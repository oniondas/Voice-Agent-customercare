# 🎯 Frontend-Only Deployment Guide

This guide explains how to deploy the AI Voice Agent as a **frontend-only application** for hackathon demonstrations, eliminating the need for a separate backend server.

---

## 📋 Overview

In this deployment model:
- ✅ All data (products, orders, FAQs, policies) lives in the frontend
- ✅ Data updates happen in the browser (no database)
- ✅ Deployment is as simple as pushing to Vercel/Netlify
- ⚠️ Vector search requires a different approach

---

## 🏗️ Architecture Changes

### Current (Backend + Frontend)
```
Frontend (React) → Backend (FastAPI) → ChromaDB (Vector Search)
                                     → JSON Files (Products/Orders)
```

### Frontend-Only
```
Frontend (React) → Local Data (JSON in memory)
                → Gemini AI (handles semantic understanding)
```

---

## 🔍 Vector Search: The Challenge

Vector search (ChromaDB) requires:
- Server-side processing
- Embedding generation (MiniLM model)
- Vector database storage

### Solutions for Frontend-Only Deployment

#### **Option 1: Gemini-Native Semantic Search (Recommended for Hackathons)**
Let Gemini AI handle all the "semantic understanding" without an explicit vector database.

**How it works:**
1. Pass all products/policies to Gemini in the system prompt or as context.
2. When the user asks "I need headphones for gaming," Gemini understands the intent and searches through the provided data.
3. No vector DB needed—Gemini is already a semantic engine!

**Pros:**
- ✅ Zero setup
- ✅ Works perfectly for hackathon-sized datasets (< 100 products)
- ✅ Gemini 2.5 Flash has a 1M token context window

**Cons:**
- ⚠️ Doesn't scale to thousands of products (context window limits)
- ⚠️ Slightly higher cost (more tokens in context)

**Implementation:**
- In `prompts.ts`, include the full product catalog in the system instruction.
- Gemini will search semantically through the context.

---

#### **Option 2: Client-Side Vector Search (Advanced)**
Use a JavaScript-based vector search library.

**Libraries:**
- [Vectra](https://github.com/Stevenic/vectra) - Local vector database for JS
- [LanceDB](https://lancedb.github.io/lancedb/) - Embedded vector search

**How it works:**
1. Pre-compute embeddings for all products using a free API (e.g., Gemini Embeddings API).
2. Store embeddings in the frontend as JSON.
3. Use Vectra to perform client-side vector similarity search.

**Pros:**
- ✅ True vector search in the browser
- ✅ No backend required

**Cons:**
- ⚠️ Requires pre-computing embeddings before deployment
- ⚠️ Larger bundle size (embedding data + library)

---

#### **Option 3: Managed Vector Service (Cloud-Assisted)**
Use a free-tier vector search service like **Pinecone** or **Supabase Vector**.

**How it works:**
1. Upload your product/policy embeddings to Pinecone (free tier: 1 index).
2. Frontend makes direct API calls to Pinecone for vector search.
3. No backend server needed, just a Pinecone API key.

**Pros:**
- ✅ Professional vector search
- ✅ No backend server

**Cons:**
- ⚠️ Requires API key management
- ⚠️ External dependency

---

#### **Option 4: Keyword-Only Search (Simplest)**
Remove vector search entirely and use simple keyword matching.

**How it works:**
- Filter products by exact or partial string matches.
- Use `product.name.includes(query)` or regex-based search.

**Pros:**
- ✅ Simplest possible solution
- ✅ No dependencies

**Cons:**
- ❌ No semantic understanding (searching "audio" won't find "headphones")

---

## 🚀 Recommended Setup for Hackathons

### Step 1: Move Data to Frontend
1. Copy all JSON files from `Files/` into `src/data/`:
   ```
   src/data/products.json
   src/data/orders.json
   src/data/faqs.json
   ```

2. Update `mockData.ts` to import these files directly:
   ```typescript
   import productsData from './data/products.json';
   import ordersData from './data/orders.json';
   ```

### Step 2: Use Gemini for Semantic Search
1. In `prompts.ts`, add the product catalog to the system instruction:
   ```typescript
   const systemInstruction = `
   You are a shopping assistant. Here is our product catalog:
   ${JSON.stringify(productsData, null, 2)}
   
   When users ask for products, search through this catalog semantically.
   `;
   ```

2. Remove the `search_products` tool and let Gemini handle it via the context.

### Step 3: Deploy to Vercel
1. Push your code to GitHub.
2. Connect to Vercel.
3. Add `VITE_GEMINI_API_KEY` to Vercel environment variables.
4. Deploy!

**That's it. No backend, no Docker, no ChromaDB.**

---

## 📊 Performance Considerations

| Approach | Latency | Accuracy | Complexity |
|----------|---------|----------|------------|
| **Gemini Context** | 200-500ms | High | Low |
| **Client-Side Vector (Vectra)** | 50-100ms | High | Medium |
| **Managed Service (Pinecone)** | 100-200ms | High | Medium |
| **Keyword-Only** | <10ms | Low | Very Low |

---

## 🎭 Demo Tips

For a hackathon demo, **Option 1 (Gemini-Native)** is the sweet spot:
- Fast to implement
- Impressive to judges ("Look, no backend!")
- Works perfectly for < 100 products

If your dataset is larger (> 1000 products), consider **Option 3 (Pinecone)** for the free tier.

---

## 🛠️ Example: Gemini-Native Implementation

```typescript
// prompts.ts
import products from './data/products.json';

const productContext = products.map(p => 
  `ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Price: ₹${p.price}, Stock: ${p.stock}`
).join('\n');

export const SYSTEM_INSTRUCTION = `
You are an intelligent shopping assistant. You have access to the following products:

${productContext}

When a user asks for a product, analyze their intent and recommend the best matches from the catalog above.
For example, if they ask for "gaming audio," suggest headphones or speakers with gaming features.
`;
```

**Result**: Gemini will perform semantic search through the context without any vector database!

---

## 🌟 Summary

For a hackathon frontend-only deployment:
1. ✅ Move all data to `src/data/`
2. ✅ Use Gemini's context window for semantic search
3. ✅ Deploy to Vercel in minutes
4. ✅ No backend complexity

**Good luck with your demo!** 🚀
