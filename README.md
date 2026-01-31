# 🏆 AI Voice Agent: Ecommerce & Support

A state-of-the-art **Multimodal AI Voice Agent** designed for high-performance, real-time voice interactions. Powered by **Gemini 2.5 Flash** and **FastAPI**, it delivers a seamless voice shopping experience with low latency and smart context awareness.

---

## 📐 Architecture & Data Flow

 The system uses a **Tool-First, Multimodal Architecture**. The "Brain" (Gemini) orchestrates the conversation, while the "Body" (Frontend) handles I/O, and the "Memory" (Backend) manages data.

### 🔄 System Diagram

```mermaid
graph TD
    %% Nodes
    User([👤 User])
    Frontend[💻 React Frontend<br><i>(Body & I/O)</i>]
    AI[🧠 Gemini 2.5 Flash<br><i>(The Brain)</i>]
    Backend[⚙️ FastAPI Backend<br><i>(The Memory)</i>]
    VectorDB[(🗄️ ChromaDB<br><i>Vectors</i>)]
    FileDB[(📄 JSON/MD Files<br><i>Products/Policies</i>)]

    %% Flow
    User <-->|🎤 Voice Input / 🔊 Audio Output| Frontend
    Frontend <-->|⚡ WebSocket Stream| AI
    
    %% Tool Execution Flow
    AI -- 🛠️ Decide Tool Call --> Frontend
    Frontend -- 🌐 HTTP Request --> Backend
    
    subgraph "Backend Data Logic"
        Backend -->|🔍 Semantic Search| VectorDB
        Backend -->|📂 CRUD Operations| FileDB
    end

    Backend -- 📦 JSON Data --> Frontend
    Frontend -- 📤 Tool Response --> AI
```

### 🧠 Data Flow Lifecycle

1.  **Voice Input**: User speech is captured (16kHz PCM) and streamed securely to Gemini.
2.  **Intent & Tooling**: Gemini analyzes intent. If data is needed (e.g., "Find noise-canceling headphones"), it triggers a **Tool Call**.
3.  **Execution**: The Frontend intercepts the tool call and queries the **FastAPI Backend**.
4.  **Hybrid Search**: The Backend performs **Parallel Search**:
    *   **Keyword**: For exact matches (e.g., "Sony XM5").
    *   **Vector (Semantic)**: For conceptual matches (e.g., "Good for travel") using ChromaDB.
5.  **Response**: Data is returned to Gemini to generate a natural, context-aware voice response (24kHz).

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Server starts on `http://localhost:8000`*

### 2. Frontend Setup
```bash
npm install
npm run dev
```
*App opens at `http://localhost:5173`*

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | Manages UI, Web Audio API, and Tool execution. |
| **AI Model** | Gemini 2.5 Flash | Multimodal Live API for real-time reasoning and voice. |
| **Backend** | FastAPI (Python) | High-performance API handling business logic. |
| **Database** | ChromaDB + JSON | Hybrid separate of vector storage and product catalogs. |

---

## 📂 Project Structure

-   `📁 /backend`: Python FastAPI server, search algorithms, and ChromaDB integration.
-   `📁 /services`: Frontend AI logic (WebSocket handling, Tool definitions).
-   `📁 /components`: React UI components for the dashboard.
-   `📁 /Files`: Raw data sources (Product JSONs, Policy Markdown files).

---

## � Future Optimizations

To further enhance performance and reduce costs, we have a detailed roadmap:

1.  **System Prompt Compression**: Reducing token usage by ~40% through concise instruction tuning.
2.  **Smart VAD Thresholding**: Only transmitting audio when speech is detected (saving ~50% bandwidth).
3.  **Frontend Caching**: Storing frequent search results individually to minimize API calls.
4.  **Batch Tool Calls**: Combining related data fetches (e.g., product details + reviews) into single requests.
5.  **Open Source Model Integration**: Adopting cutting-edge open-source models (updated quarterly) for reliable, low-cost local inference.

👉 **See the full [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) for implementation details.**

---

## �📚 Documentation
-   **[HACKATHON_GUIDE.md](./HACKATHON_GUIDE.md)**: Deep dive into the architecture and hackathon-specific features.
-   **[COST_AND_LATENCY.md](./COST_AND_LATENCY.md)**: Details on cost estimation and latency optimization.