# NeurologicAI Store - Backend & Database Architecture

This document outlines the architectural requirements for the real backend system that will replace the `mockData.ts` simulation.

## System Overview

The application is designed as a **Tool-First AI Agent**. The frontend (React) and the AI (Gemini) do not hold the "Truth". They act as interfaces. The Backend Database is the single source of truth.

### Data Flow Strategy
1.  **On Mount**: The Frontend fetches `System Context` (User ID, Categories, Policy Headers).
2.  **On Interaction**: When the user speaks, Gemini outputs a **Tool Call**.
3.  **Tool Execution**: The Frontend calls the Backend API (e.g., `POST /api/search`).
4.  **Freshness (On-Demand)**: The Frontend fetches fresh data immediately when the user navigates to a new view (e.g., opening the dashboard or checking an order).

---

## Database Architecture & Vector Search

The database must support both **Structured Data** (SQL/NoSQL) and **Unstructured Data** (Vector Embeddings).

### 1. Structured Data (SQL/PostgreSQL recommended)
Used for transactional consistency: Products, Orders, Inventory.

**Tables:**
*   `products`: id, name, price, stock (INT), delivery_days, attributes (JSONB).
*   `orders`: id, user_id, status (ENUM), total, items (JSONB).
*   `users`: id, name, preferences, search_history (JSONB), purchase_history (JSONB).

### 2. Unstructured Data & Vector Search (Critical)
Used for **Policies**, **FAQs**, and **Product Recommendations**.

**Implementation:**
*   **Database**: PostgreSQL with `pgvector` or a specialized DB like Pinecone/Weaviate.
*   **Process**:
    1.  Chunk long policy documents into smaller segments.
    2.  Generate Embeddings for Policy segments AND Product Descriptions.
    3.  Store embeddings in the database.

**Recommendation Logic (Hybrid Search):**
To fulfill the requirement of suggesting products based on history/cart/inquiry:
1.  **User Profile Vector**: Create a composite vector average of the user's recent search queries + last 3 purchased items.
2.  **Cart Vector**: Create a vector for items currently in the cart.
3.  **Query**: Perform a vector similarity search against the `products` table (where product descriptions are embedded) using a weighted combination of User Profile Vector (40%) and Cart Vector (60%).

---

## API Contract (Endpoints)

The Frontend expects the following REST endpoints. All responses should be JSON.

### Product Catalog
*   `GET /api/products/search?q={query}&cat={category}`
    *   **Logic**: 
        *   If `q` is present: Perform fuzzy string matching OR full-text search on Name/Description.
        *   Return limited fields: `id`, `name`, `price`, `stock`, `rating`, `deliveryTimeDays`.
*   `GET /api/products/{id}`
    *   **Logic**: Return full details including `features` array.
*   `GET /api/products/recommendations?userId={id}`
    *   **Logic**: **Intelligent Personalization**.
        *   **Input**: User ID, Current Cart contents (passed in body or retrieved from session).
        *   **Algorithm**:
            1.  **Recent Inquiry**: Analyze the last 5 search terms from the user.
            2.  **Cart Context**: If cart has "Laptop", boost accessories like "Mouse", "Bag".
            3.  **Purchase History**: Exclude items already bought.
            4.  **Vector Match**: Find products semantically similar to the aggregated context.
        *   **Output**: Top 5 relevant products.
*   `GET /api/products/{id}/related`
    *   **Logic**: Return 3 products in the same category with high ratings.

### Order Management
*   `GET /api/orders?userId={id}`
*   `GET /api/orders/{id}`
*   `POST /api/orders/{id}/cancel`
    *   **Logic**: Only allow if status is 'Placed'. Else return 400 error.

### Knowledge Base (Vector Powered)
*   `GET /api/policies/search?topic={topic}`
    *   **Input**: "Can I return a used shirt?"
    *   **Backend Logic**: Embed input -> Vector Search -> Return most relevant policy text block.
*   `GET /api/products/{id}/faq`
    *   **Logic**: Return FAQs specific to the product ID.

### Cart (Session)
*   `GET /api/cart`
*   `POST /api/cart/add` (Body: `{ productId, quantity }`)
*   `POST /api/cart/checkout` (Body: `{ userId }`)

---

## Example Workflow: "I need a laptop"

Here is the step-by-step data flow when a user interacts with the agent to find a product.

### 1. User Input (Frontend)
*   **Action**: User speaks: *"I need a powerful laptop for work."*
*   **System**: `GeminiLiveService` captures audio, sends it to the Gemini Model via WebSocket.

### 2. Reasoning & Tool Selection (Gemini Model)
*   **Analysis**: Gemini identifies the intent is "Product Search".
*   **Constraint Check**: It checks its system instructions: *"You do NOT have a local database. You MUST use tools."*
*   **Decision**: It decides to call the tool `search_products`.
*   **Parameter Generation**: It extracts key terms: `{"query": "powerful laptop", "category": "Electronics"}`.
*   **Output**: Sends a `ToolCall` message back to the Frontend.

### 3. Tool Execution (Frontend Layer)
*   **Action**: `services/tools.ts` intercepts the `ToolCall`.
*   **API Request**: It triggers an asynchronous fetch to the Backend:
    ```http
    GET /api/products/search?q=powerful%20laptop&cat=Electronics
    ```

### 4. Data Retrieval (Backend Layer)
*   **Logic**: The backend receives the query.
*   **Database Query**:
    ```sql
    SELECT * FROM products
    WHERE category = 'Electronics'
    AND (name ILIKE '%laptop%' OR description ILIKE '%powerful%')
    AND stock > 0
    ORDER BY rating DESC
    LIMIT 8;
    ```
*   **Response**: Returns a JSON array of product objects (e.g., "Quanta Laptop Plus").

### 5. Context Update & UI Refresh (Frontend)
*   **State Update**: The Frontend receives the JSON. It updates the React State (`state.products`), causing the UI to immediately render the list of laptops card grid.
*   **Feedback Loop**: The Frontend sends the JSON result back to Gemini so it knows what was found:
    ```json
    [
      { "id": "P1007", "name": "Quanta Laptop Plus", "price": 1386.90, "features": ["High Performance", "16GB RAM"] }
    ]
    ```

### 6. Response Generation (Gemini Model)
*   **Synthesis**: Gemini reads the JSON tool output.
*   **Generation**: It generates a natural language response based on the data:
    *"I found the Quanta Laptop Plus. It's a high-performance machine perfect for work, priced at $1,386.90. It has a high rating. Would you like to see the full specs?"*

### 7. Audio Output (Frontend)
*   **Action**: Frontend receives the audio stream of the response and plays it to the user.

---

## Dynamic Data & Freshness

The Frontend implements an **On-Demand Refresh Strategy** (in `App.tsx`).
*   **Trigger**: View Navigation (`state.mode` changes).
*   **Behavior**:
    *   **Dashboard**: Refreshes "Recommended Products" to ensure stock is accurate.
    *   **Order Detail**: Fetches the latest status for the specific order.
    *   **Cart**: Re-syncs with the server to validate stock and totals.

This ensures data is always fresh when the user asks for it, without unnecessary background network traffic.