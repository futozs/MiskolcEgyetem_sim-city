"""
Szolgáltatás modell osztály a városfejlesztési szimulátorhoz
"""
import uuid
from datetime import datetime
import pandas as pd
from alomvaros_szimulator.config import ALLAMI_TAMOGATAS_SZAZALEK


class Szolgaltatas:
    """
    Szolgáltatás osztály, amely a város szolgáltatásainak adatait tárolja és kezeli.
    """
    
    def __init__(self, azonosito, nev, tipus, havi_koltseg, elegedettseg_hatas=0, lakossag_hatas=0, indulas_datum=None, ertek=1):
        """
        Szolgáltatás létrehozása
        
        :param azonosito: Szolgáltatás egyedi azonosítója
        :param nev: Szolgáltatás neve
        :param tipus: Szolgáltatás típusa (pl. közlekedés, oktatás, stb.)
        :param havi_koltseg: Szolgáltatás havi költsége
        :param elegedettseg_hatas: A szolgáltatás hatása a lakosság elégedettségére (százalékpontban)
        :param lakossag_hatas: A szolgáltatás hatása a lakosság számára
        :param indulas_datum: Szolgáltatás indulási dátuma (opcionális)
        :param ertek: Szolgáltatás értéke a lakosság számára (1-10 skálán)
        """
        self.azonosito = azonosito
        self.nev = nev
        self.tipus = tipus
        self.havi_koltseg = havi_koltseg
        self.elegedettseg_hatas = elegedettseg_hatas
        self.lakossag_hatas = lakossag_hatas
        self.ertek = ertek
        
        # Ha nem kaptunk indulási dátumot, az aktuális dátumot állítjuk be
        if indulas_datum is None:
            self.indulas_datum = datetime.now().date()
        else:
            self.indulas_datum = indulas_datum
        
        self.aktiv = True  # Alapértelmezetten a szolgáltatás aktív
    
    def megszuntet(self):
        """
        Szolgáltatás megszüntetése
        
        :return: True, ha sikeres volt a megszüntetés
        """
        if self.aktiv:
            self.aktiv = False
            return True
        return False
    
    def ujraindit(self):
        """
        Szolgáltatás újraindítása, ha korábban megszüntették
        
        :return: True, ha sikeres volt az újraindítás
        """
        if not self.aktiv:
            self.aktiv = True
            self.indulas_datum = datetime.now().date()
            return True
        return False
    
    def havi_tamogatas_szamolas(self):
        """
        Kiszámolja a szolgáltatásra kapott állami támogatást havonta
        
        :return: Állami támogatás összege
        """
        return self.havi_koltseg * ALLAMI_TAMOGATAS_SZAZALEK / 100
    
    def to_dict(self):
        """
        Szolgáltatás adatainak szótárrá alakítása
        
        :return: Szolgáltatás adatait tartalmazó szótár
        """
        return {
            'azonosito': self.azonosito,
            'nev': self.nev,
            'tipus': self.tipus,
            'havi_koltseg': self.havi_koltseg,
            'elegedettseg_hatas': self.elegedettseg_hatas,
            'lakossag_hatas': self.lakossag_hatas,
            'ertek': self.ertek,
            'indulas_datum': self.indulas_datum.isoformat() if hasattr(self.indulas_datum, 'isoformat') else str(self.indulas_datum),
            'aktiv': self.aktiv
        }
    
    def __str__(self):
        """
        Szolgáltatás string reprezentációja
        
        :return: Olvasható string a szolgáltatás adataival
        """
        status = "aktív" if self.aktiv else "inaktív"
        return f"{self.nev} ({self.tipus}, {self.havi_koltseg} Ft/hó, {status})"
    
    @classmethod
    def from_dict(cls, data):
        """
        Szolgáltatás létrehozása szótárból
        
        :param data: Szolgáltatás adatait tartalmazó szótár
        :return: Új Szolgaltatas objektum
        """
        from datetime import datetime
        
        indulas_datum = None
        if 'indulas_datum' in data:
            try:
                indulas_datum = datetime.fromisoformat(data['indulas_datum']).date()
            except ValueError:
                # Ha nem ISO formátumú, megpróbáljuk más formátumban
                try:
                    indulas_datum = datetime.strptime(data['indulas_datum'], '%Y-%m-%d').date()
                except ValueError:
                    # Ha ez sem sikerül, alapértelmezett érték lesz
                    indulas_datum = None
        
        szolgaltatas = cls(
            azonosito=data['azonosito'],
            nev=data['nev'],
            tipus=data['tipus'],
            havi_koltseg=data['havi_koltseg'],
            elegedettseg_hatas=data.get('elegedettseg_hatas', 0),
            lakossag_hatas=data.get('lakossag_hatas', 0),
            indulas_datum=indulas_datum,
            ertek=data.get('ertek', 1)
        )
        
        # Aktivitás beállítása
        szolgaltatas.aktiv = data.get('aktiv', True)
        
        return szolgaltatas

    @classmethod
    def from_csv_row(cls, row):
        """
        CSV sorból szolgáltatás objektumot hoz létre
        
        :param row: CSV sor (dict vagy list)
        :return: Új Szolgaltatas objektum
        """
        try:
            if isinstance(row, dict):
                # Azonosító kezelése - különböző lehetséges nevek
                azonosito = None
                if 'azonosito' in row:
                    azonosito = int(row['azonosito'])
                elif 'szolgáltatás_azonosító' in row or 'szolgaltatas_azonosito' in row:
                    azonosito = int(row.get('szolgáltatás_azonosító', row.get('szolgaltatas_azonosito')))
                elif 'id' in row:
                    azonosito = int(row['id'])
                
                # Név kezelése
                nev = None
                if 'nev' in row:
                    nev = row['nev']
                elif 'név' in row:
                    nev = row['név']
                    
                # Típus kezelése
                tipus = None
                if 'tipus' in row:
                    tipus = row['tipus']
                elif 'típus' in row:
                    tipus = row['típus']
                
                # Épület azonosító
                epulet_id = None
                if 'epulet_id' in row or 'épület_azonosító' in row:
                    epulet_id = int(row.get('epulet_id', row.get('épület_azonosító')))
                elif 'epulet_azonosito' in row:
                    epulet_id = int(row['epulet_azonosito'])
                
                # Havi költség alapértelmezett érték
                havi_koltseg = 10000  # Alapértelmezett havi költség
                if 'havi_koltseg' in row:
                    try:
                        havi_koltseg = float(row['havi_koltseg'])
                    except:
                        pass
                
                # Elégedettség hatás alapértelmezett érték
                elegedettseg_hatas = 5  # Alapértelmezett pozitív hatás
                if 'elegedettseg_hatas' in row:
                    try:
                        elegedettseg_hatas = float(row['elegedettseg_hatas'])
                    except:
                        pass
                
                # Kötelező mezők ellenőrzése
                if azonosito is None:
                    raise ValueError("Hiányzó azonosító")
                if nev is None:
                    raise ValueError("Hiányzó név")
                if tipus is None:
                    raise ValueError("Hiányzó típus")
                
                # Szolgáltatás létrehozása
                szolgaltatas = cls(
                    azonosito=azonosito,
                    nev=nev,
                    tipus=tipus,
                    havi_koltseg=havi_koltseg,
                    elegedettseg_hatas=elegedettseg_hatas
                )
                
                # Ha van épület azonosító, akkor beállítjuk
                if epulet_id is not None:
                    # A szolgáltatást egy épülethez kötjük
                    # Ezt a logikát később kell majd kiegészíteni, ha több épülethez is tartozhat
                    szolgaltatas.epulet_id = epulet_id
                
                return szolgaltatas
            else:
                # Lista esetén feltételezzük a sorrendet: [azonosito, nev, tipus, epulet_id]
                if len(row) < 4:
                    raise ValueError(f"Nem elegendő adat a szolgáltatás létrehozásához: {row}")
                
                # Alap értékek kinyerése
                azonosito = int(row[0])
                nev = str(row[1])
                tipus = str(row[2])
                epulet_id = int(row[3])
                
                # Alapértelmezett értékek
                havi_koltseg = 10000  # Alapértelmezett havi költség
                elegedettseg_hatas = 5  # Alapértelmezett pozitív hatás
                
                # Szolgáltatás létrehozása
                szolgaltatas = cls(
                    azonosito=azonosito,
                    nev=nev,
                    tipus=tipus,
                    havi_koltseg=havi_koltseg,
                    elegedettseg_hatas=elegedettseg_hatas
                )
                
                # Épület azonosító beállítása
                szolgaltatas.epulet_id = epulet_id
                
                return szolgaltatas
                
        except Exception as e:
            print(f"Hiba a szolgáltatás CSV sorából történő létrehozásakor: {e}")
            raise 