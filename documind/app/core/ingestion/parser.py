import fitz  # PyMuPDF
from docx import Document as DocxDocument


def parse_pdf(path: str) -> str:
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)


def parse_docx(path: str) -> str:
    doc = DocxDocument(path)
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
