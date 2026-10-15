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
   Add your Cloudinary credentials in `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
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

## ☁️ Cloudinary storage

Warranty attachments are uploaded to Cloudinary instead of the local server filesystem. The backend stores the Cloudinary `secure_url`, `publicId`, `resourceType`, `format`, and file size in MongoDB. Files are retrieved through signed URLs for authenticated access and are deleted from Cloudinary when a record or file is removed.

## ⚖️ Legal pages and account deletion

The public `/privacy`, `/terms`, and `/contact` pages contain starter policy text. Before deploying, replace placeholders such as `[Your Name]`, `[your-email@example.com]`, `[email provider]`, and `[Your jurisdiction]` with accurate details and have the policies reviewed for your service and jurisdiction.

Users can delete their account from Account Settings after confirming their password. This removes their warranty records and associated uploaded files from active application storage.
