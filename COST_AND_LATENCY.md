# 💰 Cost & Latency Estimation Logic

This document explains the formulas and methodology used within the application to estimate session costs and measure real-time latency.

> **Note**: These values are **estimates** based on public pricing for **Gemini 2.0 Flash** (as of Dec 2025). They are calculated client-side for informational purposes and may not perfectly match the final Google Cloud billing.

---

## 💸 Cost Estimation

The application tracks costs across four dimensions: **Audio Input**, **Audio Output**, **Input Tokens** (Text/Tools), and **Output Tokens** (Text/Tools).

### 1. Audio Input (Microphone)
We calculate the duration of user speech sent to the model.
*   **Formula**: `Duration (seconds) * $0.00002`
*   **Rate**: ~$0.072 per hour
*   **Implementation**: Measured in `startAudioInput` (VAD script processor).

### 2. Audio Output (Model Voice)
We calculate the duration of audio received from the model.
*   **Formula**: `Duration (seconds) * $0.00008`
*   **Rate**: ~$0.288 per hour
*   **Implementation**: Measured in `playAudio` when decoding the buffer.

### 3. Input Tokens (Text/Tools)
Text sent to the model, including the **System Prompt** and **Tool Results**.
*   **Approximation**: `JSON String Length / 4` characters ≈ 1 Token.
*   **Formula**: `(Tokens / 1,000,000) * $0.10`
*   **Rate**: $0.10 per 1M tokens.

### 4. Output Tokens (Tool Calls)
When the model sends text or tool arguments (e.g., `search_products(...)`).
*   **Approximation**: `JSON String Length / 4` characters ≈ 1 Token.
*   **Formula**: `(Tokens / 1,000,000) * $0.40`
*   **Rate**: $0.40 per 1M tokens.

### Total Session Cost
`Total = AudioInputCost + AudioOutputCost + InputTokenCost + OutputTokenCost`

---

## ⏱️ Latency Measurement

Latency is critical for a voice agent. We measure the **Voice-to-Voice** latency—the time between the user stopping speaking and the model starting to speak.

### Methodology

1.  **User Speech End**:
    *   We use a simple **RMS Threshold** (Root Mean Square) on the microphone input.
    *   When volume > `0.01` (Active), we track the timestamp.
    *   The `lastUserSpeechTimestamp` captures the *moment* the user stopped speaking (or the last active frame).

2.  **Model Audio Start**:
    *   We track when the first byte of audio data arrives from the WebSocket (`onmessage`).
    *   `Timestamp Now - lastUserSpeechTimestamp` = Latency.

3.  **Filtration**:
    *   We only calculate latency if the user spoke recently (< 15 seconds ago) to avoid measuring gaps where the model speaks unprompted or after a long silence.

### Metrics Displayed
*   **Last Request**: The exact latency of the most recent turn.
*   **Average**: A running average of all valid turns in the current session.

---

## 🛠️ Code Reference

For the exact implementation, check `services/geminiLiveService.ts`:

```typescript
// Cost Constants
const COST_PER_SEC_AUDIO_INPUT = 0.00002;
const COST_PER_SEC_AUDIO_OUTPUT = 0.00008;

// Latency Logic (Simplified)
if (rms > SPEECH_THRESHOLD) {
    this.lastUserSpeechTimestamp = performance.now();
}

// On Audio Message Received
if (!this.isModelSpeaking && (now - this.lastUserSpeechTimestamp) < 15000) {
    const latency = now - this.lastUserSpeechTimestamp;
    updateMetrics(latency);
}
```
