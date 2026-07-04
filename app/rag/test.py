from app.rag.retriever import Retriever

retriever = Retriever()

results = retriever.retrieve(
    "Show all customers from Chennai"
)

for result in results:
    print(result["score"])
    print(result["document"])