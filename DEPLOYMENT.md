# AskDB Production Deployment Guide (Cloud PaaS)

This guide walks you through deploying **AskDB** to cloud platforms. We will host the **Next.js Frontend on Vercel**, the **FastAPI Backend on Render**, and the database on a managed cloud service.

---

## Architecture Overview

```text
┌─────────────────┐
│ Next.js Frontend│
│   (Vercel)      │
└────────┬────────┘
         │ (HTTPS / REST API)
         ▼
┌─────────────────┐       ┌──────────────────┐
│ FastAPI Backend │ ─────►│  Cloud Database  │
│   (Render)      │       │ (MySQL/PostgreSQL│
└─────────────────┘       └──────────────────┘
```

---

## Step 1: Database Setup

AskDB uses a central database to store users, sessions, database connection details, chats, reports, and settings. 

1. Sign up for a managed cloud database provider (e.g., [Aiven](https://aiven.io/) for MySQL/PostgreSQL, or [Neon](https://neon.tech/) for PostgreSQL).
2. Create a database instance (a free-tier instance is suitable for testing/low usage).
3. Copy the **Connection URI/String** of your database (e.g. `mysql://user:password@host:port/dbname` or `postgresql://...`).
4. Keep this connection string ready; you will provide it to the backend as `DATABASE_URL`.

---

## Step 2: Backend Deployment (Render)

Render is a developer-friendly platform for hosting Python/FastAPI services.

1. Sign in to [Render](https://render.com/) and click **New > Web Service**.
2. Connect your GitHub repository containing the AskDB codebase.
3. Configure the Web Service settings:
   * **Name**: `askdb-backend` (or similar)
   * **Region**: Choose the region closest to your database/users
   * **Branch**: `main`
   * **Runtime**: `Python` (or `Python 3` depending on Render's UI)
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python -m uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Click **Advanced** and add the following **Environment Variables**:
   * `DATABASE_URL`: Set this to your Cloud Database Connection URI (from Step 1).
   * `gemini_api_key`: Your Google Gemini API Key.
   * `ENCRYPTION_KEY`: A 32-byte cryptography encryption key. You can generate a valid key using python in your terminal:
     ```bash
     python -c "import cryptography.fernet; print(cryptography.fernet.Fernet.generate_key().decode())"
     ```
   * `FRONTEND_URL`: The URL of your frontend (e.g. `https://your-askdb-app.vercel.app` — you can update this once Vercel finishes deploying).
   * `BACKEND_URL`: The URL of this Render web service itself (e.g., `https://askdb-backend.onrender.com`).
   * *(Optional)* OAuth keys for Gmail integration: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
5. Click **Create Web Service**. Render will build and deploy the backend. Copy the live service URL.

---

## Step 3: Frontend Deployment (Vercel)

Vercel is the optimal hosting platform for Next.js applications.

1. Sign in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Import your GitHub repository containing the AskDB codebase.
3. In the project configuration page:
   * **Framework Preset**: Select `Next.js`.
   * **Root Directory**: Select `ask-db-frontend`.
4. Click **Environment Variables** and add:
   * **Key**: `NEXT_PUBLIC_API_URL`
   * **Value**: Set this to your Render backend URL (e.g., `https://askdb-backend.onrender.com` — *do not add a trailing slash*).
5. Click **Deploy**. Vercel will build your Next.js application and deploy it globally.
6. Once deployed, copy your Vercel frontend URL, go back to your **Render Web Service Settings**, and update the `FRONTEND_URL` environment variable with your Vercel URL. This ensures CORS, sessions, and OAuth callback redirects function properly.

---

## Step 4: Verification

1. Open your Vercel frontend URL in a browser.
2. Confirm the logo renders correctly and click **Sign Up** or **Log In**.
3. Create an account. Your user credentials will be saved directly in your Cloud Database.
4. Go to **Connections** and add a relational database connection. AskDB will extract the schema and allow you to ask natural language queries immediately!
