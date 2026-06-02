import requests
import json

SERVER_URL = "http://localhost:5000"
OUTPUT_FILE = "server_response.json"


def main():
    print(" Client avviato...")
    print()

    print(" Invio richiesta GET /studente...")
    
    try:
        response_get = requests.get(f"{SERVER_URL}/studente", timeout=5)
        response_get.raise_for_status()
        
        dati_luca = response_get.json()
        print(f" Risposta GET: {dati_luca}")
        
        # Salva la risposta del server in un file JSON
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(dati_luca, f, indent=2, ensure_ascii=False)
        print(f" Dati salvati in: {OUTPUT_FILE}")
        print()
    except requests.exceptions.RequestException as e:
        print(f" Errore GET: {e}")
        print("Assicurati che il server sia avviato (python server.py)")
        return

    print(" Invio richiesta POST /studente con dati di Mario Rossi...")
    
    mario_rossi = {
        "nome": "Nigro",
        "cognome": "Rich",
        "classe": "3IFON",
        "eta": 17
    }
    
    try:
        response_post = requests.post(
            f"{SERVER_URL}/studente",
            json=mario_rossi,
            timeout=5
        )
        response_post.raise_for_status()
        
        risposta_server = response_post.json()
        print(f" Risposta POST: {risposta_server}")
        print()
        print(" Operazioni completate con successo!")
        
    except requests.exceptions.RequestException as e:
        print(f" Errore POST: {e}")
        return


if __name__ == "__main__":
    main()
