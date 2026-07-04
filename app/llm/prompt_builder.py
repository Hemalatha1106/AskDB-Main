class PromptBuilder:
    def __init__(self, dialect: str = "SQL"):
        self.dialect = dialect

    def build_prompt(self, query: str, retrieved_schemas: list):
        """
        Builds the system instruction and user prompt for the LLM using the 
        user's natural language query and retrieved schema chunks.
        """
        # Combine the document text from retrieval results
        schema_context = "\n\n".join([item["document"] for item in retrieved_schemas])
        
        system_instruction = (
            f"You are a highly accurate Text-to-SQL assistant.\n"
            f"Your task is to generate a valid {self.dialect} query that answers the user's question, "
            f"based ONLY on the database schema provided.\n\n"
            f"Rules:\n"
            f"1. Output ONLY the raw SQL query. Do NOT wrap it in markdown code blocks (e.g. ```sql) or include explanations.\n"
            f"2. Ensure table and column names exactly match the schema provided.\n"
            f"3. If joining tables, use explicit JOIN syntax with foreign keys.\n"
            f"4. Make string comparisons case-insensitive where appropriate (e.g. using LIKE or COLLATE NOCASE).\n"
            f"5. If the question asks for tables, columns, or information that does not exist in the provided schema, return EXACTLY: '-- ERROR: Information not found in schema.' (Note: Standard database metadata queries like SHOW TABLES, DESCRIBE table, or queries targeting sqlite_master/information_schema to list tables/columns are fully allowed and should not trigger this error.)"
        )

        user_message = (
            f"Database Schema:\n"
            f"-----------------\n"
            f"{schema_context}\n"
            f"-----------------\n\n"
            f"Question: {query}\n\n"
            f"SQL Query:"
        )

        return {
            "system_instruction": system_instruction,
            "prompt": user_message
        }
