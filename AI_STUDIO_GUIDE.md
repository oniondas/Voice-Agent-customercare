# 🚀 AI_Studio Deployment Guide

## What is AI_Studio?

`AI_Studio` is a **frontend-only** version of the Voice Agent that requires **zero backend infrastructure**. All data (products, orders, FAQs) is embedded directly in the frontend, and **Gemini handles semantic search** through its context window.

---

## 🎯 Key Differences from Main Project

| Feature | Main Project | AI_Studio |
|---------|--------------|-----------|
| **Backend** | FastAPI + Python | None |
| **Database** | JSON files + ChromaDB | JSON embedded in frontend |
| **Semantic Search** | ChromaDB vector search | Gemini context-based search |
| **Deployment** | Frontend + Backend servers | Vercel only |
| **Data Updates** | API endpoints | Edit JSON files directly |

---

## ⚡ Quick Start

```bash
cd AI_Studio
npm install
```

Create `.env.local`:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

Run:
```bash
npm run dev
```

---

## 🔍 How It Works

### Gemini-Native Semantic Search
Instead of using ChromaDB, the product catalog is embedded directly in the system instruction:

**File: `src/services/prompts.ts`**
```typescript
const productContext = products.map(p => 
  `${p.product_name} (${p.category}) - ₹${p.price} - Stock: ${p.stock_available}`
).join('\n');
```

When a user asks "I need gaming headphones," Gemini searches through this context naturally—no vector database required!

---

## 📦 Deployment to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Frontend-only voice agent"
   git push
   ```

2. **Deploy**:
   - Go to [vercel.com](https://vercel.com)
   - Import your repo
   - Add `VITE_GEMINI_API_KEY` as environment variable
   - Deploy!

---

## 🛠️ Updating Data

### Products
Edit `src/data/product_catalog.json`:
```json
{
  "product_id": "P9999",
  "product_name": "New Headphones",
  "category": "Electronics",
  "price": 15000,
  "stock_available": 25,
  "description": "High-quality wireless headphones"
}
```

Redeploy to Vercel after changes.

---

## 🌟 Perfect for Hackathons

### Why Use AI_Studio?
- ✅ **No Docker**: Just `npm install` and run
- ✅ **No Backend Setup**: Zero database configuration
- ✅ **Fast Deployment**: Vercel deploy in < 2 minutes
- ✅ **Impressive Demo**: "Look, it's all frontend!"

---

## 📊 Performance

- **Latency**: Slightly higher than main project (due to larger context)
- **Scalability**: Works great for < 200 products
- **Cost**: Same as main project (Gemini API usage)

---

## 🔄 Migrating Back to Main Project

If you later need a backend:
1. Use the main project's `backend/` folder
2. Update `mockData.ts` to call API endpoints instead of importing JSON
3. Deploy backend to Render + frontend to Vercel

---

## 🎭 Demo Script

1. "Show me electronics"
2. "What's your return policy?"
3. "Add Luma Monitor to cart"
4. "Checkout my order"

---

**Built for speed. Designed for demos. Zero complexity.** 🚀
