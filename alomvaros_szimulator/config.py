"""
Konfiguráció a városfejlesztési szimulátorhoz
"""
import os
from datetime import datetime

# Alapértelmezett könyvtárak létrehozása
def create_default_directories():
    """Létrehozza az alapértelmezett könyvtárakat, ha még nem léteznek"""
    directories = [
        # Alap könyvtárak
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "adatok"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "output"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "mentesek"),
        
        # Alkönyvtárak
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "adatok", "epuletek"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "adatok", "szolgaltatasok"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "adatok", "projektek"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "adatok", "lakosok"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "adatok", "esemenyek"),
    ]
    
    for directory in directories:
        try:
            if not os.path.exists(directory):
                os.makedirs(directory)
                print(f"Könyvtár létrehozva: {directory}")
        except Exception as e:
            print(f"Hiba a könyvtár létrehozásakor: {directory}, hiba: {str(e)}")

# Alap könyvtárstruktúra létrehozása
create_default_directories()

# Alapértelmezett útvonalak
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ADATOK_MAPPA = os.path.join(BASE_DIR, "adatok/")
EPULETEK_MAPPA = os.path.join(ADATOK_MAPPA, "epuletek/")
SZOLGALTATASOK_MAPPA = os.path.join(ADATOK_MAPPA, "szolgaltatasok/")
PROJEKTEK_MAPPA = os.path.join(ADATOK_MAPPA, "projektek/")
LAKOSOK_MAPPA = os.path.join(ADATOK_MAPPA, "lakosok/")
ESEMENYEK_MAPPA = os.path.join(ADATOK_MAPPA, "esemenyek/")
KIMENET_MAPPA = os.path.join(BASE_DIR, "output/")
MENTES_MAPPA = os.path.join(BASE_DIR, "mentesek/")

# Alapértelmezett CSV fájlok elérési útvonalai
EPULETEK_CSV = os.path.join(EPULETEK_MAPPA, "epuletek.csv")
SZOLGALTATASOK_CSV = os.path.join(SZOLGALTATASOK_MAPPA, "szolgaltatasok.csv")
PROJEKTEK_CSV = os.path.join(PROJEKTEK_MAPPA, "projektek.csv")
LAKOSOK_CSV = os.path.join(LAKOSOK_MAPPA, "lakosok.csv")
ESEMENYEK_CSV = os.path.join(ESEMENYEK_MAPPA, "esemenyek.csv")

# Épülettípusok
EPULET_TIPUSOK = [
    "lakóház",
    "kereskedelmi",
    "ipari",
    "oktatási",
    "egészségügyi",
    "kulturális",
    "középület"
]

# Szolgáltatás típusok
SZOLGALTATAS_TIPUSOK = [
    "közlekedés",
    "oktatás",
    "egészségügy",
    "közbiztonság",
    "kultúra",
    "kommunális",
    "közigazgatás",
    "sport",
    "szabadidő"
]

# Épület állapot értékek
EPULET_ALLAPOT = {
    "új": 5,
    "kiváló": 5,
    "jó": 4,
    "megfelelő": 3,
    "elfogadható": 3,
    "felújítandó": 2,
    "rossz": 1
}

# Konstansok
ALAPERTELMEZETT_PENZUGYI_KERET = 100_000_000  # 100 millió forint induló keret
ALAPERTELMEZETT_LAKOSSAG_ELEGEDETTSEG = 80     # 80% kezdeti elégedettség
MIN_LAKOSSAG_ELEGEDETTSEG = 20                 # 20% alatt vége a játéknak
MINIMUM_PENZUGYI_KERET = -50_000_000           # -50 millió forint alatt vége a játéknak
LAKOS_PER_NEGYZETMETER = 25                    # 25 m² per lakos (lakóházaknál)
ALLAMI_TAMOGATAS_SZAZALEK = 30                 # 30% állami támogatás a szolgáltatásoknál

# Hatások és költségek
UJ_EPULET_ELEGEDETTSEG_NOVELES = 2.0           # Új épület építése +2% elégedettséget hoz
KARBANTARTAS_ELEGEDETTSEG_NOVELES = 1.0        # Épület karbantartása +1% elégedettséget hoz
HAVI_ADO_PER_LAKOS = 2000                      # 2000 Ft adó havonta lakosonként
UJ_SZOLGALTATAS_ELEGEDETTSEG_NOVELES = 2.0     # Új szolgáltatás indítása +2% elégedettséget hoz
SZOLGALTATAS_MEGSZUNTETES_ELEGEDETTSEG_CSOKKENES = 3.0  # Szolgáltatás megszüntetése -3% elégedettséget hoz

# Teljes játék beállítások
BEALLITASOK = {
    "jatekmenet": {
        "fordulo_hossz_napokban": 30,          # Egy forduló 30 nap (1 hónap)
        "alapertelmezett_datum": datetime(2025, 1, 1).date(),  # Játék kezdeti dátuma
        "maximum_fordulok_szama": 48,          # Maximum 48 forduló (4 év)
        "auto_mentes_gyakorisag": 6            # 6 fordulónként automatikus mentés
    },
    "gazdasag": {
        "alap_penzugyi_keret": ALAPERTELMEZETT_PENZUGYI_KERET,
        "minimum_penzugyi_keret": MINIMUM_PENZUGYI_KERET,
        "allami_tamogatas_szazalek": ALLAMI_TAMOGATAS_SZAZALEK
    },
    "lakossag": {
        "kezdo_elegedettseg": ALAPERTELMEZETT_LAKOSSAG_ELEGEDETTSEG,
        "minimum_elegedettseg": MIN_LAKOSSAG_ELEGEDETTSEG,
        "lakos_per_negyzetmeter": LAKOS_PER_NEGYZETMETER
    },
    "hatasok": {
        "uj_epulet_elegedettseg": UJ_EPULET_ELEGEDETTSEG_NOVELES,
        "karbantartas_elegedettseg": KARBANTARTAS_ELEGEDETTSEG_NOVELES,
        "havi_ado_per_lakos": HAVI_ADO_PER_LAKOS
    },
    "fajl_utak": {
        "adatok_mappa": ADATOK_MAPPA,
        "epuletek_mappa": EPULETEK_MAPPA,
        "szolgaltatasok_mappa": SZOLGALTATASOK_MAPPA,
        "projektek_mappa": PROJEKTEK_MAPPA,
        "lakosok_mappa": LAKOSOK_MAPPA,
        "esemenyek_mappa": ESEMENYEK_MAPPA,
        "kimenet_mappa": KIMENET_MAPPA,
        "mentes_mappa": MENTES_MAPPA,
        "epuletek_csv": EPULETEK_CSV,
        "szolgaltatasok_csv": SZOLGALTATASOK_CSV,
        "projektek_csv": PROJEKTEK_CSV,
        "lakosok_csv": LAKOSOK_CSV,
        "esemenyek_csv": ESEMENYEK_CSV
    }
}

# Segédfüggvények
def get_config(config_path, default_value=None):
    """
    Konfigurációs érték biztonságos kinyerése
    
    :param config_path: Útvonal a konfigurációs értékhez (pl. "gazdasag.alap_penzugyi_keret")
    :param default_value: Alapértelmezett érték, ha a konfigurációs érték nem található
    :return: A konfigurációs érték vagy az alapértelmezett érték
    """
    keys = config_path.split(".")
    value = BEALLITASOK
    
    try:
        for key in keys:
            value = value[key]
        return value
    except (KeyError, TypeError):
        return default_value 