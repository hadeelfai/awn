"""Fetch sources.txt pages and PDFs, chunk them, and replace their stored vectors."""
import argparse
import re

import pymupdf
import requests

from common import embed, get_conn

MAX_CHARS = 1200
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AwnBot/0.1)"}


def fetch_text(url: str) -> str:
    """Extract text from a direct PDF or clean a page through r.jina.ai."""
    if url.lower().split("?")[0].endswith(".pdf"):
        response = requests.get(url, headers=HEADERS, timeout=60)
        response.raise_for_status()
        with pymupdf.open(stream=response.content, filetype="pdf") as doc:
            return "\n\n".join(page.get_text() for page in doc)

    response = requests.get("https://r.jina.ai/" + url, headers=HEADERS, timeout=60)
    response.raise_for_status()
    return response.text.split("Markdown Content:", 1)[-1]


def get_title(url: str, raw: str) -> str:
    match = re.search(r"^#\s+(.+)$", raw, re.M)
    title = match.group(1).strip() if match else url
    if "medlineplus.gov/lab-tests/" in url:
        return f"Source: MedlinePlus, National Library of Medicine — {title}"
    return title


def chunk(text: str) -> list[str]:
    """Split into roughly 1200-character sections, starting at headings."""
    chunks, current, heading = [], "", ""

    def flush():
        nonlocal current
        if current.strip():
            chunks.append(current.strip())
        current = ""

    for paragraph in re.split(r"\n\s*\n", text):
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        if paragraph.startswith("#"):
            flush()
            heading = paragraph.lstrip("# ").strip()
            current = paragraph + "\n\n"
            continue
        if len(current) + len(paragraph) > MAX_CHARS:
            flush()
            current = (heading + "\n\n") if heading else ""
        current += paragraph + "\n\n"
    flush()
    return [part for part in chunks if len(part) > 80]


def main():
    parser = argparse.ArgumentParser(description="Fetch and index Awn RAG sources.")
    parser.add_argument(
        "--url",
        action="append",
        dest="selected_urls",
        help="Process only this exact source URL. Repeat to process several URLs.",
    )
    args = parser.parse_args()

    with open("sources.txt", encoding="utf-8") as source_file:
        all_urls = [line.strip() for line in source_file if line.strip() and not line.lstrip().startswith("#")]

    if args.selected_urls:
        unknown_urls = set(args.selected_urls) - set(all_urls)
        if unknown_urls:
            parser.error("URL not present in sources.txt: " + ", ".join(sorted(unknown_urls)))
        urls = list(dict.fromkeys(args.selected_urls))
    else:
        urls = all_urls

    if not urls:
        print("sources.txt has no links yet. Add official sources and run again.")
        return

    with get_conn() as conn:
        for url in urls:
            print("Reading", url)
            try:
                raw = fetch_text(url)
                if len(raw.strip()) < 400:
                    print("  skipped: page looks like a listing, not an article")
                    continue
                pieces = chunk(raw)
                if not pieces:
                    print("  skipped: no usable text found")
                    continue
                title = get_title(url, raw)

                # Fetch and chunk sources on each run to detect changed content,
                # but avoid the costly BGE-M3 model load/encoding when unchanged.
                existing = conn.execute(
                    "select title, chunk_index, content from chunks "
                    "where source_url = %s order by chunk_index",
                    (url,),
                ).fetchall()
                if existing and all(row[0] == title for row in existing) and [
                    row[2] for row in existing
                ] == pieces:
                    print(f"  unchanged: {len(pieces)} chunks; embeddings reused")
                    continue

                vectors = embed(pieces)
                conn.execute("delete from chunks where source_url = %s", (url,))
                with conn.cursor() as cursor:
                    cursor.executemany(
                        "insert into chunks (source_url, title, chunk_index, content, embedding) "
                        "values (%s, %s, %s, %s, %s)",
                        [(url, title, index, piece, vector) for index, (piece, vector) in enumerate(zip(pieces, vectors))],
                    )
                conn.commit()
                print(f"  saved {len(pieces)} chunks")
            except Exception as error:
                conn.rollback()
                print("  skipped:", error)


if __name__ == "__main__":
    main()
