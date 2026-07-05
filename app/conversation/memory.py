from typing import Dict, Any, List
from app.conversation.models import ConversationMemory
from app.conversation.summarizer import Summarizer
from app.conversation.context_resolver import ContextResolver
from app.database.system_db import get_chat_messages

# In-memory storage for active sessions
_memories: Dict[str, ConversationMemory] = {}

def get_memory(chat_id: str) -> ConversationMemory:
    """
    Retrieves the ConversationMemory for a given chat_id.
    If not in the cache, initializes a new memory and pre-populates it with the
    latest 8-10 messages from the database history if available.
    """
    if not chat_id:
        return ConversationMemory()

    global _memories
    if chat_id not in _memories:
        memory = ConversationMemory()
        
        # Load from DB history to recover state on server restart
        try:
            db_msgs = get_chat_messages(chat_id)
            if db_msgs:
                # Keep latest 8 messages from history (to fit the sliding window safely)
                recent_msgs = db_msgs[-8:]
                for msg in recent_msgs:
                    memory.add_message(msg["role"], msg["content"])
                
                # Check for the last executed SQL in recent history
                for msg in reversed(recent_msgs):
                    if msg["role"] == "assistant" and msg.get("sql"):
                        memory.last_sql = msg["sql"]
                        # Pre-fill simple metadata table name if possible
                        import re
                        table_match = re.search(r'\bfrom\s+([a-zA-Z0-9_`.]+)', msg["sql"], re.IGNORECASE)
                        if table_match:
                            table_name = table_match.group(1).strip('`"\'').split('.')[-1]
                            memory.last_result_metadata = {"table": table_name}
                            memory.active_entities = {"table": table_name}
                        break
        except Exception as e:
            print(f"Warning: Could not pre-populate conversational memory from DB ({e})")
            
        _memories[chat_id] = memory

    return _memories[chat_id]

def update_memory_after_query(chat_id: str, query: str, resolved_query: str, sql: str, columns: List[str], rows: List[Any], answer: str):
    """
    Updates the conversation memory for a chat_id with the new interaction details.
    Manages the sliding window of messages, summarizing older messages when limit is exceeded.
    """
    if not chat_id:
        return

    memory = get_memory(chat_id)
    
    # 1. Add current interaction to message list
    memory.add_message("user", query)
    memory.add_message("assistant", answer)
    
    # 2. Update query result metadata
    if sql:
        memory.update_result_metadata(sql, columns, rows)
        
        # 3. Update active entities using ContextResolver's LLM component
        try:
            resolver = ContextResolver()
            updated_entities = resolver.extract_active_entities(
                query=query,
                sql=sql,
                columns=columns,
                rows=rows,
                prev_entities=memory.active_entities
            )
            memory.active_entities = updated_entities
        except Exception as e:
            print(f"Warning: Failed to update active entities ({e})")

    # 4. Sliding Window: If messages history exceeds 10, summarize older ones and keep latest 8
    if len(memory.messages) > 10:
        try:
            # We keep the latest 8 messages (4 interactions)
            messages_to_summarize = memory.messages[:-8]
            summarizer = Summarizer()
            new_summary = summarizer.summarize(memory.summary, messages_to_summarize)
            
            memory.summary = new_summary
            memory.messages = memory.messages[-8:]
        except Exception as e:
            print(f"Warning: Failed to summarize older messages ({e})")
            # If summarization fails, we still truncate to prevent context window overflow
            memory.messages = memory.messages[-8:]
            
    # Save back to global store
    _memories[chat_id] = memory
