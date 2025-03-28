"""
Projekt modell osztály a városfejlesztési szimulátorhoz
"""
import uuid
from datetime import datetime, timedelta
from alomvaros_szimulator.config import UJ_EPULET_ELEGEDETTSEG_NOVELES, KARBANTARTAS_ELEGEDETTSEG_NOVELES


class Projekt:
    """
    Projekt osztály, amely a város fejlesztési projektjeinek adatait tárolja és kezeli.
    """
    
    def __init__(self, azonosito, nev, tipus, koltseg, kezdo_datum, befejezo_datum, 
                erintett_epuletek=None, uj_epulet_adatok=None):
        """
        Projekt létrehozása
        
        :param azonosito: Projekt egyedi azonosítója
        :param nev: Projekt neve
        :param tipus: Projekt típusa (pl. új építés, karbantartás, felújítás)
        :param koltseg: Projekt teljes költsége
        :param kezdo_datum: Projekt kezdő dátuma
        :param befejezo_datum: Projekt befejező dátuma
        :param erintett_epuletek: Érintett épületek azonosítóinak listája (opcionális)
        :param uj_epulet_adatok: Új épület adatai, ha építési projektről van szó (opcionális)
        """
        self.azonosito = azonosito
        self.nev = nev
        self.tipus = tipus
        self.koltseg = koltseg
        self.kezdo_datum = kezdo_datum
        self.befejezo_datum = befejezo_datum
        self.erintett_epuletek = erintett_epuletek if erintett_epuletek is not None else []
        self.uj_epulet_adatok = uj_epulet_adatok
        self.befejezett = False
        self.eltelt_ido = 0  # Eltelt idő napokban
    
    @property
    def idotartam(self):
        """
        Projekt időtartama napokban
        
        :return: Napok száma
        """
        # Biztosítjuk, hogy mindkét dátum ugyanolyan típusú (date) legyen a kivonás előtt
        kezdo = self.kezdo_datum
        befejezo = self.befejezo_datum
        
        # Ha datetime objektum, konvertáljuk date-re
        if isinstance(kezdo, datetime):
            kezdo = kezdo.date()
        if isinstance(befejezo, datetime):
            befejezo = befejezo.date()
            
        return (befejezo - kezdo).days
    
    def szamol_eltelt_ido(self):
        """
        A projekt kezdete óta eltelt idő kiszámítása napokban
        
        :return: Eltelt napok száma
        """
        from datetime import datetime
        aktualis_datum = datetime.now().date()
        
        # Ha még nem kezdődött el a projekt
        if aktualis_datum < self.kezdo_datum:
            return 0
            
        # Ha már befejeződött a projekt
        if aktualis_datum > self.befejezo_datum:
            return self.idotartam
            
        # Ha folyamatban van a projekt
        return (aktualis_datum - self.kezdo_datum).days
    
    def havi_koltseg(self, aktualis_datum=None):
        """
        Projekt havi költsége. Az összes költség egyenlően elosztva a projekt időtartama alatt.
        
        :param aktualis_datum: Aktuális dátum, amelyre a költséget számoljuk (opcionális)
        :return: Adott havi költség
        """
        if aktualis_datum is None:
            aktualis_datum = datetime.now().date()
        
        # Ha még nem kezdődött el vagy már befejeződött a projekt, akkor nincs költség
        if aktualis_datum < self.kezdo_datum or aktualis_datum > self.befejezo_datum:
            return 0
        
        # Teljes időtartam hónapokban (kerekítve felfelé)
        honapok = (self.idotartam // 30) + 1
        
        # Havi költség
        return self.koltseg / honapok
    
    def van_hatasa_datumkor(self, datum):
        """
        Ellenőrzi, hogy a projektnek van-e hatása az adott dátumon
        (pl. befejeződik a projekt és elkészül egy épület)
        
        :param datum: Ellenőrizendő dátum
        :return: True, ha van hatása a projektnekv
        """
        # Ha befejeződött a projekt az adott napon, akkor van hatása
        return datum == self.befejezo_datum and not self.befejezett
    
    def befejez(self):
        """
        Projekt befejezése, hatások érvényesítése
        
        :return: Projekt hatásai szótár formában
        """
        if self.befejezett:
            return None
            
        self.befejezett = True
        
        hatások = {
            'tipus': self.tipus,
            'uj_epulet': self.uj_epulet_adatok,
            'erintett_epuletek': self.erintett_epuletek.copy(),
            'elegedettseg_valtozas': 0
        }
        
        # Hatások típus alapján
        if self.tipus.lower() == "új építés":
            hatások['elegedettseg_valtozas'] = UJ_EPULET_ELEGEDETTSEG_NOVELES
        
        elif self.tipus.lower() in ["karbantartás", "felújítás"]:
            hatások['elegedettseg_valtozas'] = KARBANTARTAS_ELEGEDETTSEG_NOVELES
        
        return hatások
    
    def to_dict(self):
        """
        Projekt adatait szótárrá alakítja
        
        :return: Projekt adatai szótár formátumban
        """
        return {
            'azonosito': self.azonosito,
            'nev': self.nev,
            'tipus': self.tipus,
            'koltseg': self.koltseg,
            'kezdo_datum': str(self.kezdo_datum),
            'befejezo_datum': str(self.befejezo_datum),
            'erintett_epuletek': self.erintett_epuletek,
            'uj_epulet_adatok': self.uj_epulet_adatok,
            'befejezett': self.befejezett,
            'eltelt_ido': self.eltelt_ido
        }
    
    def __str__(self):
        """
        Projekt string reprezentációja
        
        :return: Olvasható string a projekt adataival
        """
        status = "befejezett" if self.befejezett else f"folyamatban ({self.koltseg} Ft)"
        return f"{self.nev} ({self.tipus}, {str(self.kezdo_datum)} - {str(self.befejezo_datum)}, {status})"
    
    @classmethod
    def from_dict(cls, data):
        """
        Projekt létrehozása szótárból
        
        :param data: Projekt adatait tartalmazó szótár
        :return: Új Projekt objektum
        """
        from datetime import datetime
        
        # Dátumok kezelése
        kezdo_datum = None
        befejezo_datum = None
        
        if 'kezdo_datum' in data:
            try:
                kezdo_datum = datetime.fromisoformat(data['kezdo_datum']).date()
            except ValueError:
                try:
                    kezdo_datum = datetime.strptime(data['kezdo_datum'], '%Y-%m-%d').date()
                except ValueError:
                    kezdo_datum = datetime.now().date()
        
        if 'befejezo_datum' in data:
            try:
                befejezo_datum = datetime.fromisoformat(data['befejezo_datum']).date()
            except ValueError:
                try:
                    befejezo_datum = datetime.strptime(data['befejezo_datum'], '%Y-%m-%d').date()
                except ValueError:
                    befejezo_datum = datetime.now().date()
        
        # Projekt létrehozása
        projekt = cls(
            azonosito=data['azonosito'],
            nev=data['nev'],
            tipus=data['tipus'],
            koltseg=data['koltseg'],
            kezdo_datum=kezdo_datum,
            befejezo_datum=befejezo_datum,
            erintett_epuletek=data.get('erintett_epuletek', []),
            uj_epulet_adatok=data.get('uj_epulet_adatok', None)
        )
        
        # Befejezettség állapot beállítása
        projekt.befejezett = data.get('befejezett', False)
        
        # Eltelt idő beállítása, ha rendelkezésre áll az adatokban
        if 'eltelt_ido' in data:
            projekt.eltelt_ido = data.get('eltelt_ido', 0)
        
        return projekt
    
    @classmethod
    def from_csv_row(cls, row):
        """
        Projekt létrehozása CSV sor alapján
        
        :param row: CSV sor (dict vagy list)
        :return: Új Projekt objektum
        """
        if isinstance(row, dict):
            import pandas as pd
            from datetime import datetime
            
            # Oszlopnevek normalizálása
            id_field = None
            if 'azonosito' in row:
                id_field = 'azonosito'
            elif 'id' in row:
                id_field = 'id'
            elif 'Projekt_azonosito' in row:
                id_field = 'Projekt_azonosito'
            
            nev_field = 'nev'
            tipus_field = 'tipus'
            koltseg_field = None
            if 'koltseg' in row:
                koltseg_field = 'koltseg'
            
            kezdo_datum_field = None
            if 'kezdo_datum' in row:
                kezdo_datum_field = 'kezdo_datum'
            elif 'kezdo_d' in row:
                kezdo_datum_field = 'kezdo_d'
            
            befejezo_datum_field = None
            if 'befejezo_datum' in row:
                befejezo_datum_field = 'befejezo_datum'
            elif 'befejezo_d' in row:
                befejezo_datum_field = 'befejezo_d'
            
            erintett_epuletek_field = 'erintett_epuletek'
            
            # Kötelező mezők ellenőrzése
            if id_field is None:
                raise ValueError("Hiányzó kötelező mező: azonosító (azonosito/id/Projekt_azonosito)")
            if nev_field not in row:
                raise ValueError("Hiányzó kötelező mező: nev")
            if koltseg_field is None:
                raise ValueError("Hiányzó kötelező mező: koltseg")
            
            # Azonosító konvertálása
            try:
                azonosito = int(row[id_field])
            except (ValueError, TypeError):
                print(f"Figyelmeztetés: Hibás azonosító érték: {row[id_field]}, alapértelmezett 1 lesz használva.")
                azonosito = 1
            
            # Név
            nev = str(row[nev_field]) if nev_field in row else "Ismeretlen projekt"
            
            # Típus
            tipus = str(row.get(tipus_field, 'fejlesztés'))
            
            # Költség konvertálása
            try:
                koltseg = float(row[koltseg_field])
            except (ValueError, TypeError):
                print(f"Figyelmeztetés: Hibás költség érték: {row[koltseg_field]}, alapértelmezett 1000000 Ft lesz használva.")
                koltseg = 1000000
            
            # Dátumok kezelése
            kezdo_datum = None
            befejezo_datum = None
            
            if kezdo_datum_field and kezdo_datum_field in row and pd.notna(row[kezdo_datum_field]):
                try:
                    from datetime import datetime
                    datum_str = str(row[kezdo_datum_field]).strip()
                    kezdo_datum = datetime.strptime(datum_str, '%Y-%m-%d').date()
                except ValueError:
                    # Próbáljunk meg más formátumokat is
                    try:
                        from dateutil import parser
                        kezdo_datum = parser.parse(datum_str).date()
                    except:
                        print(f"Figyelmeztetés: Nem sikerült feldolgozni a kezdő dátumot: {row[kezdo_datum_field]}")
            
            if befejezo_datum_field and befejezo_datum_field in row and pd.notna(row[befejezo_datum_field]):
                try:
                    from datetime import datetime
                    datum_str = str(row[befejezo_datum_field]).strip()
                    befejezo_datum = datetime.strptime(datum_str, '%Y-%m-%d').date()
                except ValueError:
                    # Próbáljunk meg más formátumokat is
                    try:
                        from dateutil import parser
                        befejezo_datum = parser.parse(datum_str).date()
                    except:
                        print(f"Figyelmeztetés: Nem sikerült feldolgozni a befejező dátumot: {row[befejezo_datum_field]}")
            
            # Érintett épületek feldolgozása
            erintett_epuletek = []
            if erintett_epuletek_field in row and pd.notna(row[erintett_epuletek_field]):
                try:
                    epulet_str = str(row[erintett_epuletek_field])
                    # Ha a formátum {1,2,3}, akkor ezt dolgozzuk fel
                    if epulet_str.startswith('{') and epulet_str.endswith('}'):
                        epulet_lista = epulet_str.strip('{}').split(',')
                        erintett_epuletek = [int(e.strip()) for e in epulet_lista if e.strip() and e.strip().isdigit()]
                    else:
                        # Egyébként vesszővel elválasztott lista
                        erintett_epuletek = [int(e.strip()) for e in epulet_str.split(',') if e.strip() and e.strip().isdigit()]
                except Exception as e:
                    print(f"Figyelmeztetés: Nem sikerült feldolgozni az érintett épületeket: {row[erintett_epuletek_field]} - {str(e)}")
            
            # Új épület adatok (ha van)
            uj_epulet_adatok = row.get('uj_epulet_adatok', None)
            
            return cls(
                azonosito=azonosito,
                nev=nev,
                tipus=tipus,
                koltseg=koltseg,
                kezdo_datum=kezdo_datum,
                befejezo_datum=befejezo_datum,
                erintett_epuletek=erintett_epuletek,
                uj_epulet_adatok=uj_epulet_adatok
            )
        else:
            # Ha lista vagy Series, feltételezzük a megfelelő sorrendet
            import pandas as pd
            from datetime import datetime
            
            if len(row) < 4:
                raise ValueError(f"Nem elegendő adat a projekt létrehozásához: {row}")
            
            try:
                # Azonosító
                try:
                    azonosito = int(row[0])
                except (ValueError, TypeError):
                    print(f"Figyelmeztetés: Hibás azonosító érték, alapértelmezett 1 lesz használva.")
                    azonosito = 1
                
                # Név
                nev = str(row[1])
                
                # Típus
                tipus = str(row[2]) if len(row) > 2 and pd.notna(row[2]) else 'fejlesztés'
                
                # Költség
                try:
                    koltseg = float(row[3])
                except (ValueError, TypeError):
                    print(f"Figyelmeztetés: Hibás költség érték, alapértelmezett 1000000 Ft lesz használva.")
                    koltseg = 1000000
                
                # Dátumok
                kezdo_datum = None
                if len(row) > 4 and pd.notna(row[4]):
                    try:
                        datum_str = str(row[4]).strip()
                        kezdo_datum = datetime.strptime(datum_str, '%Y-%m-%d').date()
                    except ValueError:
                        try:
                            from dateutil import parser
                            kezdo_datum = parser.parse(datum_str).date()
                        except:
                            print(f"Figyelmeztetés: Nem sikerült feldolgozni a kezdő dátumot.")
                
                befejezo_datum = None
                if len(row) > 5 and pd.notna(row[5]):
                    try:
                        datum_str = str(row[5]).strip()
                        befejezo_datum = datetime.strptime(datum_str, '%Y-%m-%d').date()
                    except ValueError:
                        try:
                            from dateutil import parser
                            befejezo_datum = parser.parse(datum_str).date()
                        except:
                            print(f"Figyelmeztetés: Nem sikerült feldolgozni a befejező dátumot.")
                
                # Érintett épületek
                erintett_epuletek = []
                if len(row) > 6 and pd.notna(row[6]):
                    try:
                        epulet_str = str(row[6])
                        if epulet_str.startswith('{') and epulet_str.endswith('}'):
                            epulet_lista = epulet_str.strip('{}').split(',')
                            erintett_epuletek = [int(e.strip()) for e in epulet_lista if e.strip() and e.strip().isdigit()]
                        else:
                            erintett_epuletek = [int(e.strip()) for e in epulet_str.split(',') if e.strip() and e.strip().isdigit()]
                    except Exception as e:
                        print(f"Figyelmeztetés: Nem sikerült feldolgozni az érintett épületeket: {str(e)}")
                
                # Új épület adatok
                uj_epulet_adatok = row[7] if len(row) > 7 and pd.notna(row[7]) else None
                
                return cls(
                    azonosito=azonosito,
                    nev=nev,
                    tipus=tipus,
                    koltseg=koltseg,
                    kezdo_datum=kezdo_datum,
                    befejezo_datum=befejezo_datum,
                    erintett_epuletek=erintett_epuletek,
                    uj_epulet_adatok=uj_epulet_adatok
                )
            except Exception as e:
                print(f"Hiba a projekt adatok feldolgozásakor: {e}, adat: {row}")
                # Alapértékekkel létrehozzuk, hogy ne szakadjon meg a betöltés
                return cls(
                    azonosito=1,
                    nev="Ismeretlen projekt",
                    tipus="fejlesztés",
                    koltseg=1000000,
                    kezdo_datum=datetime.now().date(),
                    befejezo_datum=datetime.now().date(),
                    erintett_epuletek=[],
                    uj_epulet_adatok=None
                ) 
    
    @property
    def aktiv(self):
        """
        A projekt aktív-e (folyamatban van)
        
        :return: True, ha a projekt aktív, False ha már befejeződött
        """
        return not self.befejezett 

    @property
    def aktualis_ido(self):
        """
        Projekt aktuális ideje (eltelt fordulók/hónapok)
        
        :return: Eltelt fordulók száma (1 forduló = 1 hónap)
        """
        # Átalakítjuk az eltelt időt fordulókra (hónapokra)
        # Feltételezzük, hogy 1 forduló = 1 hónap = 30 nap
        return self.eltelt_ido // 30
        
    @property
    def allapot(self):
        """
        Projekt állapota (befejezett vagy folyamatban)
        
        :return: Állapot string
        """
        return "befejezett" if self.befejezett else "folyamatban" 

    def elorehaladas(self, aktualis_datum):
        """
        Projekt előrehaladásának kezelése.
        Növeli az eltelt időt és ellenőrzi, hogy befejeződött-e a projekt.
        
        :param aktualis_datum: Az aktuális dátum
        :return: True, ha a projekt most fejeződött be, False egyébként
        """
        # Ha már befejezett, nem csinálunk semmit
        if self.befejezett:
            return False
            
        # Egy hónap (forduló) előrehaladás
        self.eltelt_ido += 30
        
        # Fordulók számának kiszámítása
        forduloban_eltelt_ido = self.eltelt_ido // 30
        ossz_fordulok = self.idotartam // 30
        
        # Log üzenet - debug célokból
        print(f"Projekt előrehaladás: {self.nev} - Eltelt idő: {self.eltelt_ido}/{self.idotartam} nap, Eltelt fordulók: {forduloban_eltelt_ido}/{ossz_fordulok}")
        
        # Ellenőrizzük, hogy befejeződött-e a projekt
        if self.eltelt_ido >= self.idotartam:
            # Meghívjuk a befejez metódust és visszaadjuk az eredményét
            self.befejez()
            return True
        
        return False
        
    @property
    def havi_bevetel(self):
        """
        Projekt havi bevétele befejezés után
        
        :return: Havi bevétel Ft-ban (alapértelmezetten 0)
        """
        return 0
        
    @property
    def lakossagi_tamogatottsag(self):
        """
        Projekt lakossági támogatottsága (0-100% között)
        
        :return: Támogatottság százalékban
        """
        # A projektek alapértelmezetten 50%-os támogatottságúak
        return 50 