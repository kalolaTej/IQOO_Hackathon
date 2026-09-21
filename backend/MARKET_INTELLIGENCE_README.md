# AgriSync — Market Intelligence, Matching & Logistics (Developer: Tej)

## 1. Overview
This module extends AgriSync into post-harvest intelligence:
- **Mandi Price Aggregation**: Live AGMARKNET (data.gov.in) API integration with automated cache and transparent labeled mock fallback (`source: "real"` | `source: "mock"`).
- **Sale-Window Recommendation**: Rule-based decision engine calculating trend momentum, volatility, and perishability urgency to recommend "sell_now" vs "hold N days".
- **Buyer/FPO Matching**: Multi-factor weighted similarity scoring matching produce lots with registered buyer demand profiles.
- **Logistics & Storage Recommendation**: Multi-attribute scoring of cold storages, grain warehouses, and transit fleets.

---

## 2. API Contract Summary

### Market Prices
- `GET /api/prices?crop=<string>&state=<string>`
  - Response: `[{ crop_type, market_name, state, min_price, max_price, modal_price, price_date, source }]`
- `GET /api/prices/trend?crop=<string>&market=<string>`
  - Response: `[{ price_date, modal_price, source }]` (Chronological array)
- `GET /api/lots/:id/sale-window`
  - Response: `{ lot_id, recommendation: "sell_now" | "hold", hold_days: number | null, rationale: string }`

### Buyer Matching
- `POST /api/buyer-profile`
  - Body: `{ crop_type, min_quantity_kg, preferred_grade, location, buyer_name, company_name, state, contact_phone }`
  - Response: `201 Created` with profile object including `id`.
- `GET /api/lots/:id/matches`
  - Response: `[{ buyer_id, buyer_name, match_score, status: "suggested", crop_type, min_quantity_kg, location }]`
- `GET /api/buyers/:id/matches`
  - Response: `[{ lot_id, match_score, status, crop_type, quantity_kg, grade }]`
- `PATCH /api/matches/:id`
  - Body: `{ status: "interested" | "accepted" | "rejected" }`
  - Response: `{ id, status, updated_at }`

### Logistics & Storage
- `GET /api/lots/:id/logistics-suggestion`
  - Response: `{ recommended: { facility_name, type, distance_km, cost_per_day, reason }, alternatives: [{ facility_name, type, distance_km, cost_per_day, reason }] }`
- `GET /api/logistics/facilities`
  - Response: List of all registered demo facilities.

---

## 3. AGMARKNET API Key Setup
1. Register for a free API key at [data.gov.in](https://data.gov.in).
2. Resource: *Current Daily Price of Various Commodities from Various Markets (Mandi)* (Catalog ID: `9ef84268-d588-465a-a308-a864a43d0070`).
3. Set in `.env`:
   ```env
   AGMARKNET_API_KEY=your_registered_api_key_here
   ```
4. **Data Coverage & Resilience Note**: AGMARKNET updates daily on working market days; coverage varies across small mandis. If data is absent for a requested crop/market/date, the system seamlessly returns seeded historical mock data with `source: "mock"`, ensuring the application never crashes.

---

## 4. Team Handoff Details

### To Vasu (Frontend Lead)
- **Component paths created**:
  - `web/src/pages/market/MarketPrices.jsx`
  - `web/src/pages/market/SaleWindow.jsx`
  - `web/src/pages/market/BuyerProfile.jsx`
  - `web/src/pages/market/BuyerMatches.jsx`
  - `web/src/pages/market/LogisticsSuggestion.jsx`
- **Data labeling**: Every price response includes `source: "real"` (live government AGMARKNET) or `source: "mock"` (historical demo fallback).

### To Krushn (Produce Lots & Core Backend)
- **Read-Only Fields on `produce_lots`**:
  - `id` (UUID)
  - `crop_type` (String)
  - `quantity_kg` (Numeric)
  - `grade` (String: 'A' | 'B' | 'C')
  - `harvest_date` (Date)
  - `state` / `location` (Optional String)
- Tej's services execute **SELECT ONLY** queries against `produce_lots` and do not alter or write to Krushn's tables.
