import sys
from app.rag.retriever import Retriever
from app.llm.prompt_builder import PromptBuilder
from app.llm.sql_generator import SQLGenerator
from app.executor.sql_executor import SQLExecutor

def run_askdb(query: str):
    print(f"\nUser Query: {query}")
    print("=" * 60)

    # 1. RAG: Retrieve table schemas
    print("\n[1/4] Retrieving relevant table schemas...")
    try:
        retriever = Retriever()
        schemas = retriever.retrieve(query, k=2)
    except Exception as e:
        print(f"Error initializing retriever or reading index: {e}")
        print("Please ensure you have built the vector index first.")
        return

    retrieved_tables = [item["document"].split("\n")[0] for item in schemas]
    print(f"Retrieved tables: {', '.join(retrieved_tables)}")

    # 2. Build prompt
    print("\n[2/4] Building prompt...")
    from app.database.connection import get_dialect
    dialect = get_dialect()
    dialect_display = dialect
    if dialect.lower() == "sqlite":
        dialect_display = "SQLite"
    elif dialect.lower() == "postgresql":
        dialect_display = "PostgreSQL"
    elif dialect.lower() == "mysql":
        dialect_display = "MySQL"
    else:
        dialect_display = dialect.capitalize()
        
    print(f"Database dialect: {dialect_display}")
    builder = PromptBuilder(dialect=dialect_display)
    prompt_data = builder.build_prompt(query, schemas)

    # 3. Generate SQL query
    print("\n[3/4] Generating SQL query with Gemini...")
    try:
        generator = SQLGenerator()
        sql = generator.generate_sql(prompt_data)
        print(f"Generated SQL:\n{sql}")
    except Exception as e:
        print(f"Failed to generate SQL: {e}")
        return

    # 4. Execute SQL
    print("\n[4/4] Executing SQL query against database...")
    executor = SQLExecutor()
    result = executor.execute(sql)

    if result["success"]:
        print("Execution Success! Results:")
        print("-" * 60)
        if result["rows"]:
            headers = result["columns"]
            header_str = " | ".join(headers)
            print(header_str)
            print("-" * len(header_str))
            for row in result["rows"]:
                print(" | ".join(str(row[h]) for h in headers))
                
            # 5. Synthesize natural language response
            print("\n[5/5] Synthesizing final answer...")
            try:
                from app.llm.response_synthesizer import ResponseSynthesizer
                synthesizer = ResponseSynthesizer()
                answer = synthesizer.synthesize(query, sql, result["columns"], result["rows"])
                print("\nAnswer:")
                print("=" * 60)
                print(answer)
                print("=" * 60)
            except Exception as e:
                print(f"Failed to synthesize response: {e}")
                
            # 6. Generate and save visualization
            print("\nChecking if data can be visualized...")
            try:
                from app.utils.visualizer import DataVisualizer
                visualizer = DataVisualizer()
                output_plot_path = "query_result_plot.png"
                plot_success = visualizer.generate_and_save_plot(query, sql, result["columns"], result["rows"], output_plot_path)
                if plot_success:
                    print(f"Success! Visualized graph saved to: {output_plot_path}")
                else:
                    print("Data is not chartable or visualization not required (e.g. no numeric data or insufficient rows).")
            except Exception as e:
                print(f"Failed to generate visualization: {e}")
        else:
            print("(No rows returned or empty result set)")
        print("-" * 60)
    else:
        print(f"SQL Execution Failed: {result['error']}")

def main():
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = input("Ask a question about the database: ")
    
    if not query.strip():
        print("Empty query. Exiting.")
        return
        
    run_askdb(query)

if __name__ == "__main__":
    main()
