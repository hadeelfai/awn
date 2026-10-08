"""Shared embedding and PostgreSQL helpers for the Awn RAG service."""
import os

import psycopg
from dotenv import load_dotenv
from pgvector.psycopg import register_vector
from sentence_transformers import SentenceTransformer

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
_model = None


def embed(texts: list[str], *, allow_download: bool = True):
    """Create normalized BGE-M3 embeddings (1024 dimensions)."""
    global _model
    if _model is None:
        try:
            # Prefer the local cache so ordinary questions don't require a
            # Hugging Face metadata request when the model is already present.
            _model = SentenceTransformer("BAAI/bge-m3", local_files_only=True)
        except (OSError, ValueError):
            if not allow_download:
                raise
            # Fresh installations can still download the model on first use.
            _model = SentenceTransformer("BAAI/bge-m3")
    return _model.encode(texts, normalize_embeddings=True, batch_size=8)


def get_conn():
    """Open a connection configured for pgvector values."""
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured.")
    conn = psycopg.connect(DATABASE_URL)
    register_vector(conn)
    return conn
