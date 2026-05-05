_TEMPLATE = """\
You are a precise document assistant. Answer the question using ONLY the context below.
If the answer is not in the context, say "I don't have enough information in the uploaded documents."

Context:
{context}

Question: {question}

Answer:"""


def build_rag_prompt(chunks: list[str], question: str) -> str:
    context = "\n\n---\n\n".join(chunks)
    return _TEMPLATE.format(context=context, question=question)
