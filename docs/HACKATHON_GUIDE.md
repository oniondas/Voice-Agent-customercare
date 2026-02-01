# 🏆 Hackathon Guide: Voice Agent with Backend Support

This guide provides a comprehensive technical overview of the Voice Agent, designed for hackathon judges and developers. It covers the architecture, data flow, performance metrics, and the clever techniques that make this agent stand out.

---

## 🏗️ 1. Overall Architecture

The system follows a **Tool-First, Multimodal Architecture** that separates the "Brain" from the "Body" and "Memory."

-   **The Brain (Gemini 2.5 Flash)**: Orchestrates the conversation, reasons about user intent, and decides when to use tools.
-   **The Body (React Frontend)**: Handles real-time audio I/O (Web Audio API), manages UI state, and executes tools requested by the brain.
-   **The Memory (FastAPI Backend)**: Provides authoritative data, handles complex search logic, and persists orders/inventory.

### Tech Stack
| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Web Audio API |
| **AI Engine** | Gemini 2.5 Flash (Multimodal Live API) |
| **Backend** | FastAPI (Python 3.10+), Uvicorn |
| **Vector DB** | ChromaDB (with `all-MiniLM-L6-v2` embeddings) |
| **Data Store** | JSON (Products/Orders), Markdown (Policies) |

---

## 🔄 2. Data Flow: The Request Lifecycle

The system utilizes a bidirectional WebSocket stream for seamless voice interaction.

1.  **Voice Input**: User speech is captured as PCM audio chunks at 16kHz and streamed to Gemini.
2.  **Intent Recognition**: Gemini performs real-time STT and decides to call a tool (e.g., `search_products`).
3.  **Tool Execution**: The frontend intercepts the tool call and makes an async HTTP request to the FastAPI backend.
4.  **Hybrid Search**: The backend runs **Parallel Keyword & Semantic Search**:
    -   **Keyword**: Instant matches for exact product names/categories.
    -   **Semantic (Vector)**: Finds related concepts (e.g., user asks for "sound systems," vector DB finds "Earbuds" and "Speakers").
5.  **Context Injection**: Search results are sent back to Gemini as a tool response.
6.  **Response Generation**: Gemini synthesizes the data and generates a natural voice response (24kHz PCM).
7.  **Voice Output**: The frontend queues and plays the audio chunks with low latency.

---

## 📊 3. Key Metrics: Latency & Cost

### ⏱️ Latency Management
We measure **Voice-to-Voice Latency**—the gap between the user stopping and the AI starting.
-   **VAD Sensing**: Client-side RMS calculation detects the exact moment of silence.
-   **Parallel Execution**: Audio and tools are processed simultaneously to hide API overhead.
-   **Direct Streaming**: No intermediate STT/TTS services; Gemini handles raw audio directly.

### 💰 Cost Optimization
| Dimension | Logic |
| :--- | :--- |
| **Audio Input** | ~$0.072/hr (Only active speech segments are billed) |
| **Audio Output** | ~$0.288/hr (High-fidelity 24kHz voice) |
| **Tokens** | $0.10/1M Input, $0.40/1M Output (Optimized via minimal tool payloads) |

---

## 💡 4. Clever Techniques

### 🔍 Hybrid Parallel Search
Instead of waiting for one search type to finish, we trigger keyword and vector searches concurrently. If keywords find perfect matches, we use them; otherwise, semantic results fill the gaps.

### 🧠 Semantic Keyboarding
We enrich the Vector DB documents with "Semantic Keywords." For example, a product named "Earbuds" is indexed with synonyms like `audio`, `listen`, `wireless`, and `bluetooth` to ensure it captures broader intent.

### 🛑 Smart Interruption (VAD)
The system uses real-time RMS monitoring to allow users to interrupt the AI. If speech is detected while the AI is speaking, the audio buffer is immediately cleared, making the agent feel human and responsive.

### 🛠️ Multi-Turn Tool Chaining
The agent can chain tool calls. If a user asks to buy a product, the agent first calls `search_products`, then `add_to_cart`, and potentially `get_related_products` for upselling—all in one logical flow.

---

## 📁 5. Codebase Guide

### Backend (`/backend`)
-   [`main.py`](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/backend/main.py): FastAPI entry point and REST routes.
-   [`data_loader.py`](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/backend/data_loader.py): The "Storage Engine." Handles JSON I/O and stock logic.
-   [`search_logic.py`](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/backend/search_logic.py): Orchestrates keyword vs. semantic results.
-   [`vector_search.py`](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/backend/vector_search.py): ChromaDB integration and embedding generation.

### Frontend (`/src/services`)
-   [`geminiLiveService.ts`](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/services/geminiLiveService.ts): WebSocket management, Audio PCM handling, and VAD.
-   [`tools.ts`](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/services/tools.ts): Tool definitions and execution logic.
-   [`mockData.ts`](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/services/mockData.ts): Acts as the API client bridge to the backend.
-   [`prompts.ts`](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/services/prompts.ts): System instruction templates and persona management.

---

## 🛠️ 6. Error Handling
-   **Network Resilience**: WebSocket auto-reconnect logic.
-   **Search Fallbacks**: If the Vector DB is unavailable, the system transparently falls back to keyword matching.
-   **Stock Safety**: Order creation performs atomic stock checks to prevent overselling.
-   **Graceful AI Failure**: If a tool fails, the agent is instructed to inform the user naturally instead of crashing.
