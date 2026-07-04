import faiss
import pickle
import os

from app.rag.embedder import Embedder


class Retriever:

    def __init__(self,
                 connection_id=None,
                 index_path="vector_store/faiss.index",
                 metadata_path="vector_store/metadata.pkl"):

        # If connection_id is provided, use connection-specific index files if they exist
        if connection_id:
            conn_index = f"vector_store/conn_{connection_id}.index"
            conn_metadata = f"vector_store/conn_{connection_id}_metadata.pkl"
            if os.path.exists(conn_index) and os.path.exists(conn_metadata):
                index_path = conn_index
                metadata_path = conn_metadata

        self.index = faiss.read_index(index_path)

        with open(metadata_path, "rb") as f:
            self.documents = pickle.load(f)

        self.embedder = Embedder()

    def retrieve(self, query, k=3):

        query_embedding = self.embedder.embed_query(query)

        k = min(k, len(self.documents))
        if k == 0:
            return []

        distances, indices = self.index.search(
            query_embedding.reshape(1, -1),
            k
        )

        results = []

        for score, idx in zip(distances[0], indices[0]):
            if idx < 0 or idx >= len(self.documents):
                continue

            results.append({
                "score": float(score),
                "document": self.documents[idx]
            })

        return results