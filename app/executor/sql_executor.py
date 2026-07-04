from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError
from app.database.connection import get_connection

class SQLExecutor:
    def __init__(self, connection_string: str = None):
        self.connection_string = connection_string

    def execute(self, sql_query: str):
        """
        Executes a SQL query against the active database using SQLAlchemy.
        Returns:
            dict: A dictionary containing:
                - "success" (bool)
                - "columns" (list of str)
                - "rows" (list of dict)
                - "error" (str or None)
        """
        conn = None
        engine = None
        try:
            if self.connection_string:
                engine = create_engine(self.connection_string)
                conn = engine.connect()
            else:
                conn = get_connection()
                
            result = conn.execute(text(sql_query))
            
            # Check if query returned rows (e.g. SELECT)
            if result.returns_rows:
                columns = list(result.keys())
                # Convert result mapping rows to standard dictionaries
                rows = [dict(row) for row in result.mappings().all()]
                return {
                    "success": True,
                    "columns": columns,
                    "rows": rows,
                    "error": None
                }
            else:
                # Commit connection if needed
                if hasattr(conn, 'commit'):
                    conn.commit()
                return {
                    "success": True,
                    "columns": [],
                    "rows": [],
                    "error": None
                }
        except SQLAlchemyError as e:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "error": str(e)
            }
        finally:
            if conn:
                conn.close()
            if engine:
                engine.dispose()
