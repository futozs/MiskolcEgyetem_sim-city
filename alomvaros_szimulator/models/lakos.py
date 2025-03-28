"""
Lakos modell osztály a városfejlesztési szimulátorhoz
"""
from datetime import datetime
from alomvaros_szimulator.models.epulet import Epulet
import pandas as pd


class Lakos:
    """
    Lakos osztály, amely a város lakosainak adatait tárolja és kezeli.
    """
    
    def __init__(self, azonosito, nev, eletkor, elegedettseg, epulet_id):
        """
        Lakos létrehozása
        
        :param azonosito: Lakos egyedi azonosítója
        :param nev: Lakos neve
        :param eletkor: Lakos életkora
        :param elegedettseg: Lakos elégedettsége (0-100)
        :param epulet_id: Az épület azonosítója, ahol a lakos lakik
        """
        self.azonosito = azonosito
        self.nev = nev
        self.eletkor = eletkor
        self.elegedettseg = min(100, max(0, elegedettseg))  # 0-100 között
        self.epulet_id = epulet_id
        self.koltozesi_datum = datetime.now().date()
        self._lakohaz = None  # Cache for the building object
    
    @property
    def lakohaz(self):
        """
        Returns the building object where the citizen lives
        
        :return: Epulet object or None if not found
        """
        if self._lakohaz is None and self.epulet_id:
            # TODO: Implement proper building lookup from the city's building registry
            # For now, return None to prevent errors
            return None
        return self._lakohaz
    
    @lakohaz.setter
    def lakohaz(self, value):
        """
        Sets the building object where the citizen lives
        
        :param value: Epulet object
        """
        if isinstance(value, Epulet):
            self._lakohaz = value
            self.epulet_id = value.azonosito
        else:
            self._lakohaz = None
            self.epulet_id = None
    
    def koltozik(self, uj_epulet_id):
        """
        Lakos költözése új épületbe
        
        :param uj_epulet_id: Új épület azonosítója
        :return: True, ha sikeres volt a költözés
        """
        if uj_epulet_id != self.epulet_id:
            self.epulet_id = uj_epulet_id
            self.koltozesi_datum = datetime.now().date()
            return True
        return False
    
    def elegedettseg_noveles(self, mennyivel):
        """
        Lakos elégedettségének növelése
        
        :param mennyivel: Mennyivel növeljük az elégedettséget
        :return: Új elégedettségi szint
        """
        self.elegedettseg = min(100, self.elegedettseg + mennyivel)
        return self.elegedettseg
    
    def elegedettseg_csokkenes(self, mennyivel):
        """
        Lakos elégedettségének csökkentése
        
        :param mennyivel: Mennyivel csökkentjük az elégedettséget
        :return: Új elégedettségi szint
        """
        self.elegedettseg = max(0, self.elegedettseg - mennyivel)
        return self.elegedettseg
    
    def oregedes(self, evvel=1):
        """
        Lakos öregedése
        
        :param evvel: Hány évvel öregedjen (alapértelmezett: 1)
        :return: Új életkor
        """
        self.eletkor += evvel
        return self.eletkor
    
    def to_dict(self):
        """
        Lakos adatait szótárrá alakítja
        
        :return: Lakos adatai szótár formátumban
        """
        return {
            'azonosito': self.azonosito,
            'nev': self.nev,
            'eletkor': self.eletkor,
            'elegedettseg': self.elegedettseg,
            'epulet_id': self.epulet_id,
            'koltozesi_datum': str(self.koltozesi_datum)
        }
    
    def __str__(self):
        """
        Lakos string reprezentációja
        
        :return: Olvasható string a lakos adataival
        """
        return f"{self.nev} ({self.eletkor} éves, elégedettség: {self.elegedettseg}%, épület: {self.epulet_id})"
    
    @classmethod
    def from_dict(cls, data):
        """
        Lakos létrehozása szótárból
        
        :param data: Lakos adatait tartalmazó szótár
        :return: Új Lakos objektum
        """
        lakos = cls(
            azonosito=data['azonosito'],
            nev=data['nev'],
            eletkor=data['eletkor'],
            elegedettseg=data['elegedettseg'],
            epulet_id=data['epulet_id']
        )
        
        if 'koltozesi_datum' in data:
            from datetime import datetime
            try:
                lakos.koltozesi_datum = datetime.fromisoformat(data['koltozesi_datum']).date()
            except (ValueError, TypeError):
                # Ha nem tudjuk feldolgozni a dátumot, marad az alapértelmezett
                pass
        
        return lakos
    
    @classmethod
    def from_csv_row(cls, row):
        """
        Lakos létrehozása CSV sor alapján
        
        :param row: CSV sor (dict vagy list)
        :return: Új Lakos objektum
        """
        try:
            # Először ellenőrizzük, hogy a sor üres-e
            if isinstance(row, dict) and all(pd.isna(v) for v in row.values()):
                raise ValueError("Üres sor")
            elif isinstance(row, (list, tuple)) and all(pd.isna(v) for v in row):
                raise ValueError("Üres sor")
            
            # Kezeljük a pandas Series típusú adatokat
            if hasattr(row, 'to_dict') and callable(getattr(row, 'to_dict')):
                # Konvertáljuk át a pandas Series-t dictionary-vé
                row_dict = row.to_dict()
                # Ha van "lakos_azonosító" vagy hasonló oszlop, akkor ez valószínűleg egy jó formátumú Series
                if any(k in ['lakos_azonosító', 'lakos_azonosito', 'azonosito'] for k in row_dict.keys()):
                    # Tároljuk el az eredeti indexeket/kulcsokat
                    keys = list(row_dict.keys())
                    values = [row[k] for k in keys]
                    
                    # Hozzuk létre újra az adatokat egy tiszta dictionary-vel
                    cleaned_row = {}
                    for k, v in zip(keys, values):
                        if not pd.isna(v):  # Kihagyjuk a NaN értékeket
                            cleaned_row[k] = v
                    
                    # Hívjuk meg saját magunkat a tisztított dictionary-vel
                    return cls.from_csv_row(cleaned_row)
                # Ha csak egy oszlop van, akkor ez valószínűleg egy rossz formátumú sor
                elif len(row) == 1:
                    # Próbáljuk meg betölteni mint egy egyedi értéket
                    first_value = row.iloc[0]
                    if isinstance(first_value, str) and (';' in first_value or ',' in first_value):
                        # Ha az első érték egy pontosvesszőkkel vagy vesszőkkel elválasztott string, próbáljuk meg szétválasztani
                        sep = ';' if ';' in first_value else ','
                        values = first_value.split(sep)
                        return cls.from_csv_row(values)
            
            if isinstance(row, dict):
                # Ha a dict több kulcsot tartalmaz, de csak egy értékes oszlop, akkor valószínűleg egy
                # rosszul betöltött sor; próbáljuk meg feldolgozni az egyetlen értékes oszlopot
                non_na_values = {k: v for k, v in row.items() if not pd.isna(v)}
                if len(non_na_values) == 1 and len(row) > 1:
                    # Feltételezzük, hogy egy sorban vannak az adatok pontosvesszővel elválasztva
                    key = list(non_na_values.keys())[0]
                    value = str(non_na_values[key])
                    
                    if ';' in value:
                        parts = value.split(';')
                        if len(parts) >= 5:  # Ellenőrizzük, hogy van-e elég mező
                            # Új listát hozunk létre és áttérünk a lista feldolgozására
                            return cls.from_csv_row(parts)
                
                # Azonosító kezelése - különböző lehetséges nevek
                azonosito = None
                for field in ['azonosito', 'lakos_azonosito', 'lakos_azonosító', 'id']:
                    if field in row and not pd.isna(row[field]):
                        try:
                            azonosito = int(float(str(row[field]).replace(',', '.')))
                            break
                        except (ValueError, TypeError):
                            continue
                
                # Név kezelése
                nev = None
                for field in ['nev', 'név', 'name']:
                    if field in row and not pd.isna(row[field]):
                        nev = str(row[field])
                        break
                
                # Életkor/születési év kezelése
                eletkor = None
                import datetime
                current_year = datetime.datetime.now().year
                
                for field in ['eletkor', 'életkor', 'kor', 'age']:
                    if field in row and not pd.isna(row[field]):
                        try:
                            eletkor = int(float(str(row[field]).replace(',', '.')))
                            break
                        except (ValueError, TypeError):
                            continue
                
                if eletkor is None:
                    for field in ['szuletesi_ev', 'születési_év', 'birth_year', 'ev', 'év']:
                        if field in row and not pd.isna(row[field]):
                            try:
                                szuletesi_ev = int(float(str(row[field]).replace(',', '.')))
                                eletkor = current_year - szuletesi_ev
                                break
                            except (ValueError, TypeError):
                                continue
                
                # Elégedettség alapértelmezett értéke
                elegedettseg = 50  # Középérték
                for field in ['elegedettseg', 'elégedettség', 'happiness']:
                    if field in row and not pd.isna(row[field]):
                        try:
                            elegedettseg = float(str(row[field]).replace(',', '.'))
                            break
                        except (ValueError, TypeError):
                            continue
                
                # Épület azonosító (lakóhely)
                epulet_id = None
                for field in ['epulet_id', 'lakohely', 'lakóhely', 'building_id', 'home']:
                    if field in row and not pd.isna(row[field]):
                        try:
                            epulet_id = int(float(str(row[field]).replace(',', '.')))
                            break
                        except (ValueError, TypeError):
                            continue
                
                # Ha még mindig hiányzik valamelyik kötelező mező, próbáljunk meg alapértelmezett értékeket adni
                if azonosito is None:
                    import random
                    azonosito = random.randint(1000, 9999)  # Véletlenszerű azonosító generálása
                    print(f"Generált azonosító: {azonosito}")
                
                if nev is None:
                    nev = f"Ismeretlen lakos {azonosito}"
                    print(f"Generált név: {nev}")
                
                if eletkor is None:
                    eletkor = 30  # Átlagos életkor
                    print(f"Alapértelmezett életkor beállítva: {eletkor}")
                
                if epulet_id is None:
                    epulet_id = 1  # Alapértelmezett épület
                    print(f"Alapértelmezett épület azonosító beállítva: {epulet_id}")
                
                return cls(
                    azonosito=azonosito,
                    nev=nev,
                    eletkor=eletkor,
                    elegedettseg=elegedettseg,
                    epulet_id=epulet_id
                )
            else:
                # Ha string, akkor próbáljuk meg szétválasztani
                if isinstance(row, str):
                    if ';' in row:
                        row = row.split(';')
                    elif ',' in row:
                        row = row.split(',')
                
                # Lista esetén feltételezzük a sorrendet: [azonosito, nev, szuletesi_ev, foglalkozas, lakohely]
                # Megnézzük, hogy van-e elég elem, ha nincs, akkor feltöltjük
                if isinstance(row, (list, tuple)):
                    row_list = list(row)
                    
                    # Ellenőrizzük, hogy az elemek nem-e üresek vagy NaN értékek
                    valid_elements = [i for i, x in enumerate(row_list) if not pd.isna(x) and str(x).strip()]
                    
                    # Ha nincs elég érvényes elem, akkor hibaüzenet
                    if len(valid_elements) < 3:  # Legalább azonosító, név és életkor/születési év kell
                        raise ValueError(f"Nem elegendő adat a lakos létrehozásához: {row}")
                    
                    # Kiegészítjük a listát, ha szükséges
                    while len(row_list) < 5:
                        row_list.append(None)
                    
                    # Alapvető adatok kinyerése és konvertálása
                    try:
                        azonosito = int(float(str(row_list[0]).replace(',', '.')))
                    except (ValueError, TypeError):
                        import random
                        azonosito = random.randint(1000, 9999)
                        print(f"Hibás azonosító adat, generált új: {azonosito}")
                    
                    nev = str(row_list[1]) if row_list[1] and not pd.isna(row_list[1]) else f"Ismeretlen {azonosito}"
                    
                    # Születési évből kiszámoljuk az életkort
                    import datetime
                    current_year = datetime.datetime.now().year
                    
                    try:
                        if row_list[2] and not pd.isna(row_list[2]):
                            szuletesi_ev = int(float(str(row_list[2]).replace(',', '.')))
                            eletkor = current_year - szuletesi_ev
                        else:
                            eletkor = 30  # Alapértelmezett érték
                    except (ValueError, TypeError):
                        eletkor = 30
                        print(f"Hibás születési év adat, alapértelmezett életkor beállítva: {eletkor}")
                    
                    # A foglalkozást most nem használjuk, de kiolvashatjuk ha van
                    # foglalkozas = str(row_list[3]) if row_list[3] and not pd.isna(row_list[3]) else "ismeretlen"
                    
                    # Lakóhely (épület azonosító)
                    try:
                        if row_list[4] and not pd.isna(row_list[4]):
                            epulet_id = int(float(str(row_list[4]).replace(',', '.')))
                        else:
                            epulet_id = 1  # Alapértelmezett érték
                    except (ValueError, TypeError):
                        epulet_id = 1
                        print(f"Hibás épület azonosító adat, alapértelmezett érték beállítva: {epulet_id}")
                    
                    # Alapértelmezett elégedettség (középérték)
                    elegedettseg = 50
                    
                    return cls(
                        azonosito=azonosito,
                        nev=nev,
                        eletkor=eletkor,
                        elegedettseg=elegedettseg,
                        epulet_id=epulet_id
                    )
                
                # Ha ide jutunk, akkor nem tudtuk értelmezni az adatot
                raise ValueError(f"Ismeretlen formátumú adat: {type(row)} - {row}")
                
        except Exception as e:
            print(f"Hiba a lakos CSV sorából történő létrehozásakor: {e}")
            raise 