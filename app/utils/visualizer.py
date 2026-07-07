import os
from app.utils.helper import load_env
from app.llm.providers import get_user_provider

class DataVisualizer:
    def __init__(self, model_name="gemini-3.5-flash"):
        load_env()
        self.model_name = model_name

    def generate_and_save_plot(self, query: str, sql: str, columns: list, rows: list, output_filename="query_result_plot.png", user_id: int = None) -> bool:
        """
        Uses active AI provider to generate matplotlib/seaborn plotting code for the dataset.
        Executes the generated code to save the chart as output_filename.
        Returns True if plot was successfully generated and saved, False otherwise.
        """
        # If there is no data or not enough rows to create a meaningful comparison/trend
        if not rows or len(rows) <= 1:
            return False

        # Prepare context for the LLM
        sample_data = rows[:5]
        all_columns = columns

        system_instruction = (
            "You are an expert Python data visualizer.\n"
            "Your task is to write clean, complete Python code using matplotlib and seaborn to visualize a dataset.\n"
            "The dataset will be provided in the local scope as both a Python list of dictionaries named `data`, and a pre-loaded pandas DataFrame named `df`.\n\n"
            "Rules:\n"
            "1. You MUST generate ONLY the Python code. Do NOT wrap it in markdown code blocks (e.g. ```python) or include any explanation.\n"
            "2. The code will be run using exec() with `data`, `df`, and list `columns` already defined in the local scope.\n"
            "3. Determine if the dataset is chartable (e.g., has numerical and categorical values, or values that can be plotted over time). If NOT chartable, output exactly: # NOT_CHARTABLE\n"
            "4. Use seaborn styling for a professional, premium aesthetic (e.g. sns.set_theme(style='whitegrid'), custom color palettes, proper labels, tight layout).\n"
            "5. You MUST save the generated chart to a file name specified by the variable `output_filename` (e.g., using plt.savefig(output_filename, dpi=300, bbox_inches='tight')). Do NOT use plt.show().\n"
            "6. Always clear the plot before and after drawing (using plt.close('all') or plt.clf()) to avoid leaking state."
        )

        prompt = (
            f"User Question: {query}\n\n"
            f"SQL Query Executed: {sql}\n\n"
            f"Dataset Columns: {all_columns}\n\n"
            f"Sample Data (List of Dicts): {sample_data}\n\n"
            f"Please write the Python plotting code."
        )

        provider = get_user_provider(user_id, self.model_name)
        response_text = provider.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.1
        )

        code = response_text.strip()
        try:
            # Clean markdown wrappers if any
            if code.startswith("```"):
                lines = code.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                code = "\n".join(lines).strip()

            if code.strip() == "# NOT_CHARTABLE" or not code:
                return False

            # Set matplotlib backend to Agg to prevent opening UI windows
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            import seaborn as sns
            import pandas as pd

            # Pre-load DataFrame from rows
            df_data = pd.DataFrame(rows)

            # Prepare execution environment
            local_vars = {
                "data": rows,
                "df": df_data,
                "columns": columns,
                "output_filename": output_filename,
                "pd": pd,
                "plt": plt,
                "sns": sns
            }
            
            # Execute generated code
            plt.clf()
            exec(code, {}, local_vars)
            plt.close('all')
            
            return os.path.exists(output_filename)

        except Exception as e:
            print(f"Error generating or executing visualization code: {e}")
            try:
                import matplotlib.pyplot as plt
                plt.close('all')
            except:
                pass
            return False

