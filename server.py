import os
import sys
import base64
import uuid
from typing import Optional
from sqlalchemy import text
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.rag.retriever import Retriever
from app.llm.prompt_builder import PromptBuilder
from app.llm.sql_generator import SQLGenerator
from app.executor.sql_executor import SQLExecutor
from app.llm.response_synthesizer import ResponseSynthesizer
from app.utils.visualizer import DataVisualizer
from app.database.connection import get_dialect, get_engine

# Import SaaS System DB helpers for multi-connections
from app.database.system_db import (
    init_db,
    create_user,
    verify_user,
    create_session,
    get_user_by_session,
    list_user_connections,
    add_user_connection,
    set_active_connection,
    delete_user_connection,
    get_active_connection,
    get_connection_string,
    create_chat,
    get_user_chats,
    save_message,
    get_chat_messages,
    save_report,
    list_reports,
    delete_report,
    get_user_ai_settings,
    save_user_ai_settings,
    delete_user_ai_settings
)
from app.llm.providers import (
    encrypt_key,
    decrypt_key,
    InvalidAPIKeyError,
    ModelUnavailableError
)


app = FastAPI(title="AskDB API", description="AI-powered SQL query assistant API with Multi-Connection Isolation")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_init():
    init_db()

# --- Request/Response Models ---

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class DatabaseConnectRequest(BaseModel):
    database: str
    host: str = ""
    port: str = ""
    username: str = ""
    password: str = ""
    database_name: str = ""
    ssl: bool = False

class CreateChatRequest(BaseModel):
    chat_id: str
    title: str

class QueryRequest(BaseModel):
    query: str
    chat_id: Optional[str] = None

class SaveReportRequest(BaseModel):
    message_id: str
    title: Optional[str] = None

class AISettingsRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: str
    use_personal_key: bool

class QueryResponse(BaseModel):

    success: bool
    sql: str = ""
    answer: str = ""
    columns: list = []
    rows: list = []
    plot: str = ""  # Base64 encoded image string
    message_id: str = ""  # UUID of the saved assistant message
    error: str = ""

# --- Authentication Dependency ---

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token missing")
    token = authorization.split(" ")[1]
    user = get_user_by_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    return user

# --- Auth Routes ---

@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    try:
        user_id = create_user(req.email, req.password)
        token = create_session(user_id)
        return {
            "success": True,
            "token": token,
            "user": {"id": user_id, "email": req.email}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = verify_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_session(user["id"])
    return {
        "success": True,
        "token": token,
        "user": user
    }

@app.get("/api/auth/me")
def me(user = Depends(get_current_user)):
    return {"success": True, "user": user}

# --- Database Connection Routes ---

@app.get("/api/database/status")
def database_status(user = Depends(get_current_user)):
    config = get_active_connection(user["id"])
    if not config:
        return {"connected": False}
    return {
        "connected": True,
        "dialect": config["dialect"],
        "database": config["database_name"]
    }

@app.get("/api/database/connections")
def list_connections(user = Depends(get_current_user)):
    connections = list_user_connections(user["id"])
    return {"success": True, "connections": connections}

@app.post("/api/database/connections/{conn_id}/active")
def make_connection_active(conn_id: int, user = Depends(get_current_user)):
    set_active_connection(user["id"], conn_id)
    return {"success": True}

@app.delete("/api/database/connections/{conn_id}")
def delete_connection(conn_id: int, user = Depends(get_current_user)):
    success = delete_user_connection(user["id"], conn_id)
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"success": True}

@app.post("/api/database/connect")
def connect_database(req: DatabaseConnectRequest, user = Depends(get_current_user)):
    config = req.dict()
    conn_str = get_connection_string({
        "dialect": req.database,
        "host": req.host,
        "port": req.port,
        "username": req.username,
        "password": req.password,
        "database_name": req.database_name,
        "ssl": req.ssl
    })
    
    # Test connection
    from sqlalchemy import create_engine
    try:
        engine = create_engine(conn_str)
        with engine.connect() as conn:
            pass
        engine.dispose()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database connection test failed: {str(e)}")
        
    # Save connection to System DB (returns generated connection ID)
    connection_id = add_user_connection(user["id"], config)
    
    # Run Schema Extraction and indexing isolated by connection ID
    user_schema_path = f"data/schema_conn_{connection_id}.json"
    user_index_path = f"vector_store/conn_{connection_id}.index"
    user_metadata_path = f"vector_store/conn_{connection_id}_metadata.pkl"
    
    try:
        test_engine = create_engine(conn_str)
        
        # 1. Extract Schema
        from app.database.schema_extractor import extract_schema
        extract_schema(output_path=user_schema_path, engine=test_engine)
        
        # 2. Build FAISS index for this connection
        from app.rag.indexer import Indexer
        indexer = Indexer(
            schema_path=user_schema_path,
            index_path=user_index_path,
            metadata_path=user_metadata_path
        )
        indexer.build_index()
        test_engine.dispose()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Connection succeeded, but schema extraction/indexing failed: {str(e)}"
        )
        
    return {"success": True}

# --- Chat History Routes ---

@app.get("/api/chats")
def list_chats(user = Depends(get_current_user)):
    chats = get_user_chats(user["id"])
    return {"success": True, "chats": chats}

@app.post("/api/chats")
def init_chat(req: CreateChatRequest, user = Depends(get_current_user)):
    create_chat(req.chat_id, user["id"], req.title)
    return {"success": True}

@app.get("/api/chats/{chat_id}")
def chat_messages(chat_id: str, user = Depends(get_current_user)):
    messages = get_chat_messages(chat_id)
    return {"success": True, "messages": messages}

# --- Saved Reports Routes ---

@app.post("/api/reports")
def api_save_report(req: SaveReportRequest, user = Depends(get_current_user)):
    try:
        report_id = save_report(user["id"], req.message_id, req.title)
        return {"success": True, "report_id": report_id}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports")
def api_list_reports(user = Depends(get_current_user)):
    try:
        reports = list_reports(user["id"])
        return {"success": True, "reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/reports/{report_id}")
def api_delete_report(report_id: str, user = Depends(get_current_user)):
    try:
        success = delete_report(user["id"], report_id)
        if not success:
            raise HTTPException(status_code=404, detail="Report not found or not owned by user.")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- SQL Assistant Query Route ---

@app.post("/api/query", response_model=QueryResponse)
def execute_query(request: QueryRequest, authorization: Optional[str] = Header(None)):
    user_id = None
    conn_str = None
    connection_id = None
    dialect_display = "SQLite"
    
    # 1. Check Auth & Load dynamic active connection configuration
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        user = get_user_by_session(token)
        if user:
            user_id = user["id"]
            config = get_active_connection(user_id)
            if not config:
                return QueryResponse(
                    success=False,
                    error="No database is currently connected.\nPlease connect a database to start asking questions."
                )
            conn_str = get_connection_string(config)
            connection_id = config["id"]
            dialect = config["dialect"]
            dialect_display = "SQLite" if dialect.lower() == "sqlite" else dialect.capitalize()
        else:
            raise HTTPException(status_code=401, detail="Session expired or invalid")
            
    query = request.query
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    try:
        # 1.5 Conversation Memory & Context resolution
        resolved_query = query
        if request.chat_id:
            from app.conversation import get_memory, update_memory_after_query, ContextResolver
            
            memory = get_memory(request.chat_id)
            resolver = ContextResolver()
            resolved_query = resolver.resolve(query, memory, user_id=user_id)
            print(f"DEBUG: Raw Query: {query} -> Resolved Standalone Query: {resolved_query}")
            
            # Check for ambiguous pronoun clarification request
            if resolved_query.startswith("I couldn't determine"):
                if user_id:
                    save_message(str(uuid.uuid4()), request.chat_id, "user", query)
                    save_message(str(uuid.uuid4()), request.chat_id, "assistant", resolved_query)
                return QueryResponse(
                    success=True,
                    sql="",
                    answer=resolved_query,
                    columns=[],
                    rows=[],
                    plot=""
                )

        # 2. Retrieve schemas using connection-specific RAG index
        retriever = Retriever(connection_id=connection_id)
        schemas = retriever.retrieve(resolved_query, k=15)
        if not schemas:
            return QueryResponse(success=False, error="No table schemas retrieved. Please connect/index your database first.")
            
        # 3. Build prompt
        builder = PromptBuilder(dialect=dialect_display)
        prompt_data = builder.build_prompt(resolved_query, schemas)
        
        # 4. Generate SQL query
        generator = SQLGenerator()
        sql = generator.generate_sql(prompt_data, user_id=user_id)
        
        if sql.startswith("-- ERROR:"):
            # Update memory even if prompt builder fails to find schema
            if request.chat_id:
                update_memory_after_query(
                    chat_id=request.chat_id,
                    query=query,
                    resolved_query=resolved_query,
                    sql="",
                    columns=[],
                    rows=[],
                    answer="I couldn't find that information in your connected database.",
                    user_id=user_id
                )
            if request.chat_id and user_id:
                save_message(str(uuid.uuid4()), request.chat_id, "user", query)
                save_message(str(uuid.uuid4()), request.chat_id, "assistant", "I couldn't find that information in your connected database.", sql_query=sql)
            return QueryResponse(
                success=False,
                sql=sql,
                error="I couldn't find that information in your connected database."
            )
            
        # 5. Execute SQL dynamically on target database
        executor = SQLExecutor(connection_string=conn_str)
        result = executor.execute(sql)
        
        if not result["success"]:
            return QueryResponse(success=False, sql=sql, error=result["error"])
            
        # 6. Synthesize final response
        synthesizer = ResponseSynthesizer()
        answer = synthesizer.synthesize(resolved_query, sql, result["columns"], result["rows"], user_id=user_id)
        
        # 7. Check and generate visualization
        visualizer = DataVisualizer()
        import tempfile
        output_filename = os.path.join(tempfile.gettempdir(), f"query_result_plot_{connection_id or 'default'}.png")
        if os.path.exists(output_filename):
            try:
                os.remove(output_filename)
            except:
                pass
            
        plot_success = visualizer.generate_and_save_plot(
            resolved_query, sql, result["columns"], result["rows"], output_filename, user_id=user_id
        )
        
        plot_base64 = ""
        if plot_success and os.path.exists(output_filename):
            with open(output_filename, "rb") as image_file:
                plot_base64 = base64.b64encode(image_file.read()).decode("utf-8")
            try:
                os.remove(output_filename)
            except:
                pass
                
        # 7.5 Update Memory
        if request.chat_id:
            update_memory_after_query(
                chat_id=request.chat_id,
                query=query,
                resolved_query=resolved_query,
                sql=sql,
                columns=result["columns"],
                rows=result["rows"],
                answer=answer,
                user_id=user_id
            )

        assistant_msg_id = ""
        # 8. Log message history in System DB if chat_id is active
        if request.chat_id and user_id:
            assistant_msg_id = str(uuid.uuid4())
            save_message(str(uuid.uuid4()), request.chat_id, "user", query)
            save_message(assistant_msg_id, request.chat_id, "assistant", answer, sql_query=sql, plot=plot_base64)
            
        return QueryResponse(
            success=True,
            sql=sql,
            answer=answer,
            columns=result["columns"],
            rows=result["rows"],
            plot=plot_base64,
            message_id=assistant_msg_id
        )
    except InvalidAPIKeyError as e:
        return QueryResponse(
            success=False,
            error=f"Your personal API key is invalid or unauthorized.\n\nError: {str(e)}\n\nPlease check your key in Workspace Settings or disable 'Use my API key' to switch back to AskDB default AI."
        )
    except ModelUnavailableError as e:
        return QueryResponse(
            success=False,
            error=f"The selected model is currently unavailable.\n\nError: {str(e)}\n\nPlease check your model settings in Workspace Settings."
        )
    except Exception as e:
        return QueryResponse(success=False, error=str(e))

@app.get("/api/database/summary")
def get_db_summary(user = Depends(get_current_user)):
    user_id = user["id"]
    conns = list_user_connections(user_id)
    conns_count = len(conns)
    
    import datetime
    today = datetime.date.today().strftime("%Y-%m-%d")
    engine = get_engine()
    queries_count = 0
    with engine.connect() as conn:
        row = conn.execute(
            text("""
            SELECT COUNT(*) 
            FROM messages m
            JOIN chats c ON m.chat_id = c.id
            WHERE c.user_id = :user_id AND m.role = 'user' AND DATE(c.created_at) = :today
            """),
            {"user_id": user_id, "today": today}
        ).fetchone()
        if row:
            queries_count = row[0]
            
    active_conn = get_active_connection(user_id)
    active_db_info = None
    if active_conn:
        schema_path = f"data/schema_conn_{active_conn['id']}.json"
        tables = []
        if os.path.exists(schema_path):
            try:
                import json
                with open(schema_path, "r", encoding="utf-8") as f:
                    schema_data = json.load(f)
                    tables = [item["table"] for item in schema_data]
            except Exception as e:
                print("Failed to read schema file:", e)
                
        active_db_info = {
            "id": active_conn["id"],
            "dialect": active_conn["dialect"],
            "database_name": active_conn["database_name"],
            "tables": tables
        }
        
    return {
        "success": True,
        "connected_databases_count": conns_count,
        "queries_today_count": queries_count,
        "active_database": active_db_info
    }

@app.get("/api/database/kpis")
def get_db_kpis(user = Depends(get_current_user)):
    user_id = user["id"]
    active_conn = get_active_connection(user_id)
    if not active_conn:
        return {"success": False, "error": "No database is currently connected."}
        
    schema_path = f"data/schema_conn_{active_conn['id']}.json"
    tables = []
    if os.path.exists(schema_path):
        try:
            import json
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_data = json.load(f)
                tables = [item["table"].lower() for item in schema_data]
        except Exception as e:
            print("Failed to read schema file:", e)
            
    conn_str = get_connection_string(active_conn)
    from sqlalchemy import create_engine, inspect
    from app.executor.sql_executor import SQLExecutor
    executor = SQLExecutor(connection_string=conn_str)
    
    kpis = {}
    
    # HR Schema Checks
    if "employees" in tables:
        res = executor.execute("SELECT COUNT(*) FROM employees")
        if res["success"] and res["rows"]:
            r = res["rows"][0]
            kpis["employees"] = r[list(r.keys())[0]] or 0
            
        res_payroll = executor.execute("SELECT SUM(salary) FROM employees")
        if res_payroll["success"] and res_payroll["rows"]:
            r = res_payroll["rows"][0]
            kpis["payroll"] = float(r[list(r.keys())[0]] or 0)
            
        res_avg = executor.execute("SELECT AVG(salary) FROM employees")
        if res_avg["success"] and res_avg["rows"]:
            r = res_avg["rows"][0]
            kpis["avg_salary"] = float(r[list(r.keys())[0]] or 0)
            
    if "departments" in tables:
        res = executor.execute("SELECT COUNT(*) FROM departments")
        if res["success"] and res["rows"]:
            r = res["rows"][0]
            kpis["departments"] = r[list(r.keys())[0]] or 0
            
    # E-commerce Schema Checks
    if "customers" in tables:
        res = executor.execute("SELECT COUNT(*) FROM customers")
        if res["success"] and res["rows"]:
            first_row = res["rows"][0]
            first_key = list(first_row.keys())[0]
            kpis["customers"] = first_row[first_key] or 0
            
    if "orders" in tables:
        res = executor.execute("SELECT COUNT(*) FROM orders")
        if res["success"] and res["rows"]:
            first_row = res["rows"][0]
            first_key = list(first_row.keys())[0]
            kpis["orders"] = first_row[first_key] or 0
            
        engine = create_engine(conn_str)
        inspector = inspect(engine)
        cols = [c["name"].lower() for c in inspector.get_columns("orders")]
        revenue_col = None
        for c in ["total_amount", "amount", "price", "total", "revenue"]:
            if c in cols:
                revenue_col = c
                break
        if revenue_col:
            res = executor.execute(f"SELECT SUM({revenue_col}) FROM orders")
            if res["success"] and res["rows"]:
                first_row = res["rows"][0]
                first_key = list(first_row.keys())[0]
                kpis["revenue"] = float(first_row[first_key] or 0)
        engine.dispose()
        
    return {
        "success": True,
        "has_data": len(kpis) > 0,
        "kpis": kpis
    }

@app.get("/api/database/visualizations")
def get_user_visualizations(user = Depends(get_current_user)):
    user_id = user["id"]
    active_conn = get_active_connection(user_id)
    if not active_conn:
        return {"success": False, "error": "No database is currently connected."}
        
    engine = get_engine()
    visuals = []
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
            SELECT m.id, m.chat_id, m.content, m.sql_query, m.plot, m.timestamp, c.title
            FROM messages m
            JOIN chats c ON m.chat_id = c.id
            WHERE c.user_id = :user_id AND m.plot IS NOT NULL AND m.plot != ''
            ORDER BY m.timestamp DESC
            """),
            {"user_id": user_id}
        ).fetchall()
        
        for r in rows:
            visuals.append({
                "id": r[0],
                "chat_id": r[1],
                "title": f"Chart from: {r[6]}",
                "query": r[2],
                "sql": r[3],
                "plot": r[4],
                "date": r[5]
            })
            
    return {"success": True, "visualizations": visuals}

@app.get("/api/database/schema")
def get_db_schema_details(user = Depends(get_current_user)):
    user_id = user["id"]
    active_conn = get_active_connection(user_id)
    if not active_conn:
        return {"success": False, "error": "No database is currently connected."}
        
    schema_path = f"data/schema_conn_{active_conn['id']}.json"
    if not os.path.exists(schema_path):
        return {"success": True, "tables": []}
        
    import json
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            tables_data = json.load(f)
    except Exception as e:
        return {"success": False, "error": str(e)}
        
    conn_str = get_connection_string(active_conn)
    from app.executor.sql_executor import SQLExecutor
    executor = SQLExecutor(connection_string=conn_str)
    
    for item in tables_data:
        table_name = item["table"]
        safe_table_name = "".join([c for c in table_name if c.isalnum() or c == "_"])
        res = executor.execute(f"SELECT COUNT(*) FROM {safe_table_name}")
        row_count = 0
        if res["success"] and res["rows"]:
            first_row = res["rows"][0]
            first_key = list(first_row.keys())[0]
            row_count = first_row[first_key] or 0
        item["row_count"] = row_count
        
    return {"success": True, "tables": tables_data}

@app.get("/api/database/dashboard-charts")
def get_dashboard_charts_data(user = Depends(get_current_user)):
    user_id = user["id"]
    active_conn = get_active_connection(user_id)
    if not active_conn:
        return {"success": False, "error": "No database is currently connected."}
        
    schema_path = f"data/schema_conn_{active_conn['id']}.json"
    tables = []
    if os.path.exists(schema_path):
        try:
            import json
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_data = json.load(f)
                tables = [item["table"].lower() for item in schema_data]
        except Exception as e:
            print(e)
            
    conn_str = get_connection_string(active_conn)
    from app.executor.sql_executor import SQLExecutor
    executor = SQLExecutor(connection_string=conn_str)
    
    charts = {}
    
    # 1. HR Database Charts
    if "employees" in tables:
        # Salary distribution by department
        if "departments" in tables:
            res_dept = executor.execute("""
                SELECT d.department_name, AVG(e.salary) as avg_salary 
                FROM employees e 
                JOIN departments d ON e.department_id = d.department_id 
                GROUP BY d.department_name 
                ORDER BY avg_salary DESC 
                LIMIT 5
            """)
            if res_dept["success"] and res_dept["rows"]:
                charts["salary_by_department"] = res_dept["rows"]
                
            res_count = executor.execute("""
                SELECT d.department_name, COUNT(*) as count 
                FROM employees e 
                JOIN departments d ON e.department_id = d.department_id 
                GROUP BY d.department_name 
                ORDER BY count DESC 
                LIMIT 5
            """)
            if res_count["success"] and res_count["rows"]:
                charts["employees_by_department"] = res_count["rows"]
                
        # Employees by Job Title
        if "jobs" in tables:
            res_jobs = executor.execute("""
                SELECT j.job_title, COUNT(*) as count 
                FROM employees e 
                JOIN jobs j ON e.job_id = j.job_id 
                GROUP BY j.job_title 
                ORDER BY count DESC 
                LIMIT 5
            """)
            if res_jobs["success"] and res_jobs["rows"]:
                charts["employees_by_job"] = res_jobs["rows"]
                
    # 2. Sales / E-commerce Database Charts
    if "orders" in tables:
        res = executor.execute("SELECT product, SUM(price * quantity) as revenue FROM orders GROUP BY product ORDER BY revenue DESC LIMIT 5")
        if res["success"] and res["rows"]:
            charts["product_revenue"] = res["rows"]
            
        # 2. Product Quantity Split (Bar Chart)
        res_qty = executor.execute("SELECT product, SUM(quantity) as total_qty FROM orders GROUP BY product ORDER BY total_qty DESC LIMIT 5")
        if res_qty["success"] and res_qty["rows"]:
            charts["product_quantity"] = res_qty["rows"]
            
    # 3. Customers by City
    if "customers" in tables:
        res_city = executor.execute("SELECT city, COUNT(*) as count FROM customers GROUP BY city ORDER BY count DESC LIMIT 5")
        if res_city["success"] and res_city["rows"]:
            charts["customers_by_city"] = res_city["rows"]
            
    return {
        "success": True,
        "charts": charts
    }

# --- AI Settings Routes ---

@app.get("/api/settings/ai")
def get_ai_settings(user = Depends(get_current_user)):
    settings = get_user_ai_settings(user["id"])
    if not settings:
        return {
            "success": True,
            "settings": {
                "provider": "gemini",
                "model": "gemini-3.5-flash",
                "use_personal_key": False,
                "has_key": False
            }
        }
    
    return {
        "success": True,
        "settings": {
            "provider": settings.get("provider", "gemini"),
            "model": settings.get("model", "gemini-3.5-flash"),
            "use_personal_key": settings.get("use_personal_key", False),
            "has_key": bool(settings.get("encrypted_api_key"))
        }
    }

@app.post("/api/settings/ai")
def save_ai_settings(req: AISettingsRequest, user = Depends(get_current_user)):
    current_settings = get_user_ai_settings(user["id"])
    encrypted_key = None
    
    if req.api_key:
        encrypted_key = encrypt_key(req.api_key)
    elif current_settings:
        encrypted_key = current_settings.get("encrypted_api_key")
        
    if req.use_personal_key and not encrypted_key:
        raise HTTPException(status_code=400, detail="API key is required when 'Use my API key' is enabled.")
        
    save_user_ai_settings(
        user_id=user["id"],
        provider=req.provider,
        encrypted_key=encrypted_key or "",
        model=req.model,
        use_personal_key=req.use_personal_key
    )
    return {"success": True}

@app.delete("/api/settings/ai")
def delete_ai_settings(user = Depends(get_current_user)):
    delete_user_ai_settings(user["id"])
    return {"success": True}

if __name__ == "__main__":

    import uvicorn
    # Make sure we init tables on startup
    init_db()
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
