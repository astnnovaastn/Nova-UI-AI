import streamlit as st
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
from datetime import datetime
import base64
import streamlit.components.v1 as components
from fpdf import FPDF

# Load Font Awesome and Custom CSS for Premium UI
st.markdown("""
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    .premium-alert {
        padding: 16px 20px;
        border-radius: 12px;
        margin: 16px 0;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.05);
        border: 1px solid rgba(255,255,255,0.3);
        backdrop-filter: blur(10px);
        animation: slideIn 0.4s ease-out;
    }
    
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .alert-success { background-color: #f0fdf4; border-left: 5px solid #22c55e; color: #166534; }
    .alert-warning { background-color: #fffbeb; border-left: 5px solid #f59e0b; color: #92400e; }
    .alert-error { background-color: #fef2f2; border-left: 5px solid #ef4444; color: #991b1b; }
    .alert-info { background-color: #eff6ff; border-left: 5px solid #3b82f6; color: #1e40af; }
    
    .alert-icon { font-size: 20px; flex-shrink: 0; }
    .alert-content { font-weight: 500; font-size: 15px; }

    /* Customizing Streamlit Widgets */
    .stTabs [data-baseweb="tab-list"] { padding: 4px; background: rgba(0,51,102,0.03); border-radius: 10px; }
    .stTabs [data-baseweb="tab"] { border-radius: 8px; font-weight: 600; border: none !important; }
    
    /* Global Icon Styling */
    .fa, .fas, .fab {
        color: inherit;
    }

    /* Branding Expander Icon via CSS (Targeting by attribute if possible) */
    [data-testid="stExpander"] details summary span p {
        font-weight: 600;
        color: #003366;
    }
    </style>
""", unsafe_allow_html=True)

def premium_notify(msg, type="info"):
    icon_map = {
        "success": "fa-circle-check",
        "warning": "fa-triangle-exclamation",
        "error": "fa-circle-xmark",
        "info": "fa-circle-info"
    }
    icon = icon_map.get(type, "fa-circle-info")
    st.markdown(f"""
        <div class="premium-alert alert-{type}">
            <div class="alert-icon"><i class="fas {icon}"></i></div>
            <div class="alert-content">{msg}</div>
        </div>
    """, unsafe_allow_html=True)

# -----------------------
# CONFIG ERROR HANDLING
# -----------------------
try:
    import warnings
    warnings.filterwarnings('ignore')
except:
    pass

# -----------------------
# CONFIG PAGINA
# -----------------------
st.set_page_config(
    page_title="Generatore Comunale",
    layout="wide"
)

# -----------------------
# STRISCIA NERA IN ALTO & DESIGN
# -----------------------
st.markdown(
    """
    <style>
    /* Modernized Top Bar */
    .top-bar {
        background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        padding: 25px 20px;
        text-align: center;
        margin-bottom: 40px;
        border-radius: 0 0 20px 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        border-bottom: 2px solid rgba(255,255,255,0.05);
    }
    .top-bar h1 {
        color: #ffffff;
        margin: 0;
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.5px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
    }
    .top-bar h1 i {
        background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 38px;
    }

    /* Card style per le colonne */
    .stButton>button {
        background-color: #003366;
        color: white;
        border-radius: 8px;
        padding: 8px 20px;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        background-color: #0055aa;
        color: #fff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,51,102,0.3);
    }

    /* Page background and containers */
    body {
        background: linear-gradient(180deg, #eef2f6 0%, #f6f9fb 48%, #fbfdff 100%);
        -webkit-font-smoothing: antialiased;
        color-scheme: light;
    }

    .app-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    /* Box per le sezioni sinistra/destra */
    .stContainer {
        background-color: rgba(255,255,255,0.96);
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.08);
        border: 1px solid rgba(0,0,0,0.04);
        transition: box-shadow 0.3s ease;
    }
    .stContainer:hover {
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }

    /* Testo */
    p, li {
        font-family: 'Segoe UI', sans-serif;
        font-size: 15px;
        line-height: 1.5;
    }

    h2, h3 {
        font-family: 'Segoe UI', sans-serif;
        color: #003366;
    }

    /* Icon styles */
    .icon {
        margin-right: 8px;
        color: #003366;
    }

    /* Metric cards */
    .metric-card {
        background: rgba(255,255,255,0.9);
        border-radius: 8px;
        padding: 15px;
        margin: 5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
    }

    /* Expander improvements */
    .streamlit-expanderHeader {
        font-weight: 600;
        color: #003366;
    }

    /* Tab improvements */
    .stTabs [data-baseweb="tab-list"] {
        padding: 4px;
        background: rgba(0,51,102,0.03);
        border-radius: 10px;
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        font-weight: 600;
        border: none !important;
        background-color: rgba(0,51,102,0.1);
        padding: 8px 16px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #003366 !important;
        color: white !important;
    }


    @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .alert-success { background-color: #f0fdf4; border-left: 5px solid #22c55e; color: #166534; }
    .alert-warning { background-color: #fffbeb; border-left: 5px solid #f59e0b; color: #92400e; }
    .alert-error { background-color: #fef2f2; border-left: 5px solid #ef4444; color: #991b1b; }
    .alert-info { background-color: #eff6ff; border-left: 5px solid #3b82f6; color: #1e40af; }

    .alert-icon { font-size: 20px; flex-shrink: 0; }
    .alert-content { font-weight: 500; font-size: 15px; }

    /* Customizing Streamlit Widgets */
    .stTabs [data-baseweb="tab-list"] { padding: 4px; background: rgba(0,51,102,0.03); border-radius: 10px; }
    .stTabs [data-baseweb="tab"] { border-radius: 8px; font-weight: 600; border: none !important; }

    /* Global Icon Styling */
    .fa, .fas, .fab { color: inherit; }

    /* Branding Expander Icon via CSS (Targeting by attribute if possible) */
    [data-testid="stExpander"] details summary span p { font-weight: 600; color: #003366; }
    </style>
    """,
    unsafe_allow_html=True
)

st.markdown(
    """
    <div class="top-bar">
        <h1>
            <i class="fas fa-city"></i>
            Generatore di Testi e Codici per Pagine Comunali
        </h1>
    </div>
    """,
    unsafe_allow_html=True
)

# -----------------------
# FUNZIONE ANALISI TESTO
# -----------------------
def analizza_testo(testo):
    """Analizza il testo e estrae informazioni chiave con validazione"""
    if not testo or not testo.strip():
        return None
        
    dati = {}
    frasi = [f.strip() for f in re.split(r"[.\n]", testo) if f.strip()]

    dati["titolo"] = frasi[0] if frasi else "Titolo non specificato"
    dati["sottotitolo"] = frasi[1] if len(frasi) > 1 else ""

    data = re.search(r"\b\d{1,2}\s+\w+\s+20\d{2}\b", testo)
    dati["data"] = data.group() if data else "Data non specificata"

    dati["descrizione"] = testo
    dati["lunghezza"] = len(testo)
    dati["num_frasi"] = len(frasi)

    if "tutti" in testo.lower():
        dati["destinatari"] = "Tutti i cittadini"
    elif "giovani" in testo.lower():
        dati["destinatari"] = "Giovani"
    elif "aziend" in testo.lower():
        dati["destinatari"] = "Aziende"
    elif "student" in testo.lower():
        dati["destinatari"] = "Studenti"
    else:
        dati["destinatari"] = "Destinatari specifici"

    parole_requisiti = ["requisit", "necessari", "devono", "solo", "obbligatorio"]
    dati["requisiti"] = (
        "Consultare i requisiti indicati nel testo."
        if any(p in testo.lower() for p in parole_requisiti)
        else None
    )

    return dati

# -----------------------
# FUNZIONE CERCA ALLEGATI
# -----------------------
def cerca_allegati(url):
    """Cerca allegati (PDF, DOC, ecc.) in una pagina web"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        allegati = []
        estensioni = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar']
        
        # Cerca link con estensioni di allegati
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            if any(href.endswith(ext) for ext in estensioni):
                url_allegato = urljoin(url, link['href'])
                allegati.append(url_allegato)
        
        return allegati, None
    except Exception as e:
        return [], str(e)

# -----------------------
# FUNZIONE ANALISI CONTENUTI
# -----------------------
def calcola_metriche(testo):
    """Calcola metriche di lettura e contenuto"""
    parole = len(testo.split())
    frasi = len([f for f in re.split(r"[.!?]", testo) if f.strip()])
    
    # Tempo di lettura (media 200 parole al minuto)
    tempo_lettura = max(1, round(parole / 200))
    
    # Indice Flesch (semplificato) 0-100
    if parole > 0 and frasi > 0:
        flesch = max(0, min(100, 206.835 - 1.015 * (parole / frasi) - 84.6 * (len([c for c in testo if c in 'aeiouàèéìòù']) / parole)))
    else:
        flesch = 0
    
    # Determinare difficoltà
    if flesch >= 60:
        difficolta = "Molto facile"
    elif flesch >= 50:
        difficolta = "Facile"
    elif flesch >= 40:
        difficolta = "Medio"
    elif flesch >= 30:
        difficolta = "Difficile"
    else:
        difficolta = "Molto difficile"
    
    return {
        "parole": parole,
        "frasi": frasi,
        "caratteri": len(testo),
        "tempo_lettura": tempo_lettura,
        "flesch": round(flesch, 1),
        "difficolta": difficolta
    }

# -----------------------
# TEMPLATES COMUNALI
# -----------------------
TEMPLATES = {
    "Bando": """Bando di partecipazione a concorso pubblico
Data pubblicazione: [DATA]

Descrizione:
[TESTO]

Destinatari: [DESTINATARI]

Scadenza: [SCADENZA]""",
    
    "Avviso": """Avviso pubblico
Data: [DATA]

Oggetto:
[TESTO]

A tutti i cittadini e residenti del Comune""",
    
    "Comunicato stampa": """COMUNICATO STAMPA
Data: [DATA]

Titolo: [TITOLO]

[TESTO]

Per informazioni:
Ufficio Comunicazione - Comune""",
    
    "Ordinanza": """ORDINANZA N. [NUMERO]

Il Sindaco

Visto: [LEGGI RIFERIMENTO]

Ordina:

[TESTO]

La presente ordinanza entra in vigore dalla data di pubblicazione.""",
    
    "Delibera": """DELIBERA DELLA GIUNTA MUNICIPALE

Oggetto: [TITOLO]

Data: [DATA]

LA GIUNTA MUNICIPALE

Visto: [RIFERIMENTI NORMATIVI]

Delibera:

[TESTO]""",
    
    "Regolamento": """REGOLAMENTO COMUNALE

TITOLO: [TITOLO]

ART. 1 - OGGETTO
[TESTO]

ART. 2 - DESTINATARI
[DESTINATARI]

ART. 3 - DISPOSIZIONI FINALI
[TESTO]""",
    
    "Manifesto": """MANIFESTO PUBBLICO

COMUNE DI [NOME COMUNE]

[TITOLO]

[TESTO]

Data: [DATA]
Il Sindaco""",
    
    "Petizione": """PETIZIONE POPOLARE

Al Sindaco del Comune

I sottoscritti cittadini

CHIEDONO

[TESTO]

Data: [DATA]""",
    
    "Verbale": """VERBALE DI SEDUTA

Data: [DATA]
Ora: [ORA]
Luogo: [LUOGO]

PRESIDENTE: [NOME]
SEGRETARIO: [NOME]

ORDINE DEL GIORNO:
1. [ARGOMENTO]

DISCUSSIONE:
[TESTO]

DELIBERAZIONI:
[TESTO]""",
    
    "Certificato": """CERTIFICATO

Il sottoscritto Sindaco del Comune di [NOME COMUNE]

CERTIFICA

[TESTO]

Data: [DATA]
Il Sindaco"""
}

# -----------------------
# FUNZIONE EXPORT MARKDOWN
# -----------------------
def genera_markdown(dati, allegati_list=None):
    """Genera contenuto in formato Markdown"""
    md = f"""# {dati['titolo']}

**Data:** {dati['data']}

## Sottotitolo
{dati['sottotitolo']}

## Descrizione
{dati['descrizione']}

## Destinatari
{dati['destinatari']}
"""
    
    if dati.get('requisiti'):
        md += f"\n## Requisiti\n{dati['requisiti']}\n"
    
    if allegati_list:
        md += "\n## Allegati\n"
        for allegato in allegati_list:
            md += f"- [{allegato.split('/')[-1]}]({allegato})\n"
    
    md += f"\n---\n*Generato il {datetime.now().strftime('%d/%m/%Y %H:%M')}*"
    
    return md

# -----------------------
# FUNZIONE EXPORT PDF
# -----------------------
def genera_pdf(dati, allegati_list=None):
    """Genera contenuto in formato PDF"""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=16, style='B')
    pdf.cell(200, 10, txt=dati['titolo'], ln=True, align='C')
    pdf.ln(10)
    
    pdf.set_font("Arial", size=12)
    if dati.get('sottotitolo'):
        pdf.cell(200, 10, txt=f"Sottotitolo: {dati['sottotitolo']}", ln=True)
        pdf.ln(5)
    
    pdf.cell(200, 10, txt=f"Data: {dati['data']}", ln=True)
    pdf.cell(200, 10, txt=f"Destinatari: {dati['destinatari']}", ln=True)
    pdf.ln(10)
    
    pdf.multi_cell(0, 10, txt=dati['descrizione'])
    pdf.ln(10)
    
    if dati.get('requisiti'):
        pdf.cell(200, 10, txt="Requisiti:", ln=True)
        pdf.multi_cell(0, 10, txt=dati['requisiti'])
        pdf.ln(10)
    
    if allegati_list:
        pdf.cell(200, 10, txt="Allegati:", ln=True)
        for allegato in allegati_list[:5]:
            pdf.cell(200, 10, txt=f"- {allegato.split('/')[-1]}", ln=True)
    
    pdf.ln(10)
    pdf.cell(200, 10, txt=f"Generato il {datetime.now().strftime('%d/%m/%Y %H:%M')}", ln=True)
    
    return pdf.output(dest='S').encode('latin1')

# -----------------------
# FUNZIONE EXPORT TXT
# -----------------------
def genera_txt(dati, allegati_list=None):
    """Genera contenuto in formato TXT semplice"""
    txt = f"""{dati['titolo'].upper()}
{'=' * len(dati['titolo'])}

Data: {dati['data']}
Destinatari: {dati['destinatari']}

SOTTOTITOLO
{dati['sottotitolo']}

DESCRIZIONE
{dati['descrizione']}
"""
    
    if dati.get('requisiti'):
        txt += f"\nREQUISITI\n{dati['requisiti']}\n"
    
    if allegati_list:
        txt += "\nALLEGATI\n"
        for allegato in allegati_list:
            txt += f"- {allegato}\n"
    
    txt += f"\nGenerato il {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    
    return txt

# -----------------------
# FUNZIONE TRADUZIONE SEMPLICE
# -----------------------
def traduci_inglese(testo):
    """Traduzione semplice italiano-inglese (mock)"""
    # Dizionario di traduzioni comuni
    traduzioni = {
        "comune": "municipality",
        "cittadini": "citizens", 
        "data": "date",
        "destinatari": "recipients",
        "requisiti": "requirements",
        "allegati": "attachments",
        "bando": "notice",
        "avviso": "notice",
        "delibera": "resolution",
        "ordinanza": "ordinance",
        "comunicato": "press release",
        "stampa": "press",
        "sindaco": "mayor",
        "giunta": "council",
        "municipale": "municipal",
        "pubblico": "public",
        "amministrazione": "administration",
        "servizi": "services",
        "sociali": "social",
        "progetto": "project",
        "iniziativa": "initiative",
        "partecipazione": "participation",
        "scadenza": "deadline",
        "informazioni": "information",
        "contatti": "contacts"
    }
    
    testo_lower = testo.lower()
    testo_tradotto = testo
    
    for it, en in traduzioni.items():
        testo_tradotto = testo_tradotto.replace(it, en)
        testo_tradotto = testo_tradotto.replace(it.capitalize(), en.capitalize())
    
    return testo_tradotto
col1, col2 = st.columns(2)

# Inizializza session_state per dati
if "dati" not in st.session_state:
    st.session_state["dati"] = None
if "branding_color" not in st.session_state:
    st.session_state["branding_color"] = "#003366"
if "logo_url" not in st.session_state:
    st.session_state["logo_url"] = ""
# Gradienti personalizzabili (chiaro / scuro)
if "bg_light_start" not in st.session_state:
    st.session_state["bg_light_start"] = "#eef2f6"
if "bg_light_end" not in st.session_state:
    st.session_state["bg_light_end"] = "#fbfdff"
if "bg_dark_start" not in st.session_state:
    st.session_state["bg_dark_start"] = "#24303a"
if "bg_dark_end" not in st.session_state:
    st.session_state["bg_dark_end"] = "#0f1720"
if "bg_theme_choice" not in st.session_state:
    st.session_state["bg_theme_choice"] = "Chiaro"
if "show_original_structured" not in st.session_state:
    st.session_state["show_original_structured"] = False
if "history" not in st.session_state:
    st.session_state["history"] = []

# ===== SINISTRA =====
with col1:
    st.markdown("## <i class='fas fa-pen-to-square'></i> Generatore di Testo", unsafe_allow_html=True)
    
    # -----------------------
    # SEZIONE BRANDING
    # -----------------------
    st.markdown("### <i class='fas fa-palette'></i> Personalizzazione Branding", unsafe_allow_html=True)
    with st.expander("Modifica colori e stile del Comune", expanded=False):
        st.write("**Colori e stile del Comune**")
        branding_col1, branding_col2 = st.columns(2)
        
        with branding_col1:
            st.session_state["branding_color"] = st.color_picker(
                "Colore principale",
                value=st.session_state["branding_color"],
                key="branding_color_picker"
            )
        
        with branding_col2:
            st.session_state["logo_url"] = st.text_input(
                "URL logo Comune",
                value=st.session_state["logo_url"],
                placeholder="https://..."
            )
        # Scelta tema gradiente e picker
        st.write("**Sfondo: tema gradiente**")
        st.session_state["bg_theme_choice"] = st.selectbox(
            "Tema sfondo:", ["Chiaro", "Scuro"],
            index=0 if st.session_state.get("bg_theme_choice", "Chiaro") == "Chiaro" else 1
        )

        light_col1, light_col2 = st.columns(2)
        with light_col1:
            st.session_state["bg_light_start"] = st.color_picker(
                "Chiaro: Colore 1",
                value=st.session_state["bg_light_start"],
                key="bg_light_start_picker"
            )
        with light_col2:
            st.session_state["bg_light_end"] = st.color_picker(
                "Chiaro: Colore 2",
                value=st.session_state["bg_light_end"],
                key="bg_light_end_picker"
            )

        dark_col1, dark_col2 = st.columns(2)
        with dark_col1:
            st.session_state["bg_dark_start"] = st.color_picker(
                "Scuro: Colore 1",
                value=st.session_state["bg_dark_start"],
                key="bg_dark_start_picker"
            )
        with dark_col2:
            st.session_state["bg_dark_end"] = st.color_picker(
                "Scuro: Colore 2",
                value=st.session_state["bg_dark_end"],
                key="bg_dark_end_picker"
            )

        st.markdown("<hr/>", unsafe_allow_html=True)

        # Pulsante reset (opzionale)
        if st.button("Reset gradienti predefiniti"):
            st.session_state["bg_light_start"] = "#eef2f6"
            st.session_state["bg_light_end"] = "#fbfdff"
            st.session_state["bg_dark_start"] = "#24303a"
            st.session_state["bg_dark_end"] = "#0f1720"
            st.success("Gradienti ripristinati")

    # Applica il gradiente selezionato globalmente (se non si usa immagine di sfondo)
    theme = st.session_state.get("bg_theme_choice", "Chiaro")
    if theme == "Chiaro":
        gstart = st.session_state.get("bg_light_start", "#eef2f6")
        gend = st.session_state.get("bg_light_end", "#fbfdff")
    else:
        gstart = st.session_state.get("bg_dark_start", "#24303a")
        gend = st.session_state.get("bg_dark_end", "#0f1720")

    st.markdown(
        f"""
        <style>
        body {{
            background: linear-gradient(180deg, {gstart} 0%, {gend} 100%);
        }}
        .stContainer {{ background-color: rgba(255,255,255,0.96); }}
        </style>
        """,
        unsafe_allow_html=True,
    )
    
    # -----------------------
    # SEZIONE TEMPLATE
    # -----------------------
    st.markdown("### <i class='fas fa-layer-group'></i> Scegli un template", unsafe_allow_html=True)
    template_choice = st.selectbox(
        "Seleziona un modello predefinito:",
        ["Inserisci testo libero"] + list(TEMPLATES.keys()),
        help="Seleziona un template per iniziare più velocemente"
    )
    
    if template_choice != "Inserisci testo libero":
        template_text = TEMPLATES[template_choice]
        st.info(f"Template '{template_choice}' caricato. Personalizza il testo:")
    else:
        template_text = ""
    
    # Input testo
    testo_input = st.text_area(
        "Inserisci il testo da analizzare:",
        value=template_text,
        height=150,
        placeholder="Es: Bando comunale per giovani imprenditori, data 15 gennaio 2026. I requisiti sono..."
    )
    
    if st.button("Analizza Testo", use_container_width=True):
        if testo_input.strip():
            st.session_state["dati"] = analizza_testo(testo_input)
            premium_notify("Analisi completata: il testo è stato strutturato correttamente.", "success")

    # Toggle per mostrare il testo originale suddiviso
    st.session_state["show_original_structured"] = st.checkbox(
        "Mostra testo originale strutturato",
        value=st.session_state.get("show_original_structured", False)
    )

    if st.session_state.get("show_original_structured") and testo_input.strip():
        dati_tmp = analizza_testo(testo_input)
        if dati_tmp:
            with st.expander("📚 Testo originale (strutturato)", expanded=True):
                st.subheader("Titolo")
                st.text_area("", value=dati_tmp.get('titolo', ''), height=50)
                if dati_tmp.get('sottotitolo'):
                    st.subheader("Sottotitolo")
                    st.text_area("", value=dati_tmp.get('sottotitolo', ''), height=60)
                st.subheader("Descrizione")
                st.text_area("", value=dati_tmp.get('descrizione', ''), height=180)
                if dati_tmp.get('requisiti'):
                    st.subheader("Requisiti")
                    st.text_area("", value=dati_tmp.get('requisiti', ''), height=100)
    
    # -----------------------
    # SEZIONE ALLEGATI
    # -----------------------
    st.markdown("## <i class='fas fa-paperclip'></i> Allegati", unsafe_allow_html=True)

    # Inizializza session_state per url e risultati
    if "url_allegati" not in st.session_state:
        st.session_state["url_allegati"] = ""
    if "allegati_trovati" not in st.session_state:
        st.session_state["allegati_trovati"] = []
    if "errore_allegati" not in st.session_state:
        st.session_state["errore_allegati"] = None

    # Campo per inserire URL
    url_comune = st.text_input(
        "URL della pagina comunale:",
        value=st.session_state["url_allegati"],
        placeholder="https://www.comune.esempio.it/notizia/..."
    )

    # Bottone di ricerca
    if st.button("Cerca allegati", use_container_width=True):
        if url_comune.strip():
            st.session_state["url_allegati"] = url_comune
            allegati, errore = cerca_allegati(url_comune)
            st.session_state["allegati_trovati"] = allegati
            st.session_state["errore_allegati"] = errore

    # Mostra risultati persistenti
    if st.session_state["errore_allegati"]:
        premium_notify("Si è verificato un errore durante la scansione della pagina.", "error")

    elif st.session_state["allegati_trovati"]:
        premium_notify(f"Scansione completata: individuati {len(st.session_state['allegati_trovati'])} documenti disponibili.", "success")
        for a in st.session_state["allegati_trovati"]:
            st.markdown(f"- <i class='fas fa-file-pdf'></i> [{a.split('/')[-1]}]({a})", unsafe_allow_html=True)
    else:
        premium_notify("Nessun allegato rilevato nell'URL fornito.", "info")

    # Sezione aiuto
    st.markdown("## <i class='fas fa-question-circle'></i> Guida Rapida", unsafe_allow_html=True)
    with st.expander("Come utilizzare il generatore", expanded=False):
        st.markdown("""
        **Passi per generare un documento:**
        1. **Scegli un template** dal menu a tendina o inserisci testo libero
        2. **Analizza il testo** cliccando il pulsante corrispondente
        3. **Personalizza** colori, logo e opzioni di generazione
        4. **Cerca allegati** inserendo l'URL di una pagina comunale
        5. **Genera HTML** per vedere il risultato finale
        6. **Scarica** i formati desiderati (HTML, Markdown, TXT, PDF)
        
        **Funzionalità avanzate:**
        - **Riassunto automatico**: Genera un riassunto del testo
        - **Traduzione inglese**: Traduzione base italiano-inglese
        - **Metriche di leggibilità**: Analizza la complessità del testo
        - **Cronologia**: Accedi ai documenti precedenti
        
        **Template disponibili:**
        - Bando, Avviso, Comunicato stampa
        - Ordinanza, Delibera, Regolamento
        - Manifesto, Petizione, Verbale, Certificato
        """)
        
        # Strumenti interattivi nella guida
        st.markdown("---")
        st.markdown("### <i class='fas fa-tools'></i> Strumenti Rapidi", unsafe_allow_html=True)
        
        # Riassunto automatico
        if st.session_state.get("dati"):
            st.markdown("#### <i class='fas fa-compress'></i> Riassunto Automatico", unsafe_allow_html=True)
            if st.button("Riassumi testo corrente", use_container_width=True, key="guida_riassunto"):
                try:
                    riassunto = riassumi_testo(st.session_state["dati"]['descrizione'])
                    st.markdown("**Riassunto:**")
                    st.info(riassunto)
                    premium_notify("Riassunto generato con successo!", "success")
                except Exception as e:
                    premium_notify(f"Errore nella generazione del riassunto: {str(e)}", "error")
            
            # Traduzione inglese
            st.markdown("#### <i class='fas fa-language'></i> Traduzione Inglese", unsafe_allow_html=True)
            if st.button("Traduci testo corrente", use_container_width=True, key="guida_traduzione"):
                try:
                    traduzione = traduci_inglese(st.session_state["dati"]['descrizione'])
                    st.markdown("**Traduzione inglese:**")
                    st.info(traduzione)
                    premium_notify("Traduzione completata!", "success")
                except Exception as e:
                    premium_notify(f"Errore nella traduzione: {str(e)}", "error")
        else:
            st.info("Analizza un testo prima per utilizzare gli strumenti rapidi.")

# ===== DESTRA =====
with col2:
    st.markdown("## <i class='fas fa-microchip'></i> Generazione e Analytics", unsafe_allow_html=True)
    
    # Pulsante Clear All
    if st.button("🗑️ Cancella Tutto", use_container_width=True):
        st.session_state["dati"] = None
        st.session_state["url_allegati"] = ""
        st.session_state["allegati_trovati"] = []
        st.session_state["errore_allegati"] = None
        st.session_state["history"] = []
        premium_notify("Tutti i dati sono stati cancellati.", "info")
        st.rerun()

    if st.session_state["dati"]:
        premium_notify("Dati pronti per l'elaborazione e la generazione.", "success")
        
        # Mostra riepilogo dati strutturato
        st.markdown("### <i class='fas fa-chart-pie'></i> Analisi Testo Strutturata", unsafe_allow_html=True)
        with st.expander("Visualizza dettagli analisi", expanded=True):
            d = st.session_state["dati"]
            
            # TITOLO
            st.markdown("#### <i class='fas fa-thumbtack'></i> Titolo", unsafe_allow_html=True)
            st.write(d["titolo"])
            
            # SOTTOTITOLO
            if d.get('sottotitolo'):
                st.markdown("#### <i class='fas fa-heading'></i> Sottotitolo", unsafe_allow_html=True)
                st.write(d["sottotitolo"])
            
            # DESCRIZIONE
            st.markdown("#### <i class='fas fa-align-left'></i> Descrizione", unsafe_allow_html=True)
            st.write(d['descrizione'])
            
            # REQUISITI
            if d.get('requisiti'):
                st.markdown("#### <i class='fas fa-clipboard-check'></i> Requisiti", unsafe_allow_html=True)
                st.write(d['requisiti'])
            
            # Informazioni aggiuntive
            st.divider()
            st.markdown(f"**<i class='fas fa-calendar-days'></i> Data:** {d['data']}", unsafe_allow_html=True)
            st.markdown(f"**<i class='fas fa-users-gear'></i> Destinatari:** {d['destinatari']}", unsafe_allow_html=True)
            st.markdown(f"**<i class='fas fa-chart-simple'></i> Statistiche:** {d['lunghezza']} caratteri | {d['num_frasi']} frasi", unsafe_allow_html=True)
        
        # Mostra metriche di lettura
        st.markdown("### <i class='fas fa-gauge-high'></i> Parametri di Leggibilità", unsafe_allow_html=True)
        with st.expander("Metriche avanzate di contenuto", expanded=False):
            try:
                metriche = calcola_metriche(d['descrizione'])
                
                metric_col1, metric_col2, metric_col3 = st.columns(3)
                
                with metric_col1:
                    st.metric("Parole", metriche['parole'])
                    st.metric("Tempo lettura", f"{metriche['tempo_lettura']} min")
                
                with metric_col2:
                    st.metric("Caratteri", metriche['caratteri'])
                    st.metric("Indice Flesch", metriche['flesch'])
                
                with metric_col3:
                    st.metric("Difficoltà", metriche['difficolta'])
                    st.metric("Frasi", metriche['frasi'])
                
                # Visualizza feedback sulla leggibilità
                if metriche['flesch'] >= 60:
                    premium_notify("Eccellente fluidità: il contenuto è facilmente accessibile a tutti.", "success")
                elif metriche['flesch'] >= 40:
                    premium_notify("Leggibilità standard: il contenuto è bilanciato per un pubblico generico.", "info")
                else:
                    premium_notify("Complessità elevata: si consiglia una revisione per semplificare il linguaggio.", "warning")
            except Exception as e:
                premium_notify(f"Impossibile calcolare le metriche di lettura: {str(e)}", "error")
        
        # Opzioni di personalizzazione
        st.markdown("### <i class='fas fa-sliders'></i> Opzioni di generazione", unsafe_allow_html=True)
        col_opt1, col_opt2 = st.columns(2)
        with col_opt1:
            include_allegati = st.checkbox("Includi sezione allegati", value=True)
            include_requisiti = st.checkbox("Includi requisiti", value=True)
        with col_opt2:
            include_footer = st.checkbox("Includi footer", value=True)
            dark_mode = st.checkbox("Tema scuro", value=False)
        
        if st.button("Genera HTML", use_container_width=True):
            d = st.session_state["dati"]
            if not d:
                premium_notify("Dati mancanti: inserire e analizzare un testo prima di procedere.", "error")
                st.stop()
            
            # Colori basati su tema e branding
            if dark_mode:
                header_bg = st.session_state["branding_color"]
                header_color = "#ffffff"
                body_bg = "#2d2d2d"
                text_color = "#e0e0e0"
            else:
                header_bg = st.session_state["branding_color"]
                header_color = "#ffffff"
                body_bg = "#f5f5f5"
                text_color = "#333333"

            logo_html = ""
            if st.session_state["logo_url"] and st.session_state["logo_url"].strip():
                try:
                    logo_html = f'<img src="{st.session_state["logo_url"]}" style="max-width: 100px; margin-bottom: 20px;" alt="Logo Comune">'
                except:
                    logo_html = ""

            # Sanitizza il contenuto HTML
            titolo_safe = str(d.get('titolo', 'Titolo')).replace('<', '&lt;').replace('>', '&gt;')
            sottotitolo_safe = str(d.get('sottotitolo', '')).replace('<', '&lt;').replace('>', '&gt;')
            descrizione_safe = str(d.get('descrizione', '')).replace('<', '&lt;').replace('>', '&gt;')
            destinatari_safe = str(d.get('destinatari', '')).replace('<', '&lt;').replace('>', '&gt;')
            data_safe = str(d.get('data', '')).replace('<', '&lt;').replace('>', '&gt;')

            # Determina background da applicare al file HTML esportato
            bg_image_export = st.session_state.get("bg_image_data") or st.session_state.get("bg_image_url") or None
            if bg_image_export:
                bg_style = f"background-image: url('{bg_image_export}'); background-size: cover; background-position: center; background-attachment: fixed;"
                overlay_css = "background: rgba(255,255,255,0.72);"
            else:
                theme_export = st.session_state.get("bg_theme_choice", "Chiaro")
                if theme_export == "Chiaro":
                    start_export = st.session_state.get("bg_light_start", "#eef2f6")
                    end_export = st.session_state.get("bg_light_end", "#fbfdff")
                    overlay_css = "background: rgba(255,255,255,0.88);"
                else:
                    start_export = st.session_state.get("bg_dark_start", "#24303a")
                    end_export = st.session_state.get("bg_dark_end", "#0f1720")
                    overlay_css = "background: rgba(0,0,0,0.55);"
                bg_style = f"background: linear-gradient(180deg, {start_export} 0%, {end_export} 100%);"

            # Overlay div HTML da inserire subito dopo body per miglior leggibilità
            overlay_div = '<div class="page-overlay" aria-hidden="true"></div>'

            html = f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<meta name="description" content="{titolo_safe} - {sottotitolo_safe[:100]}">
<title>{titolo_safe}</title>
<style>
* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    {bg_style}
    color: {text_color};
    line-height: 1.6;
}}

.page-overlay {{
    position: fixed;
    inset: 0;
    pointer-events: none;
    {overlay_css}
}}


header {{
    background: linear-gradient(135deg, {header_bg} 0%, {header_bg}dd 100%);
    color: {header_color};
    padding: 40px 20px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}}

header h1 {{
    font-size: 32px;
    margin-bottom: 10px;
    font-weight: 700;
}}

header p {{
    font-size: 18px;
    opacity: 0.95;
}}

section {{
    margin: 30px auto;
    padding: 20px;
    max-width: 900px;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
}}

section h2 {{
    color: {header_bg};
    border-bottom: 3px solid {header_bg};
    padding-bottom: 10px;
    margin-bottom: 15px;
}}

footer {{
    text-align: center;
    margin-top: 50px;
    padding: 20px;
    border-top: 1px solid rgba(0,0,0,0.1);
    color: #666;
    font-size: 14px;
}}

.info {{
    background: rgba(0,51,102,0.05);
    padding: 15px;
    border-left: 4px solid {header_bg};
    margin: 15px 0;
    border-radius: 4px;
}}

.data {{
    text-align: right;
    font-style: italic;
    color: #999;
    margin-top: 20px;
}}

ul {{
    margin-left: 20px;
}}

li {{
    margin-bottom: 8px;
}}

a {{
    color: {header_bg};
    text-decoration: none;
}}

a:hover {{
    text-decoration: underline;
}}
</style>
</head>
<body>

<header>
{logo_html}
<h1>{titolo_safe}</h1>
<p>{sottotitolo_safe}</p>
</header>

<section>
<h2>Descrizione</h2>
<p>{descrizione_safe}</p>
<div class="data">Pubblicato: {data_safe}</div>
</section>

<section>
<h2>Destinatari</h2>
<div class="info">
<p><strong>{destinatari_safe}</strong></p>
</div>
</section>"""

            if include_requisiti and d.get('requisiti'):
                html += f"""
<section>
<h2>Requisiti</h2>
<div class="info">
<p>{str(d['requisiti']).replace('<', '&lt;').replace('>', '&gt;')}</p>
</div>
</section>"""

            if include_allegati and st.session_state.get("allegati_trovati"):
                html += f"""
<section>
<h2>Allegati</h2>
<ul>"""
                for allegato in st.session_state["allegati_trovati"][:5]:
                    try:
                        nome = allegato.split('/')[-1]
                        nome_safe = nome.replace('<', '&lt;').replace('>', '&gt;')
                        allegato_safe = allegato.replace('<', '&lt;').replace('>', '&gt;')
                        html += f'\n<li><a href="{allegato_safe}" target="_blank">{nome_safe}</a></li>'
                    except:
                        pass
                html += """
</ul>
</section>"""

            if include_footer:
                html += f"""
<footer>
<p>© {datetime.now().year} Comune - Generato automaticamente</p>
</footer>"""

            html += """
</body>
</html>"""

            premium_notify("Codice HTML generato con successo e pronto per l'esportazione.", "success")
            
            # Genera anche Markdown e TXT
            try:
                markdown_content = genera_markdown(d, st.session_state.get("allegati_trovati", []) if include_allegati else None)
                txt_content = genera_txt(d, st.session_state.get("allegati_trovati", []) if include_allegati else None)
            except Exception as e:
                premium_notify(f"Errore critico durante la generazione dei formati: {str(e)}", "error")
                markdown_content = ""
                txt_content = ""
            
            # Save to history
            history_entry = {
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "title": d.get('titolo', 'Senza titolo'),
                "html": html,
                "markdown": markdown_content,
                "txt": txt_content,
                "data": d,
                "allegati": st.session_state.get("allegati_trovati", []) if include_allegati else None
            }
            st.session_state["history"].append(history_entry)
            if len(st.session_state["history"]) > 10:  # Keep only last 10
                st.session_state["history"] = st.session_state["history"][-10:]
            
            # Tab per visualizzare codice e preview
            tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(["HTML Code", "Visual Preview", "Markdown", "Text File", "PDF", "All Downloads"])
            
            with tab1:
                st.code(html, language="html")
            
            with tab2:
                st.markdown("#### Anteprima della pagina:")
                try:
                    st.html(html)
                except Exception as e:
                    premium_notify("L'anteprima visiva non può essere generata in questo ambiente.", "warning")
            
            with tab3:
                if markdown_content:
                    st.code(markdown_content, language="markdown")
                    st.download_button(
                        label="Scarica Markdown",
                        data=markdown_content,
                        file_name=f"{d['titolo'][:20].replace(' ', '_')}.md",
                        mime="text/markdown",
                        use_container_width=True
                    )
                else:
                    premium_notify("Versione Markdown attualmente non disponibile.", "warning")
            
            with tab4:
                if txt_content:
                    st.text(txt_content)
                    st.download_button(
                        label="Scarica TXT",
                        data=txt_content,
                        file_name=f"{d['titolo'][:20].replace(' ', '_')}.txt",
                        mime="text/plain",
                        use_container_width=True
                    )
                else:
                    premium_notify("Versione testuale (TXT) attualmente non disponibile.", "warning")
            
            with tab5:
                try:
                    pdf_content = genera_pdf(d, allegati_list)
                    st.download_button(
                        label="Scarica PDF",
                        data=pdf_content,
                        file_name=f"{d['titolo'][:20].replace(' ', '_')}.pdf",
                        mime="application/pdf",
                        use_container_width=True
                    )
                    premium_notify("PDF generato con successo!", "success")
                except Exception as e:
                    premium_notify(f"Errore nella generazione del PDF: {str(e)}", "error")
            
            with tab6:
                col_down1, col_down2, col_down3, col_down4 = st.columns(4)
                
                with col_down1:
                    st.download_button(
                        label="HTML",
                        data=html,
                        file_name=f"pagina_{d['titolo'][:20].replace(' ', '_')}.html",
                        mime="text/html",
                        use_container_width=True
                    )
                
                with col_down2:
                    if markdown_content:
                        st.download_button(
                            label="Markdown",
                            data=markdown_content,
                            file_name=f"pagina_{d['titolo'][:20].replace(' ', '_')}.md",
                            mime="text/markdown",
                            use_container_width=True
                        )
                
                with col_down3:
                    if txt_content:
                        st.download_button(
                            label="TXT",
                            data=txt_content,
                            file_name=f"pagina_{d['titolo'][:20].replace(' ', '_')}.txt",
                            mime="text/plain",
                            use_container_width=True
                        )
                
                with col_down4:
                    try:
                        pdf_content = genera_pdf(d, allegati_list)
                        st.download_button(
                            label="PDF",
                            data=pdf_content,
                            file_name=f"pagina_{d['titolo'][:20].replace(' ', '_')}.pdf",
                            mime="application/pdf",
                            use_container_width=True
                        )
                    except Exception as e:
                        st.error(f"Errore PDF: {str(e)}")

        # Suggerimenti di miglioramento
        st.markdown("### <i class='fas fa-lightbulb'></i> Consigli per l'ottimizzazione", unsafe_allow_html=True)
        with st.expander("Visualizza suggerimenti di qualità", expanded=True):
            try:
                metriche = calcola_metriche(d['descrizione'])
                suggerimenti = []
                
                if metriche['parole'] < 50:
                    st.markdown("- <i class='fas fa-circle-plus'></i> Aggiungere più dettagli e informazioni", unsafe_allow_html=True)
                if metriche['flesch'] < 40:
                    st.markdown("- <i class='fas fa-file-pen'></i> Semplificare il linguaggio per migliorare la leggibilità", unsafe_allow_html=True)
                if not d.get('sottotitolo'):
                    st.markdown("- <i class='fas fa-heading'></i> Aggiungere un sottotitolo descrittivo", unsafe_allow_html=True)
                if not d.get('requisiti'):
                    st.markdown("- <i class='fas fa-list-check'></i> Aggiungere una sezione sui requisiti", unsafe_allow_html=True)
                if not st.session_state.get("logo_url"):
                    st.markdown("- <i class='fas fa-image'></i> Aggiungere il logo del Comune", unsafe_allow_html=True)
                
                if not suggerimenti:
                    premium_notify("Ottimo lavoro: il documento soddisfa tutti i criteri di qualità.", "success")
            except Exception as e:
                premium_notify(f"Analisi dei suggerimenti non riuscita: {str(e)}", "warning")
    
    # History section
    if st.session_state["history"]:
        st.markdown("### <i class='fas fa-history'></i> Cronologia Generazioni", unsafe_allow_html=True)
        with st.expander("Visualizza documenti precedenti", expanded=False):
            for i, entry in enumerate(reversed(st.session_state["history"])):
                st.markdown(f"**{i+1}. {entry['title']}** - {entry['timestamp']}")
                col_h1, col_h2, col_h3, col_h4 = st.columns(4)
                with col_h1:
                    st.download_button(
                        label="HTML",
                        data=entry["html"],
                        file_name=f"{entry['title'][:20].replace(' ', '_')}_{entry['timestamp'][:10]}.html",
                        mime="text/html",
                        key=f"hist_html_{i}"
                    )
                with col_h2:
                    if entry["markdown"]:
                        st.download_button(
                            label="Markdown",
                            data=entry["markdown"],
                            file_name=f"{entry['title'][:20].replace(' ', '_')}_{entry['timestamp'][:10]}.md",
                            mime="text/markdown",
                            key=f"hist_md_{i}"
                        )
                with col_h3:
                    if entry["txt"]:
                        st.download_button(
                            label="TXT",
                            data=entry["txt"],
                            file_name=f"{entry['title'][:20].replace(' ', '_')}_{entry['timestamp'][:10]}.txt",
                            mime="text/plain",
                            key=f"hist_txt_{i}"
                        )
                with col_h4:
                    try:
                        pdf_content = genera_pdf(entry["data"], entry.get("allegati"))
                        st.download_button(
                            label="PDF",
                            data=pdf_content,
                            file_name=f"{entry['title'][:20].replace(' ', '_')}_{entry['timestamp'][:10]}.pdf",
                            mime="application/pdf",
                            key=f"hist_pdf_{i}"
                        )
                    except Exception as e:
                        st.error(f"Errore PDF: {str(e)}")
                st.divider()
    
    else:
        st.markdown("<i class='fas fa-arrow-left'></i> Analizza un testo nella sezione sinistra per iniziare", unsafe_allow_html=True)

# Footer
st.markdown(
    """
    <hr style="margin-top: 50px;">
    <div style="text-align: center; color: #666; font-size: 14px; padding: 20px;">
        <i class="fas fa-copyright"></i> 2026 Generatore Comunale - Creato con <i class="fas fa-heart" style="color: #e74c3c;"></i> per i Comuni Italiani
    </div>
    """,
    unsafe_allow_html=True
)
