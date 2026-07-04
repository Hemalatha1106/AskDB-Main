# 🚀 AskDB

> Chat with your database using natural language. No SQL required.

AskDB is an AI-powered database assistant that allows users to interact with their databases using plain English. Instead of writing complex SQL queries, simply ask questions like:

- "What are my top 10 customers?"
- "Show monthly revenue trends."
- "Which products have the highest sales?"
- "Compare sales between 2024 and 2025."

AskDB understands your database schema, generates optimized SQL, executes it safely, and returns results along with visualizations and insights.

---

## ✨ Features

- 🤖 AI-powered natural language to SQL
- 🗄️ Connect to your own database
- 💬 Chat-based interface
- 📊 Automatic chart generation
- 📈 Dashboard and KPI visualization
- 🔍 Schema-aware SQL generation
- 📝 Query history
- 🌙 Dark & Light mode
- 🔒 Uses only the currently connected database
- ⚡ FastAPI backend

---

## 🖥️ Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- FastAPI
- Python
- SQLAlchemy
- Pandas

### Database
- MySQL
- PostgreSQL (planned)
- SQLite (planned)
- SQL Server (planned)

### AI
- OpenAI Compatible APIs
- Schema-aware prompting
- RAG-ready architecture

---

## 📂 Project Structure

```
AskDB/
│
├── app/
├── ask-db-frontend/
├── data/
├── notebooks/
├── tests/
├── server.py
├── main.py
├── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Hemalatha1106/AskDB-Main.git
cd AskDB-Main
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it:

Windows

```bash
venv\Scripts\activate
```

Linux/macOS

```bash
source venv/bin/activate
```

---

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Configure Environment Variables

Create a `.env` file.

Example:

```env
OPENAI_API_KEY=your_api_key

DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database
DB_USER=root
DB_PASSWORD=your_password
```

---

### 5. Run the backend

```bash
python server.py
```

or

```bash
uvicorn main:app --reload
```

---

### 6. Run the frontend

```bash
cd ask-db-frontend
npm install
npm run dev
```

---

## 💡 How It Works

1. User connects a database.
2. AskDB loads the schema.
3. User asks a question in natural language.
4. AI generates SQL using the schema.
5. SQL executes against the connected database.
6. Results are displayed as tables, charts, and summaries.

> AskDB never relies on mock data. All answers are generated from the currently connected database.

---

## 📸 Screenshots

Add screenshots of:

- Landing Page
- Chat Interface
- Database Connection
- Dashboard
- Generated Charts

---

## 🛣️ Roadmap

- [x] AI Chat
- [x] Database Connection
- [x] SQL Generation
- [x] Charts
- [x] Dashboard
- [ ] RAG-based schema retrieval
- [ ] Multi-database support
- [ ] Team workspaces
- [ ] Scheduled reports
- [ ] Export to PDF/CSV
- [ ] Fine-grained permissions

---

## 🤝 Contributing

Contributions, feature requests, and suggestions are welcome.

Feel free to fork the project and open a pull request.

---

## 📜 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

**Hemalatha**

- GitHub: https://github.com/Hemalatha1106

---

⭐ If you found this project useful, consider giving it a star!
