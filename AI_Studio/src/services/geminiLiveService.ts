import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, base64ToUint8Array, decodeAudioData, calculateRMS } from './audioUtils';
import { AppState } from '../types';
import { TOOLS, executeTool } from './tools';
import { getSystemInstruction } from './prompts';
import { db } from './mockData';

type ContextUpdateCallback = (update: Partial<AppState>) => void;
type MetricsUpdateCallback = (cost: number, latency?: number) => void;

// Pricing Constants (Approximate for Gemini 2.5 Flash)
const COST_PER_SEC_AUDIO_INPUT = 0.00002; // ~$0.072/hour
const COST_PER_SEC_AUDIO_OUTPUT = 0.00008; // ~$0.288/hour
const COST_PER_1M_INPUT_TOKENS = 0.10;
const COST_PER_1M_OUTPUT_TOKENS = 0.40;

// VAD Constants
const SPEECH_THRESHOLD = 0.01; // RMS Threshold for "speaking"

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private onContextUpdate: ContextUpdateCallback;
  private onMetricsUpdate?: MetricsUpdateCallback;
  private audioSources: Set<AudioBufferSourceNode> = new Set();

  // Latency Tracking State
  private lastUserSpeechTimestamp = 0;
  private isUserSpeaking = false;
  private isModelSpeaking = false;

  constructor(onContextUpdate: ContextUpdateCallback, onMetricsUpdate?: MetricsUpdateCallback) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    this.onContextUpdate = onContextUpdate;
    this.onMetricsUpdate = onMetricsUpdate;
  }

  async connect() {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    // Fetch fresh system context from the "backend" before connecting
    const systemInstruction = await this.prepareSystemPrompt();

    // Setup Microphone Stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Estimate System Prompt Cost (One-time context)
    const promptTokens = systemInstruction.length / 4;
    const promptCost = (promptTokens / 1000000) * COST_PER_1M_INPUT_TOKENS;
    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(promptCost);
    }

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemInstruction,
        tools: TOOLS,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
      },
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Connected');
          this.startAudioInput(stream, sessionPromise);
        },
        onmessage: (message: LiveServerMessage) => {
          // Parallel Execution: Process Audio and Tools simultaneously

          // 1. Audio Processing
          this.handleAudio(message).catch(err => console.error("Audio handling error:", err));

          // 2. Tool Execution (Async)
          this.handleTools(message, sessionPromise).catch(err => console.error("Tool handling error:", err));
        },
        onclose: () => console.log('Gemini Live Closed'),
        onerror: (err) => console.error('Gemini Live Error', err),
      }
    });

    this.session = await sessionPromise;
  }

  private async prepareSystemPrompt(): Promise<string> {
    // Get base instruction template
    const baseInstruction = getSystemInstruction();

    // Fetch dynamic data from database
    const dbContext = await db.getSystemContext();

    // Inject the dynamic data into the template
    // We are replacing the "mock" function call in prompts.ts with real DB data here
    // This is a bit of a hack to reuse the existing string template logic
    return baseInstruction.replace('SYSTEM_CONTEXT_PLACEHOLDER', JSON.stringify(dbContext, null, 2));
  }

  private startAudioInput(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputAudioContext) return;

    const source = this.inputAudioContext.createMediaStreamSource(stream);
    const processor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);

      // 1. Voice Activity Detection (VAD) logic
      const rms = calculateRMS(inputData);
      if (rms > SPEECH_THRESHOLD) {
        this.isUserSpeaking = true;
        this.isModelSpeaking = false;
        this.lastUserSpeechTimestamp = performance.now();
      } else {
        this.isUserSpeaking = false;
      }

      // 2. Cost Calculation (Input Audio)
      const durationSec = inputData.length / 16000;
      if (this.onMetricsUpdate) {
        this.onMetricsUpdate(durationSec * COST_PER_SEC_AUDIO_INPUT);
      }

      // 3. Stream Data
      const pcmBlob = createPcmBlob(inputData);
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(processor);
    processor.connect(this.inputAudioContext.destination);
  }

  // Task A: Handle Audio Playback
  private async handleAudio(message: LiveServerMessage) {
    // Check Interruption first
    if (message.serverContent?.interrupted) {
      this.stopAllAudio();
      this.isModelSpeaking = false;
      return;
    }

    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputAudioContext) {
      // Latency Measurement
      if (!this.isModelSpeaking) {
        const now = performance.now();
        // Calculate latency if user spoke recently (< 15s ago)
        if (this.lastUserSpeechTimestamp > 0 && (now - this.lastUserSpeechTimestamp) < 15000) {
          const latency = now - this.lastUserSpeechTimestamp;
          if (this.onMetricsUpdate) this.onMetricsUpdate(0, latency);
        }
        this.isModelSpeaking = true;
      }

      this.playAudio(audioData);
    }
  }

  // Task B: Handle Tool Execution
  private async handleTools(message: LiveServerMessage, sessionPromise: Promise<any>) {
    if (message.toolCall) {
      const functionResponses = [];

      // Estimate Output Token Cost (Model tool call)
      const toolCallStr = JSON.stringify(message.toolCall);
      const outputTokens = toolCallStr.length / 4;
      const outputCost = (outputTokens / 1000000) * COST_PER_1M_OUTPUT_TOKENS;
      if (this.onMetricsUpdate) {
        this.onMetricsUpdate(outputCost);
      }

      // Execute tools immediately to update UI (Optimistic/Parallel)
      // IMPORTANT: await the result because executeTool is now async (DB calls)
      for (const fc of message.toolCall.functionCalls) {
        const result = await executeTool(fc.name, fc.args, this.onContextUpdate);
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: { result }
        });
      }

      // Send response back to model
      const session = await sessionPromise;
      session.sendToolResponse({ functionResponses });

      // Estimate Input Token Cost (Tool response)
      const responseStr = JSON.stringify(functionResponses);
      const inputTokens = responseStr.length / 4;
      const inputCost = (inputTokens / 1000000) * COST_PER_1M_INPUT_TOKENS;
      if (this.onMetricsUpdate) {
        this.onMetricsUpdate(inputCost);
      }
    }
  }

  private playAudio(base64Data: string) {
    if (!this.outputAudioContext) return;

    const uint8 = base64ToUint8Array(base64Data);
    const audioBuffer = decodeAudioData(uint8, this.outputAudioContext, 24000);

    // Cost Calculation (Output Audio)
    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(audioBuffer.duration * COST_PER_SEC_AUDIO_OUTPUT);
    }

    const currentTime = this.outputAudioContext.currentTime;

    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.05;
    }

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);
    source.start(this.nextStartTime);

    this.audioSources.add(source);
    source.onended = () => {
      this.audioSources.delete(source);
    };

    this.nextStartTime += audioBuffer.duration;
  }

  private stopAllAudio() {
    this.audioSources.forEach(source => {
      try {
        source.stop();
      } catch (e) { }
    });
    this.audioSources.clear();
    this.nextStartTime = 0;
  }

  disconnect() {
    this.stopAllAudio();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
  }
}