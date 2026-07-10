# 🚀 AskDB

<div align="center">

# Chat with Your Database Using Natural Language

**Ask questions in plain English. Generate SQL automatically. Visualize data instantly. Build dashboards. Generate reports.**

No SQL knowledge required.

---

![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-38BDF8?style=for-the-badge)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

# 📖 Overview

AskDB is an AI-powered database assistant that enables users to interact with relational databases using natural language.

Instead of writing complex SQL queries, users simply ask questions like:

> "Show the top 10 customers by revenue."

> "Compare monthly sales for 2024 and 2025."

> "Which products have the highest profit margin?"

> "What are today's pending orders?"

AskDB understands your database schema, generates optimized SQL, safely executes queries on the connected database, and returns results as tables, charts, dashboards, and AI-generated insights.

---

# ✨ Features

## 🤖 AI-Powered Querying

- Natural Language → SQL
- Context-aware conversations
- AI-generated summaries
- Follow-up query support
- Intelligent SQL generation

---

## 🗄 Database Connectivity

- MySQL ✅
- PostgreSQL (Coming Soon)
- SQLite (Coming Soon)
- SQL Server (Coming Soon)

---

## 🧠 Schema-Aware Intelligence

- Automatic schema extraction
- Schema-aware prompting
- RAG-ready architecture
- Optimized SQL generation
- Reduced token usage

---

## 📊 Data Visualization

- Automatic chart generation
- Interactive dashboards
- KPI cards
- Trend analysis
- Comparative analytics

---

## 📑 Reports

- Save AI responses as reports
- Combine multiple reports
- Email report generation
- PDF export 

---

## 💬 Chat Experience

- Chat-based interface
- Query history
- Modern UI
- Dark / Light mode
- Responsive design

---

## 🔒 Security

- Uses only the currently connected database
- No mock data
- Environment-based configuration
- Secure database connections

---

# 🚀 Why AskDB?

Traditional BI tools require users to:

- Learn SQL
- Build dashboards manually
- Write complicated queries

AskDB eliminates these barriers by allowing anyone to analyze databases using natural language.

---

# 🧠 How AskDB Works

```text
User Question
      │
      ▼
React Frontend
      │
      ▼
FastAPI Backend
      │
      ▼
Schema Loader
      │
      ▼
AI Prompt Builder
      │
      ▼
LLM SQL Generator
      │
      ▼
SQL Execution
      │
      ▼
Pandas Data Processing
      │
      ▼
Charts + Dashboard + AI Summary
```

---

# ⚙ Workflow

1. Connect a database.
2. Ask a question in plain English.
3. AskDB loads the database schema.
4. AI generates optimized SQL.
5. SQL executes safely.
6. Results are analyzed.
7. Charts and dashboards are created.
8. AI generates insights.
9. Reports can be saved or emailed.

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Tailwind CSS
- shadcn/ui

---

## Backend

- FastAPI
- Python
- SQLAlchemy
- Pandas

---

## Database

- MySQL
- PostgreSQL (Planned)
- SQLite (Planned)
- SQL Server (Planned)

---

## AI

- OpenAI Compatible APIs
- Schema-aware prompting
- SQL generation pipeline
- RAG-ready architecture

---

# 📂 Project Structure

```
AskDB/
│
├── app/
│   ├── api/
│   ├── ai/
│   ├── database/
│   ├── services/
│   ├── visualization/
│   └── auth/
│
├── ask-db-frontend/
│
├── data/
│
├── notebooks/
│
├── tests/
│
├── server.py
├── main.py
├── requirements.txt
└── README.md
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/Hemalatha1106/AskDB-Main.git

cd AskDB-Main
```

---

## 2. Create a Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create a `.env` file.

```env
OPENAI_API_KEY=your_api_key

DB_HOST=localhost
DB_PORT=3306
DB_NAME=database_name
DB_USER=root
DB_PASSWORD=password
```

---

## 5. Start Backend

```bash
python server.py
```

or

```bash
uvicorn main:app --reload
```

---

## 6. Start Frontend

```bash
cd ask-db-frontend

npm install

npm run dev
```

---

# 💡 Example Questions

```
Show the top 10 customers by revenue.

Monthly sales trend.

Compare revenue between 2024 and 2025.

Which category has the highest profit?

List inactive customers.

Show pending orders.

Average order value by month.

Revenue by region.

Top selling products.

Employee performance dashboard.
```

---

# 🛣 Roadmap

- ✅ Natural Language SQL
- ✅ AI Chat
- ✅ Database Connection
- ✅ SQL Generation
- ✅ Interactive Charts
- ✅ Dashboard
- ✅ Query History
- ✅ Saved Reports
- ✅ Email Reports

---

# 🤝 Contributing

Contributions are always welcome!

If you'd like to improve AskDB:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

# 📜 License

This project is licensed under the MIT License.

---

# 👩‍💻 Author

## Hemalatha

B.Tech Information Technology

GitHub

https://github.com/Hemalatha1106

---

# ⭐ Support

If you found AskDB useful,

⭐ Star the repository

🐛 Report issues

💡 Suggest new features

Contributions are always appreciated!

---

<div align="center">

### 🚀 Ask Better Questions. Get Better Insights.

**Built with ❤️ by Hemalatha**

</div>