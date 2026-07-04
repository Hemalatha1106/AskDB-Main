import json


class SchemaChunker:
    def __init__(self, schema_path: str):
        self.schema_path = schema_path

    def load_schema(self):
        with open(self.schema_path, "r", encoding="utf-8") as f:
            return json.load(f)#returns dictionary {{table:, description:, columns:,}}

    def create_chunks(self):
        schema = self.load_schema()

        chunks = []

        for table in schema:
            lines = []

            lines.append(f"Table: {table['table']}")

            if table.get("description"):
                lines.append(f"Description: {table['description']}")

            lines.append("Columns:")

            for column in table["columns"]:
                line = f"- {column['name']} ({column['type']})"

                if column.get("key"):
                    line += f" [{column['key']}]"

                lines.append(line)

            chunks.append("\n".join(lines))

        return chunks


if __name__ == "__main__":
    chunker = SchemaChunker("data/schema.json")

    chunks = chunker.create_chunks()

    for i, chunk in enumerate(chunks, 1):
        print(f"\n------ Chunk {i} ------\n")
        print(chunk)