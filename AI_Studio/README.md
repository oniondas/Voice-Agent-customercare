# 🎙️ AI Voice Agent - Frontend-Only Version

This is a **zero-backend** deployment of the AI Voice Agent, designed for hassle-free hackathon demonstrations.

---

## 🌟 Key Features

- ✅ **No Backend Required**: All data lives in the frontend
- ✅ **Gemini-Native Semantic Search**: Uses Gemini's context window for intelligent product search
- ✅ **One-Click Deploy**: Push to Vercel and you're live
- ✅ **Real-Time Voice**: Full-duplex audio streaming with Gemini 2.5 Flash

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Your API Key
Create a `.env.local` file:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Run Locally
```bash
npm run dev
```

Visit `http://localhost:5173` and click "Start Agent" to begin!

---

## 📁 Project Structure

```
AI_Studio/
├── src/
│   ├── components/       # UI components (ProductCard, OrderCard, etc.)
│   ├── services/         # Core logic
│   │   ├── geminiLiveService.ts   # WebSocket audio handling
│   │   ├── tools.ts               # Tool definitions
│   │   ├── prompts.ts             # System instructions + product context
│   │   └── mockData.ts            # Frontend data layer
│   ├── data/             # JSON data files
│   │   ├── product_catalog.json
│   │   ├── orders.json
│   │   └── faqs.json
│   ├── App.tsx           # Main application
│   └── types.ts          # TypeScript interfaces
├── index.html
├── package.json
└── README.md
```

---

## 🔍 How Semantic Search Works (No Vector DB!)

Instead of ChromaDB, this version uses **Gemini's native semantic understanding**:

1. **Product Context Injection**: All products are embedded in the system prompt.
2. **Natural Language Processing**: Gemini understands "gaming headphones" → finds "Zenith Headset Pro".
3. **Tool-Free Search**: No `search_products` tool needed—Gemini searches its own context.

**Example:**
- User: "I need something for listening to music while working out"
- Gemini: *searches product context* → Recommends "Aero Earbuds" (wireless, sweat-resistant)

---

## 🎯 Deployment to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Frontend-only AI Voice Agent"
git branch -M main
git remote add origin https://github.com/your-username/ai-voice-agent.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Add environment variable: `VITE_GEMINI_API_KEY=your_api_key`
5. Click "Deploy"

**Done!** Your app will be live at `https://your-app.vercel.app`

---

## 📊 Data Management

### Updating Products
Edit `src/data/product_catalog.json` directly:
```json
{
  "product_id": "P9999",
  "product_name": "New Product",
  "category": "Electronics",
  "price": 25000,
  "stock_available": 10
}
```

### Updating Orders
Orders are stored in `src/data/orders.json`. New orders created during the session are kept in memory (not persisted).

---

## 🛠️ Customization

### Change the Assistant's Voice
In `src/services/geminiLiveService.ts`, modify the voice config:
```typescript
const config = {
  model: "models/gemini-2.0-flash-exp",
  generationConfig: {
    responseModalities: "audio",
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
    }
  }
};
```

Available voices: `Puck`, `Charon`, `Kore`, `Fenrir`, `Aoede`

### Add New Product Categories
1. Add products to `src/data/product_catalog.json`
2. The category will auto-populate in the UI sidebar

---

## 🎤 Demo Mode

Click the **Activity Icon** (⚡) in the top header to toggle "Hackathon Demo Mode". This displays a banner to signal to judges that you're presenting.

---

## 💡 Tips for Hackathon Judges

### What Makes This Special?
- **Zero Infrastructure**: No Docker, no backend servers, no database setup
- **Gemini as the Engine**: Leveraging Gemini's 1M token context for semantic search
- **Full Voice Flow**: Real-time STT → Tool Execution → TTS in a single WebSocket stream

### Live Demo Script
1. **Search**: "Show me gaming headphones"
2. **Policy Query**: "What's your return policy?"
3. **Purchase**: "Add the Zenith Headset to my cart and checkout"
4. **Track Order**: "Where's my order ORD1001?"

---

## 🐛 Troubleshooting

### "API Key Error"
- Ensure `VITE_GEMINI_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

### "Products Not Loading"
- Check that `src/data/product_catalog.json` exists
- Make sure the JSON is valid (no trailing commas)

### "Voice Not Working"
- Allow microphone permissions in your browser
- Use HTTPS in production (Vercel auto-provides this)

---

## 📜 License

MIT

---

## 🙌 Built With

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Gemini 2.0 Flash** - AI Engine
- **Web Audio API** - Real-time Audio

---

**Ready to wow the judges? Click "Start Agent" and let Gemini do the magic!** ✨
