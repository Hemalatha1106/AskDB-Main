import os
from app.utils.helper import load_env
from app.llm.providers import get_user_provider

class ResponseSynthesizer:
    def __init__(self, model_name="gemini-3.5-flash"):
        load_env()
        self.model_name = model_name

    def synthesize(self, query: str, sql: str, columns: list, rows: list, user_id: int = None) -> str:
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

        provider = get_user_provider(user_id, self.model_name)
        response_text = provider.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.3
        )

        return response_text.strip()

