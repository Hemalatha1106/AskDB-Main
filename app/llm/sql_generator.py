import os
from app.utils.helper import load_env
from app.llm.providers import get_user_provider

class SQLGenerator:
    def __init__(self, model_name="gemini-3.5-flash"):
        # Load environment variables from .env file
        load_env()
        self.model_name = model_name

    def generate_sql(self, prompt_data: dict, user_id: int = None) -> str:
        """
        Sends system instructions and prompt to the active AI provider,
        and returns the parsed, clean SQL string.
        """
        provider = get_user_provider(user_id, self.model_name)
        response_text = provider.generate(
            prompt=prompt_data["prompt"],
            system_instruction=prompt_data["system_instruction"],
            temperature=0.0
        )

        sql = response_text.strip()
        
        # Clean any markdown formatting if model outputted code blocks
        if sql.startswith("```"):
            lines = sql.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            sql = "\n".join(lines).strip()
            
        return sql

