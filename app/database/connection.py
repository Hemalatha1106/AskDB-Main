import os
from sqlalchemy import create_engine
from app.utils.helper import load_env

_engine = None

def get_engine():
    """
    Creates and returns a SQLAlchemy engine based on env variables.
    """
    global _engine
    if _engine is None:
        load_env()
        db_url = os.getenv("DATABASE_URL")
        
        if not db_url:
            # Fallback to local sqlite
            db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/askdb.db"))
            # Ensure the directory exists
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            db_url = f"sqlite:///{db_path}"
        else:
            # Support optional password injection if {password} placeholder is present
            db_password = os.getenv("DATABASE_PASSWORD")
            if db_password and "{password}" in db_url:
                db_url = db_url.format(password=db_password)
        
        # Create engine. If SQLite, we specify check_same_thread=False for safety across threads/requests.
        if db_url.startswith("sqlite"):
            _engine = create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            _engine = create_engine(db_url)
            
    return _engine

def get_connection():
    """
    Returns a connection from the SQLAlchemy engine connection pool.
    """
    engine = get_engine()
    return engine.connect()

def get_dialect() -> str:
    """
    Returns the dialect name of the active database engine (e.g. 'sqlite', 'postgresql', 'mysql').
    """
    engine = get_engine()
    return engine.name
