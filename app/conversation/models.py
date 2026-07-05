from typing import List, Dict, Any, Optional

def _normalize_val(val):
    from decimal import Decimal
    from datetime import datetime, date
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    return val

class ConversationMemory:
    def __init__(self, 
                 messages: Optional[List[Dict[str, str]]] = None, 
                 summary: str = "", 
                 last_sql: str = "", 
                 last_result_metadata: Optional[Dict[str, Any]] = None, 
                 active_entities: Optional[Dict[str, Any]] = None, 
                 current_database: str = "", 
                 current_schema: str = ""):
        self.messages = messages if messages is not None else []
        self.summary = summary
        self.last_sql = last_sql
        self.last_result_metadata = last_result_metadata if last_result_metadata is not None else {}
        self.active_entities = active_entities if active_entities is not None else {}
        self.current_database = current_database
        self.current_schema = current_schema

    def add_message(self, role: str, content: str):
        """
        Adds a message to the memory history.
        """
        self.messages.append({"role": role, "content": content})

    def update_result_metadata(self, sql: str, columns: List[str], rows: List[Any]):
        """
        Extracts and stores lightweight metadata about the latest SQL query result.
        Does NOT store the full results, only schema-like information and entity previews.
        """
        import re
        
        # Determine row count
        row_count = len(rows) if rows else 0
        
        # 1. Simple heuristic to extract main table name from query
        table_name = ""
        # Match "FROM table_name" or "JOIN table_name"
        from_matches = re.findall(r'\b(?:from|join)\s+([a-zA-Z0-9_`.]+)', sql, re.IGNORECASE)
        if from_matches:
            # Get the first one that isn't subquery/etc.
            # Clean backticks and quotes
            table_name = from_matches[0].strip('`"\'').split('.')[-1]
            
        # 2. Extract entity preview (first 3 rows) as dictionaries
        entity_preview = []
        if rows and columns:
            for r in rows[:3]:
                # In SQLAlchemy rows might be tuples or dictionaries/legacy Row objects
                # We normalize them to dict
                row_dict = {}
                for idx, col in enumerate(columns):
                    try:
                        # Try indexing if it is a dictionary-like or mapping-like Row
                        if hasattr(r, '_mapping'):
                            val = r._mapping[col]
                        elif isinstance(r, dict):
                            val = r[col]
                        else:
                            val = r[idx]
                    except Exception:
                        val = None
                    row_dict[col] = _normalize_val(val)
                entity_preview.append(row_dict)
                
        self.last_sql = sql
        self.last_result_metadata = {
            "table": table_name,
            "returned_columns": columns,
            "entity_preview": entity_preview,
            "row_count": row_count
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "messages": self.messages,
            "summary": self.summary,
            "last_sql": self.last_sql,
            "last_result_metadata": self.last_result_metadata,
            "active_entities": self.active_entities,
            "current_database": self.current_database,
            "current_schema": self.current_schema
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversationMemory':
        return cls(
            messages=data.get("messages"),
            summary=data.get("summary", ""),
            last_sql=data.get("last_sql", ""),
            last_result_metadata=data.get("last_result_metadata"),
            active_entities=data.get("active_entities"),
            current_database=data.get("current_database", ""),
            current_schema=data.get("current_schema", "")
        )
