import os
import google.generativeai as genai
from app.utils.helper import load_env

class ResponseSynthesizer:
    def __init__(self, model_name="gemini-3.5-flash"):
        load_env()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is not set. "
                "Please add it to your .env file."
            )
        genai.configure(api_key=api_key)
        self.model_name = model_name

    def synthesize(self, query: str, sql: str, columns: list, rows: list) -> str:
        """
        Synthesizes the database results into a natural language response.
        """
        # Formulate query results string representation
        results_str = ""
        if rows:
            results_str += " | ".join(columns) + "\n"
            results_str += "-" * 40 + "\n"
            for row in rows:
                results_str += " | ".join(str(row[col]) for col in columns) + "\n"
        else:
            results_str = "(No rows returned)"

        system_instruction = (
            "You are a precise database assistant.\n"
            "Your task is to answer the user's question in a clear, professional, natural language format, "
            "based SOLELY on the provided database query results.\n"
            "CRITICAL: If the query results are empty (e.g. '(No rows returned)') or do not contain the requested information, you MUST state "
            "exactly: 'I couldn't find that information in your connected database.' "
            "Never invent values, columns, statistics, business insights, or facts. Do not assume or fabricate anything."
        )

        prompt = (
            f"User Question: {query}\n\n"
            f"Executed SQL Query: {sql}\n\n"
            f"Query Results:\n"
            f"-----------------\n"
            f"{results_str}\n"
            f"-----------------\n\n"
            f"Natural Language Answer:"
        )

        models = [self.model_name, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite']
        # Deduplicate while preserving order
        models = list(dict.fromkeys(models))
        
        last_error = None
        response_text = None
        
        for m_name in models:
            try:
                model = genai.GenerativeModel(
                    model_name=m_name,
                    system_instruction=system_instruction
                )
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.3
                    )
                )
                response_text = response.text
                break
            except Exception as e:
                print(f"Warning: Response synthesis failed with model {m_name} ({e}). Trying fallback...")
                last_error = e
                
        if response_text is None:
            raise last_error

        return response_text.strip()
