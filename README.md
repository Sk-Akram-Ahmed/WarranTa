# 🛡️ Warranty Tracker Prototype

A full-stack web application designed to track consumer product warranties, upload and securely view receipts, and automatically calculate and notify users before warranties expire.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally on default port 27017 or a valid MongoDB connection string.

---

### 1. Backend Setup

1. Open your terminal in the `server` directory:
   ```bash
   cd server
   npm install
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Note: If you do not configure SMTP variables, emails will safely log to the server console instead.*

3. Populate the database with test data:
   ```bash
   npm run seed
   ```
   *This seeds a user: `demo@example.com` / `Password123!` with 5 diverse warranty cards (Active, Expiring Soon, Expired).*

4. Start the server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a new terminal in the `client` directory:
   ```bash
   cd client
   npm install
   ```

2. Copy the client environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## 🧪 Running Unit Tests

Run the backend date calculation unit tests:
```bash
cd server
npm test
```
This tests UTC calendar math, month rollover boundaries (Jan 31 + 1 month), leap years, and status evaluation.
