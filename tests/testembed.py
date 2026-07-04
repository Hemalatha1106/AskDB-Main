from app.rag.chunker import SchemaChunker
from app.rag.embedder import Embedder

chunker = SchemaChunker("data/schema.json")
chunks = chunker.create_chunks()

embedder = Embedder()

embeddings = embedder.embed_documents(chunks)

print(f"Number of chunks: {len(chunks)}")
print(f"Embedding shape: {embeddings.shape}")