# 🎭 Hackathon Demo & Simulation Guide

This guide ensures your Voice Agent demo is flawless, low-latency, and makes a strong impression on judges.

---

## 🚀 1. The Strategy: Tunneling (ngrok)
For hackathons, **local tunneling beats cloud deployment**. It gives you zero-config "live" URLs while running the heavy "brain" on your own machine.

### Setup
1.  **Install ngrok**: `npm install -g ngrok` (or download from [ngrok.com](https://ngrok.com/))
2.  **Expose Backend**: `ngrok http 8000`
3.  **Expose Frontend**: `ngrok http 5173`
4.  **Update `.env.local`**:
    ```env
    VITE_API_BASE_URL=https://<your-backend-id>.ngrok-free.app
    ```

> [!TIP]
> Use the ngrok URLs on your phone! Showing the voice agent working on a mobile device is a huge "wow" factor.

---

## 🏆 2. The "Golden Path" Script
Don't just talk to the agent randomly. Follow this "Perfect Interaction" flow:

1.  **Warm-up**: "Hey, I'm looking for a gift for a gamer."
    - *Goal*: Show prompt understanding.
2.  **Search**: "What headphones do you have?"
    - *Goal*: Show `search_products` tool call and UI sync.
3.  **Specific Query**: "Are the Razer Kraken in stock?"
    - *Goal*: Show real-time database lookup.
4.  **Policy Check**: "What is your return policy for electronics?"
    - *Goal*: Show RAG/Vector search capability.
5.  **Conversion**: "Add those to my cart and check me out."
    - *Goal*: Show state management and order creation.

---

## 🎤 3. Voice Simulation Tips
Hackathon halls are **noisy**. This can break voice recognition.

-   **Use a Lapel Mic**: If possible, use a dedicated microphone.
-   **Text Fallback**: Always have the text input visible so you can type if the noise is too loud.
-   **Push-to-Talk**: Ensure the "Voice Toggle" is easy to reach.
-   **Demo Mode**: Use the "Demo Mode" indicator (if implemented) to show the judges the "Brain" thinking in real-time.

---

## 🌩️ 4. Quick Cloud Deployment (Plan B)
If you MUST deploy to the cloud:

### Backend (Render)
1.  Connect your GitHub repo to **Render.com**.
2.  Select **Web Service** -> **Python**.
3.  Build Command: `pip install -r backend/requirements.txt`
4.  Start Command: `python backend/main.py` (ensure host is `0.0.0.0`)

### Frontend (Vercel)
1.  Connect your GitHub repo to **Vercel**.
2.  Set `VITE_API_BASE_URL` to your Render URL.
3.  Vercel will auto-detect Vite and deploy.

---

## 🛠️ 5. Simulation Troubleshooting
-   **Latency Lag?** Check your internet. If on a slow Wi-Fi, use a phone hotspot.
-   **CORS Issues?** The backend is configured to allow all origins by default in `main.py`, but check if your proxy blocks headers.
-   **Audio Feedback?** Use headphones or a directional mic to prevent the agent from hearing itself.
