import os
import json
from typing import List, Dict, Any
from app.utils.helper import load_env
from app.conversation.models import ConversationMemory, _normalize_val
from app.llm.providers import get_user_provider

class ContextResolver:
    def __init__(self, model_name="gemini-3.5-flash"):
        load_env()
        self.model_name = model_name

    def resolve(self, query: str, memory: ConversationMemory, user_id: int = None) -> str:
        """
        Resolves ambiguous pronouns and follow-up references in the user's question,
        returning a self-contained question, or a clarification request if ambiguous.
        """
        # Format recent messages
        formatted_messages = ""
        for msg in memory.messages:
            formatted_messages += f"{msg['role'].capitalize()}: {msg['content']}\n"

        system_instruction = (
            "You are a database conversation context resolver.\n"
            "Your task is to rewrite ambiguous user questions into fully self-contained questions based on the conversation history and metadata.\n"
            "CRITICAL: If the user's question contains a pronoun or refers to something in the previous context (like 'it', 'its', 'they', 'them', 'those', 'this', 'that', 'these', 'he', 'she', 'him', 'her', 'one', 'same', etc.) but the reference is ambiguous and cannot be determined from the provided history, active entities, or previous result metadata, you MUST return exactly:\n"
            "I couldn't determine what \"[pronoun]\" refers to. Please clarify which customer, table, or previous result you're referring to.\n"
            "(Replace [pronoun] with the actual ambiguous pronoun used by the user, e.g., \"it\", \"one\", \"them\", etc.)\n\n"
            "Rules:\n"
            "1. Output ONLY the resolved standalone question or the clarification request. Do not include any intros, markdown code blocks, or explanations.\n"
            "2. Ensure the resolved question is clear, grammatical, and fully self-contained so that a Text-to-SQL system can convert it directly to SQL.\n"
            "3. If the user's question is already self-contained and clear, output the original question exactly.\n"
            "4. If the user is requesting a visualization, chart, plot, or graph of the previous results (e.g. 'show as piechart', 'plot this data', 'i want a bar chart of this'), rewrite it into a self-contained query that requests the same data as before but explicitly specifies the target visualization (e.g. 'Which departments contribute the highest percentage of the company\'s payroll? Needs: Pie Chart').\n"
            "5. Do NOT treat chart formatting expressions (e.g. 'as bar chart', 'as a pie chart', 'in a line graph') as ambiguous context references or pronouns. They are simply requests for the output format of the current query."
        )

        prompt = (
            f"Conversation Summary:\n"
            f"{memory.summary or 'None'}\n\n"
            f"Recent Conversation History:\n"
            f"{formatted_messages or 'None'}\n\n"
            f"Last SQL Query:\n"
            f"{memory.last_sql or 'None'}\n\n"
            f"Last Result Metadata:\n"
            f"{json.dumps(memory.last_result_metadata, indent=2) if memory.last_result_metadata else 'None'}\n\n"
            f"Active Entities in Context:\n"
            f"{json.dumps(memory.active_entities, indent=2) if memory.active_entities else 'None'}\n\n"
            f"Current User Question: {query}\n\n"
            f"Resolved Standalone Question:"
        )

        provider = get_user_provider(user_id, self.model_name)
        response_text = provider.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.0
        )
        return response_text.strip()

    def extract_active_entities(self, query: str, sql: str, columns: List[str], rows: List[Any], prev_entities: Dict[str, Any], user_id: int = None) -> Dict[str, Any]:
        """
        Uses Gemini LLM to update the active entities based on the latest query, SQL, and query results.
        """
        # Get first 3 rows for entity preview context
        preview_rows = []
        if rows and columns:
            for r in rows[:3]:
                row_dict = {}
                for idx, col in enumerate(columns):
                    try:
                        if hasattr(r, '_mapping'):
                            val = r._mapping[col]
                        elif isinstance(r, dict):
                            val = r[col]
                        else:
                            val = r[idx]
                    except:
                        val = None
                    row_dict[col] = _normalize_val(val)
                preview_rows.append(row_dict)

        system_instruction = (
            "You are an AI assistant that maintains the active context and entities discussed in a database conversation.\n"
            "Given the previous active entities, the current user question, the executed SQL, and the preview of the returned rows, "
            "you must output the updated active entities. Active entities include the current table, and specific IDs, names, or filter values that are currently selected or discussed (e.g., selected_customer = 101, selected_region = 'South India').\n"
            "Rules:\n"
            "1. Output ONLY a valid JSON object matching the dictionary structure.\n"
            "2. Do not wrap the JSON in markdown code blocks or include explanations.\n"
            "3. Keep existing entities if they are still relevant and not overwritten or changed by the new query."
        )

        prompt = (
            f"Previous Active Entities:\n"
            f"{json.dumps(prev_entities, indent=2)}\n\n"
            f"Current User Question: {query}\n\n"
            f"Executed SQL Query:\n"
            f"{sql}\n\n"
            f"Result Columns:\n"
            f"{columns}\n\n"
            f"Result Rows Preview:\n"
            f"{json.dumps(preview_rows, indent=2)}\n\n"
            f"Updated Active Entities JSON:"
        )

        provider = get_user_provider(user_id, self.model_name)
        try:
            res_text = provider.generate(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=0.0
            )
            res_text = res_text.strip()
            # Strip markdown blocks if generated
            if res_text.startswith("```"):
                lines = res_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                res_text = "\n".join(lines).strip()
            return json.loads(res_text)
        except Exception as e:
            print(f"Warning: Entity extraction failed ({e}). Trying fallback...")
            
        # If all fail, return at least a simple heuristic table name
        import re
        table_name = prev_entities.get("table", "")
        from_matches = re.findall(r'\b(?:from|join)\s+([a-zA-Z0-9_`.]+)', sql, re.IGNORECASE)
        if from_matches:
            table_name = from_matches[0].strip('`"\'').split('.')[-1]
        return {"table": table_name}

