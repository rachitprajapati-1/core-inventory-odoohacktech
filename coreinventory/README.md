# 📦 CoreInventory — Full-Stack MERN IMS

A production-ready, modular **Inventory Management System** built with the MERN stack.

## 🚀 Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18, Vite, Tailwind CSS, Recharts |
| Backend   | Node.js, Express.js |
| Database  | MongoDB + Mongoose |
| Realtime  | Socket.io |
| Auth      | JWT + OTP |
| Export    | ExcelJS, PDFKit |
| Barcode   | ZXing (scan), bwip-js (generate) |

---

## 📁 Project Structure

```
coreinventory/
├── backend/            # Express API server
│   ├── config/         # DB connection
│   ├── middleware/      # Auth middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── utils/          # Email helper
│   └── server.js       # Entry point
│
└── frontend/           # React app (Vite)
    └── src/
        ├── components/ # Layout, common UI
        ├── context/    # Auth, Socket context
        ├── pages/      # All pages
        └── services/   # Axios API service
```

---

## ⚙️ Setup Instructions

### 1. MongoDB
Make sure MongoDB is running locally or use MongoDB Atlas.

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your values (MongoDB URI, JWT secret, email)
npm install
npm run dev
# Server starts at http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App starts at http://localhost:5173
```

---

## 🔑 Environment Variables

| Variable     | Description |
|-------------|-------------|
| `MONGO_URI`  | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRE` | Token expiry (e.g., `7d`) |
| `EMAIL_HOST` | SMTP host for OTP emails |
| `EMAIL_USER` | Email username |
| `EMAIL_PASS` | Email app password |
| `CLIENT_URL` | Frontend URL (CORS) |
| `NODE_ENV`   | `development` or `production` |

---

## 👤 User Roles

| Role    | Permissions |
|---------|------------|
| `admin`   | Full access — create, edit, delete, validate all |
| `manager` | Create, edit, validate operations |
| `staff`   | View only — cannot validate operations |

---

## 🌟 Features

### Core Operations
- ✅ **Dashboard** — KPIs, charts, real-time stock snapshot
- ✅ **Products** — Create/edit with SKU, barcode, categories, reorder rules
- ✅ **Receipts** — Incoming stock from vendors, validate → stock +
- ✅ **Deliveries** — Outgoing to customers, validate → stock −
- ✅ **Internal Transfers** — Move stock between warehouses
- ✅ **Stock Adjustments** — Fix discrepancies, physical count
- ✅ **Move History** — Full stock ledger with all movements

### Bonus Features (A++)
- ✅ **Barcode Scanning** — Camera-based using ZXing library
- ✅ **Export Reports** — Excel & PDF for products and ledger
- ✅ **Real-time Updates** — Socket.io live stock notifications
- ✅ **Notifications** — In-app bell + toast alerts
- ✅ **Role-based Access** — Admin / Manager / Staff permissions
- ✅ **OTP Password Reset** — Email-based reset flow
- ✅ **Multi-warehouse** — Full multi-location stock tracking
- ✅ **Global Search** — Search products by name, SKU, or barcode

---

## 📡 API Endpoints

| Resource         | Endpoint |
|-----------------|----------|
| Auth            | `/api/auth` |
| Products        | `/api/products` |
| Categories      | `/api/categories` |
| Warehouses      | `/api/warehouses` |
| Receipts        | `/api/receipts` |
| Deliveries      | `/api/deliveries` |
| Transfers       | `/api/transfers` |
| Adjustments     | `/api/adjustments` |
| Stock Ledger    | `/api/ledger` |
| Dashboard       | `/api/dashboard/stats` |
| Export          | `/api/export/products/excel|pdf`, `/api/export/ledger/excel` |
| Notifications   | `/api/notifications` |
| Barcode         | `/api/barcode/generate/:text`, `/api/barcode/qr/:text` |

---

## 🎨 Design Highlights

- Dark-themed, glass-morphism UI
- Fully responsive (mobile + desktop)
- Animated sidebar, real-time live badge
- Color-coded stock status (In Stock / Low / Out)
- Interactive Recharts dashboards

___
