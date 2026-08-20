# 🚀 StockSense — Setup Guide

Smart Inventory & Dead Stock Management System  
**Stack:** Node.js + Express · Firebase Firestore · Firebase Auth · Vanilla HTML/CSS/JS · ApexCharts

---

## 📋 Prerequisites

Install these before starting:

1. **Node.js** (v18+) → https://nodejs.org/en/download  
   _(Choose "LTS" version, run the installer, restart your terminal)_

2. **A Firebase Account** → https://firebase.google.com (free)

---

## 🔥 Step 1: Create a Firebase Project

1. Go to → https://console.firebase.google.com
2. Click **"Add project"** → Name it `stocksense` → Click through the steps
3. On the project dashboard:

### Enable Authentication
- Left menu → **Build → Authentication**
- Click **"Get started"**
- Under **Sign-in method** → Enable **Email/Password** → Save

### Enable Firestore Database
- Left menu → **Build → Firestore Database**
- Click **"Create database"**
- Choose **"Start in test mode"** (for development) → Next
- Select a region (e.g., `asia-south1` for India) → Enable

---

## 🔑 Step 2: Get Firebase Admin SDK Credentials (for Backend)

1. In Firebase Console → Click the ⚙️ **gear icon** → **Project settings**
2. Go to the **"Service accounts"** tab
3. Click **"Generate new private key"** → Download the JSON file
4. Open the downloaded JSON file — you'll need 3 values:
   - `project_id`
   - `private_key`
   - `client_email`

---

## 🌐 Step 3: Get Firebase Client SDK Config (for Frontend)

1. In Firebase Console → Click the ⚙️ **gear icon** → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click **"Add app"** → Select **Web** (`</>` icon)
4. Register app name: `stocksense-web` → Click **"Register app"**
5. Copy the `firebaseConfig` object shown

---

## ⚙️ Step 4: Configure the Project

### 4a. Create your `.env` file (Backend config)

In the project root, copy `.env.example` to `.env`:

```
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC123...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
PORT=5000
```

> ⚠️ **Important:** The private key must be in double quotes `"..."` and keep the `\n` as literal `\n` characters.

### 4b. Update Frontend Firebase Config

Open: `public/js/firebase-client-config.js`

Replace the placeholder values with your actual Firebase web config:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 📦 Step 5: Install Dependencies & Run

Open a terminal in the project folder and run:

```bash
npm install
npm run dev
```

The server will start at → **http://localhost:5000**

Open your browser and go to: **http://localhost:5000**

---

## 🌱 Step 6: Seed Demo Data (Optional but Recommended)

1. Register as **Admin** on the login page
2. Go to the **Dashboard**
3. Click the **"Seed Demo Data"** button (Admin only)
4. This inserts 50+ products across 5 categories — some with 120+ day old sales (dead stock), some with low stock

> 💡 This lets you immediately see all dashboard charts and analytics working!

---

## 📁 Project Structure

```
smart-inventory/
├── server/                  ← Node.js + Express Backend
│   ├── index.js             ← Server entry point (port 5000)
│   ├── firebase-admin.js    ← Firebase Admin SDK init
│   ├── middleware/
│   │   ├── verifyToken.js   ← JWT authentication guard
│   │   └── checkRole.js     ← Admin/Manager role guard
│   └── routes/
│       ├── auth.js          ← POST /api/auth/register, /login
│       ├── products.js      ← CRUD /api/products
│       ├── inventory.js     ← GET/PUT /api/inventory
│       ├── sales.js         ← POST/GET /api/sales
│       ├── analytics.js     ← GET /api/analytics/*
│       └── seed.js          ← POST /api/seed
│
├── public/                  ← Frontend (served as static files)
│   ├── index.html           ← Login/Register page
│   ├── dashboard.html       ← Main dashboard + charts
│   ├── inventory.html       ← Inventory table + CRUD
│   ├── sales.html           ← Log sales transactions
│   ├── analytics.html       ← Dead stock & low stock reports
│   ├── css/
│   │   ├── main.css         ← Global dark glassmorphism design
│   │   ├── dashboard.css    ← Dashboard-specific styles
│   │   └── tables.css       ← Table & modal styles
│   └── js/
│       ├── firebase-client-config.js  ← ⚠️ Fill this in!
│       ├── api.js           ← API fetch wrapper
│       ├── auth.js          ← Login/Register logic
│       ├── dashboard.js     ← Dashboard data & stat cards
│       ├── inventory.js     ← Inventory CRUD logic
│       ├── sales.js         ← Sale logging logic
│       ├── analytics.js     ← Dead stock reports
│       ├── charts.js        ← ApexCharts setup
│       └── ui.js            ← Toasts, modals, helpers
│
├── .env                     ← ⚠️ Create this! (see Step 4a)
├── .env.example             ← Template for .env
├── package.json
└── SETUP.md                 ← This file
```

---

## 🔗 API Endpoints Reference

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get role |
| GET | `/api/products` | All | List all inventory |
| POST | `/api/products` | Manager+ | Add product |
| PUT | `/api/products/:id` | Manager+ | Update product |
| DELETE | `/api/products/:id` | Admin only | Delete product |
| GET | `/api/inventory` | All | List inventory batches |
| PUT | `/api/inventory/:id` | Manager+ | Update stock |
| POST | `/api/sales` | All | Log a sale |
| GET | `/api/sales` | All | Sales history |
| GET | `/api/analytics/summary` | All | Dashboard stat cards |
| GET | `/api/analytics/dead-stock` | All | Dead stock (>90 days) |
| GET | `/api/analytics/low-stock` | All | Low stock alerts |
| GET | `/api/analytics/sales-trend` | All | Monthly sales trend |
| GET | `/api/analytics/by-category` | All | Stock by category |
| POST | `/api/seed` | Admin only | Seed 50+ demo products |

---

## ⚠️ Firestore Composite Index

The dead stock query uses two WHERE clauses (`currentStock > 0` AND `lastSaleAt <= cutoff`). Firestore requires a **composite index** for this.

When you first hit `/api/analytics/dead-stock`, if you see an index error, the error message will include a **direct link** to create the index in Firebase Console. Click it and create the index — it takes ~2 minutes.

---

## 🧪 Roles & Permissions

| Feature | Manager | Admin |
|---------|---------|-------|
| View Dashboard & Analytics | ✅ | ✅ |
| Add Products | ✅ | ✅ |
| Edit Products | ✅ | ✅ |
| Delete Products | ❌ | ✅ |
| Log Sales | ✅ | ✅ |
| Seed Demo Data | ❌ | ✅ |

---

## 🐛 Troubleshooting

**"npm is not recognized"** → Node.js not installed. Download from https://nodejs.org

**"Firebase: Error (auth/invalid-api-key)"** → Check `firebase-client-config.js` values

**"Cannot read privateKey"** → In `.env`, make sure private key is in double quotes

**Charts not showing** → Seed demo data first, or add products and log some sales

**Dead stock query fails** → Create the Firestore composite index (see above)

---

## 👥 Team

Built by **Dhruvik & Rudra** — Smart Inventory & Dead Stock Management Project
