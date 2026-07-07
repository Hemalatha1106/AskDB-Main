from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError
from app.database.connection import get_connection

def split_queries(sql: str) -> list:
    """
    Splits a SQL string into individual statements by semicolon,
    correctly ignoring semicolons/quotes nested inside single/double quoted literals
    or SQL line/block comments.
    """
    queries = []
    current = []
    in_single_quote = False
    in_double_quote = False
    escaped = False
    in_line_comment = False
    in_block_comment = False
    
    i = 0
    n = len(sql)
    while i < n:
        char = sql[i]
        
        # If in a block comment, append and look for the end: */
        if in_block_comment:
            current.append(char)
            if char == '/' and i > 0 and sql[i-1] == '*':
                in_block_comment = False
            i += 1
            continue
            
        # If in a line comment, append and look for the end: \n
        if in_line_comment:
            current.append(char)
            if char == '\n':
                in_line_comment = False
            i += 1
            continue
            
        # Check for escape character
        if escaped:
            current.append(char)
            escaped = False
            i += 1
            continue
            
        if char == '\\':
            current.append(char)
            escaped = True
            i += 1
            continue
            
        # Check for block comment start: /*
        if char == '/' and i + 1 < n and sql[i+1] == '*':
            current.append('/')
            current.append('*')
            in_block_comment = True
            i += 2
            continue
            
        # Check for line comment start: -- or #
        if char == '#' or (char == '-' and i + 1 < n and sql[i+1] == '-'):
            current.append(char)
            if char == '-':
                current.append('-')
                i += 2
            else:
                i += 1
            in_line_comment = True
            continue
            
        # Handle quotes (only if not in a comment)
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
        elif char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            
        # Split on semicolon if not inside quotes/comments
        if char == ';' and not in_single_quote and not in_double_quote:
            queries.append("".join(current).strip())
            current = []
        else:
            current.append(char)
            
        i += 1
        
    remainder = "".join(current).strip()
    if remainder:
        queries.append(remainder)
    return [q for q in queries if q]


class SQLExecutor:
    def __init__(self, connection_string: str = None):
        self.connection_string = connection_string

    def execute(self, sql_query: str):
        """
        Executes SQL queries against the active database. Supports multiple queries
        separated by semicolons, executing them sequentially on the same connection.
        Returns the result of the last query that returns rows, or the last statement's status.
        """
        conn = None
        engine = None
        try:
            if self.connection_string:
                engine = create_engine(self.connection_string)
                conn = engine.connect()
            else:
                conn = get_connection()
                
            queries = split_queries(sql_query)
            if not queries:
                return {
                    "success": False,
                    "columns": [],
                    "rows": [],
                    "error": "No SQL statements found to execute."
                }

            last_result = None
            for query in queries:
                result = conn.execute(text(query))
                
                # Check if query returned rows (e.g. SELECT)
                if result.returns_rows:
                    columns = list(result.keys())
                    # Convert result mapping rows to standard dictionaries
                    raw_rows = [dict(row) for row in result.mappings().all()]
                    
                    # Normalize Decimal types to float/int for type compatibility with visualizers/serializers
                    from decimal import Decimal
                    rows = []
                    for r in raw_rows:
                        normalized_row = {}
                        for k, v in r.items():
                            if isinstance(v, Decimal):
                                if v % 1 == 0:
                                    normalized_row[k] = int(v)
                                else:
                                    normalized_row[k] = float(v)
                            else:
                                normalized_row[k] = v
                        rows.append(normalized_row)

                    last_result = {
                        "success": True,
                        "columns": columns,
                        "rows": rows,
                        "error": None
                    }
                else:
                    # Commit connection if needed
                    if hasattr(conn, 'commit'):
                        conn.commit()
                    last_result = {
                        "success": True,
                        "columns": [],
                        "rows": [],
                        "error": None
                    }
                    
            return last_result
            
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

