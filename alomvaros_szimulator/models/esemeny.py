"""
Esemény modell osztály a városfejlesztési szimulátorhoz
"""
import random


class Esemeny:
    """
    Esemény osztály, amely a város véletlenszerű eseményeinek adatait tárolja és kezeli.
    """
    
    def __init__(self, azonosito, nev, valoszinuseg, penzugyi_hatas, elegedettsegi_hatas, leiras=None, tipus=None, lakossag_hatas=0):
        """
        Esemény létrehozása
        
        :param azonosito: Esemény egyedi azonosítója
        :param nev: Esemény neve
        :param valoszinuseg: Esemény előfordulási valószínűsége (0-1 között)
        :param penzugyi_hatas: Esemény pénzügyi hatása (lehet pozitív vagy negatív)
        :param elegedettsegi_hatas: Esemény lakosság elégedettségére gyakorolt hatása (lehet pozitív vagy negatív)
        :param leiras: Esemény részletes leírása (opcionális)
        :param tipus: Esemény típusa (pl. pozitív, negatív, stb.)
        :param lakossag_hatas: Esemény lakosságra gyakorolt hatása (lehet pozitív vagy negatív)
        """
        self.azonosito = azonosito
        self.nev = nev
        self.valoszinuseg = valoszinuseg
        self.penzugyi_hatas = penzugyi_hatas
        self.elegedettsegi_hatas = elegedettsegi_hatas
        # Kompatibilitási okokból mindkét névváltozatot támogatjuk
        self.elegedettseg_hatas = elegedettsegi_hatas
        self.leiras = leiras if leiras is not None else nev
        self.tipus = tipus
        self.lakossag_hatas = lakossag_hatas
    
    @classmethod
    def from_dict(cls, data):
        """
        Esemény objektum létrehozása szótárból
        
        :param data: Az esemény adatai szótár formátumban
        :return: Új Esemény objektum
        """
        return cls(
            azonosito=data.get('azonosito', 0),
            nev=data.get('nev', 'Ismeretlen esemény'),
            valoszinuseg=data.get('valoszinuseg', 0.0),
            penzugyi_hatas=data.get('penzugyi_hatas', 0),
            elegedettsegi_hatas=data.get('elegedettsegi_hatas', 0),
            leiras=data.get('leiras', None),
            tipus=data.get('tipus', None),
            lakossag_hatas=data.get('lakossag_hatas', 0)
        )
    
    def to_dict(self):
        """
        Esemény adatait szótárrá alakítja
        
        :return: Esemény adatai szótár formátumban
        """
        return {
            'azonosito': self.azonosito,
            'nev': self.nev,
            'valoszinuseg': self.valoszinuseg,
            'penzugyi_hatas': self.penzugyi_hatas,
            'elegedettsegi_hatas': self.elegedettsegi_hatas,
            'elegedettseg_hatas': self.elegedettseg_hatas,
            'leiras': self.leiras,
            'tipus': self.tipus,
            'lakossag_hatas': self.lakossag_hatas
        }
    
    def __str__(self):
        """
        Esemény string reprezentációja
        
        :return: Olvasható string az esemény adataival
        """
        penz_str = f"{self.penzugyi_hatas:+,} Ft" if self.penzugyi_hatas != 0 else "nincs pénzügyi hatás"
        eleg_str = f"{self.elegedettsegi_hatas:+}%" if self.elegedettsegi_hatas != 0 else "nincs hatás az elégedettségre"
        return f"{self.nev}: {self.leiras} ({penz_str}, {eleg_str})"


class EsemenyGenerator:
    """
    Osztály, amely véletlenszerű eseményeket generál a valószínűségük alapján.
    """
    
    def __init__(self, esemenyek):
        """
        Esemény generátor létrehozása
        
        :param esemenyek: Események listája (Esemeny objektumok)
        """
        self.esemenyek = esemenyek
        
        # Valószínűségek összege ellenőrzése
        osszeg = sum(esemeny.valoszinuseg for esemeny in esemenyek)
        if abs(osszeg - 1.0) > 0.01:  # Kis eltérést megengedünk a kerekítési hibák miatt
            print(f"Figyelmeztetés: Az események valószínűségének összege nem 1.0 ({osszeg})")
            # Normalizáljuk a valószínűségeket, hogy összegük 1.0 legyen
            for esemeny in esemenyek:
                esemeny.valoszinuseg /= osszeg
    
    def veletlen_esemeny(self):
        """
        Kiválaszt egy véletlenszerű eseményt a valószínűségük alapján
        
        :return: A kiválasztott Esemeny objektum
        """
        r = random.random()  # 0.0 - 1.0 közötti véletlen szám
        
        # Kumulatív valószínűség alapján választjuk ki az eseményt
        kumulativ = 0.0
        for esemeny in self.esemenyek:
            kumulativ += esemeny.valoszinuseg
            if r <= kumulativ:
                return esemeny
        
        # Ha valamiért nem választottunk eseményt (pl. kerekítési hiba miatt), az utolsót adjuk vissza
        return self.esemenyek[-1]
    
    @classmethod
    def alap_esemenyek(cls):
        """
        Létrehoz alapértelmezett eseményeket
        
        :return: EsemenyGenerator objektum az alapértelmezett eseményekkel
        """
        esemenyek = [
            Esemeny(1, "Nem történt semmi", 0.5, 0, 0, "Minden a megszokott mederben folyik.", None, 0),
            Esemeny(2, "Gazdasági fellendülés", 0.1, 5000000, 5, "A helyi vállalkozások virágoznak, ez növeli a városi bevételeket.", None, 0),
            Esemeny(3, "Természeti katasztrófa", 0.05, -8000000, -10, "Árvíz vagy vihar okozott károkat a városban.", None, 0),
            Esemeny(4, "Kulturális fesztivál", 0.15, -1000000, 7, "Sikeres kulturális fesztivál növelte a város hírnevét.", None, 0),
            Esemeny(5, "Infrastruktúra meghibásodás", 0.15, -3000000, -5, "Váratlan meghibásodás a közmű-hálózatban.", None, 0),
            Esemeny(6, "Állami támogatás", 0.05, 10000000, 3, "A város extra állami támogatást kapott fejlesztésre.", None, 0)
        ]
        return cls(esemenyek) 