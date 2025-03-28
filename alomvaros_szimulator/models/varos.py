"""
Város modell osztály a városfejlesztési szimulátorhoz
"""
from datetime import datetime, timedelta
import os
import pandas as pd
import random
import uuid
import csv

from .epulet import Epulet
from .szolgaltatas import Szolgaltatas
from .projekt import Projekt
from .esemeny import Esemeny, EsemenyGenerator
from .lakos import Lakos
from .penzugyek import Penzugyek
from alomvaros_szimulator.config import (
    UJ_SZOLGALTATAS_ELEGEDETTSEG_NOVELES,
    SZOLGALTATAS_MEGSZUNTETES_ELEGEDETTSEG_CSOKKENES,
    KIMENET_MAPPA,
    ALLAMI_TAMOGATAS_SZAZALEK
)


class Varos:
    """
    Város osztály - a játék fő modellje.
    Tartalmazza a város összes adatát és a hozzá tartozó épületeket, szolgáltatásokat stb.
    """
    
    def __init__(self, nev="Álomváros", kezdeti_penz=100000000, kezdeti_lakosok=500):
        """
        Város inicializálása
        
        :param nev: A város neve
        :param kezdeti_penz: Kezdeti pénzügyi keret
        :param kezdeti_lakosok: Kezdeti lakosok száma
        """
        # Alapértékek beállítása
        self.nev = nev
        self.penzugyek = Penzugyek(kezdeti_penz=kezdeti_penz)
        self.penzugyi_keret = kezdeti_penz  # Visszafelé kompatibilitás miatt
        
        # Üres kollekciók inicializálása
        self.epuletek = {}
        self.szolgaltatasok = {}
        self.projektek = {}
        self.lakosok = {}  # Lakosok szótára (azonosító -> Lakos objektum)
        self.statisztika = {}  # Fordulók statisztikáinak tárolására
        
        # Dátum inicializálása
        from datetime import datetime
        self.aktualis_datum = datetime.now().date()
        self.alapitas_datum = self.aktualis_datum
        
        # Statisztikák és állapotok alapértékei
        self.lakossag_szama = int(kezdeti_lakosok) if kezdeti_lakosok and kezdeti_lakosok > 0 else 500
        self.lakossag_elegedettseg = 75  # Kezdetben közepesen elégedettek (0-100 skála)
        self.min_elegedettseg = 20  # Minimális elfogadható elégedettség
        self.kornyezeti_allapot = 85  # Kezdetben jó környezeti állapot (0-100 skála)
        self.turisztikai_vonzero = 50  # Kezdeti turisztikai vonzerő (0-100 skála)
        self.adosav = 20  # Kezdeti adókulcs (százalék)
        self.gazdasagi_novekedes = 1.0  # Kezdeti gazdasági növekedés (1.0 = stagnálás)
        
        # Kockázati tényezők
        self.kockazati_tenyezok = {
            "gazdasági": 10,
            "környezeti": 10,
            "társadalmi": 10
        }
        
        # Infrastruktúra állapota
        self.infrastruktura_allapot = {
            "közlekedés": 70,
            "közművek": 80,
            "kommunikáció": 65,
            "energia": 75
        }
        
        # Játék és körök kezelése
        self.fordulokovetes = True  # Követjük-e a fordulókat
        self.fordulok_szama = 0
        self.esemeny_naplo = []
        self.elozo_fordulo_esemenyei = []
        
        # Város biztonsági tartaléka
        self.biztonsagi_tartalek = kezdeti_penz * 0.25  # A kezdeti pénzügyi keret 25%-a
        
        # Válságmodell bekapcsolása
        self.valsag_mod = False
        
        # Játék vége jelzés
        self.jatek_vege = False
        self.jatek_vege_ok = None
        
        # Kezdeti lakosok generálása
        self._lakosok_generalasa(self.lakossag_szama)
        
        # Biztosítsuk, hogy van legalább egy lakóház
        if not any(hasattr(e, 'tipus') and e.tipus.lower() == "lakóház" for e in self.epuletek.values()):
            self._alap_epuletek_letrehozasa()
            
        print(f"Város sikeresen létrehozva: {nev}")
        print(f"Kezdeti lakosságszám: {self.lakosok_szama} fő")
        print(f"Kezdeti pénzügyi keret: {kezdeti_penz:,} Ft")
    
    # Tulajdonság a pénzügyi keret kompatibilis lekérdezéséhez és beállításához
    @property
    def penzugyi_keret(self):
        return self.penzugyek.egyenleg if hasattr(self, 'penzugyek') else 0
    
    @penzugyi_keret.setter
    def penzugyi_keret(self, ertek):
        if hasattr(self, 'penzugyek'):
            self.penzugyek.egyenleg = ertek
        else:
            # Ha még nincs penzugyek objektum, ideiglenes attribútumként tároljuk az értéket
            self._penzugyi_keret = ertek
            
    def _lakosok_generalasa(self, lakosok_szama):
        """
        Generál egy adott számú véletlenszerű lakost
        
        :param lakosok_szama: Létrehozandó lakosok száma
        """
        try:
            from .lakos import Lakos
            import random
            import string
            from datetime import datetime, timedelta
            
            # Új lakosok gyűjtemény létrehozása (meglévőket megtartjuk, ha vannak)
            if not hasattr(self, 'lakosok') or self.lakosok is None:
                self.lakosok = {}
            
            # Új lakosok számának kiszámítása
            jelenlegi_lakosok_szama = len(self.lakosok)
            letrehozando_lakosok_szama = max(0, lakosok_szama - jelenlegi_lakosok_szama)
            
            print(f"Lakosok generálása: {letrehozando_lakosok_szama} új lakos létrehozása")
            
            # Ha nincs mit létrehozni, visszatérünk
            if letrehozando_lakosok_szama <= 0:
                self.lakossag_elegedettseg = 50  # Biztosítjuk, hogy legyen alapértelmezett elégedettség
                return
            
            # Maximális azonosító meghatározása
            max_id = 0
            if self.lakosok:
                max_id = max(self.lakosok.keys(), default=0)
            
            # Új lakosok generálása
            for i in range(letrehozando_lakosok_szama):
                # Azonosító
                id = max_id + i + 1
                
                # Véletlen név generálása
                vezeteknev = random.choice([
                    "Nagy", "Kis", "Kovács", "Szabó", "Horváth", "Varga", "Tóth", "Molnár",
                    "Balogh", "Papp", "Lakatos", "Takács", "Juhász", "Szilágyi", "Németh"
                ])
                keresztnev = random.choice([
                    "Anna", "Béla", "Csaba", "Dóra", "Elemér", "Ferenc", "Gábor", "Hanna",
                    "István", "János", "Katalin", "László", "Mária", "Nóra", "Ottó", "Péter"
                ])
                nev = f"{vezeteknev} {keresztnev}"
                
                # Kor
                eletkor = random.randint(18, 80)
                
                # Elégedettség - kezdetben közepes-jó
                elegedettseg = random.randint(50, 75)
                
                # Épület hozzárendelés
                epulet_id = None
                lakohazak = [e.azonosito for e in self.epuletek.values() 
                             if hasattr(e, 'tipus') and e.tipus and e.tipus.lower() == "lakóház"]
                
                if lakohazak:
                    epulet_id = random.choice(lakohazak)
                
                # Lakos létrehozása és hozzáadása
                uj_lakos = Lakos(
                    azonosito=id,
                    nev=nev,
                    eletkor=eletkor,
                    elegedettseg=elegedettseg,
                    epulet_id=epulet_id
                )
                
                self.lakosok[id] = uj_lakos
            
            # Lakosságszám és elégedettség frissítése
            self.lakosok_szama = len(self.lakosok)
            ossz_elegedettseg = sum(lakos.elegedettseg for lakos in self.lakosok.values() if hasattr(lakos, 'elegedettseg'))
            
            if self.lakosok_szama > 0:
                self.lakossag_elegedettseg = ossz_elegedettseg / self.lakosok_szama
            else:
                self.lakossag_elegedettseg = 50  # Alapértelmezett
            
            # Játék aktiválása
            self.jatek_vege = False
            self.jatek_vege_ok = None
            
            # Épületek ellenőrzése és létrehozása, ha nincsenek
            if not self.epuletek:
                self._alap_epuletek_letrehozasa()
            
            print(f"Sikeresen létrehozva {letrehozando_lakosok_szama} új lakos. Összes lakos: {self.lakosok_szama}.")
            print(f"Lakosság elégedettsége: {self.lakossag_elegedettseg:.1f}%")
            
        except Exception as e:
            print(f"Hiba a lakosok generálásakor: {str(e)}")
            import traceback
            traceback.print_exc()
            
    def _alap_epuletek_letrehozasa(self):
        """
        Alap épületek létrehozása, ha nincsenek még épületek
        """
        try:
            from .epulet import Epulet
            
            # Ha már vannak épületek, nem csinálunk semmit
            if self.epuletek:
                return
                
            print("Alap épületek létrehozása...")
            
            # Lakóház létrehozása
            lakoepulet = Epulet(
                azonosito=1,
                nev="Központi Lakótelep",
                tipus="lakóház",
                alapterulet=5000,
                allapot="kiváló"
            )
            self.epuletek[1] = lakoepulet
            
            # Városháza
            varoshaza = Epulet(
                azonosito=2,
                nev="Városháza",
                tipus="középület",
                alapterulet=2000,
                allapot="kiváló"
            )
            self.epuletek[2] = varoshaza
            
            # Iskola
            iskola = Epulet(
                azonosito=3,
                nev="Általános Iskola",
                tipus="oktatási",
                alapterulet=3000,
                allapot="jó"
            )
            self.epuletek[3] = iskola
            
            print(f"Sikeresen létrehozva {len(self.epuletek)} alap épület.")
            
        except Exception as e:
            print(f"Hiba az alap épületek létrehozásakor: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def epulet_hozzaadas(self, epulet):
        """
        Épület hozzáadása a városhoz
        
        :param epulet: Az épület objektum amit hozzá szeretnénk adni
        :return: True, ha sikerült a hozzáadás, False, ha nem
        """
        if epulet.azonosito is None:
            # Ha nincs azonosító, generálunk egyet
            epulet.azonosito = len(self.epuletek) + 1
            
        # Ellenőrizzük, hogy nem létezik-e már ilyen azonosítóval épület
        if epulet.azonosito in self.epuletek:
            print(f"HIBA: Már létezik épület {epulet.azonosito} azonosítóval!")
            return False
            
        self.epuletek[epulet.azonosito] = epulet
        return True
    
    def uj_epulet_hozzaadasa(self, epulet):
        """
        Új épület hozzáadása a városhoz
        
        :param epulet: Az új épület objektum
        :return: Az épület azonosítója, ha sikerült a hozzáadás, None, ha nem
        """
        if not hasattr(epulet, 'azonosito') or epulet.azonosito is None:
            # Ha nincs azonosító, generálunk egyet
            epulet.azonosito = len(self.epuletek) + 1
            
        # Ellenőrizzük, hogy nem létezik-e már ilyen azonosítóval épület
        if epulet.azonosito in self.epuletek:
            print(f"HIBA: Már létezik épület {epulet.azonosito} azonosítóval!")
            
            # Új azonosító generálása
            epulet.azonosito = max(self.epuletek.keys()) + 1 if self.epuletek else 1
            
        # Hozzáadjuk az épületet
        self.epuletek[epulet.azonosito] = epulet
        
        # Frissítjük a város statisztikáit, ha szükséges
        if hasattr(epulet, 'kornyezeti_hatas') and epulet.kornyezeti_hatas:
            self.kornyezeti_allapot = max(0, min(100, self.kornyezeti_allapot + epulet.kornyezeti_hatas))
            
        if hasattr(epulet, 'elegedettseg_hatas') and epulet.elegedettseg_hatas:
            self.lakossag_elegedettseg = max(0, min(100, self.lakossag_elegedettseg + epulet.elegedettseg_hatas))
        
        return epulet.azonosito
    
    def szolgaltatas_hozzaadas(self, szolgaltatas):
        """
        Új szolgáltatás hozzáadása a városhoz
        
        :param szolgaltatas: Szolgaltatas objektum
        :return: Szolgáltatás azonosítója
        """
        self.szolgaltatasok[szolgaltatas.azonosito] = szolgaltatas
        
        # Növeljük a lakosság elégedettségét
        self.lakossag_elegedettseg = min(100, self.lakossag_elegedettseg + UJ_SZOLGALTATAS_ELEGEDETTSEG_NOVELES)
        
        return szolgaltatas.azonosito
    
    def projekt_inditasa(self, projekt):
        """
        Új projekt indítása a városban
        
        :param projekt: Projekt objektum
        :return: Projekt azonosítója
        """
        self.projektek[projekt.azonosito] = projekt
        return projekt.azonosito
    
    def szolgaltatas_megszuntetese(self, szolgaltatas_id):
        """
        Szolgáltatás megszüntetése
        
        :param szolgaltatas_id: Megszüntetendő szolgáltatás azonosítója
        :return: True, ha sikeres volt
        """
        if szolgaltatas_id not in self.szolgaltatasok:
            return False
        
        szolgaltatas = self.szolgaltatasok[szolgaltatas_id]
        if szolgaltatas.megszuntet():
            # Csökkentjük a lakosság elégedettségét
            self.lakossag_elegedettseg = max(0, self.lakossag_elegedettseg - SZOLGALTATAS_MEGSZUNTETES_ELEGEDETTSEG_CSOKKENES)
            return True
        
        return False
    
    def epulet_karbantartas(self, epulet_id, javitas_merteke=1):
        """
        Épület karbantartása
        
        :param epulet_id: Karbantartandó épület azonosítója
        :param javitas_merteke: Javítás mértéke (alapértelmezett: 1)
        :return: Javított állapot vagy None, ha nem létezik az épület
        """
        if epulet_id not in self.epuletek:
            return None
        
        return self.epuletek[epulet_id].javit_allapot(javitas_merteke)
    
    def adatok_betoltese(self, epuletek_csv=None, szolgaltatasok_csv=None, projektek_csv=None, lakosok_csv=None):
        """
        Adatok betöltése CSV fájlokból
        
        :param epuletek_csv: Épületek CSV fájl elérési útja
        :param szolgaltatasok_csv: Szolgáltatások CSV fájl elérési útja
        :param projektek_csv: Projektek CSV fájl elérési útja
        :return: Sikeres betöltések száma
        """
        import pandas as pd
        import os
        import csv
        
        betoltott_elemek = 0

        # Függvény a CSV szeparátor automatikus felismerésére
        def detect_separator(file_path):
            with open(file_path, 'r', encoding='utf-8') as file:
                first_line = file.readline().strip()
                if ';' in first_line:
                    return ';'
                elif ',' in first_line:
                    return ','
                else:
                    return ','  # Alapértelmezett elválasztó
        
        # Épületek betöltése
        if epuletek_csv and os.path.exists(epuletek_csv):
            try:
                separator = detect_separator(epuletek_csv)
                epuletek_df = pd.read_csv(epuletek_csv, encoding='utf-8', sep=separator)
                print(f"Sikeresen betöltve {len(epuletek_df)} épület.")
                
                for _, row in epuletek_df.iterrows():
                    try:
                        epulet = Epulet.from_csv_row(row)
                        self.epuletek[epulet.azonosito] = epulet
                        betoltott_elemek += 1
                    except Exception as e:
                        print(f"Hiba az épület betöltésekor: {str(e)}")
                        continue
            except Exception as e:
                print(f"Hiba az épületek CSV betöltésekor: {str(e)}")
        
        # Szolgáltatások betöltése
        if szolgaltatasok_csv and os.path.exists(szolgaltatasok_csv):
            try:
                separator = detect_separator(szolgaltatasok_csv)
                szolgaltatasok_df = pd.read_csv(szolgaltatasok_csv, encoding='utf-8', sep=separator)
                
                # Oszlopnevek kiíratása és ellenőrzése
                print(f"Szolgáltatások CSV oszlopok: {list(szolgaltatasok_df.columns)}")
                
                # Oszlopnevek intelligens felismerése és validálása
                szolg_oszlopok = list(szolgaltatasok_df.columns)
                
                # Ellenőrizzük, hogy ez tényleg szolgáltatás adat-e vagy talán más típusú adat
                if 'eletkor' in szolg_oszlopok and 'elegedettseg' in szolg_oszlopok and 'epulet_id' in szolg_oszlopok:
                    print("Az adatstruktúra inkább lakosok adataira hasonlít, nem szolgáltatásokéra.")
                    print("A fájl valószínűleg lakosok adatait tartalmazza, nem szolgáltatásokét.")
                    
                    # Ha ez lakosok CSV-je, és nincs még betöltve lakosok adat, akkor próbáljuk meg lakosokként betölteni
                    if lakosok_csv is None:
                        print("Próbálkozás a szolgáltatás CSV lakosok adataiként történő betöltésével...")
                        # Átnevezzük a lakosok CSV-jének és betöltjük alább
                        lakosok_csv = szolgaltatasok_csv
                        szolgaltatasok_csv = None
                
                # Ha még mindig szolgáltatásként kezeljük, ellenőrizzük a kötelező oszlopokat
                if szolgaltatasok_csv:
                    szukseges_oszlopok = ['tipus', 'havi_koltseg']
                    hianyzo_oszlopok = [oszlop for oszlop in szukseges_oszlopok if oszlop not in szolg_oszlopok]
                    
                    if hianyzo_oszlopok:
                        print(f"Nem szabványos szolgáltatás adatstruktúra, kísérlet a felismerésre...")
                        
                        # Próbáljuk meg azonosítani, hogy valójában mi lehet ez az adattípus
                        if 'inditasi_datum' in szolg_oszlopok and 'havi_koltseg' not in szolg_oszlopok:
                            # Lehet, hogy felcserélődtek az oszlopok
                            print("Oszlopnevek nem standard formátumban, kísérlet a helyreállításra...")
                            
                            # Dátum és költség mező azonosítása
                            lehetseges_datum_oszlopok = [col for col in szolg_oszlopok if 'datum' in col.lower()]
                            lehetseges_koltseg_oszlopok = [col for col in szolg_oszlopok if 'koltseg' in col.lower() or 'dij' in col.lower()]
                            
                            # Ha van ilyen oszlop, hozzuk létre a hiányzó oszlopokat
                            if lehetseges_datum_oszlopok and not any(col in szolg_oszlopok for col in ['havi_koltseg', 'koltseg']):
                                # Létrehozzuk a havi_koltseg oszlopot alapértelmezett értékkel
                                szolgaltatasok_df['havi_koltseg'] = 10000
                                print("'havi_koltseg' oszlop létrehozva alapértelmezett értékkel (10000)")
                            
                            if lehetseges_koltseg_oszlopok and 'tipus' not in szolg_oszlopok:
                                # Létrehozzuk a tipus oszlopot alapértelmezett értékkel
                                szolgaltatasok_df['tipus'] = 'általános'
                                print("'tipus' oszlop létrehozva alapértelmezett értékkel ('általános')")
                        else:
                            print(f"Figyelmeztetés: Hiányzó kötelező oszlopok a szolgáltatások CSV-ben: {hianyzo_oszlopok}")
                    else:
                        print("Szabványos szolgáltatás adatstruktúra detektálva.")
                    
                    # Debugolás: az első szolgáltatás kiíratása
                    if not szolgaltatasok_df.empty:
                        print(f"Első szolgáltatás adat: {szolgaltatasok_df.iloc[0].to_dict()}")
                        
                    for _, row in szolgaltatasok_df.iterrows():
                        try:
                            szolgaltatas = Szolgaltatas.from_csv_row(row)
                            self.szolgaltatasok[szolgaltatas.azonosito] = szolgaltatas
                            betoltott_elemek += 1
                        except Exception as e:
                            print(f"Hiba a szolgáltatás betöltésekor: {str(e)}")
                            continue
                    
                    print(f"Sikeresen betöltve {len(self.szolgaltatasok)} szolgáltatás.")
            except Exception as e:
                print(f"Hiba a szolgáltatások CSV betöltésekor: {str(e)}")
        
        # Lakosok betöltése
        if lakosok_csv and os.path.exists(lakosok_csv):
            try:
                from .lakos import Lakos
                separator = detect_separator(lakosok_csv)
                lakosok_df = pd.read_csv(lakosok_csv, encoding='utf-8', sep=separator)
                
                # Oszlopnevek kiíratása
                print(f"Lakosok CSV oszlopok: {list(lakosok_df.columns)}")
                
                # Oszlopnevek ellenőrzése
                lakos_oszlopok = list(lakosok_df.columns)
                szukseges_oszlopok = ['azonosito', 'nev', 'lakos_azonosito', 'lakos_azonosító', 'név']
                
                # Ellenőrzés hogy legalább egy kötelező oszlop szerepel-e
                has_required_column = any(col in lakos_oszlopok for col in szukseges_oszlopok)
                if not has_required_column:
                    print(f"Figyelmeztetés: Hiányoznak a kötelező oszlopok a lakosok CSV-ben.")
                    print("Próbálunk az első sorból közvetlen értelmezni...")
                
                loaded_lakos_count = 0
                self.lakosok = {}  # Újraindítjuk a lakosok gyűjteményét
                for index, row in lakosok_df.iterrows():
                    try:
                        # Ha üres a sor, kihagyjuk
                        if row.isnull().all() or (isinstance(row, str) and row.strip() == ''):
                            continue
                            
                        lakos = Lakos.from_csv_row(row)
                        self.lakosok[lakos.azonosito] = lakos
                        betoltott_elemek += 1
                        loaded_lakos_count += 1
                    except Exception as e:
                        print(f"Hiba a lakos betöltésekor: {str(e)}")
                        print(f"Problémás adat: {row}")
                        continue
                
                print(f"Sikeresen betöltve {loaded_lakos_count} lakos.")
                
                # Frissítjük a lakosok számát az újonnan betöltött adatok alapján
                self.frissit_lakosok_szama()
                
                # Biztosítsuk, hogy a játék aktív állapotban van a lakosok betöltése után
                self.jatek_vege = False
                self.jatek_vege_ok = None
                
            except Exception as e:
                print(f"Hiba a lakosok CSV betöltésekor: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # Projektek betöltése
        if projektek_csv and os.path.exists(projektek_csv):
            try:
                from .projekt import Projekt
                separator = detect_separator(projektek_csv)
                projektek_df = pd.read_csv(projektek_csv, encoding='utf-8', sep=separator)
                
                # Oszlopnevek kiíratása
                print(f"Projektek CSV oszlopok: {list(projektek_df.columns)}")
                
                # Oszlopnevek ellenőrzése
                szukseges_oszlopok = ['Projekt_azonosito', 'koltseg', 'kezdo_d', 'befejezo_d']
                proj_oszlopok = list(projektek_df.columns)
                
                # Szükséges oszlopok alternatív nevei
                id_alternativak = ['Projekt_azonosito', 'azonosito', 'id']
                koltseg_alternativak = ['koltseg', 'Koltseg', 'osszeg']
                kezdo_alternativak = ['kezdo_d', 'kezdo_datum', 'indulas']  
                befejezo_alternativak = ['befejezo_d', 'befejezo_datum', 'vegdatum']
                
                # Ellenőrizzük, hogy a szükséges oszlopok valamelyik változata megtalálható-e
                id_talalt = any(alt in proj_oszlopok for alt in id_alternativak)
                koltseg_talalt = any(alt in proj_oszlopok for alt in koltseg_alternativak)
                kezdo_talalt = any(alt in proj_oszlopok for alt in kezdo_alternativak)
                befejezo_talalt = any(alt in proj_oszlopok for alt in befejezo_alternativak)
                
                if not (id_talalt and koltseg_talalt and kezdo_talalt and befejezo_talalt):
                    print(f"Figyelmeztetés: Hiányzó kötelező oszlopok a projektek CSV-ben: {szukseges_oszlopok}")
                
                for _, row in projektek_df.iterrows():
                    try:
                        projekt = Projekt.from_csv_row(row)
                        self.projektek[projekt.azonosito] = projekt
                        betoltott_elemek += 1
                    except Exception as e:
                        print(f"Hiba a projekt betöltésekor: {str(e)}")
                        continue
                
                print(f"Sikeresen betöltve {len(self.projektek)} projekt.")
            except Exception as e:
                print(f"Hiba a projektek CSV betöltésekor: {str(e)}")
        
        # Ellenőrzés: van-e lakosa a városnak?
        if self.lakosok_szama == 0:
            print("FIGYELMEZTETÉS: A városnak nincs lakosa!")
        
        return betoltott_elemek
    
    def projekt_export_csv(self, output_path):
        """
        Projektek exportálása CSV fájlba a feladatban megadott formátumban
        
        :param output_path: Kimeneti fájl útvonala
        :return: Igaz, ha sikeres volt az exportálás
        """
        try:
            # Biztosítsuk, hogy a kimenet könyvtára létezik
            import os
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                # Fejléc
                f.write("Projekt_azonosito,nev,koltseg,kezdo_d,befejezo_d,erintett_epuletek\n")
                
                # Projektek
                for projekt_id, projekt in self.projektek.items():
                    # Dátumok formázása YYYY-MM-DD formátumba
                    kezdo_datum = projekt.kezdo_datum.strftime('%Y-%m-%d') if hasattr(projekt.kezdo_datum, 'strftime') else str(projekt.kezdo_datum)
                    befejezo_datum = projekt.befejezo_datum.strftime('%Y-%m-%d') if hasattr(projekt.befejezo_datum, 'strftime') else str(projekt.befejezo_datum)
                    
                    # Érintett épületek kezelése
                    if not projekt.erintett_epuletek:
                        erintett_epuletek_str = "{}"
                    else:
                        erintett_epuletek_str = "{" + ",".join(str(e) for e in projekt.erintett_epuletek) + "}"
                    
                    # Adatok kiírása
                    f.write(f"{projekt_id},{projekt.nev},{projekt.koltseg},"
                            f"{kezdo_datum},{befejezo_datum},{erintett_epuletek_str}\n")
            
            print(f"Projektek sikeresen exportálva: {output_path}")
            return True
        except Exception as e:
            print(f"Hiba a projektek exportálásakor: {str(e)}")
            return False
    
    def fordulo(self, esemenyek=None):
        """
        Egy forduló végrehajtása a városban
        
        :param esemenyek: Események listája, amelyek a fordulóban történnek (opcionális)
        :return: Események listája, amelyek a fordulóban történtek
        """
        # Megjegyzés: A dátum léptetése és a forduló számláló növelése már
        # a GameEngine.kovetkezo_fordulo metódusban megtörtént
        
        # Események kezelése
        if esemenyek is None:
            esemenyek = []
        
        # Jelezzük, hogy az események még nincsenek alkalmazva
        esemenyek_mar_alkalmazva = False
        
        # Események naplózása
        fordulo_esemenyek = []
        
        try:
            # Importálások
            import random
            
            # 1. Projektek alapköltségei (Projektek előrehaladását a ForduloManager kezeli)
            for projekt_id, projekt in self.projektek.items():
                if not projekt:
                    continue
                
                if not projekt.befejezett:
                    havi_koltseg = projekt.havi_koltseg(self.aktualis_datum)
                    if havi_koltseg > 0:
                        self.penzugyek.koltseg_hozzaadasa(havi_koltseg, f"Projekt költség: {projekt.nev}")
                        fordulo_esemenyek.append(f"Projekt költség: {projekt.nev} - {havi_koltseg:,.0f} Ft")
            
            # 2. Adóbevételek számítása és beszedése
            adokulcs = self.adosav / 100  # Százalékból aránnyá konvertálás
            havi_atlagber = 400000  # Ft/hó (feltételezett érték)
            
            # Lakosságfüggő adóbevétel
            alap_adobevetel = self.lakosok_szama * havi_atlagber * adokulcs
            
            # Gazdasági tényezők hatása az adóbevételre
            gazdasagi_szorzo = self.gazdasagi_novekedes  # Gazdasági növekedés hat az adóbevételre
            
            # Elégedettség hatása az adóbefizetési hajlandóságra
            elegedettsegi_szorzo = 0.7 + (0.6 * (self.lakossag_elegedettseg / 100))
            
            # Kockázati tényezők hatása
            kockazati_szorzo = 1.0 - (self.kockazati_tenyezok["gazdasági"] / 200) 
            
            # Teljes havi adóbevétel számítása
            havi_adobevetel = alap_adobevetel * gazdasagi_szorzo * elegedettsegi_szorzo * kockazati_szorzo
            
            # Adóbevétel hozzáadása a költségvetéshez
            self.penzugyek.havi_adobevetel_hozzaadasa(havi_adobevetel)
            fordulo_esemenyek.append(f"Adóbevétel: {havi_adobevetel:,.0f} Ft")
            
            # 3. Szolgáltatások fenntartási költségeinek levonása
            szolgaltatasok_osszkoltseg = 0
            for szolgaltatas_id, szolgaltatas in self.szolgaltatasok.items():
                havi_koltseg = szolgaltatas.havi_koltseg if hasattr(szolgaltatas, 'havi_koltseg') else 0
                szolgaltatasok_osszkoltseg += havi_koltseg
                
                # Szolgáltatás elégedettségi hatása
                szolg_elegedettsegi_hatas = szolgaltatas.elegedettseg_hatas / 10 if hasattr(szolgaltatas, 'elegedettseg_hatas') else 0  # Kisebb havi hatás
                self.lakossag_elegedettseg = max(0, min(100, self.lakossag_elegedettseg + szolg_elegedettsegi_hatas))
            
            # Szolgáltatások összköltsége
            self.penzugyek.koltseg_hozzaadasa(szolgaltatasok_osszkoltseg, "Szolgáltatások fenntartási költsége")
            fordulo_esemenyek.append(f"Szolgáltatások összköltsége: {szolgaltatasok_osszkoltseg:,.0f} Ft")
            
            # 4. Épületek fenntartási költségeinek levonása
            epuletek_osszkoltseg = 0
            for epulet_id, epulet in self.epuletek.items():
                havi_koltseg = epulet.fenntartasi_koltseg if hasattr(epulet, 'fenntartasi_koltseg') else 0
                epuletek_osszkoltseg += havi_koltseg
                
                # Épület elégedettségi hatása
                epulet_elegedettsegi_hatas = epulet.elegedettseg_hatas / 10 if hasattr(epulet, 'elegedettseg_hatas') else 0  # Kisebb havi hatás
                self.lakossag_elegedettseg = max(0, min(100, self.lakossag_elegedettseg + epulet_elegedettsegi_hatas))
            
            # Épületek összköltsége
            self.penzugyek.koltseg_hozzaadasa(epuletek_osszkoltseg, "Épületek fenntartási költsége")
            fordulo_esemenyek.append(f"Épületek összköltsége: {epuletek_osszkoltseg:,.0f} Ft")

            # 5. Lakosságszám változása
            # Alapvető növekedés/csökkenés az elégedettség alapján
            elegedettseg_hatas = (self.lakossag_elegedettseg - 50) / 500  # -10% és +10% között
            
            # Infrastruktúra állapotának hatása
            infrastruktura_atlag = sum(self.infrastruktura_allapot.values()) / len(self.infrastruktura_allapot)
            infrastruktura_hatas = (infrastruktura_atlag - 50) / 1000  # -5% és +5% között
            
            # Turisztikai vonzerő hatása betelepülésre
            turizmus_hatas = self.turisztikai_vonzero / 2000  # 0% és +5% között
            
            # Összes hatás
            lakossag_valtozas_szazalek = elegedettseg_hatas + infrastruktura_hatas + turizmus_hatas
            
            # Az első 3 fordulóban ne csökkenjen a lakosságszám
            if self.fordulok_szama <= 3:
                print(f"Az első 3 fordulóban vagyunk ({self.fordulok_szama}. forduló), nem engedünk lakossági csökkenést.")
                lakossag_valtozas_szazalek = max(0, lakossag_valtozas_szazalek)  # Csak növekedés lehet
            else:
                # Válság hatása - ha válság van, növeli az elvándorlást
                if self.valsag_mod:
                    lakossag_valtozas_szazalek -= 0.05  # 5% veszteség válság esetén
                
                # Kockázati tényezők hatása
                kockazati_hatas = (self.kockazati_tenyezok["társadalmi"] / 500)  # Max 20% csökkenés
                lakossag_valtozas_szazalek -= kockazati_hatas
                
                # Véletlenszerű tényező - életszerűség érdekében
                veletlen_hatas = random.uniform(-0.01, 0.01)  # -1% és +1% között
                lakossag_valtozas_szazalek += veletlen_hatas
            
            # Lakosságszám változásának alkalmazása
            lakossag_valtozas = int(self.lakosok_szama * lakossag_valtozas_szazalek)
            
            # Biztosítsuk, hogy ne legyen 0 alatti a lakosságszám
            uj_lakossag_szama = max(10, self.lakosok_szama + lakossag_valtozas)
            
            # Csak akkor írunk üzenetet, ha ténylegesen változott a lakosságszám
            if uj_lakossag_szama != self.lakosok_szama:
                lakossag_valtozas = uj_lakossag_szama - self.lakosok_szama
                self.lakosok_szama = uj_lakossag_szama
                
                if lakossag_valtozas > 0:
                    fordulo_esemenyek.append(f"Lakosságszám növekedés: +{lakossag_valtozas} fő")
                elif lakossag_valtozas < 0:
                    fordulo_esemenyek.append(f"Lakosságszám csökkenés: {lakossag_valtozas} fő")
            
            # 6. Természeti és környezeti tényezők
            # Környezeti állapot romlása a lakosságszám és infrastruktúra miatt
            kornyezeti_romlasa = (self.lakosok_szama / 10000) + (100 - infrastruktura_atlag) / 50
            kornyezeti_romlasa = min(5, max(0.1, kornyezeti_romlasa))  # 0.1% és 5% között
            
            # Környezeti állapot változása
            self.kornyezeti_allapot = max(0, min(100, self.kornyezeti_allapot - kornyezeti_romlasa))
            
            # 7. Gazdasági és kockázati tényezők frissítése
            # Gazdasági növekedés változása az elégedettség, infrastruktúra és kockázati tényezők alapján
            gazdasagi_valtozas = (self.lakossag_elegedettseg / 1000) + (infrastruktura_atlag / 2000) - (sum(self.kockazati_tenyezok.values()) / 3000)
            veletlen_gazdasagi_valtozas = random.uniform(-0.02, 0.02)  # -2% és +2% között
            
            self.gazdasagi_novekedes = max(0.8, min(1.2, self.gazdasagi_novekedes + gazdasagi_valtozas + veletlen_gazdasagi_valtozas))
            
            # Kockázati tényezők változása
            for kockazat in self.kockazati_tenyezok:
                # Kockázat csökkenése normál helyzetben
                csokkenes = random.uniform(0.5, 2.0)
                # Kockázat növekedése az alacsony elégedettség, magas lakosságszám vagy kedvezőtlen környezeti állapot miatt
                novekedes = 0
                
                if self.lakossag_elegedettseg < 30:
                    novekedes += random.uniform(1.0, 3.0)
                    
                if self.kornyezeti_allapot < 30 and kockazat == "környezeti":
                    novekedes += random.uniform(2.0, 5.0)
                    
                if self.penzugyi_keret < self.biztonsagi_tartalek and kockazat == "gazdasági":
                    novekedes += random.uniform(3.0, 7.0)
                
                # Kockázat változása
                self.kockazati_tenyezok[kockazat] = max(0, min(100, self.kockazati_tenyezok[kockazat] - csokkenes + novekedes))
            
            # 8. Infrastruktúra állapotának változása
            for infrastruktura in self.infrastruktura_allapot:
                # Infrastruktúra romlása
                romlas = random.uniform(0.1, 0.5)  # 0.1% és 0.5% közötti romlás
                # Karbantartás-szerű javulás a költségvetés arányában
                infrastruktura_javulas_koltsege = self.penzugyi_keret * 0.01  # Költségvetés 1%-a
                javulas = (infrastruktura_javulas_koltsege / 10000000) * 5  # Max 5% javulás
                
                # Infrastruktúra állapotának változása
                self.infrastruktura_allapot[infrastruktura] = max(0, min(100, self.infrastruktura_allapot[infrastruktura] - romlas + javulas))
                
                # Infrastruktúra javítás költségének levonása
                self.penzugyi_keret -= infrastruktura_javulas_koltsege
                fordulo_esemenyek.append(f"{infrastruktura.capitalize()} karbantartás: {infrastruktura_javulas_koltsege:,.0f} Ft")
            
            # 9. Válság kezelése és ellenőrzése
            # Válság ellenőrzése - ha a kockázati tényezők átlaga magasabb, mint 70%, válság következik be
            kockazati_atlag = sum(self.kockazati_tenyezok.values()) / len(self.kockazati_tenyezok)
            
            if kockazati_atlag > 70 and not self.valsag_mod:
                # Válság bekövetkezése
                self.valsag_mod = True
                valsag_uzenet = "VÁLSÁG: A magas kockázati tényezők miatt válság alakult ki a városban!"
                fordulo_esemenyek.append(valsag_uzenet)
                
                # Válság hatásai
                self.lakossag_elegedettseg -= 20  # Jelentős elégedettség csökkenés
                self.penzugyi_keret = self.penzugyi_keret * 0.8  # 20% költségvetés csökkenés
                self.gazdasagi_novekedes = 0.8  # Gazdasági visszaesés
            
            elif self.valsag_mod and kockazati_atlag < 40:
                # Válság vége
                self.valsag_mod = False
                valsag_vege_uzenet = "A válság véget ért, a város újra fejlődésnek indult!"
                fordulo_esemenyek.append(valsag_vege_uzenet)
                
                # Válság utáni fellendülés
                self.lakossag_elegedettseg += 10  # Elégedettség növekedés
                self.gazdasagi_novekedes = 1.1  # Gazdasági fellendülés
            
            # 10. Elégedettség korrigálása
            # Korrigáljuk az elégedettséget különböző tényezők alapján
            
            # Pénzügyi helyzet hatása az elégedettségre
            penzugyi_hatas = 0
            if self.penzugyi_keret < 0:
                # Negatív költségvetés erősen csökkenti az elégedettséget
                penzugyi_hatas = -5
            elif self.penzugyi_keret < self.biztonsagi_tartalek:
                # Alacsony költségvetés enyhén csökkenti az elégedettséget
                penzugyi_hatas = -2
            else:
                # Megfelelő költségvetés enyhén növeli az elégedettséget
                penzugyi_hatas = 1
            
            # Környezeti állapot hatása
            kornyezeti_hatas = (self.kornyezeti_allapot - 50) / 20  # -2.5 és +2.5 között
            
            # Infrastruktúra hatása
            infrastruktura_hatas = (infrastruktura_atlag - 50) / 25  # -2 és +2 között
            
            # Gazdasági állapot hatása
            gazdasagi_hatas = (self.gazdasagi_novekedes - 1.0) * 10  # -2 és +2 között
            
            # Turisztikai vonzerő kis pozitív hatása
            turizmus_hatas = self.turisztikai_vonzero / 50  # 0 és +2 között
            
            # Véletlenszerű hangulati tényező
            veletlen_hangulat = random.uniform(-1.0, 1.0)
            
            # Összesített elégedettség változás
            elegedettseg_valtozas = penzugyi_hatas + kornyezeti_hatas + infrastruktura_hatas + gazdasagi_hatas + turizmus_hatas + veletlen_hangulat
            
            # Korábbi elégedettség hatása - nagyobb változás, ha szélsőséges értéken van
            if self.lakossag_elegedettseg < 20:
                elegedettseg_valtozas -= 1  # Még jobban csökken, ha már alacsony
            elif self.lakossag_elegedettseg > 80:
                elegedettseg_valtozas += 0.5  # Még jobban nő, ha már magas
            
            # Elégedettség frissítése
            self.lakossag_elegedettseg = max(0, min(100, self.lakossag_elegedettseg + elegedettseg_valtozas))
            
            # 11. Dátum frissítése
            self.aktualis_datum += timedelta(days=30)  # Kb. egy hónap
            
            # 12. Statisztikák rögzítése
            self.statisztika[self.fordulok_szama] = {
                "datum": self.aktualis_datum,
                "penzugyi_keret": self.penzugyi_keret,
                "lakossag": self.lakosok_szama,
                "elegedettseg": self.lakossag_elegedettseg,
                "kornyezeti_allapot": self.kornyezeti_allapot,
                "gazdasagi_novekedes": self.gazdasagi_novekedes,
                "kockazati_tenyezok": self.kockazati_tenyezok.copy(),
                "infrastruktura_allapot": self.infrastruktura_allapot.copy()
            }
            
            # Események tárolása
            self.elozo_fordulo_esemenyei = fordulo_esemenyek
            
            # Ha még nincsenek alkalmazva az események, akkor most alkalmazzuk őket
            if not esemenyek_mar_alkalmazva and esemenyek:
                # Külsős eseménykezelőtől érkező események hatásait itt nem kezeljük,
                # mert azokat már az esemenyek_alkalmazasa metódus végrehajtotta
                fordulo_esemenyek.extend([f"Külső esemény: {str(esemeny)}" for esemeny in esemenyek])
            
            return fordulo_esemenyek
        except Exception as e:
            print(f"Hiba a forduló végrehajtásakor: {str(e)}")
            return []
    
    def _feldolgoz_esemeny(self, esemeny):
        """
        Egy esemény feldolgozása és annak hatásainak alkalmazása a városra
        
        :param esemeny: Az esemény szótára
        :return: Az esemény hatásának leírása
        """
        try:
            # Esemény alapadatainak kiolvasása
            nev = esemeny.get('nev', 'Ismeretlen esemény')
            hatastipus = esemeny.get('hatastipus', 'semleges')
            hatas_merteke = esemeny.get('hatas_merteke', 0)
            leiras = esemeny.get('leiras', '')
            
            eredmeny = f"Esemény: {nev} - "
            
            # Új, részletesebb hatáskezelés a 'hatas' kulcs alatt
            if 'hatas' in esemeny:
                hatasok = esemeny['hatas']
                
                # Pénzügyi hatás
                if 'penz' in hatasok:
                    penz_hatas = hatasok['penz']
                    if penz_hatas > 0:
                        self.penzugyek.bevetel_hozzaadasa(penz_hatas, f"Esemény bevétel: {nev}")
                    else:
                        self.penzugyek.koltseg_hozzaadasa(abs(penz_hatas), f"Esemény költség: {nev}")
                    eredmeny += f"Pénzügyi hatás: {penz_hatas:+,} Ft; "
                
                # Boldogság/elégedettség hatás
                if 'boldogsag' in hatasok:
                    boldogsag_hatas = hatasok['boldogsag']
                    self.lakossag_elegedettseg = max(0, min(100, self.lakossag_elegedettseg + boldogsag_hatas))
                    eredmeny += f"Elégedettségi hatás: {boldogsag_hatas:+}%; "
                
                # Lakossági hatás
                if 'lakossag' in hatasok:
                    lakossag_hatas = hatasok['lakossag']
                    self.lakosok_szama = max(0, self.lakosok_szama + lakossag_hatas)
                    eredmeny += f"Lakossági hatás: {lakossag_hatas:+} fő; "
                
                # Környezeti hatás
                if 'kornyezet' in hatasok:
                    kornyezet_hatas = hatasok['kornyezet']
                    self.kornyezeti_allapot = max(0, min(100, self.kornyezeti_allapot + kornyezet_hatas))
                    eredmeny += f"Környezeti hatás: {kornyezet_hatas:+}%; "
                
                # Gazdasági növekedési hatás
                if 'gazdasagi_novekedes' in hatasok:
                    gazdasagi_hatas = hatasok['gazdasagi_novekedes'] / 100  # százalékból törté
                    self.gazdasagi_novekedes = max(0.5, min(1.5, self.gazdasagi_novekedes + gazdasagi_hatas))
                    eredmeny += f"Gazdasági növekedési hatás: {gazdasagi_hatas*100:+.2f}%; "
                
                # Infrastruktúra állapot hatás
                if 'infrastruktura' in hatasok:
                    infra_tipus = hatasok.get('infrastruktura_tipus', 'altalanos')
                    infra_hatas = hatasok.get('infrastruktura_ertek', 0)
                    
                    if infra_tipus in self.infrastruktura_allapot:
                        self.infrastruktura_allapot[infra_tipus] = max(0, min(100, self.infrastruktura_allapot[infra_tipus] + infra_hatas))
                        eredmeny += f"Infrastruktúra hatás ({infra_tipus}): {infra_hatas:+}%; "
                
                # Kockázati tényezők hatás
                if 'kockazat' in hatasok:
                    kockazat_tipus = hatasok.get('kockazat_tipus', 'altalanos')
                    kockazat_hatas = hatasok.get('kockazat_ertek', 0)
                    
                    if kockazat_tipus in self.kockazati_tenyezok:
                        self.kockazati_tenyezok[kockazat_tipus] = max(0, min(100, self.kockazati_tenyezok[kockazat_tipus] + kockazat_hatas))
                        eredmeny += f"Kockázati hatás ({kockazat_tipus}): {kockazat_hatas:+}%; "
                
                # Lakosságváltozás százalékban
                if 'lakossag_valtozas' in hatasok:
                    valtozas_szazalek = hatasok['lakossag_valtozas']
                    valtozas = int(self.lakosok_szama * valtozas_szazalek)
                    self.lakosok_szama = max(0, self.lakosok_szama + valtozas)
                    eredmeny += f"Lakossági változás: {valtozas:+} fő ({valtozas_szazalek*100:+.1f}%); "
                
                # Kritikus események erősebb hatást gyakorolnak
                if esemeny.get('kritikus', False):
                    # Kritikus események extra hatásai
                    # Csökkenti az infrastruktúra állapotát
                    for infra_tipus in self.infrastruktura_allapot:
                        csokkenes = random.randint(5, 15)
                        self.infrastruktura_allapot[infra_tipus] = max(0, self.infrastruktura_allapot[infra_tipus] - csokkenes)
                        eredmeny += f"Kritikus hatás: {infra_tipus} infrastruktúra -{csokkenes}%; "
                    
                    # Növeli a kockázati tényezőket
                    for kockázat_tipus in self.kockazati_tenyezok:
                        novekedes = random.randint(10, 20)
                        self.kockazati_tenyezok[kockázat_tipus] = min(100, self.kockazati_tenyezok[kockázat_tipus] + novekedes)
                        eredmeny += f"Kritikus hatás: {kockázat_tipus} kockázat +{novekedes}%; "
                
                return eredmeny
            
            # Kompatibilitás a régi hatásrendszerrel
            # Hatás alkalmazása a várostól függően
            if hatastipus == 'penzugyi':
                self.penzugyek.bevetel_hozzaadasa(hatas_merteke, f"Esemény hatás: {nev}")
                eredmeny += f"Pénzügyi hatás: {hatas_merteke:+,.0f} Ft"
                
            elif hatastipus == 'elegedettseg':
                self.lakossag_elegedettseg = max(0, min(100, self.lakossag_elegedettseg + hatas_merteke))
                eredmeny += f"Elégedettségi hatás: {hatas_merteke:+.1f}%"
                
            elif hatastipus == 'lakossag':
                self.lakosok_szama = max(0, self.lakosok_szama + int(hatas_merteke))
                eredmeny += f"Lakossági hatás: {int(hatas_merteke):+} fő"
                
            elif hatastipus == 'kornyezeti':
                self.kornyezeti_allapot = max(0, min(100, self.kornyezeti_allapot + hatas_merteke))
                eredmeny += f"Környezeti hatás: {hatas_merteke:+.1f}%"
                
            elif hatastipus == 'gazdasagi':
                self.gazdasagi_novekedes = max(0.5, min(1.5, self.gazdasagi_novekedes + (hatas_merteke / 100)))
                eredmeny += f"Gazdasági hatás: {hatas_merteke:+.1f}%"
            
            return eredmeny
            
        except Exception as e:
            print(f"Hiba az esemény feldolgozásakor: {str(e)}")
            return f"Hiba: {str(e)}"
    
    def _ellenorzes_jatek_vege(self):
        """
        Ellenőrzi, hogy véget ért-e a játék
        """
        # Az első 3 fordulóban ne fejeződhessen be a játék
        if hasattr(self, 'fordulok_szama') and self.fordulok_szama <= 3:
            print(f"Az első 3 fordulóban vagyunk ({self.fordulok_szama}. forduló), nem fejeződhet be a játék.")
            self.jatek_vege = False
            self.jatek_vege_ok = None
            return False
        
        # 1. Pénzkeret elfogyott
        if self.penzugyi_keret <= 0:
            self.jatek_vege = True
            self.jatek_vege_ok = "A város pénzkerete elfogyott!"
            return True
        
        # 2. Lakosság elégedettsége a minimum alá csökkent
        if self.lakossag_elegedettseg < 20:
            self.jatek_vege = True
            self.jatek_vege_ok = f"A lakosság elégedettsége túl alacsony! ({self.lakossag_elegedettseg:.1f}% < 20%)"
            return True
        
        # 3. Szimuláció időszak vége
        if self.fordulok_szama >= 48:  # 4 év
            self.jatek_vege = True
            self.jatek_vege_ok = f"A szimulációs időszak véget ért! ({self.fordulok_szama} hónap)"
            return True
        
        return False
    
    def uj_epulet_epitese(self, nev, tipus, alapterulet, koltseg, idotartam_honapokban):
        """
        Új épület építésének indítása
        
        :param nev: Épület neve
        :param tipus: Épület típusa
        :param alapterulet: Épület alapterülete
        :param koltseg: Építés költsége
        :param idotartam_honapokban: Építés időtartama hónapokban
        :return: Létrehozott projekt azonosítója vagy None, ha nem sikerült
        """
        # Ellenőrizzük, van-e elég pénz
        if koltseg > self.penzugyi_keret:
            return None, "Nincs elég pénz az építkezéshez!"
        
        # Új épület azonosítója
        uj_epulet_id = max(self.epuletek.keys(), default=0) + 1
        
        # Új projekt azonosítója
        uj_projekt_id = max(self.projektek.keys(), default=0) + 1
        
        # Kezdő és befejező dátum
        kezdo_datum = self.aktualis_datum
        befejezo_datum = (datetime.combine(kezdo_datum, datetime.min.time()) + 
                          timedelta(days=30 * idotartam_honapokban)).date()
        
        # Új épület adatai
        uj_epulet_adatok = {
            'azonosito': uj_epulet_id,
            'nev': nev,
            'tipus': tipus,
            'alapterulet': alapterulet,
            'allapot': "kiváló"  # Új épület, kiváló állapotban
        }
        
        # Új projekt létrehozása
        uj_projekt = Projekt(
            azonosito=uj_projekt_id,
            nev=f"{nev} építése",
            tipus="új építés",
            koltseg=koltseg,
            kezdo_datum=kezdo_datum,
            befejezo_datum=befejezo_datum,
            uj_epulet_adatok=uj_epulet_adatok
        )
        
        # Projekt indítása
        self.projekt_inditasa(uj_projekt)
        
        return uj_projekt_id, None
    
    def epulet_karbantartas_inditasa(self, epulet_id, koltseg, idotartam_honapokban):
        """
        Épület karbantartás projekt indítása
        
        :param epulet_id: Karbantartandó épület azonosítója
        :param koltseg: Karbantartás költsége
        :param idotartam_honapokban: Karbantartás időtartama hónapokban
        :return: Létrehozott projekt azonosítója vagy None, ha nem sikerült
        """
        # Ellenőrizzük, létezik-e az épület
        if epulet_id not in self.epuletek:
            return None, "Nem létező épület!"
        
        # Ellenőrizzük, van-e elég pénz
        if koltseg > self.penzugyi_keret:
            return None, "Nincs elég pénz a karbantartáshoz!"
        
        # Új projekt azonosítója
        uj_projekt_id = max(self.projektek.keys(), default=0) + 1
        
        # Kezdő és befejező dátum
        kezdo_datum = self.aktualis_datum
        befejezo_datum = (datetime.combine(kezdo_datum, datetime.min.time()) + 
                          timedelta(days=30 * idotartam_honapokban)).date()
        
        # Új projekt létrehozása
        epulet = self.epuletek[epulet_id]
        uj_projekt = Projekt(
            azonosito=uj_projekt_id,
            nev=f"{epulet.nev} karbantartása",
            tipus="karbantartás",
            koltseg=koltseg,
            kezdo_datum=kezdo_datum,
            befejezo_datum=befejezo_datum,
            erintett_epuletek=[epulet_id]
        )
        
        # Projekt indítása
        self.projekt_inditasa(uj_projekt)
        
        return uj_projekt_id, None
    
    def uj_szolgaltatas_inditasa(self, nev, tipus, havi_koltseg, elegedettseg_hatas=0, lakossag_hatas=0):
        """
        Új szolgáltatás indítása
        
        :param nev: Szolgáltatás neve
        :param tipus: Szolgáltatás típusa
        :param havi_koltseg: Szolgáltatás havi költsége
        :param elegedettseg_hatas: A szolgáltatás hatása a lakosság elégedettségére (százalékpontban)
        :param lakossag_hatas: A szolgáltatás hatása a lakosság számára
        :return: Létrehozott szolgáltatás azonosítója vagy None, ha nem sikerült
        """
        # Ellenőrizzük, van-e elég pénz
        if havi_koltseg > self.penzugyi_keret:
            return None
        
        # Új szolgáltatás azonosítója
        uj_szolgaltatas_id = max(self.szolgaltatasok.keys(), default=0) + 1
        
        # Új szolgáltatás létrehozása
        uj_szolgaltatas = Szolgaltatas(
            azonosito=uj_szolgaltatas_id,
            nev=nev,
            tipus=tipus,
            havi_koltseg=havi_koltseg,
            elegedettseg_hatas=elegedettseg_hatas,
            lakossag_hatas=lakossag_hatas,
            indulas_datum=self.aktualis_datum
        )
        
        # Szolgáltatás hozzáadása
        self.szolgaltatas_hozzaadas(uj_szolgaltatas)
        
        # Szolgáltatás hatásainak érvényesítése
        self.elegedettseg_modositasa(elegedettseg_hatas)
        self.lakossag_modositasa(lakossag_hatas)
        
        return uj_szolgaltatas_id
    
    def naplo_mentes(self, fordulo_esemenyek, output_file=None):
        """
        Forduló eseményeinek mentése naplófájlba
        
        :param fordulo_esemenyek: Események listája
        :param output_file: Kimeneti fájl neve (opcionális)
        :return: Mentés sikeres volt-e
        """
        try:
            # Import the config safely
            try:
                from ..config import KIMENET_MAPPA, ALLAMI_TAMOGATAS_SZAZALEK
            except ImportError:
                # Ha az import nem sikerül, használjunk default értékeket
                import os
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                KIMENET_MAPPA = os.path.join(base_dir, "output/")
                ALLAMI_TAMOGATAS_SZAZALEK = 30
                print(f"Alapértelmezett értékek használata: KIMENET_MAPPA={KIMENET_MAPPA}")
            
            if output_file is None:
                datum_str = self.aktualis_datum.strftime('%Y%m%d')
                output_file = f"{KIMENET_MAPPA}szimulacios_naplo_{datum_str}.txt"
            
            # Könyvtár létrehozása, ha nem létezik
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"===============================================\n")
                f.write(f"=== Álomváros Szimuláció - {self.aktualis_datum} ===\n")
                f.write(f"===============================================\n\n")
                
                f.write("--- Események ---\n")
                if isinstance(fordulo_esemenyek, list):
                    if not fordulo_esemenyek:
                        f.write("* Nem történt esemény ebben a fordulóban.\n")
                    else:
                        for esemeny in fordulo_esemenyek:
                            # Ellenőrizzük, hogy objektum-e vagy string
                            if hasattr(esemeny, 'nev') and hasattr(esemeny, 'leiras'):
                                # Ha Esemeny objektum
                                penzugyi_hatas = getattr(esemeny, 'penzugyi_hatas', 0)
                                
                                # Elégedettségi hatás kezelése - mindkét névváltozat támogatása
                                elegedettseg_hatas = 0
                                if hasattr(esemeny, 'elegedettsegi_hatas'):
                                    elegedettseg_hatas = esemeny.elegedettsegi_hatas
                                elif hasattr(esemeny, 'elegedettseg_hatas'):
                                    elegedettseg_hatas = esemeny.elegedettseg_hatas
                                
                                # Lakossági hatás
                                lakossag_hatas = getattr(esemeny, 'lakossag_hatas', 0)
                                
                                f.write(f"* ESEMÉNY: {esemeny.nev} - {esemeny.leiras}\n")
                                f.write(f"  - Pénzügyi hatás: {penzugyi_hatas:+,.0f} Ft\n")
                                f.write(f"  - Elégedettségi hatás: {elegedettseg_hatas:+.1f}%\n")
                                f.write(f"  - Lakossági hatás: {lakossag_hatas:+} fő\n")
                            else:
                                # Ha string (régebbi események)
                                f.write(f"* {esemeny}\n")
                elif isinstance(fordulo_esemenyek, dict):
                    # Ha a fordulo_esemenyek egy szótár a havi költségekről
                    f.write("--- Havi pénzügyi kimutatás ---\n")
                    if 'osszkoltseg' in fordulo_esemenyek:
                        f.write(f"* Összes kiadás: {fordulo_esemenyek['osszkoltseg']:,.0f} Ft\n")
                    if 'epulet_koltsegek' in fordulo_esemenyek:
                        f.write(f"* Épület fenntartási költségek: {fordulo_esemenyek['epulet_koltsegek']:,.0f} Ft\n")
                    if 'szolgaltatas_koltsegek' in fordulo_esemenyek:
                        f.write(f"* Szolgáltatások bruttó költsége: {fordulo_esemenyek['szolgaltatas_koltsegek']:,.0f} Ft\n")
                    if 'allami_tamogatasok' in fordulo_esemenyek:
                        f.write(f"* Állami támogatások ({ALLAMI_TAMOGATAS_SZAZALEK}%): {fordulo_esemenyek['allami_tamogatasok']:,.0f} Ft\n")
                    if 'projekt_koltsegek' in fordulo_esemenyek:
                        f.write(f"* Projekt költségek: {fordulo_esemenyek['projekt_koltsegek']:,.0f} Ft\n")
                    if 'adobevetel' in fordulo_esemenyek:
                        f.write(f"* Adóbevételek: {fordulo_esemenyek['adobevetel']:,.0f} Ft\n")
                f.write("\n")
                
                f.write("--- Város állapota ---\n")
                f.write(f"* Pénzügyi keret: {self.penzugyi_keret:,.0f} Ft\n")
                f.write(f"* Lakosság elégedettsége: {self.lakossag_elegedettseg:.1f}%\n")
                f.write(f"* Lakosok száma: {self.lakosok_szama} fő\n")
                f.write(f"* Eltelt fordulók száma: {self.fordulok_szama}\n")
                f.write("\n")
                
                f.write("--- Épületek állapota ---\n")
                for epulet_id, epulet in self.epuletek.items():
                    if hasattr(epulet, 'fenntartasi_koltseg'):
                        f.write(f"* {epulet.nev} ({epulet.tipus}, {epulet.allapot}) - {epulet.alapterulet} m² - Fenntartási ktg: {epulet.fenntartasi_koltseg:,.0f} Ft/hó\n")
                    else:
                        f.write(f"* {epulet.nev} ({epulet.tipus}, {epulet.allapot}) - {epulet.alapterulet} m²\n")
                f.write("\n")
                
                f.write("--- Aktív szolgáltatások ---\n")
                aktiv_szolgaltatasok = [szolg for szolg in self.szolgaltatasok.values() if szolg.aktiv]
                for szolgaltatas in aktiv_szolgaltatasok:
                    tamogatas = szolgaltatas.havi_koltseg * (ALLAMI_TAMOGATAS_SZAZALEK / 100)
                    netto_koltseg = szolgaltatas.havi_koltseg - tamogatas
                    f.write(f"* {szolgaltatas.nev} ({szolgaltatas.tipus}) - Bruttó: {szolgaltatas.havi_koltseg:,.0f} Ft/hó, Támogatás: {tamogatas:,.0f} Ft, Nettó: {netto_koltseg:,.0f} Ft/hó\n")
                f.write("\n")
                
                f.write("--- Folyamatban lévő projektek ---\n")
                for projekt in self.projektek.values():
                    progress_percent = (projekt.eltelt_ido / projekt.idotartam) * 100 if hasattr(projekt, 'eltelt_ido') and hasattr(projekt, 'idotartam') else 0
                    f.write(f"* {projekt.nev} ({projekt.tipus}) - Költség: {projekt.koltseg:,.0f} Ft, Készültség: {progress_percent:.1f}%\n")
                f.write("\n")
                
                f.write("--- Befejezett projektek ---\n")
                for projekt in self.befejezett_projektek[-5:]:  # Csak az utolsó 5 befejezett projektet mutatjuk
                    f.write(f"* {projekt.nev} ({projekt.tipus}) - Költség: {projekt.koltseg:,.0f} Ft\n")
                f.write("\n")
                
                # Ha vége a játéknak, kiírjuk az okot
                if self.jatek_vege:
                    f.write(f"=== JÁTÉK VÉGE: {self.jatek_vege_ok} ===\n")
            
            return True
        except Exception as e:
            print(f"Hiba a naplófájl mentésekor: {e}")
            return False
    
    def __str__(self):
        """
        Város string reprezentációja
        
        :return: Olvasható string a város állapotával
        """
        return (f"{self.nev} - Pénzkeret: {self.penzugyi_keret:,.0f} Ft, "
                f"Elégedettség: {self.lakossag_elegedettseg:.1f}%, "
                f"Lakosok: {self.lakosok_szama} fő, "
                f"Dátum: {self.aktualis_datum}")
    
    def to_dict(self):
        """
        Város adatainak szótárrá alakítása
        
        :return: A város adatai szótár formátumban
        """
        # Lakosság átalakítása
        lakossag_dict = {}
        for lakos_id, lakos in self.lakosok.items():
            lakossag_dict[lakos_id] = lakos.to_dict() if hasattr(lakos, 'to_dict') else lakos
        
        # Épületek átalakítása
        epuletek_dict = {}
        for epulet_id, epulet in self.epuletek.items():
            epuletek_dict[epulet_id] = epulet.to_dict() if hasattr(epulet, 'to_dict') else epulet
        
        # Szolgáltatások átalakítása
        szolgaltatasok_dict = {}
        for szolg_id, szolg in self.szolgaltatasok.items():
            szolgaltatasok_dict[szolg_id] = szolg.to_dict() if hasattr(szolg, 'to_dict') else szolg
        
        # Projektek átalakítása
        projektek_dict = {}
        for projekt_id, projekt in self.projektek.items():
            projektek_dict[projekt_id] = projekt.to_dict() if hasattr(projekt, 'to_dict') else projekt
        
        # Pénzügyek átalakítása
        penzugyek_dict = self.penzugyek.to_dict() if hasattr(self, 'penzugyek') else {'egyenleg': self.penzugyi_keret}
        
        # Események naplója
        esemenyek_dict = []
        for esemeny in self.esemeny_naplo:
            esemenyek_dict.append(esemeny.to_dict() if hasattr(esemeny, 'to_dict') else esemeny)
            
        # Előző forduló eseményei
        elozo_fordulo_esemenyek_dict = []
        for esemeny in self.elozo_fordulo_esemenyei:
            elozo_fordulo_esemenyek_dict.append(esemeny.to_dict() if hasattr(esemeny, 'to_dict') else esemeny)
        
        return {
            'nev': self.nev,
            'penzugyi_keret': self.penzugyi_keret,
            'penzugyek': penzugyek_dict,
            'lakosok_szama': self.lakosok_szama,
            'lakossag_elegedettseg': self.lakossag_elegedettseg,
            'adosav': self.adosav,
            'fordulok_szama': self.fordulok_szama,
            'epuletek': epuletek_dict,
            'szolgaltatasok': szolgaltatasok_dict,
            'lakossag': lakossag_dict,
            'projektek': projektek_dict,
            'aktualis_datum': self.aktualis_datum.isoformat() if hasattr(self.aktualis_datum, 'isoformat') else str(self.aktualis_datum),
            'kornyezeti_allapot': self.kornyezeti_allapot,
            'gazdasagi_novekedes': self.gazdasagi_novekedes,
            'kockazati_tenyezok': self.kockazati_tenyezok,
            'infrastruktura_allapot': self.infrastruktura_allapot,
            'esemeny_naplo': esemenyek_dict,
            'elozo_fordulo_esemenyei': elozo_fordulo_esemenyek_dict,
            'jatek_vege': self.jatek_vege,
            'jatek_vege_ok': self.jatek_vege_ok
        }
    
    def statisztikak(self):
        """
        Statisztikai adatok a városról
        
        :return: Város statisztikái szótár formájában
        """
        aktiv_szolgaltatasok = len([s for s in self.szolgaltatasok.values() if s.aktiv])
        inaktiv_szolgaltatasok = len(self.szolgaltatasok) - aktiv_szolgaltatasok
        
        epulet_tipusok = {}
        for epulet in self.epuletek.values():
            if epulet.tipus not in epulet_tipusok:
                epulet_tipusok[epulet.tipus] = 0
            epulet_tipusok[epulet.tipus] += 1
        
        folyamatban_levo_projektek = len([p for p in self.projektek.values() if not p.befejezett])
        
        return {
            "Város neve": self.nev,
            "Pénzügyi keret": f"{self.penzugyi_keret:,} Ft",
            "Lakosság elégedettsége": f"{self.lakossag_elegedettseg}%",
            "Lakosok száma": f"{self.lakosok_szama:,} fő",
            "Épületek száma": len(self.epuletek),
            "Épületek típusonként": epulet_tipusok,
            "Aktív szolgáltatások": aktiv_szolgaltatasok,
            "Inaktív szolgáltatások": inaktiv_szolgaltatasok,
            "Folyamatban lévő projektek": folyamatban_levo_projektek,
            "Befejezett projektek": len(self.befejezett_projektek),
            "Szimulált fordulók száma": self.fordulok_szama,
            "Aktuális dátum": self.aktualis_datum.strftime("%Y-%m-%d"),
            "Szimuláció kezdete": self.kezdeti_datum.strftime("%Y-%m-%d"),
            "Szimuláció tervezett hossza": "4 év"
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        Város objektum létrehozása szótárból
        
        :param data: A város adatai szótár formátumban
        :return: Új Város objektum
        """
        from .penzugyek import Penzugyek
        from .epulet import Epulet
        from .szolgaltatas import Szolgaltatas
        from .projekt import Projekt
        from .lakos import Lakos
        from .esemeny import Esemeny
        from datetime import datetime
        
        # Alap objektum létrehozása
        varos = cls(
            nev=data.get('nev', 'Álomváros'),
            kezdeti_penz=data.get('penzugyi_keret', 100000000),
            kezdeti_lakosok=0  # Lakosokat később állítjuk be
        )
        
        # Pénzügyek beállítása
        if 'penzugyek' in data:
            varos.penzugyek = Penzugyek.from_dict(data['penzugyek'])
        else:
            varos.penzugyek.egyenleg = data.get('penzugyi_keret', 100000000)
            
        # További adatok betöltése
        varos.lakosok_szama = data.get('lakosok_szama', 0)
        varos.lakossag_elegedettseg = data.get('lakossag_elegedettseg', 50.0)
        varos.adosav = data.get('adosav', 5.0)
        varos.fordulok_szama = data.get('fordulok_szama', 0)
        
        # Környezeti és gazdasági adatok
        varos.kornyezeti_allapot = data.get('kornyezeti_allapot', 80.0)
        varos.gazdasagi_novekedes = data.get('gazdasagi_novekedes', 1.0)
        
        # Komplex adatstruktúrák
        varos.kockazati_tenyezok = data.get('kockazati_tenyezok', {
            "gazdasági": 0.0,
            "társadalmi": 0.0,
            "környezeti": 0.0
        })
        
        varos.infrastruktura_allapot = data.get('infrastruktura_allapot', {
            "közlekedés": 50.0,
            "közművek": 50.0,
            "kommunikáció": 50.0
        })
        
        # Dátum visszaállítása
        if 'aktualis_datum' in data:
            try:
                varos.aktualis_datum = datetime.fromisoformat(data['aktualis_datum'])
            except (ValueError, TypeError):
                # Ha nem sikerül az ISO formátumot értelmezni, alapértelmezett értéket használunk
                varos.aktualis_datum = datetime(2023, 1, 1)
        
        # Épületek betöltése
        if 'epuletek' in data:
            varos.epuletek = {}
            for epulet_id, epulet_adat in data['epuletek'].items():
                # String ID konvertálása integerré ahol szükséges
                epulet_id = int(epulet_id) if isinstance(epulet_id, str) and epulet_id.isdigit() else epulet_id
                epulet = Epulet.from_dict(epulet_adat)
                varos.epuletek[epulet_id] = epulet
        
        # Szolgáltatások betöltése
        if 'szolgaltatasok' in data:
            varos.szolgaltatasok = {}
            for szolg_id, szolg_adat in data['szolgaltatasok'].items():
                # String ID konvertálása integerré ahol szükséges
                szolg_id = int(szolg_id) if isinstance(szolg_id, str) and szolg_id.isdigit() else szolg_id
                szolgaltatas = Szolgaltatas.from_dict(szolg_adat)
                varos.szolgaltatasok[szolg_id] = szolgaltatas
        
        # Projektek betöltése
        if 'projektek' in data:
            varos.projektek = {}
            for projekt_id, projekt_adat in data['projektek'].items():
                # String ID konvertálása integerré ahol szükséges
                projekt_id = int(projekt_id) if isinstance(projekt_id, str) and projekt_id.isdigit() else projekt_id
                projekt = Projekt.from_dict(projekt_adat)
                varos.projektek[projekt_id] = projekt
        
        # Lakosok betöltése
        if 'lakossag' in data:
            varos.lakosok = {}
            for lakos_id, lakos_adat in data['lakossag'].items():
                # String ID konvertálása integerré ahol szükséges
                lakos_id = int(lakos_id) if isinstance(lakos_id, str) and lakos_id.isdigit() else lakos_id
                lakos = Lakos.from_dict(lakos_adat)
                varos.lakosok[lakos_id] = lakos
        
        # Esemény napló betöltése
        if 'esemeny_naplo' in data:
            varos.esemeny_naplo = []
            for esemeny_adat in data['esemeny_naplo']:
                if isinstance(esemeny_adat, dict):
                    esemeny = Esemeny.from_dict(esemeny_adat)
                    varos.esemeny_naplo.append(esemeny)
                elif isinstance(esemeny_adat, str):
                    # Ha csak szöveges az esemény, akkor egyszerűen berakjuk a naplóba
                    varos.esemeny_naplo.append(esemeny_adat)
                else:
                    print(f"Ismeretlen típusú esemény: {type(esemeny_adat)}")
                
        # Előző forduló eseményeinek betöltése
        if 'elozo_fordulo_esemenyei' in data:
            varos.elozo_fordulo_esemenyei = []
            for esemeny_adat in data['elozo_fordulo_esemenyei']:
                if isinstance(esemeny_adat, dict):
                    esemeny = Esemeny.from_dict(esemeny_adat)
                    varos.elozo_fordulo_esemenyei.append(esemeny)
                elif isinstance(esemeny_adat, str):
                    # Ha csak szöveges az esemény, akkor egyszerűen berakjuk a naplóba
                    varos.elozo_fordulo_esemenyei.append(esemeny_adat)
                else:
                    print(f"Ismeretlen típusú esemény: {type(esemeny_adat)}")
        
        # Végső állapotadatok
        varos.jatek_vege = data.get('jatek_vege', False)
        varos.jatek_vege_ok = data.get('jatek_vege_ok', "")
        
        return varos

    def frissit_lakosok_szama(self):
        """
        Frissíti a város lakosainak számát a lakosok szótár alapján
        és újraszámolja a lakóépületekhez kapcsolódó adatokat
        """
        # Lakosok számának frissítése
        self.lakosok_szama = len(self.lakosok)
        
        # Ha nincs vagy kevés lakos van, akkor alapértelmezett értéket adunk
        if self.lakosok_szama < 100:  # Csak akkor generálunk új lakosokat, ha nagyon alacsony a szám
            print(f"FIGYELMEZTETÉS: A városban kevés lakos van ({self.lakosok_szama})! Új lakosok generálása.")
            self._lakosok_generalasa(500)  # 500 új lakos generálása
            
            # Játék folytatódik mindenképpen
            self.jatek_vege = False
            self.jatek_vege_ok = None
            
            print(f"Lakosságszám beállítva: {self.lakosok_szama}")
            return
        
        # Újraszámoljuk az átlagos elégedettséget
        ossz_elegedettseg = sum(lakos.elegedettseg for lakos in self.lakosok.values() if hasattr(lakos, 'elegedettseg'))
        if ossz_elegedettseg > 0:
            self.lakossag_elegedettseg = ossz_elegedettseg / self.lakosok_szama
        else:
            # Ha nincs elégedettségi érték a lakosoknál, alapértelmezett értéket adunk
            self.lakossag_elegedettseg = 50  # Alapértelmezett 50% elégedettség
        
        # Ellenőrizzük, hogy minden lakosnak van-e épülete
        lakas_nelkuli_lakosok = []
        for lakos_id, lakos in self.lakosok.items():
            if not hasattr(lakos, 'epulet_id') or not lakos.epulet_id or (hasattr(self, 'epuletek') and lakos.epulet_id not in self.epuletek):
                lakas_nelkuli_lakosok.append(lakos_id)
        
        # Ha vannak lakás nélküli lakosok, és vannak lakóházak, akkor hozzárendeljük őket
        if lakas_nelkuli_lakosok:
            if hasattr(self, 'epuletek') and self.epuletek:
                lakohazak = [epulet for epulet in self.epuletek.values() 
                            if hasattr(epulet, 'tipus') and epulet.tipus and epulet.tipus.lower() == "lakóház"]
                
                if lakohazak:
                    import random
                    for lakos_id in lakas_nelkuli_lakosok:
                        # Véletlenszerűen választunk egy lakóházat
                        epulet = random.choice(lakohazak)
                        self.lakosok[lakos_id].epulet_id = epulet.azonosito
                        print(f"Lakos {lakos_id} hozzárendelve az {epulet.azonosito} épülethez")
                else:
                    print("FIGYELMEZTETÉS: Nincsenek lakóházak a városban, új lakóház létrehozása...")
                    self._alap_epuletek_letrehozasa()  # Létrehozunk alap épületeket
                    
                    # Újra próbáljuk a lakóházakhoz rendelést
                    lakohazak = [epulet for epulet in self.epuletek.values() 
                                if hasattr(epulet, 'tipus') and epulet.tipus and epulet.tipus.lower() == "lakóház"]
                    
                    if lakohazak:
                        import random
                        for lakos_id in lakas_nelkuli_lakosok:
                            # Véletlenszerűen választunk egy lakóházat
                            epulet = random.choice(lakohazak)
                            self.lakosok[lakos_id].epulet_id = epulet.azonosito
                            print(f"Lakos {lakos_id} hozzárendelve az {epulet.azonosito} épülethez")
            else:
                print("FIGYELMEZTETÉS: Nincsenek épületek a városban! Alap épületek létrehozása...")
                self._alap_epuletek_letrehozasa()
                
        # Biztosítsuk, hogy a játék ne fejeződjön be lakossági problémák miatt
        self.jatek_vege = False
        self.jatek_vege_ok = None
                
        # Ellenőrizzük az épületek telítettségét
        if hasattr(self, 'epuletek'):
            for epulet in self.epuletek.values():
                if hasattr(epulet, 'tipus') and epulet.tipus and epulet.tipus.lower() == "lakóház":
                    # Épülethez rendelt lakosok száma
                    epulet_lakosok = sum(1 for lakos in self.lakosok.values() 
                                       if hasattr(lakos, 'epulet_id') and lakos.epulet_id == epulet.azonosito)
                    
                    # Épület kapacitása
                    kapacitas = epulet.lakos_kapacitas() if hasattr(epulet, 'lakos_kapacitas') else 20  # Alapértelmezett kapacitás
                    
                    # Ha túl sokan vannak, csökkentjük az elégedettséget
                    if epulet_lakosok > kapacitas * 1.2:  # 20% túltelítettség
                        for lakos in self.lakosok.values():
                            if hasattr(lakos, 'epulet_id') and lakos.epulet_id == epulet.azonosito:
                                lakos.elegedettseg -= 2  # Csökkentjük az elégedettséget
                                
                                # Limit ellenőrzés
                                if lakos.elegedettseg < 0:
                                    lakos.elegedettseg = 0
                                    
                    # Ha kevesen vannak, növeljük az elégedettséget
                    elif epulet_lakosok < kapacitas * 0.5:  # Fél ház
                        for lakos in self.lakosok.values():
                            if hasattr(lakos, 'epulet_id') and lakos.epulet_id == epulet.azonosito:
                                lakos.elegedettseg += 1  # Növeljük az elégedettséget
                                
                                # Limit ellenőrzés
                                if lakos.elegedettseg > 100:
                                    lakos.elegedettseg = 100
                                    
        # Végső frissítés - újraszámoljuk az átlagos elégedettséget
        if self.lakosok:
            ossz_elegedettseg = sum(lakos.elegedettseg for lakos in self.lakosok.values() if hasattr(lakos, 'elegedettseg'))
            if ossz_elegedettseg > 0 and self.lakosok_szama > 0:
                self.lakossag_elegedettseg = ossz_elegedettseg / self.lakosok_szama

    def get_epulet_tipusok(self):
        """
        Visszaadja a városban használható épület típusokat
        
        :return: Lista az épület típusokkal
        """
        alap_tipusok = ["lakóház", "kereskedelmi", "ipari", "oktatási", "egészségügyi", "kulturális", "középület"]
        
        # Ha már vannak épületek, kiegészítjük a listát a meglévő épületek típusaival
        egyedi_tipusok = set()
        for epulet in self.epuletek.values():
            if hasattr(epulet, 'tipus') and epulet.tipus and epulet.tipus.lower() not in [t.lower() for t in alap_tipusok]:
                egyedi_tipusok.add(epulet.tipus)
        
        return alap_tipusok + list(egyedi_tipusok)
    
    def elegedettseg_modositasa(self, ertek):
        """
        Lakosok elégedettségének módosítása a megadott értékkel
        
        :param ertek: Elégedettség változás értéke (százalékpont)
        :return: Az új elégedettségi érték
        """
        # Maximális érték 100
        self.lakossag_elegedettseg = min(100, max(0, self.lakossag_elegedettseg + ertek))
        return self.lakossag_elegedettseg
        
    def lakossag_modositasa(self, ertek):
        """
        Lakosság számának módosítása a megadott értékkel
        
        :param ertek: Lakosság változás értéke
        :return: Az új lakossági létszám
        """
        # Nem lehet negatív lakos
        self.lakosok_szama = max(0, self.lakosok_szama + ertek)
        return self.lakosok_szama
    
    def epulet_torlese(self, epulet_id):
        """
        Épület törlése a városból
        
        :param epulet_id: Törlendő épület azonosítója
        :return: True, ha sikeres volt, False ha nem található az épület
        """
        if epulet_id not in self.epuletek:
            return False
            
        epulet = self.epuletek[epulet_id]
        
        # Lakók kiköltöztetése, ha lakóépületről van szó
        if hasattr(epulet, 'tipus') and epulet.tipus.lower() == "lakóház":
            for lakos_id, lakos in list(self.lakosok.items()):
                if hasattr(lakos, 'epulet_id') and lakos.epulet_id == epulet_id:
                    # Lakó áthelyezése egy másik épületbe vagy törlése
                    lakos.epulet_id = None
                    # Keressünk egy másik lakóépületet
                    for masik_epulet in self.epuletek.values():
                        if masik_epulet.azonosito != epulet_id and hasattr(masik_epulet, 'tipus') and masik_epulet.tipus.lower() == "lakóház":
                            lakos.epulet_id = masik_epulet.azonosito
                            break
        
        # Épület törlése előtt kornyezeti_hatas és elegedettseg_hatas visszaállítása
        if hasattr(epulet, 'kornyezeti_hatas') and epulet.kornyezeti_hatas:
            # Ellentétes hatás alkalmazása (negatív lesz pozitív, pozitív lesz negatív)
            self.kornyezeti_allapot = max(0, min(100, self.kornyezeti_allapot - epulet.kornyezeti_hatas))
            
        if hasattr(epulet, 'elegedettseg_hatas') and epulet.elegedettseg_hatas:
            # Ellentétes hatás alkalmazása (negatív lesz pozitív, pozitív lesz negatív)
            self.lakossag_elegedettseg = max(0, min(100, self.lakossag_elegedettseg - epulet.elegedettseg_hatas))
        
        # Épület tényleges törlése
        del self.epuletek[epulet_id]
        
        return True