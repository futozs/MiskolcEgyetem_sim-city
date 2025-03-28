"""
Épület modell osztály a városfejlesztési szimulátorhoz
"""
import uuid
from datetime import datetime, timedelta
import pandas as pd
from alomvaros_szimulator.config import EPULET_ALLAPOT, LAKOS_PER_NEGYZETMETER


class Epulet:
    """
    Épület osztály, amely a város épületeinek adatait tárolja és kezeli.
    """
    
    def __init__(self, azonosito, nev, tipus, alapterulet, allapot, epitesi_datum=None):
        """
        Épület létrehozása
        
        :param azonosito: Épület egyedi azonosítója
        :param nev: Épület neve
        :param tipus: Épület típusa (pl. lakóház, kereskedelmi, oktatási, stb.)
        :param alapterulet: Épület alapterülete négyzetméterben
        :param allapot: Épület állapota (1-5 közötti érték vagy szöveges leírás)
        :param epitesi_datum: Épület építési dátuma (opcionális)
        """
        self.azonosito = azonosito
        self.nev = nev
        self.tipus = tipus
        self.alapterulet = alapterulet
        self.allapot = allapot
        
        # Ha nem kaptunk építési dátumot, az aktuális dátumot állítjuk be
        if epitesi_datum is None:
            self.epitesi_datum = datetime.now().date()
        else:
            self.epitesi_datum = epitesi_datum
        
        # Fenntartási alap költségek négyzetméterenként (típus szerint különböző)
        self._fenntartasi_alap_koltsegek = {
            "lakóház": 200,         # 200 Ft/m²/hó
            "kereskedelmi": 300,    # 300 Ft/m²/hó
            "ipari": 250,           # 250 Ft/m²/hó
            "oktatási": 350,        # 350 Ft/m²/hó
            "egészségügyi": 400,    # 400 Ft/m²/hó
            "kulturális": 320,      # 320 Ft/m²/hó
            "középület": 380        # 380 Ft/m²/hó
        }
    
    def javit_allapot(self, mertekkel=1):
        """
        Épület állapotának javítása
        
        :param mertekkel: Mennyivel javuljon az állapot (alapértelmezett: 1)
        :return: Javított állapot értéke
        """
        # Ha az állapot szöveges, akkor számszerűsítjük
        if isinstance(self.allapot, str):
            allapot_ertek = EPULET_ALLAPOT.get(self.allapot.lower(), 1)
            ujAllapot_ertek = min(5, allapot_ertek + mertekkel)
            
            # Visszaalakítjuk szöveges formára
            for nev, ertek in EPULET_ALLAPOT.items():
                if ertek == ujAllapot_ertek:
                    self.allapot = nev
                    break
        else:
            # Számszerű állapot esetén egyszerűen növeljük, de maximum 5 lehet
            self.allapot = min(5, self.allapot + mertekkel)
        
        return self.allapot
    
    def romlik_allapot(self, mertekkel=0.1):
        """
        Épület állapotának romlása idővel
        
        :param mertekkel: Mennyivel romoljon az állapot (alapértelmezett: 0.1)
        :return: Új állapot értéke
        """
        # Ha az állapot szöveges, akkor számszerűsítjük
        if isinstance(self.allapot, str):
            allapot_ertek = EPULET_ALLAPOT.get(self.allapot.lower(), 1)
            ujAllapot_ertek = max(1, allapot_ertek - mertekkel)
            
            # Visszaalakítjuk szöveges formára
            for nev, ertek in EPULET_ALLAPOT.items():
                if ertek == round(ujAllapot_ertek):
                    self.allapot = nev
                    break
        else:
            # Számszerű állapot esetén egyszerűen csökkentjük, de minimum 1 lehet
            self.allapot = max(1, self.allapot - mertekkel)
        
        return self.allapot
    
    def lakos_kapacitas(self):
        """
        Kiszámolja, hogy hány lakos fér el az épületben (csak lakóház esetén)
        
        :return: Lakos kapacitás vagy 0, ha nem lakóház
        """
        if self.tipus.lower() == "lakóház":
            return self.alapterulet // LAKOS_PER_NEGYZETMETER
        return 0
    
    def to_dict(self):
        """
        Épület adatait szótárrá alakítja
        
        :return: Épület adatai szótár formátumban
        """
        return {
            'azonosito': self.azonosito,
            'nev': self.nev,
            'tipus': self.tipus,
            'alapterulet': self.alapterulet,
            'allapot': self.allapot,
            'epitesi_datum': str(self.epitesi_datum)
        }
    
    def __str__(self):
        """
        Épület string reprezentációja
        
        :return: Olvasható string az épület adataival
        """
        return f"{self.nev} ({self.tipus}, {self.alapterulet}m², állapot: {self.allapot})"
        
    @classmethod
    def from_dict(cls, data):
        """
        Épület létrehozása szótárból
        
        :param data: Épület adatait tartalmazó szótár
        :return: Új Epulet objektum
        """
        from datetime import datetime
        
        epitesi_datum = None
        if 'epitesi_datum' in data:
            try:
                epitesi_datum = datetime.fromisoformat(data['epitesi_datum']).date()
            except ValueError:
                # Ha nem ISO formátumú, megpróbáljuk más formátumban
                try:
                    epitesi_datum = datetime.strptime(data['epitesi_datum'], '%Y-%m-%d').date()
                except ValueError:
                    # Ha ez sem sikerül, alapértelmezett érték lesz
                    epitesi_datum = None
        
        return cls(
            azonosito=data['azonosito'],
            nev=data['nev'],
            tipus=data['tipus'],
            alapterulet=data['alapterulet'],
            allapot=data['allapot'],
            epitesi_datum=epitesi_datum
        )
    
    @property
    def fenntartasi_koltseg(self):
        """
        Kiszámítja az épület havi fenntartási költségét az alapterület, típus és állapot alapján
        
        Az állapot rosszabb = magasabb fenntartási költség
        
        :return: Havi fenntartási költség Ft-ban
        """
        # Alapterület és épülettípus alapján kiszámoljuk az alapköltséget
        tipus_alap_koltseg = self._fenntartasi_alap_koltsegek.get(
            self.tipus.lower(), 250  # Ismeretlen típus esetén 250 Ft/m²/hó
        )
        alap_koltseg = self.alapterulet * tipus_alap_koltseg
        
        # Az épület állapotának figyelembevétele
        if isinstance(self.allapot, str):
            allapot_ertek = EPULET_ALLAPOT.get(self.allapot.lower(), 3)
        else:
            # Ha számként van megadva az állapot, akkor azt használjuk
            allapot_ertek = self.allapot
            
        # Az állapot hatása a fenntartási költségre (rosszabb állapot = magasabb költség)
        # 5 (kiváló) = 0.8-szoros szorzó, 1 (rossz) = 1.5-szörös szorzó
        if isinstance(allapot_ertek, (int, float)):
            if allapot_ertek >= 5:  # Kiváló állapot
                allapot_szorzo = 0.8
            elif allapot_ertek >= 4:  # Jó állapot
                allapot_szorzo = 0.9
            elif allapot_ertek >= 3:  # Megfelelő állapot
                allapot_szorzo = 1.0
            elif allapot_ertek >= 2:  # Felújítandó állapot
                allapot_szorzo = 1.2
            else:  # Rossz állapot
                allapot_szorzo = 1.5
        else:
            # Alapértelmezett szorzó, ha nem tudjuk értelmezni az állapotot
            allapot_szorzo = 1.0
            
        # Végleges havi fenntartási költség
        return int(alap_koltseg * allapot_szorzo)
    
    @property
    def elegedettseg_hatas(self):
        """
        Kiszámítja az épület elégedettségre gyakorolt hatását a típus és állapot alapján
        
        Jobb állapotú épület = nagyobb pozitív hatás
        
        :return: Elégedettségre gyakorolt hatás százalékpontban
        """
        # Épület típusának alaphatása
        tipus_hatasok = {
            "lakóház": 2,
            "kereskedelmi": 3,
            "ipari": 1,
            "oktatási": 4,
            "egészségügyi": 5,
            "kulturális": 4,
            "középület": 3
        }
        
        alap_hatas = tipus_hatasok.get(self.tipus.lower(), 2)
        
        # Az épület állapotának figyelembevétele
        if isinstance(self.allapot, str):
            allapot_ertek = EPULET_ALLAPOT.get(self.allapot.lower(), 3)
        else:
            allapot_ertek = self.allapot
            
        # Az állapot szorzója (jobb állapot = nagyobb pozitív hatás)
        if isinstance(allapot_ertek, (int, float)):
            if allapot_ertek >= 5:  # Kiváló állapot
                allapot_szorzo = 1.5
            elif allapot_ertek >= 4:  # Jó állapot
                allapot_szorzo = 1.2
            elif allapot_ertek >= 3:  # Megfelelő állapot
                allapot_szorzo = 1.0
            elif allapot_ertek >= 2:  # Felújítandó állapot
                allapot_szorzo = 0.5
            else:  # Rossz állapot
                allapot_szorzo = 0.2
        else:
            allapot_szorzo = 1.0
            
        return alap_hatas * allapot_szorzo
    
    @classmethod
    def from_csv_row(cls, row):
        """
        Épület létrehozása CSV sor alapján
        
        :param row: CSV sor (dict vagy list)
        :return: Új Epulet objektum
        """
        try:
            if isinstance(row, dict):
                # Kompatibilitás az oszlopnevekkel, ellenőrizzük a különböző lehetséges neveket
                azonosito = None
                if 'azonosito' in row:
                    azonosito = int(row['azonosito'])
                elif 'épület_azonosító' in row or 'epulet_azonosito' in row:
                    azonosito = int(row.get('épület_azonosító', row.get('epulet_azonosito')))
                elif 'id' in row:
                    azonosito = int(row['id'])
                
                nev = None
                if 'nev' in row:
                    nev = row['nev']
                elif 'név' in row:
                    nev = row['név']
                
                tipus = None
                if 'tipus' in row:
                    tipus = row['tipus']
                elif 'típus' in row:
                    tipus = row['típus']
                
                # Alapterület kezelése különböző oszlopnevek esetén
                alapterulet = None
                if 'alapterulet' in row:
                    alapterulet = int(row['alapterulet'])
                elif 'hasznos_terület' in row:
                    alapterulet = int(row['hasznos_terület'])
                elif 'meret' in row or 'méret' in row:
                    alapterulet = int(row.get('meret', row.get('méret')))
                
                # Allapot/építési év kezelése
                allapot = "megfelelő"  # Alapértelmezett érték, ha nincs megadva
                if 'allapot' in row:
                    allapot = row['allapot']
                elif 'állapot' in row:
                    allapot = row['állapot']
                
                # Építési dátum kezelése
                epitesi_datum = None
                from datetime import datetime
                
                if 'epitesi_datum' in row:
                    try:
                        epitesi_datum = datetime.strptime(str(row['epitesi_datum']), '%Y-%m-%d').date()
                    except:
                        pass
                elif 'építés_éve' in row or 'epites_eve' in row:
                    # Ha csak az év van megadva, akkor azt január 1-jei dátumként kezeljük
                    try:
                        ev = int(row.get('építés_éve', row.get('epites_eve')))
                        epitesi_datum = datetime(ev, 1, 1).date()
                    except:
                        pass
                
                # Ellenőrizzük, hogy megvan-e minden kötelező adat
                if azonosito is None:
                    raise ValueError("Hiányzó azonosító")
                if nev is None:
                    raise ValueError("Hiányzó név")
                if tipus is None:
                    raise ValueError("Hiányzó típus")
                if alapterulet is None:
                    raise ValueError("Hiányzó alapterület/hasznos terület")
                
                return cls(
                    azonosito=azonosito,
                    nev=nev,
                    tipus=tipus,
                    alapterulet=alapterulet,
                    allapot=allapot,
                    epitesi_datum=epitesi_datum
                )
            else:
                # Lista esetén feltételezzük a következő sorrendet:
                # [azonosito, nev, tipus, epitesi_datum, alapterulet]
                if len(row) < 5:
                    raise ValueError(f"Nem elegendő adat az épület létrehozásához: {row}")
                
                from datetime import datetime
                
                # Értékek kinyerése indexek alapján
                azonosito = int(row[0])
                nev = str(row[1])
                tipus = str(row[2])
                
                # Építési dátum kezelése
                epitesi_datum = None
                try:
                    # Ha év van megadva, akkor január 1-jei dátumot használunk
                    if isinstance(row[3], int) or (isinstance(row[3], str) and row[3].isdigit()):
                        epitesi_datum = datetime(int(row[3]), 1, 1).date()
                    else:
                        epitesi_datum = datetime.strptime(str(row[3]), '%Y-%m-%d').date()
                except:
                    epitesi_datum = None
                
                # Alapterület
                alapterulet = int(row[4])
                
                # Alapértelmezett állapot
                allapot = "megfelelő"
                
                return cls(
                    azonosito=azonosito,
                    nev=nev,
                    tipus=tipus,
                    alapterulet=alapterulet,
                    allapot=allapot,
                    epitesi_datum=epitesi_datum
                )
        except Exception as e:
            print(f"Hiba az épület CSV sorából történő létrehozásakor: {e}")
            raise 