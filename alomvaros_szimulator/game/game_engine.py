"""
Játék motor modul a városfejlesztési szimulátorhoz
"""
import os
import json
from datetime import datetime
from dateutil.relativedelta import relativedelta

from alomvaros_szimulator.models.varos import Varos
from alomvaros_szimulator.models.epulet import Epulet
from alomvaros_szimulator.models.szolgaltatas import Szolgaltatas
from alomvaros_szimulator.models.projekt import Projekt
from alomvaros_szimulator.utils import date_utils


class GameEngine:
    """
    Játék motor osztály, amely a játék központi működését kezeli.
    """
    
    def __init__(self):
        """
        Játék motor inicializálása
        """
        self.varos = None
        self.jatekos = None
        self.fordulo_manager = None
        self.event_manager = None
        self.jatek_aktiv = False
        self.fordulo_szamlalo = 0
        self.jatekos_nev = "Játékos"  # Alapértelmezett játékosnév
        
        # Külső fájlkezelő segítségével inicializáljuk az adatbázisokat
        try:
            from alomvaros_szimulator.utils.file_manager import FileManager
            self.file_manager = FileManager()
        except ImportError:
            print("Figyelem: A FileManager nem importálható. Korlátozott funkcionalitás érhető el.")
            self.file_manager = None
    
    def uj_jatek(self, varos_nev="Álomváros", kezdeti_penz=100000000, kezdeti_lakossag=500):
        """
        Új játék létrehozása
        
        :param varos_nev: A város neve
        :param kezdeti_penz: Kezdeti pénzügyi keret
        :param kezdeti_lakossag: Kezdeti lakosságszám
        :return: Az újonnan létrehozott Varos objektum
        """
        from alomvaros_szimulator.models.varos import Varos
        from alomvaros_szimulator.game.event_manager import EventManager
        from alomvaros_szimulator.game.fordulo_manager import ForduloManager
        
        # Új város létrehozása
        self.varos = Varos(
            nev=varos_nev,
            kezdeti_penz=kezdeti_penz,
            kezdeti_lakosok=kezdeti_lakossag
        )
        
        # Eseménykezelő létrehozása
        self.event_manager = EventManager(self)
        
        # Fordulókezelő létrehozása
        self.fordulo_manager = ForduloManager(self)
        
        # Játék aktívvá tétele
        self.jatek_aktiv = True
        self.fordulo_szamlalo = 0
        
        # Ellenőrizzük és biztosítsuk a kezdeti lakosság meglétét
        if not hasattr(self.varos, 'lakosok_szama') or self.varos.lakosok_szama <= 0:
            print("Kezdeti lakosság nincs megfelelően inicializálva.")
            if hasattr(self.varos, '_lakosok_generalasa'):
                print(f"Generálunk {kezdeti_lakossag} lakost...")
                self.varos._lakosok_generalasa(kezdeti_lakossag)
            else:
                print("Lakosságszám direkt beállítása")
                self.varos.lakossag_modositasa(kezdeti_lakossag)
        
        # Biztosítsuk, hogy vannak alapépületek (pl. lakóház)
        if (not hasattr(self.varos, 'epuletek') or not self.varos.epuletek or 
                not any(hasattr(e, 'tipus') and e.tipus and e.tipus.lower() == "lakóház" for e in self.varos.epuletek.values())):
            print("Alap épületek hiányoznak, létrehozás...")
            if hasattr(self.varos, '_alap_epuletek_letrehozasa'):
                self.varos._alap_epuletek_letrehozasa()
        
        # Biztosítsuk, hogy a játék ne fejeződhessen be azonnal
        self.varos.jatek_vege = False
        self.varos.jatek_vege_ok = None
        
        print(f"Új játék létrehozva: {varos_nev}")
        print(f"Kezdeti lakosság: {self.varos.lakosok_szama} fő")
        print(f"Kezdeti pénzügyi keret: {self.varos.penzugyi_keret:,} Ft")
        
        return self.varos
    
    def jatek_betoltese(self, mentes_fajl):
        """
        Játék betöltése mentett fájlból
        
        :param mentes_fajl: A mentés fájl elérési útja
        :return: A betöltött Varos objektum
        """
        from alomvaros_szimulator.models.varos import Varos
        from alomvaros_szimulator.game.event_manager import EventManager
        from alomvaros_szimulator.game.fordulo_manager import ForduloManager
        import json
        
        try:
            with open(mentes_fajl, 'r', encoding='utf-8') as file:
                mentes_adat = json.load(file)
            
            # Város betöltése
            if isinstance(mentes_adat.get('varos'), dict):
                self.varos = Varos.from_dict(mentes_adat.get('varos', {}))
            else:
                print(f"Hiba: a betöltött adatokban a 'varos' nem szótár: {type(mentes_adat.get('varos'))}")
                return None
            
            # Fordulószám betöltése
            self.fordulo_szamlalo = self.varos.fordulok_szama
            
            # Eseménykezelő létrehozása
            self.event_manager = EventManager(self)
            
            # Fordulókezelő létrehozása
            self.fordulo_manager = ForduloManager(self)
            
            # Játék aktívvá tétele
            self.jatek_aktiv = True
            
            print(f"Játék sikeresen betöltve: {mentes_fajl}")
            return self.varos
            
        except Exception as e:
            print(f"Hiba a játék betöltéskor: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def jatek_mentese(self, mentes_fajl):
        """
        Aktuális játék mentése fájlba
        
        :param mentes_fajl: A mentés fájl elérési útja
        :return: True ha sikeres volt a mentés, False egyébként
        """
        if not self.varos:
            print("Nincs aktív játék, amit menteni lehetne.")
            return False
        
        import json
        import os
        
        try:
            # Elérési út létrehozása, ha nem létezik
            os.makedirs(os.path.dirname(mentes_fajl), exist_ok=True)
            
            # Mentés adatok összeállítása
            mentes_adat = {
                'varos': self.varos.to_dict(),
                'verzio': '2.0.0',
                'mentes_datum': self._get_current_datetime()
            }
            
            # JSON fájl kiírása
            with open(mentes_fajl, 'w', encoding='utf-8') as file:
                json.dump(mentes_adat, file, ensure_ascii=False, indent=4)
            
            print(f"Játék sikeresen mentve: {mentes_fajl}")
            return True
            
        except Exception as e:
            print(f"Hiba a játék mentésekor: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _get_current_datetime(self):
        """
        Aktuális dátum és idő lekérése ISO formátumban
        
        :return: Dátum és idő string (ISO formátum)
        """
        from datetime import datetime
        return datetime.now().isoformat()
    
    def kovetkezo_fordulo(self):
        """
        Következő forduló végrehajtása
        
        :return: A fordulóban történt események listája
        """
        if not self.varos:
            print("Nincs aktív játék, nem lehet fordulót végrehajtani.")
            return []
        
        # Fordulószám növelése
        self.fordulo_szamlalo += 1
        
        # Események generálása
        esemenyek = []
        if self.event_manager:
            esemenyek = self.event_manager.esemenyek_generalasa(self.fordulo_szamlalo)
            self.event_manager.esemenyek_alkalmazasa(esemenyek)
        
        # Forduló végrehajtása - biztosítjuk, hogy a dátum léptetése megtörténjen!
        from datetime import timedelta
        self.varos.aktualis_datum += timedelta(days=30)
        self.varos.fordulok_szama = self.fordulo_szamlalo  # Szinkronizáljuk a fordulószámot
        
        # Használjuk a ForduloManager-t a projektek előrehaladásának kezeléséhez,
        # ha még nincs inicializálva, létrehozzuk
        if not hasattr(self, 'fordulo_manager') or self.fordulo_manager is None:
            from alomvaros_szimulator.game.fordulo_manager import ForduloManager
            self.fordulo_manager = ForduloManager(self)
            
        # Projektek előrehaladásának kezelése
        self.fordulo_manager._projektek_kezelese()
        
        # Forduló logika végrehajtása
        fordulo_esemenyek = self.varos.fordulo(esemenyek)
        
        # A város fordulo_szama és a saját fordulo_szamlalo szinkronizálása
        self.fordulo_szamlalo = self.varos.fordulok_szama
        
        return fordulo_esemenyek
    
    def adatok_betoltese(self, epuletek_csv=None, szolgaltatasok_csv=None, projektek_csv=None, lakosok_csv=None):
        """
        Adatok betöltése CSV fájlokból
        
        :param epuletek_csv: Épületek CSV fájl útvonala
        :param szolgaltatasok_csv: Szolgáltatások CSV fájl útvonala
        :param projektek_csv: Projektek CSV fájl útvonala
        :param lakosok_csv: Lakosok CSV fájl útvonala
        :return: Betöltött objektumok száma
        """
        if self.varos is None:
            print("Hiba: Nincs inicializálva a város! Először indíts egy új játékot.")
            return 0
        
        betoltott_elemek = self.varos.adatok_betoltese(epuletek_csv, szolgaltatasok_csv, projektek_csv, lakosok_csv)
        
        # Ha sikerült adatokat betölteni, aktiváljuk a játékot
        if betoltott_elemek > 0:
            self.jatek_aktiv = True
            print(f"Adatok betöltve ({betoltott_elemek} elem), játék aktiválva.")
            
            # Esemény- és fordulókezelő inicializálása, ha még nem léteznek
            if not hasattr(self, 'event_manager') or self.event_manager is None:
                from alomvaros_szimulator.game.event_manager import EventManager
                self.event_manager = EventManager(self)
                
            if not hasattr(self, 'fordulo_manager') or self.fordulo_manager is None:
                from alomvaros_szimulator.game.fordulo_manager import ForduloManager
                self.fordulo_manager = ForduloManager(self)
            
            # Biztosítsuk, hogy a varos objektum játék vége állapota is megfelelően van beállítva
            self.varos.jatek_vege = False
            self.varos.jatek_vege_ok = None
        
        return betoltott_elemek
    
    def projektek_exportalasa(self, output_path):
        """
        Projektek exportálása CSV fájlba
        
        :param output_path: Kimeneti fájl útvonala
        :return: Igaz, ha sikeres volt az exportálás
        """
        if self.varos is None:
            print("Hiba: Nincs inicializálva a város! Először indíts egy új játékot.")
            return False
        
        return self.varos.projekt_export_csv(output_path)
    
    def uj_epulet_epitese(self, nev, tipus, alapterulet, koltseg, idotartam_honapokban):
        """
        Új épület építésének indítása
        
        :param nev: Épület neve
        :param tipus: Épület típusa
        :param alapterulet: Épület alapterülete
        :param koltseg: Építés költsége
        :param idotartam_honapokban: Építés időtartama hónapokban
        :return: (projekt_id, hiba_uzenet) tuple
        """
        if self.varos is None or not self.jatek_aktiv:
            return None, "Nincs inicializálva a város vagy a játék már véget ért!"
        
        return self.varos.uj_epulet_epitese(nev, tipus, alapterulet, koltseg, idotartam_honapokban)
    
    def epulet_karbantartas(self, epulet_id, koltseg, idotartam_honapokban):
        """
        Épület karbantartás projekt indítása
        
        :param epulet_id: Karbantartandó épület azonosítója
        :param koltseg: Karbantartás költsége
        :param idotartam_honapokban: Karbantartás időtartama hónapokban
        :return: (projekt_id, hiba_uzenet) tuple
        """
        if self.varos is None or not self.jatek_aktiv:
            return None, "Nincs inicializálva a város vagy a játék már véget ért!"
        
        return self.varos.epulet_karbantartas_inditasa(epulet_id, koltseg, idotartam_honapokban)
    
    def uj_szolgaltatas_inditasa(self, nev, tipus, havi_koltseg, elegedettseg_hatas=0, lakossag_hatas=0):
        """
        Új szolgáltatás indítása a városban.
        
        :param nev: Szolgáltatás neve
        :param tipus: Szolgáltatás típusa
        :param havi_koltseg: Havi fenntartási költség
        :param elegedettseg_hatas: A szolgáltatás hatása a lakosság elégedettségére (százalékpontban)
        :param lakossag_hatas: A szolgáltatás hatása a lakosság számára
        :return: (szolgaltatas_id, hiba_uzenet) tuple
        """
        if not self.varos:
            return None, "Nincs inicializálva a város!"
            
        # Havi költség ellenőrzése a pénzügyi keret függvényében
        if havi_koltseg > self.varos.penzugyi_keret * 0.1:  # Max. a pénzügyi keret 10%-a lehet
            return None, f"Túl magas a havi költség! Maximum: {self.varos.penzugyi_keret * 0.1:,.0f} Ft"
            
        try:
            # Szolgáltatás elégedettség hatása típustól függően
            if elegedettseg_hatas == 0:
                from alomvaros_szimulator.config import BEALLITASOK
                alap_hatasok = BEALLITASOK.get("szolgaltatas_hatasok", {})
                elegedettseg_hatas = alap_hatasok.get(tipus, {}).get("elegedettseg", 5)  # Alapértelmezett: 5%
                lakossag_hatas = alap_hatasok.get(tipus, {}).get("lakossag", 0)  # Alapértelmezett: 0
            
            # Új egyedi azonosító generálása
            szolgaltatas_id = max([0] + list(self.varos.szolgaltatasok.keys())) + 1
            
            # Új szolgáltatás létrehozása
            uj_szolgaltatas = Szolgaltatas(
                azonosito=szolgaltatas_id,
                nev=nev,
                tipus=tipus,
                havi_koltseg=havi_koltseg,
                elegedettseg_hatas=elegedettseg_hatas,
                lakossag_hatas=lakossag_hatas,
                indulas_datum=self.varos.aktualis_datum,
                ertek=5  # Alapértelmezett érték: 5 (1-10 skálán)
            )
            
            # Szolgáltatás hozzáadása a városhoz
            self.varos.szolgaltatas_hozzaadas(uj_szolgaltatas)
            
            return szolgaltatas_id, ""
            
        except Exception as e:
            return None, f"Hiba történt a szolgáltatás létrehozásakor: {str(e)}"
    
    def szolgaltatas_megszuntetese(self, szolgaltatas_id):
        """
        Szolgáltatás megszüntetése
        
        :param szolgaltatas_id: Megszüntetendő szolgáltatás azonosítója
        :return: (sikeres, hiba_uzenet) tuple
        """
        if not self.varos:
            return False, "Nincs inicializálva a város!"
            
        try:
            if szolgaltatas_id not in self.varos.szolgaltatasok:
                return False, "A megadott azonosítójú szolgáltatás nem létezik!"
                
            # Szolgáltatás megszüntetése
            sikeres = self.varos.szolgaltatas_megszuntetese(szolgaltatas_id)
            
            if sikeres:
                return True, ""
            else:
                return False, "A szolgáltatás már korábban meg lett szüntetve!"
                
        except Exception as e:
            return False, f"Hiba történt a szolgáltatás megszüntetésekor: {str(e)}"
    
    def jatek_allapot(self):
        """
        Játék aktuális állapotának lekérdezése
        
        :return: Szótár a játék állapotával
        """
        if self.varos is None:
            return {"hiba": "Nincs inicializálva a város!"}
        
        return {
            "varos_nev": self.varos.nev,
            "penzugyi_keret": self.varos.penzugyi_keret,
            "lakossag_elegedettseg": self.varos.lakossag_elegedettseg,
            "lakosok_szama": self.varos.lakosok_szama,
            "aktualis_datum": self.varos.aktualis_datum,
            "fordulo": self.fordulo_szamlalo,
            "epuletek_szama": len(self.varos.epuletek),
            "szolgaltatasok_szama": len([s for s in self.varos.szolgaltatasok.values() if s.aktiv]),
            "projektek_szama": len(self.varos.projektek),
            "jatek_vege": self.varos.jatek_vege,
            "jatek_vege_ok": self.varos.jatek_vege_ok if self.varos.jatek_vege else ""
        }
    
    def mentes(self):
        """
        Játék adatainak mentése
        
        :return: Játék adatait tartalmazó szótár
        """
        if self.varos is None:
            raise ValueError("Nincs inicializálva a város! Először indíts egy új játékot.")
        
        # A város adatainak kinyerése
        varos_adatok = self.varos.to_dict()
        
        # Játék állapot adatok
        jatek_adatok = {
            "jatekos_nev": getattr(self, "jatekos_nev", "Játékos"),  # Használjuk a getattr-t a biztonságért
            "fordulo_szamlalo": self.fordulo_szamlalo,
            "jatek_fut": self.jatek_aktiv,
            "mentes_idopontja": datetime.now().isoformat(),
            "varos": varos_adatok
        }
        
        return jatek_adatok
    
    def betoltes(self, jatek_adatok):
        """
        Játék betöltése mentési adatokból
        
        :param jatek_adatok: Játék adatait tartalmazó szótár
        :return: Betöltött játék város objektuma
        """
        if not jatek_adatok:
            raise ValueError("Érvénytelen játékadatok!")
        
        # Játék általános adatainak betöltése
        self.jatekos_nev = jatek_adatok.get("jatekos_nev", "Játékos")
        self.fordulo_szamlalo = jatek_adatok.get("fordulo_szamlalo", 0)
        self.jatek_aktiv = jatek_adatok.get("jatek_fut", True)
        
        # Város adatainak betöltése és város létrehozása
        varos_adatok = jatek_adatok.get("varos", {})
        if not varos_adatok:
            raise ValueError("Hiányzó város adatok!")
        
        # Város létrehozása az adatokból
        self.varos = Varos.from_dict(varos_adatok)
        
        return self.varos
    
    def jatek_mentes(self, mentes_nev=None):
        """
        Játék állapotának mentése (egyszerűsített verzió)
        Egy valódi játékban ez sokkal komplexebb lenne, itt csak a naplót mentjük
        
        :param mentes_nev: Mentés neve (alapértelmezett: aktuális dátum)
        :return: Sikeres volt-e a mentés
        """
        if self.varos is None:
            print("Hiba: Nincs inicializálva a város!")
            return False
        
        if mentes_nev is None:
            most = datetime.now().strftime('%Y%m%d_%H%M%S')
            mentes_nev = f"mentes_{most}"
        
        try:
            # Import the config safely
            try:
                # Először próbáljuk közvetlenül importálni a konstansokat
                try:
                    from alomvaros_szimulator.config import KIMENET_MAPPA, MENTES_MAPPA
                except ImportError as ie:
                    print(f"Hiba a konfigurációs konstansok importálásakor: {ie}")
                    # Ha ez nem sikerül, próbáljuk a get_config segédfüggvényt
                    try:
                        from alomvaros_szimulator.config import get_config
                        MENTES_MAPPA = get_config("fajl_utak.mentes_mappa")
                        KIMENET_MAPPA = get_config("fajl_utak.kimenet_mappa")
                    except ImportError:
                        # Ha minden importálás sikertelen, használjunk alapértelmezett útvonalakat
                        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                        KIMENET_MAPPA = os.path.join(base_dir, "output")
                        MENTES_MAPPA = os.path.join(base_dir, "mentesek")
                        print(f"Alapértelmezett útvonalak használata mentéshez: {MENTES_MAPPA}")
                
                # Ensure output directories exist
                import os
                os.makedirs(KIMENET_MAPPA, exist_ok=True)
                os.makedirs(MENTES_MAPPA, exist_ok=True)
                
                # Try to use the mentes mappa first, fall back to kimenet if that fails
                try:
                    output_file = os.path.join(MENTES_MAPPA, f"{mentes_nev}.txt")
                    result = self.varos.naplo_mentes(self.varos.elozo_fordulo_esemenyei, output_file)
                    if result:
                        print(f"Játék sikeresen mentve: {output_file}")
                        return True
                except Exception as e:
                    print(f"Hiba a mentés során ({MENTES_MAPPA}): {str(e)}")
                    print("Próbálkozás alternatív helyre mentéssel...")
                
                # If we get here, try the KIMENET_MAPPA instead
                output_file = os.path.join(KIMENET_MAPPA, f"{mentes_nev}.txt")
                
            except Exception as e:
                print(f"Nem várt hiba a konfigurációs fájl betöltésekor: {str(e)}")
                print("Alapértelmezett mentési hely használata: 'output/'")
                
                # Use a default path if config import fails
                import os
                output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "output")
                os.makedirs(output_dir, exist_ok=True)
                output_file = os.path.join(output_dir, f"{mentes_nev}.txt")
            
            # Try to save the game state
            result = self.varos.naplo_mentes(self.varos.elozo_fordulo_esemenyei, output_file)
            if result:
                print(f"Játék sikeresen mentve: {output_file}")
            return result
            
        except Exception as e:
            print(f"Nem várt hiba a játék mentésekor: {str(e)}")
            return False 