import unittest
import json
from app.conversation.models import ConversationMemory
from app.conversation.context_resolver import ContextResolver
from app.conversation.summarizer import Summarizer
from app.conversation.memory import get_memory, update_memory_after_query

class TestConversationalMemory(unittest.TestCase):
    
    def test_memory_creation_and_metadata_extraction(self):
        memory = ConversationMemory()
        
        # Test basic list fields
        self.assertEqual(len(memory.messages), 0)
        self.assertEqual(memory.summary, "")
        
        # Test result metadata extraction
        sql = "SELECT id, name, revenue FROM customers ORDER BY revenue DESC"
        columns = ["id", "name", "revenue"]
        rows = [
            {"id": 1, "name": "Alice", "revenue": 5000},
            {"id": 2, "name": "Bob", "revenue": 4000},
            {"id": 3, "name": "Charlie", "revenue": 3000},
            {"id": 4, "name": "David", "revenue": 2000}
        ]
        
        memory.update_result_metadata(sql, columns, rows)
        
        self.assertEqual(memory.last_sql, sql)
        self.assertEqual(memory.last_result_metadata["table"], "customers")
        self.assertEqual(memory.last_result_metadata["row_count"], 4)
        # Should store up to 3 preview rows
        self.assertEqual(len(memory.last_result_metadata["entity_preview"]), 3)
        self.assertEqual(memory.last_result_metadata["entity_preview"][0]["name"], "Alice")

    def test_context_resolver_resolved_flow(self):
        memory = ConversationMemory()
        memory.add_message("user", "Show top 10 customers by revenue.")
        memory.add_message("assistant", "Returned 10 customers.")
        memory.last_sql = "SELECT id, name, revenue FROM customers ORDER BY revenue DESC LIMIT 10"
        memory.last_result_metadata = {
            "table": "customers",
            "returned_columns": ["id", "name", "revenue"],
            "entity_preview": [
                {"id": 101, "name": "John", "revenue": 10000},
                {"id": 205, "name": "Sarah", "revenue": 9500}
            ],
            "row_count": 10
        }
        memory.active_entities = {
            "table": "customers",
            "selected_customer": 101
        }
        
        resolver = ContextResolver()
        
        # 1. Test clean resolution of a follow-up
        follow_up = "Which one is from Chennai?"
        resolved = resolver.resolve(follow_up, memory)
        print(f"\n[Test] Follow-up question:\nInput: {follow_up}\nOutput: {resolved}")
        self.assertIsNotNone(resolved)
        # Should refer to the top customers/customers discussed earlier
        self.assertTrue(any(x in resolved.lower() for x in ["customer", "top", "returned", "previous"]))

        # 2. Test ambiguous reference clarification
        memory_amb = ConversationMemory()
        memory_amb.add_message("user", "Show products and customer orders.")
        memory_amb.add_message("assistant", "Returned list of products and orders.")
        ambiguous = "Show its details."
        resolved_ambiguous = resolver.resolve(ambiguous, memory_amb)
        print(f"\n[Test] Ambiguous pronoun question:\nInput: {ambiguous}\nOutput: {resolved_ambiguous}")
        self.assertIsNotNone(resolved_ambiguous)
        self.assertTrue(resolved_ambiguous.startswith("I couldn't determine what"))

    def test_summarization_threshold(self):
        memory = ConversationMemory()
        summarizer = Summarizer()
        
        # Prepopulate with 6 rounds of dummy messages (12 messages total)
        for i in range(1, 7):
            memory.add_message("user", f"Query number {i}")
            memory.add_message("assistant", f"Answer number {i}")
            
        self.assertEqual(len(memory.messages), 12)
        
        # We want to summarize the older ones (all except the latest 8 messages)
        # Latest 8 messages are messages[-8:]
        messages_to_summarize = memory.messages[:-8]
        self.assertEqual(len(messages_to_summarize), 4)
        
        summary = summarizer.summarize("", messages_to_summarize)
        print(f"\n[Test] Summarizer output:\n{summary}")
        self.assertTrue("Conversation Summary:" in summary)
        
if __name__ == "__main__":
    unittest.main()
