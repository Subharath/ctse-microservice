# ShopSphere Frontend

A complete React + Vite frontend for the CTSE microservices backend.

## Tech Stack
- **React 18** + **Vite 5**
- **React Router v6** — client-side routing
- **Axios** — HTTP client with JWT interceptor
- **Tailwind CSS** — utility-first styling
- **Context API** — auth state, cart state, toast notifications

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Sign in |
| `/register` | Create account |
| `/` | Dashboard / home with stats & featured products |
| `/products` | Product catalogue — search, filter by category, paginate |
| `/products/:id` | Product detail + add to cart |
| `/cart` | Shopping cart — update qty, remove items, clear |
| `/checkout` | 3-step checkout (shipping → payment → confirm) |
| `/orders` | My orders with status filter |
| `/orders/:id` | Order detail + payment info (admin: update statuses) |
| `/profile/:userId` | View & edit profile |
| `/admin` | Admin: view all products and update stock |

## Running locally

### Prerequisites
- The API Gateway must be running on `http://localhost:8000`

### Install & start

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

The Vite dev server proxies all `/api` requests to `http://localhost:8000`.

### Build for production

```bash
npm run build
npm run preview   # serves the dist/ folder
```

## API Alignment

All API calls go through the API Gateway at port 8000:

- `POST /api/auth/register` — register
- `POST /api/auth/login` — login (stores JWT in localStorage)
- `GET  /api/products` — list products (with search & category filters)
- `GET  /api/products/:id` — product detail
- `GET/POST/PUT/DELETE /api/carts/:userId/*` — cart operations
- `POST /api/orders` — create order
- `GET  /api/orders/user/me` — my orders
- `GET  /api/orders/:id` — order detail
- `POST /api/payments` — create payment
- `GET  /api/payments/order/:id` — payment for order
- `GET/PUT /api/users/:id` — profile
