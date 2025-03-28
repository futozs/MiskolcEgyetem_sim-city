"""
Pénzügyek modell osztály a városfejlesztési szimulátorhoz
"""

class Penzugyek:
    """
    Pénzügyek osztály, amely a város pénzügyi működésével kapcsolatos funkciókat kezeli.
    """
    
    def __init__(self, kezdeti_penz=100000000):
        """
        Pénzügyek inicializálása
        
        :param kezdeti_penz: Kezdeti egyenleg
        """
        self.egyenleg = kezdeti_penz
        self.bevetel_lista = []
        self.koltseg_lista = []
        self.kulso_tamogatasok = []
    
    def bevetel_hozzaadasa(self, osszeg, leiras=None):
        """
        Bevétel hozzáadása az egyenleghez
        
        :param osszeg: A bevétel összege
        :param leiras: A bevétel leírása
        """
        self.egyenleg += osszeg
        tranzakcio = {
            'datum': None,  # Ezt majd a város beállítja
            'osszeg': osszeg,
            'tipus': 'bevétel',
            'leiras': leiras or 'Általános bevétel'
        }
        self.bevetel_lista.append(tranzakcio)
        return True
    
    def koltseg_hozzaadasa(self, osszeg, leiras=None):
        """
        Költség levonása az egyenlegről
        
        :param osszeg: A költség összege
        :param leiras: A költség leírása
        :return: True, ha sikerült a levonás, False, ha nincs elég pénz
        """
        self.egyenleg -= osszeg
        tranzakcio = {
            'datum': None,  # Ezt majd a város beállítja
            'osszeg': osszeg,
            'tipus': 'költség',
            'leiras': leiras or 'Általános költség'
        }
        self.koltseg_lista.append(tranzakcio)
        return True
    
    def kulso_tamogatas_hozzaadasa(self, osszeg, leiras=None):
        """
        Külső támogatás (pl. állami) hozzáadása az egyenleghez
        
        :param osszeg: A támogatás összege
        :param leiras: A támogatás leírása
        """
        self.egyenleg += osszeg
        tamogatas = {
            'datum': None,  # Ezt majd a város beállítja
            'osszeg': osszeg,
            'leiras': leiras or 'Külső támogatás'
        }
        self.kulso_tamogatasok.append(tamogatas)
        self.bevetel_lista.append({
            'datum': None,
            'osszeg': osszeg,
            'tipus': 'támogatás',
            'leiras': leiras or 'Külső támogatás'
        })
        return True
    
    def havi_adobevetel_hozzaadasa(self, osszeg):
        """
        Havi adóbevétel hozzáadása az egyenleghez
        
        :param osszeg: A havi adóbevétel összege
        """
        return self.bevetel_hozzaadasa(osszeg, "Havi adóbevétel")
    
    def to_dict(self):
        """
        Pénzügyek adatainak szótárrá alakítása
        
        :return: Pénzügyek adatai szótár formátumban
        """
        return {
            'egyenleg': self.egyenleg,
            'bevetel_lista': self.bevetel_lista,
            'koltseg_lista': self.koltseg_lista,
            'kulso_tamogatasok': self.kulso_tamogatasok
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        Pénzügyek objektum létrehozása szótárból
        
        :param data: Pénzügyek adatai szótár formátumban
        :return: Új Pénzügyek objektum
        """
        penzugyek = cls(kezdeti_penz=data.get('egyenleg', 0))
        penzugyek.bevetel_lista = data.get('bevetel_lista', [])
        penzugyek.koltseg_lista = data.get('koltseg_lista', [])
        penzugyek.kulso_tamogatasok = data.get('kulso_tamogatasok', [])
        return penzugyek
    
    def __str__(self):
        """
        Pénzügyek string reprezentációja
        
        :return: Olvasható string a pénzügyek adataival
        """
        return f"Pénzügyi egyenleg: {self.egyenleg:,} Ft" 