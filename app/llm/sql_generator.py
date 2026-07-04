import os
import google.generativeai as genai
from app.utils.helper import load_env

class SQLGenerator:
    def __init__(self, model_name="gemini-3.5-flash"):
        # Load environment variables from .env file
        load_env()
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is not set. "
                "Please add it to your .env file."
            )
        
        genai.configure(api_key=api_key)
        self.model_name = model_name

    def generate_sql(self, prompt_data: dict) -> str:
        """
        Sends system instructions and prompt to Gemini API,
        and returns the parsed, clean SQL string.
        """
        models = [self.model_name, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite']
        # Deduplicate while preserving order
        models = list(dict.fromkeys(models))
        
        last_error = None
        response_text = None
        
        for m_name in models:
            try:
                model = genai.GenerativeModel(
                    model_name=m_name,
                    system_instruction=prompt_data["system_instruction"]
                )
                response = model.generate_content(
                    prompt_data["prompt"],
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.0  # Use deterministic output
                    )
                )
                response_text = response.text
                break
            except Exception as e:
                print(f"Warning: SQL generation failed with model {m_name} ({e}). Trying fallback...")
                last_error = e
                
        if response_text is None:
            raise last_error

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
