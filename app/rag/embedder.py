import os
import numpy as np
from app.utils.helper import load_env

class Embedder:
    def __init__(self, model_name="BAAI/bge-small-en-v1.5"):
        load_env()
        # Check if gemini_api_key is available
        self.api_key = os.getenv("gemini_api_key") or os.getenv("GEMINI_API_KEY")
        self.use_gemini = bool(self.api_key)
        
        if self.use_gemini:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.model_name = "models/gemini-embedding-2"
            print("Using Google Gemini API for embeddings (zero-RAM cloud embedding).")
        else:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(model_name)
                print(f"Using local SentenceTransformer({model_name}) for embeddings.")
            except ImportError:
                raise ImportError(
                    "sentence-transformers is not installed and no gemini_api_key was found in the environment. "
                    "Please install sentence-transformers or set gemini_api_key."
                )

    def embed_documents(self, documents):
        """
        Convert a list of text documents into embeddings.
        """
        if self.use_gemini:
            import google.generativeai as genai
            embeddings = []
            for doc in documents:
                # Wrap doc in string to handle potential non-string values
                text_content = str(doc)
                if not text_content.strip():
                    text_content = "empty"
                try:
                    result = genai.embed_content(
                        model=self.model_name,
                        content=text_content,
                        task_type="retrieval_document"
                    )
                    embeddings.append(result['embedding'])
                except Exception as e:
                    print(f"Gemini embedding failed for document: {e}. Retrying with empty placeholder...")
                    result = genai.embed_content(
                        model=self.model_name,
                        content="empty",
                        task_type="retrieval_document"
                    )
                    embeddings.append(result['embedding'])
            return np.array(embeddings, dtype=np.float32)
        else:
            embeddings = self.model.encode(
                documents,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            return embeddings

    def embed_query(self, query):
        """
        Convert a user query into an embedding.
        """
        if self.use_gemini:
            import google.generativeai as genai
            text_content = str(query)
            if not text_content.strip():
                text_content = "empty"
            result = genai.embed_content(
                model=self.model_name,
                content=text_content,
                task_type="retrieval_query"
            )
            return np.array(result['embedding'], dtype=np.float32)
        else:
            embedding = self.model.encode(
                query,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            return embedding