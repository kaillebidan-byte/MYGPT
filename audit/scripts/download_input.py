#!/usr/bin/env python3
"""Download an audit input from a direct URL, GitHub URL, or common Google Drive share URL."""

from __future__ import annotations

import argparse
import re
import urllib.parse
import urllib.request
from pathlib import Path


def normalize_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    if parsed.netloc in {"github.com", "www.github.com"} and "/blob/" in parsed.path:
        owner, repository, _, ref, *rest = parsed.path.strip("/").split("/")
        return f"https://raw.githubusercontent.com/{owner}/{repository}/{ref}/{'/'.join(rest)}"

    if "drive.google.com" in parsed.netloc:
        match = re.search(r"/file/d/([^/]+)", parsed.path)
        query = urllib.parse.parse_qs(parsed.query)
        file_id = match.group(1) if match else (query.get("id") or [None])[0]
        if file_id:
            return (
                "https://drive.usercontent.google.com/download"
                f"?id={urllib.parse.quote(file_id)}&export=download&confirm=t"
            )
    return url


def download(url: str, output: Path) -> None:
    request = urllib.request.Request(
        normalize_url(url),
        headers={
            "User-Agent": "MYGPT-sprite-auditor/1.0",
            "Accept": "image/*,application/octet-stream;q=0.9,*/*;q=0.1",
        },
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(request, timeout=90) as response, output.open("wb") as target:
        content_type = response.headers.get("Content-Type", "")
        payload = response.read()
        if "text/html" in content_type.lower() or payload.lstrip().startswith(b"<!DOCTYPE html"):
            raise RuntimeError(
                "URL returned HTML instead of an image. Use a public direct-download URL."
            )
        target.write(payload)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    download(args.url, args.output)
    print(args.output)


if __name__ == "__main__":
    main()
