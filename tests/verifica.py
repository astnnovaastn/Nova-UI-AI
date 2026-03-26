from __future__ import annotations
import os
import sys
import argparse
import requests
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

API_ENDPOINT = "https://api.nasa.gov/planetary/apod"
DOCS_URL = "https://api.nasa.gov/"
DEMO_KEY = "DEMO_KEY"  # Changed back to actual DEMO_KEY


def get_api_key() -> str:
    """Return API key from environment or DEMO_KEY fallback."""
    return os.environ.get("NASA_API_KEY", DEMO_KEY)


def fetch_apod(api_key: str, date: Optional[str] = None, timeout: int = 20, retries: int = 5) -> Dict[str, Any]:
    """Fetch APOD metadata for given date (YYYY-MM-DD) or today.

    Returns the JSON metadata as dict. Raises requests.HTTPError on failure.
    """
    params = {"api_key": api_key}
    if date:
        # validate simple format
        try:
            datetime.strptime(date, "%Y-%m-%d")
            params["date"] = date
        except ValueError as e:
            raise ValueError("Date must be in YYYY-MM-DD format") from e

    headers = {"User-Agent": "AstraAI-verifica/1.0", "Accept": "application/json"}

    # If using the default DEMO_KEY, add a small delay to respect rate limits
    if api_key == "DEMO_KEY":
        time.sleep(1)  # NASA API has 1000 requests/day limit with DEMO_KEY

    attempt = 0
    while attempt < retries:
        attempt += 1
        try:
            resp = requests.get(API_ENDPOINT, params=params, timeout=timeout, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.ReadTimeout as e:
            if attempt < retries:
                wait = min(2 ** (attempt - 1), 5)  # Cap the wait time to 5 seconds
                print(f"Read timed out (attempt {attempt}/{retries}). Retrying in {wait}s...")
                time.sleep(wait)
                # increase timeout for next attempt
                timeout = min(timeout * 2, 30)  # Cap timeout to 30 seconds
                continue
            else:
                raise
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:  # Rate limited
                wait = min(2 ** (attempt - 1), 10)
                print(f"Rate limited by server (attempt {attempt}/{retries}). Waiting {wait}s...")
                time.sleep(wait)
                continue
            else:
                raise
        except requests.exceptions.ConnectionError:
            if attempt < retries:
                wait = min(2 ** (attempt - 1), 5)  # Shorter wait for connection errors
                print(f"Connection error (attempt {attempt}/{retries}). Retrying in {wait}s...")
                time.sleep(wait)
                continue
            else:
                raise
        except requests.exceptions.RequestException as e:
            if attempt < retries and "Connection" in str(e):
                wait = min(2 ** (attempt - 1), 5)
                print(f"Request error (attempt {attempt}/{retries}). Retrying in {wait}s...")
                time.sleep(wait)
                continue
            else:
                raise


def download_media(metadata: Dict[str, Any], save_dir: Path) -> Optional[Path]:
    """Download media if media_type is 'image'. Returns path to saved file or None.

    Saves metadata JSON alongside the file.
    """
    media_type = metadata.get("media_type")
    url = metadata.get("url")
    if not url:
        print("Nessuna URL trovata nei metadati.")
        return None

    save_dir.mkdir(parents=True, exist_ok=True)

    # sanitize filename using date and title
    date = metadata.get("date", datetime.utcnow().strftime("%Y-%m-%d"))
    title = metadata.get("title", "apod").replace("/", "_").replace("\\", "_")
    ext = os.path.splitext(url)[1].split("?")[0] or ".jpg"
    filename = f"apod_{date}_{title}{ext}"
    file_path = save_dir / filename

    if media_type != "image":
        print(f"Media type is '{media_type}', not an image. URL: {url}")
        # still return None but save metadata
        meta_path = save_dir / f"apod_{date}_metadata.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            import json

            json.dump(metadata, f, ensure_ascii=False, indent=2)
        return None

    print(f"Scaricando immagine da: {url}\nSalvo in: {file_path}")
    # Download with simple retry logic for network issues
    headers = {"User-Agent": "AstraAI-verifica/1.0"}
    attempt = 0
    dl_timeout = 20  # Reduced timeout for download
    while attempt < 3:
        attempt += 1
        try:
            with requests.get(url, stream=True, timeout=dl_timeout, headers=headers) as r:
                r.raise_for_status()
                with open(file_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
            break
        except requests.exceptions.ReadTimeout:
            if attempt < 3:
                wait = min(2 ** (attempt - 1), 5)  # Reduced wait time
                print(f"Read timed out while downloading (attempt {attempt}/3). Retrying in {wait}s...")
                time.sleep(wait)
                dl_timeout = min(dl_timeout * 2, 60)
                continue
            else:
                raise

    # Save metadata
    meta_path = save_dir / f"apod_{date}_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        import json

        json.dump(metadata, f, ensure_ascii=False, indent=2)

    return file_path


def pretty_print_metadata(metadata: Dict[str, Any]) -> None:
    """Print some useful fields in a readable format."""
    print("--- APOD METADATA ---")
    print(f"Date: {metadata.get('date')}")
    print(f"Title: {metadata.get('title')}")
    print(f"Media type: {metadata.get('media_type')}")
    print(f"URL: {metadata.get('url')}")
    explanation = metadata.get('explanation')
    if explanation:
        # print first 400 chars of explanation
        print("Explanation:")
        print(explanation[:400] + ("..." if len(explanation) > 400 else ""))
    print(f"Copyright: {metadata.get('copyright')}")
    print("---------------------")


def build_argparser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Verifica: client semplice per NASA APOD")
    p.add_argument("--date", "-d", help="Data APOD in formato YYYY-MM-DD (default: oggi)")
    p.add_argument(
        "--save-dir",
        "-s",
        help="Cartella dove salvare immagine e metadati (default: ./apod_downloads)",
        default="apod_downloads",
    )
    p.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="Timeout in secondi per le richieste HTTP (default: 20)",
    )
    p.add_argument(
        "--retries",
        type=int,
        default=5,
        help="Numero di tentativi in caso di timeout (default: 5)",
    )
    p.add_argument(
        "--info-only",
        action="store_true",
        help="Solo stampare i metadati senza scaricare il file",
    )
    p.add_argument(
        "--docs",
        action="store_true",
        help="Stampa link alla documentazione ufficiale",
    )
    return p


def main(argv: Optional[list[str]] = None) -> int:
    parser = build_argparser()
    args = parser.parse_args(argv)

    if args.docs:
        print(f"NASA API docs: {DOCS_URL}")
        return 0

    api_key = get_api_key()
    try:
        metadata = fetch_apod(api_key, date=args.date, timeout=args.timeout, retries=args.retries)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            print(f"Errore fetching APOD: API key non valida o limite giornaliero superato")
        elif e.response.status_code == 429:
            print(f"Errore fetching APOD: Limite di richieste superato, riprova più tardi")
        else:
            print(f"Errore fetching APOD: {e}")
        return 2
    except Exception as e:
        print(f"Errore fetching APOD: {e}")
        print("Suggerimenti: controlla connessione internet, prova un'altra API key, o usa --timeout 30 --retries 5")
        return 2

    pretty_print_metadata(metadata)

    if args.info_only:
        return 0

    save_dir = Path(args.save_dir)
    try:
        saved = download_media(metadata, save_dir)
        if saved:
            print(f"Immagine salvata in: {saved}")
        else:
            print("Nessuna immagine scaricata (media non di tipo 'image' o errore). Controlla i metadati.")
    except Exception as e:
        print(f"Errore durante il download del media: {e}")
        return 3

    return 0


if __name__ == "__main__":
    sys.exit(main())