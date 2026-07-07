import hashlib
import secrets
from datetime import datetime, timedelta
from sqlalchemy import text, inspect
from app.database.connection import get_engine

def init_db():
    """
    Initializes the system database schema.
    """
    engine = get_engine()
    dialect = engine.name
    
    # Auto-migration: Check if column 'is_active' exists in user_connections table
    inspector = inspect(engine)
    if "user_connections" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("user_connections")]
        if "is_active" not in columns:
            print("Auto-migration: Dropping old user_connections table to upgrade schema...")
            with engine.begin() as conn:
                conn.execute(text("DROP TABLE IF EXISTS user_connections"))
                
    # Auto-migration: Check if column 'plot' in messages table needs to be LONGTEXT (mysql)
    if "messages" in inspector.get_table_names():
        columns = inspector.get_columns("messages")
        plot_col = next((c for c in columns if c["name"] == "plot"), None)
        if plot_col and dialect == "mysql":
            col_type = str(plot_col["type"]).upper()
            if "LONGTEXT" not in col_type:
                print("Auto-migration: Altering messages.plot column to LONGTEXT...")
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE messages MODIFY COLUMN plot LONGTEXT"))
                    
    # Auto-migration: Check if column 'created_at' exists in messages table
    if "messages" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("messages")]
        if "created_at" not in columns:
            print("Auto-migration: Adding created_at column to messages table...")
            with engine.begin() as conn:
                alter_syntax = "ALTER TABLE messages ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" if dialect == "sqlite" else "ALTER TABLE messages ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                conn.execute(text(alter_syntax))
    
    # Dialect-specific types and syntax
    pk_type = "INTEGER PRIMARY KEY AUTOINCREMENT" if dialect == "sqlite" else "INT AUTO_INCREMENT PRIMARY KEY"
    ts_type = "DATETIME DEFAULT CURRENT_TIMESTAMP" if dialect == "sqlite" else "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    text_type = "TEXT"
    plot_type = "TEXT" if dialect == "sqlite" else "LONGTEXT"
    
    with engine.begin() as conn:
        # Create users table
        conn.execute(text(f"""
        CREATE TABLE IF NOT EXISTS users (
            id {pk_type},
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            salt VARCHAR(255) NOT NULL,
            created_at {ts_type}
        )
        """))
        
        # Create sessions table
        conn.execute(text(f"""
        CREATE TABLE IF NOT EXISTS sessions (
            token VARCHAR(64) PRIMARY KEY,
            user_id INT NOT NULL,
            created_at {ts_type},
            expires_at DATETIME NOT NULL
        )
        """))
        
        # Create user_connections table (allows multiple connections per user)
        conn.execute(text(f"""
        CREATE TABLE IF NOT EXISTS user_connections (
            id {pk_type},
            user_id INT NOT NULL,
            dialect VARCHAR(50) NOT NULL,
            host VARCHAR(255),
            port INT,
            username VARCHAR(255),
            password VARCHAR(255),
            database_name VARCHAR(255),
            ssl_enabled BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 0,
            created_at {ts_type}
        )
        """))
        
        # Create chats table
        conn.execute(text(f"""
        CREATE TABLE IF NOT EXISTS chats (
            id VARCHAR(64) PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            created_at {ts_type}
        )
        """))
        
        # Create messages table
        conn.execute(text(f"""
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(64) PRIMARY KEY,
            chat_id VARCHAR(64) NOT NULL,
            role VARCHAR(20) NOT NULL,
            content {text_type} NOT NULL,
            sql_query {text_type},
            plot {plot_type},
            timestamp VARCHAR(50) NOT NULL,
            created_at {ts_type}
        )
        """))
        
        # Create reports table
        conn.execute(text(f"""
        CREATE TABLE IF NOT EXISTS reports (
            id VARCHAR(64) PRIMARY KEY,
            user_id INT NOT NULL,
            chat_id VARCHAR(64),
            message_id VARCHAR(64),
            title VARCHAR(255) NOT NULL,
            query {text_type},
            sql_query {text_type},
            answer {text_type},
            plot {plot_type},
            created_at {ts_type}
        )
        """))
        
        # Create user_ai_settings table
        conn.execute(text(f"""
        CREATE TABLE IF NOT EXISTS user_ai_settings (
            user_id INT PRIMARY KEY,
            provider VARCHAR(50) NOT NULL,
            encrypted_api_key TEXT,
            model VARCHAR(100),
            use_personal_key BOOLEAN DEFAULT 0,
            created_at {ts_type},
            updated_at {ts_type}
        )
        """))


def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return hashed, salt

def create_user(email: str, password: str) -> int:
    init_db()
    engine = get_engine()
    password_hash, salt = hash_password(password)
    
    with engine.begin() as conn:
        result = conn.execute(
            text("INSERT INTO users (email, password_hash, salt) VALUES (:email, :password_hash, :salt)"),
            {"email": email, "password_hash": password_hash, "salt": salt}
        )
        # Fetch inserted id
        if engine.name == "sqlite":
            return result.lastrowid
        else:
            # For MySQL
            row = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
            return row[0] if row else None

def verify_user(email: str, password: str) -> dict | None:
    init_db()
    engine = get_engine()
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, email, password_hash, salt FROM users WHERE email = :email"),
            {"email": email}
        ).fetchone()
        
        if not row:
            return None
            
        user_id, user_email, password_hash, salt = row
        hashed_input, _ = hash_password(password, salt)
        
        if hashed_input == password_hash:
            return {"id": user_id, "email": user_email}
    return None

def create_session(user_id: int) -> str:
    init_db()
    engine = get_engine()
    token = secrets.token_hex(32)
    expires_at = datetime.now() + timedelta(days=7)
    
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO sessions (token, user_id, expires_at) VALUES (:token, :user_id, :expires_at)"),
            {"token": token, "user_id": user_id, "expires_at": expires_at}
        )
    return token

def get_user_by_session(token: str) -> dict | None:
    init_db()
    engine = get_engine()
    with engine.connect() as conn:
        # Resolve token
        row = conn.execute(
            text("""
            SELECT u.id, u.email, s.expires_at 
            FROM sessions s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.token = :token
            """),
            {"token": token}
        ).fetchone()
        
        if not row:
            return None
            
        user_id, email, expires_at = row
        # Check if expires_at is string (SQLite fallback) or datetime
        if isinstance(expires_at, str):
            try:
                # SQLite datetime format
                expires_at = datetime.strptime(expires_at.split(".")[0], "%Y-%m-%d %H:%M:%S")
            except:
                pass
                
        if datetime.now() > expires_at:
            # Delete expired session
            with engine.begin() as delete_conn:
                delete_conn.execute(text("DELETE FROM sessions WHERE token = :token"), {"token": token})
            return None
            
        return {"id": user_id, "email": email}

def list_user_connections(user_id: int) -> list:
    init_db()
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
            SELECT id, dialect, host, port, username, database_name, ssl_enabled, is_active 
            FROM user_connections 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC
            """),
            {"user_id": user_id}
        ).fetchall()
        
        conns = []
        for r in rows:
            conns.append({
                "id": r[0],
                "dialect": r[1],
                "host": r[2],
                "port": r[3],
                "username": r[4],
                "database_name": r[5],
                "ssl": bool(r[6]),
                "is_active": bool(r[7])
            })
        return conns

def add_user_connection(user_id: int, config: dict) -> int:
    init_db()
    engine = get_engine()
    
    # Check if they have any connections. If none, set this one active.
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM user_connections WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchone()
        is_active = 0 if existing else 1
        
    with engine.begin() as conn:
        result = conn.execute(
            text("""
            INSERT INTO user_connections (user_id, dialect, host, port, username, password, database_name, ssl_enabled, is_active)
            VALUES (:user_id, :dialect, :host, :port, :username, :password, :database_name, :ssl_enabled, :is_active)
            """),
            {
                "user_id": user_id,
                "dialect": config.get("database", "sqlite"),
                "host": config.get("host", ""),
                "port": int(config.get("port")) if config.get("port") else None,
                "username": config.get("username", ""),
                "password": config.get("password", ""),
                "database_name": config.get("database_name", ""),
                "ssl_enabled": 1 if config.get("ssl") else 0,
                "is_active": is_active
            }
        )
        
        if engine.name == "sqlite":
            return result.lastrowid
        else:
            row = conn.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
            return row[0] if row else None

def set_active_connection(user_id: int, conn_id: int):
    init_db()
    engine = get_engine()
    with engine.begin() as conn:
        # Set all connections for this user to inactive
        conn.execute(
            text("UPDATE user_connections SET is_active = 0 WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        # Set specified connection as active
        conn.execute(
            text("UPDATE user_connections SET is_active = 1 WHERE user_id = :user_id AND id = :id"),
            {"user_id": user_id, "id": conn_id}
        )

def delete_user_connection(user_id: int, conn_id: int) -> bool:
    init_db()
    engine = get_engine()
    
    # Check if the deleted connection was active
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT is_active FROM user_connections WHERE user_id = :user_id AND id = :id"),
            {"user_id": user_id, "id": conn_id}
        ).fetchone()
        if not row:
            return False
        was_active = bool(row[0])
        
    with engine.begin() as conn:
        # Delete connection
        conn.execute(
            text("DELETE FROM user_connections WHERE user_id = :user_id AND id = :id"),
            {"user_id": user_id, "id": conn_id}
        )
        
        # If it was active, set the most recent connection as active
        if was_active:
            recent = conn.execute(
                text("SELECT id FROM user_connections WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1"),
                {"user_id": user_id}
               ).fetchone()
            if recent:
                conn.execute(
                    text("UPDATE user_connections SET is_active = 1 WHERE id = :id"),
                    {"id": recent[0]}
                )
    return True

def get_active_connection(user_id: int) -> dict | None:
    init_db()
    engine = get_engine()
    with engine.connect() as conn:
        row = conn.execute(
            text("""
            SELECT id, dialect, host, port, username, password, database_name, ssl_enabled 
            FROM user_connections 
            WHERE user_id = :user_id AND is_active = 1
            """),
            {"user_id": user_id}
        ).fetchone()
        
        if not row:
            return None
            
        conn_id, dialect, host, port, username, password, database_name, ssl_enabled = row
        return {
            "id": conn_id,
            "dialect": dialect,
            "host": host,
            "port": port,
            "username": username,
            "password": password,
            "database_name": database_name,
            "ssl": bool(ssl_enabled)
        }

def get_connection_string(config: dict) -> str:
    dialect = config.get("dialect", "sqlite")
    if dialect == "sqlite":
        # SQLite db path
        db_path = config.get("database_name") or "data/askdb.db"
        return f"sqlite:///{db_path}"
        
    driver = ""
    if dialect == "postgresql":
        driver = "+psycopg2"
    elif dialect == "mysql":
        driver = "+pymysql"
        
    username = config.get("username", "")
    password = config.get("password", "")
    host = config.get("host", "localhost")
    port = config.get("port")
    database_name = config.get("database_name", "")
    
    # URL encode password for safety
    import urllib.parse
    encoded_password = urllib.parse.quote_plus(password)
    
    cred = f"{username}:{encoded_password}@" if username else ""
    port_str = f":{port}" if port else ""
    
    return f"{dialect}{driver}://{cred}{host}{port_str}/{database_name}"

def create_chat(chat_id: str, user_id: int, title: str):
    init_db()
    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO chats (id, user_id, title) VALUES (:id, :user_id, :title)"),
            {"id": chat_id, "user_id": user_id, "title": title}
        )

def get_user_chats(user_id: int) -> list:
    init_db()
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, title, created_at FROM chats WHERE user_id = :user_id ORDER BY created_at DESC"),
            {"user_id": user_id}
        ).fetchall()
        
        chats = []
        for r in rows:
            created_at = r[2]
            if isinstance(created_at, str):
                created_at = created_at.split(".")[0]
            else:
                created_at = created_at.strftime("%Y-%m-%d %H:%M:%S")
            chats.append({
                "id": r[0],
                "title": r[1],
                "created_at": created_at
            })
        return chats

def save_message(msg_id: str, chat_id: str, role: str, content: str, sql_query: str = None, plot: str = None, timestamp: str = None):
    init_db()
    engine = get_engine()
    if timestamp is None:
        timestamp = datetime.now().strftime("%I:%M %p")
        
    with engine.begin() as conn:
        conn.execute(
            text("""
            INSERT INTO messages (id, chat_id, role, content, sql_query, plot, timestamp)
            VALUES (:id, :chat_id, :role, :content, :sql_query, :plot, :timestamp)
            """),
            {
                "id": msg_id,
                "chat_id": chat_id,
                "role": role,
                "content": content,
                "sql_query": sql_query,
                "plot": plot,
                "timestamp": timestamp
            }
        )

def get_chat_messages(chat_id: str) -> list:
    init_db()
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, role, content, sql_query, plot, timestamp FROM messages WHERE chat_id = :chat_id ORDER BY created_at ASC"),
            {"chat_id": chat_id}
        ).fetchall()
        
        messages = []
        for r in rows:
            messages.append({
                "id": r[0],
                "role": r[1],
                "content": r[2],
                "sql": r[3] if r[3] else None,
                "plot": r[4] if r[4] else None,
                "timestamp": r[5]
            })
        return messages

def save_report(user_id: int, message_id: str, title: str = None) -> str:
    import uuid
    init_db()
    engine = get_engine()
    
    with engine.connect() as conn:
        # Fetch the assistant message details
        msg = conn.execute(
            text("SELECT chat_id, content, sql_query, plot FROM messages WHERE id = :msg_id AND role = 'assistant'"),
            {"msg_id": message_id}
        ).fetchone()
        
        if not msg:
            raise ValueError("Message not found or is not an assistant message")
            
        chat_id, content, sql_query, plot = msg
        
        # Verify chat belongs to this user
        chat_owner = conn.execute(
            text("SELECT user_id FROM chats WHERE id = :chat_id"),
            {"chat_id": chat_id}
        ).fetchone()
        
        if not chat_owner or chat_owner[0] != user_id:
            raise PermissionError("Access denied: You do not own this chat session.")
            
        # Get preceding user query (the latest user message in the same chat)
        user_query_row = conn.execute(
            text("SELECT content FROM messages WHERE chat_id = :chat_id AND role = 'user' ORDER BY created_at DESC LIMIT 1"),
            {"chat_id": chat_id}
        ).fetchone()
        
        user_query = user_query_row[0] if user_query_row else "Query"
        
        if not title:
            # Default title to first 50 chars of the user query
            title = user_query[:50] + "..." if len(user_query) > 50 else user_query
            if not title.strip():
                title = "Query Analysis Report"
                
    report_id = str(uuid.uuid4())
    
    with engine.begin() as conn:
        conn.execute(
            text("""
            INSERT INTO reports (id, user_id, chat_id, message_id, title, query, sql_query, answer, plot)
            VALUES (:id, :user_id, :chat_id, :message_id, :title, :query, :sql_query, :answer, :plot)
            """),
            {
                "id": report_id,
                "user_id": user_id,
                "chat_id": chat_id,
                "message_id": message_id,
                "title": title,
                "query": user_query,
                "sql_query": sql_query,
                "answer": content,
                "plot": plot
            }
        )
    return report_id

def list_reports(user_id: int) -> list:
    init_db()
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, chat_id, message_id, title, query, sql_query, answer, plot, created_at FROM reports WHERE user_id = :user_id ORDER BY created_at DESC"),
            {"user_id": user_id}
        ).fetchall()
        
        reports = []
        for r in rows:
            created_at = r[8]
            if isinstance(created_at, str):
                created_at = created_at.split(".")[0]
            else:
                created_at = created_at.strftime("%Y-%m-%d %H:%M:%S")
            reports.append({
                "id": r[0],
                "chat_id": r[1],
                "message_id": r[2],
                "title": r[3],
                "query": r[4],
                "sql_query": r[5],
                "answer": r[6],
                "plot": r[7] if r[7] else None,
                "created_at": created_at
            })
        return reports

def delete_report(user_id: int, report_id: str) -> bool:
    init_db()
    engine = get_engine()
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM reports WHERE id = :id AND user_id = :user_id"),
            {"id": report_id, "user_id": user_id}
        )
        return result.rowcount > 0

def get_user_ai_settings(user_id: int) -> dict | None:
    init_db()
    engine = get_engine()
    with engine.connect() as conn:
        row = conn.execute(
            text("""
            SELECT provider, encrypted_api_key, model, use_personal_key 
            FROM user_ai_settings 
            WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        ).fetchone()
        
        if not row:
            return None
            
        return {
            "user_id": user_id,
            "provider": row[0],
            "encrypted_api_key": row[1],
            "model": row[2],
            "use_personal_key": bool(row[3])
        }

def save_user_ai_settings(user_id: int, provider: str, encrypted_key: str, model: str, use_personal_key: bool) -> None:
    init_db()
    engine = get_engine()
    with engine.begin() as conn:
        # Check if settings exist for the user
        exist = conn.execute(
            text("SELECT 1 FROM user_ai_settings WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchone()
        
        if exist:
            conn.execute(
                text("""
                UPDATE user_ai_settings 
                SET provider = :provider, 
                    encrypted_api_key = :encrypted_api_key, 
                    model = :model, 
                    use_personal_key = :use_personal_key,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id,
                    "provider": provider,
                    "encrypted_api_key": encrypted_key,
                    "model": model,
                    "use_personal_key": 1 if use_personal_key else 0
                }
            )
        else:
            conn.execute(
                text("""
                INSERT INTO user_ai_settings (user_id, provider, encrypted_api_key, model, use_personal_key)
                VALUES (:user_id, :provider, :encrypted_api_key, :model, :use_personal_key)
                """),
                {
                    "user_id": user_id,
                    "provider": provider,
                    "encrypted_api_key": encrypted_key,
                    "model": model,
                    "use_personal_key": 1 if use_personal_key else 0
                }
            )

def delete_user_ai_settings(user_id: int) -> None:
    init_db()
    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(
            text("DELETE FROM user_ai_settings WHERE user_id = :user_id"),
            {"user_id": user_id}
        )

