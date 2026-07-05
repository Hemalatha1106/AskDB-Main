import os
from typing import List, Dict
import google.generativeai as genai
from app.utils.helper import load_env

class Summarizer:
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

    def summarize(self, current_summary: str, messages_to_summarize: List[Dict[str, str]]) -> str:
        """
        Generates an updated summary of the conversation based on the existing summary and new messages.
        """
        if not messages_to_summarize:
            return current_summary

        # Format the messages
        formatted_messages = ""
        for msg in messages_to_summarize:
            formatted_messages += f"{msg['role'].capitalize()}: {msg['content']}\n"
            
        system_instruction = (
            "You are an AI assistant that maintains a running summary of a database conversation.\n"
            "Your task is to generate an updated short summary of the discussion so far based on the existing summary and new messages.\n"
            "Ensure the summary remains concise and follows the exact format requested."
        )
        
        prompt = (
            f"Current conversation summary (if any):\n"
            f"{current_summary or 'No current summary.'}\n\n"
            f"New messages to incorporate into the summary:\n"
            f"{formatted_messages}\n\n"
            f"Generate an updated short summary of the discussion so far. Always output in this exact structure and format:\n"
            f"Conversation Summary:\n"
            f"The discussion has focused on [brief topic description].\n\n"
            f"Current table:\n"
            f"[active table name(s) or None]\n\n"
            f"Active filters:\n"
            f"[applied filters, e.g. Region = South India, or None]\n\n"
            f"Compared:\n"
            f"[comparisons being made, e.g. 2023 vs 2024, or None]\n\n"
            f"Previous result:\n"
            f"[description of the last queried result]"
        )
        
        models = [self.model_name, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite']
        models = list(dict.fromkeys(models))
        
        last_error = None
        for m_name in models:
            try:
                model = genai.GenerativeModel(
                    model_name=m_name,
                    system_instruction=system_instruction
                )
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2
                    )
                )
                return response.text.strip()
            except Exception as e:
                print(f"Warning: Summarization failed with model {m_name} ({e}). Trying fallback...")
                last_error = e
                
        raise last_error
