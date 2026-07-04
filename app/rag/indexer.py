import faiss
import pickle
import os

from app.rag.chunker import SchemaChunker
from app.rag.embedder import Embedder


class Indexer:

    def __init__(self,
                 schema_path="data/schema.json",
                 index_path="vector_store/faiss.index",
                 metadata_path="vector_store/metadata.pkl"):

        self.schema_path = schema_path
        self.index_path = index_path
        self.metadata_path = metadata_path

    def build_index(self):

        chunker = SchemaChunker(self.schema_path)
        documents = chunker.create_chunks()

        embedder = Embedder()
        embeddings = embedder.embed_documents(documents)

        dimension = embeddings.shape[1]

        index = faiss.IndexFlatIP(dimension)

        index.add(embeddings)

        os.makedirs("vector_store", exist_ok=True)

        faiss.write_index(index, self.index_path)

        with open(self.metadata_path, "wb") as f:
            pickle.dump(documents, f)

        print("Index created successfully!")


if __name__ == "__main__":
    indexer = Indexer()
    indexer.build_index()