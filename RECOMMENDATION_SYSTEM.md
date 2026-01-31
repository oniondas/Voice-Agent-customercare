# Recommendation System & Data Architecture

This document explains how the Voice Agent's backend recommends products and how data flows from disk to the user's screen.

## 1. System Architecture & Data Flow

The application follows a **Client-Server-Database** architecture, where the "Database" is currently a set of structured JSON files.

### **The Pipeline**

1.  **User Interaction (Frontend)**
    *   **Voice**: User asks *"Show me gaming laptops"*. Gemini translates this to a tool call: `search_products(query="gaming laptop")`.
    *   **UI**: User navigates to a Product Detail page. Frontend calls `get_related_products(id)`.

2.  **API Bridge (`services/mockData.ts`)**
    *   The frontend service acts as an HTTP Client.
    *   It forwards the request to the backend: `GET http://localhost:8000/api/products/...`

3.  **API Layer (`backend/main.py`)**
    *   FastAPI receives the request.
    *   It routes the request to the `SearchLogic` engine.

4.  **Logic Layer (`backend/search_logic.py`)**
    *   This is the "Brain" of the recommendation system.
    *   It filters, sorts, and applies business rules (Upselling, Price Anchoring).

5.  **Data Layer (`backend/data_loader.py`)**
    *   On startup, this module reads `Files/product_catalog.json` into memory.
    *   It serves as a high-performance in-memory cache for all read operations.

## 2. Recommendation Logic

The system uses a **Context-Aware Upsell Engine** designed to maximize order value while ensuring user satisfaction.

### **A. Smart Upselling (Product Detail Page)**
When a user views a product, we calculate "Related Products" using the following algorithm:

1.  **Candidate Selection**: Select all other products in the same category (e.g., Electronics).
2.  **Stock Filter**: **Exclusion Rule**. Any item with `stock_available: 0` is immediately discarded to prevent bad user experience.
3.  **Price Anchoring (The Upsell Logic)**:
    *   If the Main Product is high-ticket (e.g., "Electronics"), the system looks for **Accessories** / Add-ons.
    *   **Rule**: `Candidate Price < 40% of Main Product Price`.
    *   *Why?* Users are more likely to impulse-add a $50 mouse when buying a $1000 laptop than to buy a second $1000 laptop.
4.  **Category Specifics**:
    *   **Electronics**: JSON "Electronics" -> Suggest cheaper Electronics (interpreted as accessories).
    *   **Clothing**: Suggest items from the same category (e.g., "Complete the fit").
5.  **Ranking**: Final candidates are sorted by `Rating` (High to Low) to ensure quality recommendations.

### **B. Global Recommendations (Dashboard/Home)**
When the user lands on the dashboard, we show "Recommended for You":

1.  **Availability First**: Filter strictly for `stock > 0`.
2.  **Quality & Reliability**: Sort by a composite score of `Rating` (High) and `Stock Depth` (High).
    *   *Why?* We want to promote popular items that we actually have in ready supply.

## 3. Search Logic (Fuzzy Matching)
The search function (`search_products`) uses a flexible matching system:
*   **Partial Category Match**: Searching "Laptop" matches the category "Electronics" if the description contains "laptop", OR if the logic maps specific keywords.
*   **Keyword Scan**: It scans `Product Name`, `Description`, and `Category` for the search terms.

## 4. Updates & Maintenance
*   **Data Source**: All data lives in `Files/product_catalog.json`.
*   **Live Updates**: Editing the JSON file and restarting the backend (`python backend/main.py`) immediately updates the entire store inventory.
