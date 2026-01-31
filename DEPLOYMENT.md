# 🚀 Deployment Guide: AI Voice Agent

This guide covers how to deploy the AI Voice Agent for both local development and production-like environments using Docker.

---

## 📋 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Local Deployment](#-local-deployment)
3. [Environment Variables](#-environment-variables)
4. [Docker Deployment (Recommended)](#-docker-deployment-recommended)
5. [Production Considerations](#-production-considerations)

---

## 🛠️ Prerequisites

- **Node.js**: v18 or higher
- **Python**: 3.10 or higher
- **Docker & Docker Compose**: (For containerized deployment)
- **Google Cloud API Key**: With Gemini Multimodal Live API access.

---

## 💻 Local Deployment

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory (based on `.env.example`):

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

> [!IMPORTANT]
> Ensure your API key has permissions for the Gemini 2.5 Flash model and the Multimodal Live API.

---

## 🐳 Docker Deployment (Recommended)

Using Docker is the easiest way to ensure the environment is consistent.

### 1. Build and Run
```bash
docker-compose up --build
```

### 2. Services
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`

---

### 🌐 Production Considerations

#### 🌩️ Deployment Platforms (The "Full Cloud" Approach)
-   **Frontend (Vercel)**: 
    -   Connect GitHub → Select project → Add `VITE_API_BASE_URL` in environment variables.
-   **Backend (Render)**: 
    -   Create Web Service → Connect GitHub → Select `Python` runtime.
    -   Use `pip install -r backend/requirements.txt` for build.
    -   Use `python backend/main.py` for start (ensure `host="0.0.0.0"` in `main.py`).

#### ⚡ High-Speed Hackathon Deployment (Tunneling)
If you are at a hackathon and want a live URL **without** the hassle of cloud setup:
1.  **Expose Backend**: `npx ngrok http 8000`
2.  **Expose Frontend**: `npx ngrok http 5173`
3.  **Update `.env.local`**: Set `VITE_API_BASE_URL` to the ngrok URL of your backend.

### 🔒 Security & Optimization
-   Never commit your `.env.local` or `.env` files.
-   In production, use environment variable secrets provided by your hosting platform.
-   Run `npm run build` to generate the production frontend build.
-   Use a production-grade WSGI server like `gunicorn` for the backend.
    ```bash
    gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
    ```

---

### 🎭 Simulation & Demo
For detailed tips on how to run a perfect hackathon demo, see [HACKATHON_DEMO.md](file:///c:/Users/Shounak%20Das/Downloads/Voice%20Agent%20with%20backend%20support/HACKATHON_DEMO.md).
