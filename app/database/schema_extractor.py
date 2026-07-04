from sqlalchemy import inspect
from app.database.connection import get_engine
import json
import os

def extract_schema(output_path="data/schema.json", engine=None):
    """
    Connects to the active database engine, inspects the schema,
    and writes it as a structured JSON file to output_path.
    """
    print("Extracting database schema...")
    if engine is None:
        engine = get_engine()
    inspector = inspect(engine)
    
    schema_data = []
    
    # Get all table names
    tables = inspector.get_table_names()
    print(f"Found tables: {tables}")
    
    for table_name in tables:
        columns_info = []
        # Get columns
        columns = inspector.get_columns(table_name)
        
        # Get primary keys
        pk_constraint = inspector.get_pk_constraint(table_name)
        pk_columns = pk_constraint.get("constrained_columns", []) if pk_constraint else []
        
        # Get foreign keys
        fk_info = inspector.get_foreign_keys(table_name)
        fk_columns = []
        for fk in fk_info:
            fk_columns.extend(fk.get("constrained_columns", []))
        
        for col in columns:
            col_name = col["name"]
            # Convert type to a readable string
            col_type = str(col["type"])
            
            key_type = None
            if col_name in pk_columns:
                key_type = "PRIMARY KEY"
            elif col_name in fk_columns:
                key_type = "FOREIGN KEY"
                
            col_data = {
                "name": col_name,
                "type": col_type
            }
            if key_type:
                col_data["key"] = key_type
                
            columns_info.append(col_data)
            
        schema_data.append({
            "table": table_name,
            "description": f"Stores information for {table_name}.",
            "columns": columns_info
        })
        
    # Write to file
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema_data, f, indent=2)
        
    print(f"Schema successfully extracted and saved to {output_path}!")

if __name__ == "__main__":
    extract_schema()
