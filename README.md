# Full-Stack E-Commerce — Sprint 01

A complete store with a public storefront and a protected manager dashboard. Orders are **requests confirmed by phone** (no online payment).

## 1. Features
- Public: home (hero, categories, featured, latest, search, category filter, sort, pagination), product details with related items, favorites and cart (LocalStorage), checkout, order-success page.
- Manager (single account): dashboard statistics, category / item / order management, internal order notes, opened/closed status.
- Unknown URLs show a translated 404 page.
- Arabic + English (English default) with full RTL support, language saved in LocalStorage.
- Security: bcrypt, JWT in an HttpOnly cookie, Helmet, CORS allow-list, login rate limiting, input validation, centralized errors.

## 2. Tech stack
Node.js, Express 4, Mongoose/MongoDB, JWT, bcrypt, express-validator, Helmet · Angular 19 (standalone, lazy routes, signals), TypeScript, SCSS, ngx-translate 16.

## 3. Architecture
Backend MVC: `routes → validators/middlewares → controllers (HTTP only) → services (business logic) → models`. Errors go to `error.middleware.js`. Frontend: `core/` (models, API services, guard, interceptor), `shared/` (components, pipe), `layouts/`, `features/`, `services/` (language, cart, favorites, storage, notifications). Translations live in `frontend/src/assets/i18n/{en,ar}.json`.

```
ecommerce-app/
├── backend/ (src/{config,controllers,models,routes,middlewares,services,validators}, scripts/createManager.js)
├── frontend/ (src/app/{core,shared,layouts,features,services}, src/assets/i18n, src/environments)
├── package.json  README.md  .gitignore
```

## 4. Prerequisites
Node.js 18+ and a MongoDB server (local or Atlas).

## 5. Install
```bash
npm install
npm run install:all
```

## 6. Configure
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env`: set `MONGODB_URI`, a long random `JWT_SECRET` (e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), and `MANAGER_*` credentials. Never commit `.env`.
Frontend settings (API URL, store name/phone/currency) are in `frontend/src/environments/environment.ts` — keep `storePhone` and `currency` equal to `STORE_PHONE` / `STORE_CURRENCY` in the backend.

**MongoDB:** local → `mongod` (default `mongodb://127.0.0.1:27017/ecommerce_db`); Atlas → paste its connection string into `MONGODB_URI`.

## 7. Create the manager account
```bash
npm run create-manager
```
Reads `MANAGER_NAME/EMAIL/PASSWORD` from `.env`, hashes the password, and refuses to create a second manager. There is no public registration endpoint.

## 8. Run
```bash
npm run dev            # backend (5000) + frontend (4200)
npm run start:backend  # backend only
npm start --prefix frontend   # frontend only
npm run build          # production build of the Angular app
```
Store: http://localhost:4200 · Manager login: http://localhost:4200/manager/login

## 9. API (`/api/v1`)
| Method | Path | Access |
|---|---|---|
| POST | /auth/login, /auth/logout · GET /auth/me | public / public / manager |
| GET | /categories, /categories/:id | public (active only) |
| POST/PATCH/DELETE | /categories(/:id) | manager |
| GET | /items, /items/:id | public (active, **no quantity**) |
| POST/PATCH/DELETE | /items(/:id) | manager |
| POST | /orders | public |
| GET | /orders, /orders/:id · PATCH /orders/:id/status, /orders/:id/notes | manager |
| GET | /dashboard/stats | manager |

Item/category listings accept `?scope=manager` — honoured **only** with a valid manager session (adds inactive records and exact `quantity`). Items also accept `search`, `category`, `sort`, `featured`, `page`, `limit`. Responses: `{ success, data, meta? }`; errors: `{ success:false, code, message, details? }`.

## 10. Languages and RTL
The switcher is in the public navbar and the dashboard header (and login page). It sets `<html lang>` and `dir` and saves the choice in LocalStorage (`lang`) without reloading. Product/category content is not auto-translated — the manager enters it in either language.

## 11. LocalStorage
`favorites` (item ids) and `cart` (item ids + quantities). **No prices are stored**; the cart re-fetches current data and the backend recalculates totals at checkout. Malformed data is discarded; deleted/inactive items are shown as unavailable.

## 12. Checkout and phone confirmation
Customer submits name, phone, optional email, address, notes → backend validates items and current stock, uses **database prices**, creates an order with a unique code (`ORD-YYYYMMDD-XXXXXX`, generated in `order.service.js`) and status `opened` → success page explains that the store will call. The cart is cleared only after success; the button is disabled while submitting, and a per-attempt `clientRequestId` makes retries idempotent.

## 13. Order status and inventory
Statuses: `opened` (awaiting/being handled) and `closed` (finished). **Inventory is not reserved or deducted automatically in Sprint 01**; stock is only validated when an order is submitted. The manager confirms availability by phone and updates quantities manually.

## 14. Manager dashboard
Overview cards (real data), categories (CRUD, activate, search; deletion blocked while items exist), items (CRUD, exact quantity, activate, featured, search/filters), orders (search by code/name/phone, status filter, details, clickable phone, customer notes vs. internal manager notes, open/close).

## 15. Security notes
- JWT is stored in an **HttpOnly, SameSite=Lax cookie** (not readable by JavaScript → resistant to XSS theft). Trade-off: cookie auth needs CSRF consideration; SameSite + CORS allow-list + JSON-only API mitigate it. For a frontend on a different site, set `COOKIE_SAME_SITE=none` and serve over HTTPS.
- Passwords are bcrypt-hashed and never returned; `password` is `select:false`.
- Every manager endpoint requires authentication and the `manager` role; there is no public order lookup.
- Public item responses never include `quantity` (only an `isAvailable` flag).
- Helmet, CORS restricted to `CLIENT_URL`, rate limits (login 10/15 min, orders, general), body size limit, express-validator on all inputs, regex-escaped search.
- Set `NODE_ENV=production` and a 32+ char `JWT_SECRET` in production; stack traces are never returned.

## 16. Troubleshooting
- **`JWT_SECRET is missing`** → create `backend/.env` from the example.
- **`MongoDB connection failed`** → start `mongod` or fix `MONGODB_URI`.
- **Login works but the dashboard bounces to login** → `CLIENT_URL` must exactly match the frontend origin (`http://localhost:4200`), and `apiUrl` must point to the backend.
- **429 on login** → wait 15 minutes (rate limit).
- **Fonts missing offline** → Google Fonts need internet; fallbacks are used.
