"""
Forduló Manager modul a játék fordulóinak kezelésére
"""
from datetime import datetime, timedelta
import math
import os
import json
import random
import pandas as pd

from alomvaros_szimulator.config import (
    KIMENET_MAPPA, 
    ALLAMI_TAMOGATAS_SZAZALEK, 
    BEALLITASOK, 
    EPULET_ALLAPOT
)
from alomvaros_szimulator.models.epulet import Epulet


class ForduloManager:
    """
    Forduló Manager osztály, ami a játék fordulóinak kezelésért felelős
    """
    
    def __init__(self, game_engine):
        """
        Forduló Manager inicializálása
        
        :param game_engine: A játék motor, amelyhez a forduló manager kapcsolódik
        """
        self.game_engine = game_engine
        self.fordulo_esemenyek = []
        self.fordulo_statisztikak = {}
        self.gyorsitas = 1  # Hány forduló fut le egy lépésben
        self.auto_fordulo = False  # Automatikusan lépjen-e a következő fordulóra
        self.auto_fordulo_ido = 5  # Másodperc két automatikus forduló között
        self.utolso_fordulo_ideje = datetime.now()
        self.esemenyek_naplo = []  # Események naplója (fordulónként elválasztva)
    
    def fordulo_vegrehajtasa(self):
        """
        Egy új forduló végrehajtása
        
        :return: A fordulóban történt események és statisztikák
        """
        # Új forduló végrehajtása a játékmotoron keresztül
        esemenyek = self.game_engine.kovetkezo_fordulo()
        
        # Statisztikák gyűjtése
        self.statisztikak_gyujtese()
        
        # Forduló események tárolása
        self.fordulo_esemenyek.append({
            'fordulo_szam': self.game_engine.fordulo_szamlalo,
            'esemenyek': esemenyek,
            'statisztikak': self.fordulo_statisztikak.get(self.game_engine.fordulo_szamlalo, {})
        })
        
        return {
            'fordulo_szam': self.game_engine.fordulo_szamlalo,
            'esemenyek': esemenyek,
            'statisztikak': self.fordulo_statisztikak.get(self.game_engine.fordulo_szamlalo, {})
        }
    
    def statisztikak_gyujtese(self):
        """
        Statisztikák gyűjtése az aktuális fordulóról
        """
        if not self.game_engine.varos:
            return
        
        varos = self.game_engine.varos
        
        # Alapvető statisztikák összegyűjtése
        statisztika = {
            'fordulo_szam': self.game_engine.fordulo_szamlalo,
            'lakossag': varos.lakossag_szama,
            'penz': varos.penzugyi_keret,
            'boldogsag': varos.lakossag_elegedettseg,
            'kornyezeti_hatas': varos.kornyezeti_allapot,
            'epuletek_szama': len(varos.epuletek) if hasattr(varos, 'epuletek') else 0,
            'uzletek_szama': len(varos.uzletek) if hasattr(varos, 'uzletek') else 0,
            'bevetelek': varos.bevetel if hasattr(varos, 'bevetel') else 0,
            'kiadasok': varos.kiadas if hasattr(varos, 'kiadas') else 0,
            'adosav': varos.adosav,
            'gazdasagi_novekedes': varos.gazdasagi_novekedes
        }
        
        # Statisztikák tárolása
        self.fordulo_statisztikak[self.game_engine.fordulo_szamlalo] = statisztika
        
        return statisztika
    
    def get_utolso_fordulo_adatok(self):
        """
        Az utolsó forduló adatainak lekérése
        
        :return: Az utolsó forduló adatai, vagy üres szótár ha nincs még forduló
        """
        if not self.fordulo_esemenyek:
            return {}
        
        return self.fordulo_esemenyek[-1]
    
    def get_osszes_fordulo_statisztika(self):
        """
        Az összes forduló statisztikáinak lekérése
        
        :return: Szótár az összes forduló statisztikáival
        """
        return self.fordulo_statisztikak
    
    def csod_ellenorzes(self):
        """
        Ellenőrzi, hogy a város csődbe ment-e
        
        :return: True ha a város csődbe ment, False egyébként
        """
        if not self.game_engine.varos:
            return False
        
        varos = self.game_engine.varos
        
        # Csőd ellenőrzése - ha a pénz nullára vagy az alá csökkent
        if varos.penz <= 0:
            return True
        
        # Csőd ellenőrzése - ha a boldogság kritikusan alacsony
        if hasattr(varos, 'lakossag_elegedettseg') and varos.lakossag_elegedettseg < 10:
            return True
        
        # Csőd ellenőrzése - ha a lakosság kritikusan alacsony
        if varos.lakossag_szama < 100:
            return True
        
        return False
    
    def fordulo_lepes(self, gyorsitas=None):
        """
        Fordulók végrehajtása (egy vagy több forduló egyetlen lépésben)
        
        :param gyorsitas: Opcionálisan felülírhatjuk a gyorsítás értékét
        :return: Az utolsó forduló eseményei
        """
        if gyorsitas is not None and isinstance(gyorsitas, (int, float)):
            self.gyorsitas = max(1, gyorsitas)
        
        # Ellenőrizzük, hogy a game_engine objektumnak van-e jatek_aktiv attribútuma
        if not hasattr(self.game_engine, 'jatek_aktiv') or not self.game_engine.jatek_aktiv:
            print("Nincs aktív játék, nem lehet fordulót végrehajtani.")
            return []
        
        # Ellenőrizzük, hogy a város objektum elérhető-e
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            print("Nincs inicializált város objektum.")
            return []
            
        # Ellenőrizzük a lakosok számát, és aktiváljuk a játékot, ha szükséges
        if hasattr(self.game_engine.varos, 'lakosok_szama') and self.game_engine.varos.lakosok_szama <= 0:
            print("A város lakossága 0 vagy negatív, újrainicializálás szükséges.")
            # Lakosságszám korrigálása, hogy legalább 10 legyen
            self.game_engine.varos.lakossag_modositasa(max(10, 500 - self.game_engine.varos.lakosok_szama))
            print(f"Lakosságszám beállítva: {self.game_engine.varos.lakosok_szama}")
            # Játék aktiválása
            self.game_engine.jatek_aktiv = True
            self.game_engine.varos.jatek_vege = False
            self.game_engine.varos.jatek_vege_ok = None
            
        # Eseménykezelő létrehozása, ha még nem létezik
        from .event_manager import EventManager
        if not hasattr(self.game_engine, 'event_manager'):
            self.game_engine.event_manager = EventManager(self.game_engine)
            
        esemenyek = []
        for _ in range(self.gyorsitas):
            # Forduló indítása
            fordulo_esemenyek = self.game_engine.kovetkezo_fordulo()
            
            # Havi költségek kezelése
            havi_koltsegek_info = self._havi_koltsegek_kezelese()
            
            # Projektek előrehaladásának kezelése - biztosítjuk, hogy mindig megtörténjen
            self._projektek_kezelese()
            
            # Épületek állapotának romlása
            self._epuletek_allapot_kezelese()
            
            # Elégedettség hatások számítása
            self._elegedettseg_hatasok_szamitasa()
            
            # Események generálása, ha nincs még (mert a kovetkezo_fordulo nem generált)
            if not fordulo_esemenyek and hasattr(self.game_engine, 'event_manager'):
                fordulo_esemenyek = self.game_engine.event_manager.esemenyek_generalasa(self.game_engine.fordulo_szamlalo)
                if fordulo_esemenyek:
                    self.game_engine.event_manager.esemenyek_alkalmazasa(fordulo_esemenyek)
            
            # Forduló végén elmentjük az eseményeket
            esemenyek.extend(fordulo_esemenyek)
            
            # Eseménynapló frissítése
            self.esemenyek_naplo.append({
                'fordulo': self.game_engine.fordulo_szamlalo,
                'datum': self.game_engine.varos.aktualis_datum,
                'esemenyek': fordulo_esemenyek.copy(),
                'koltsegek': havi_koltsegek_info
            })
            
            # Automatikus naplófájl mentése minden forduló után
            self._automatikus_naplo_mentes(fordulo_esemenyek, havi_koltsegek_info)
            
            # Ha vége a játéknak, megszakítjuk a ciklust
            if not hasattr(self.game_engine, 'jatek_aktiv') or not self.game_engine.jatek_aktiv:
                break
        
        self.utolso_fordulo_ideje = datetime.now()
        return esemenyek
    
    def kovetkezo_fordulo(self):
        """
        Következő forduló végrehajtása
        
        :return: A forduló eseményeinek listája
        """
        try:
            # Ellenőrizzük, hogy van-e játék és az aktív-e
            if not hasattr(self.game_engine, 'jatek_aktiv') or not self.game_engine.jatek_aktiv:
                print("FIGYELEM: A játék nem aktív, nem lehet fordulót végrehajtani.")
                return []
            
            # Ellenőrizzük a lakosság számát
            if hasattr(self.game_engine.varos, 'lakosok_szama') and self.game_engine.varos.lakosok_szama <= 10:
                print("FIGYELEM: A városnak túl kevés lakosa van, új lakosok generálása...")
                if hasattr(self.game_engine.varos, '_lakosok_generalasa'):
                    self.game_engine.varos._lakosok_generalasa(500)
                
                # Biztosítsuk, hogy a játék aktív maradjon
                self.game_engine.jatek_aktiv = True
                self.game_engine.varos.jatek_vege = False
                self.game_engine.varos.jatek_vege_ok = None
                
                print(f"Lakosság helyreállítva: {self.game_engine.varos.lakosok_szama} fő")
            
            # Először a GameEngine kovetkezo_fordulo metódusát hívjuk meg, 
            # ami gondoskodik a megfelelő dátum frissítésről
            esemenyek = self.game_engine.kovetkezo_fordulo()
            
            # Explicit kezelése a projektek előrehaladásának
            self._projektek_kezelese()
            
            # Újra ellenőrizzük a játék állapotát a forduló végrehajtása után
            if not self.game_engine.jatek_aktiv:
                print("FIGYELEM: A játék véget ért a forduló végrehajtása után.")
                # Visszaállítjuk az aktív állapotot az első 3 fordulóban
                if self.game_engine.fordulo_szamlalo <= 3:
                    print(f"Az első 3 fordulóban vagyunk ({self.game_engine.fordulo_szamlalo}. forduló), játék folytatása.")
                    self.game_engine.jatek_aktiv = True
                    self.game_engine.varos.jatek_vege = False
                    self.game_engine.varos.jatek_vege_ok = None
            
            return esemenyek
            
        except Exception as e:
            print(f"Hiba a forduló végrehajtásakor: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    def kovetkezo_auto_fordulo_ido(self):
        """
        Kiszámolja, hogy mennyi idő van hátra a következő automatikus fordulóig
        
        :return: Hátralévő idő másodpercekben
        """
        if not self.auto_fordulo or not hasattr(self.game_engine, 'jatek_aktiv') or not self.game_engine.jatek_aktiv:
            return -1
        
        eltelt_ido = (datetime.now() - self.utolso_fordulo_ideje).total_seconds()
        hatralevo_ido = max(0, self.auto_fordulo_ido - eltelt_ido)
        
        return hatralevo_ido
    
    def auto_fordulo_idozites_ellenorzes(self):
        """
        Ellenőrzi, hogy indítani kell-e automatikus fordulót
        
        :return: True, ha indítani kell egy új fordulót
        """
        if not self.auto_fordulo or not hasattr(self.game_engine, 'jatek_aktiv') or not self.game_engine.jatek_aktiv:
            return False
        
        hatralevo_ido = self.kovetkezo_auto_fordulo_ido()
        return hatralevo_ido <= 0
    
    def auto_fordulo_beallitas(self, bekapcsolva, ido_masodperc=None):
        """
        Automatikus forduló beállítása
        
        :param bekapcsolva: Automatikus forduló be/ki kapcsolása
        :param ido_masodperc: Idő két forduló között másodpercben (opcionális)
        """
        self.auto_fordulo = bekapcsolva
        
        if ido_masodperc is not None:
            self.auto_fordulo_ido = max(1, ido_masodperc)
        
        # Ha bekapcsoltuk, inicializáljuk az időzítőt
        if bekapcsolva:
            self.utolso_fordulo_ideje = datetime.now()
    
    def auto_fordulo_inditasa(self, ido_masodperc=None):
        """
        Automatikus forduló indítása
        
        :param ido_masodperc: Idő két forduló között másodpercben (opcionális)
        """
        self.auto_fordulo_beallitas(True, ido_masodperc)
    
    def auto_fordulo_leallitasa(self):
        """
        Automatikus forduló leállítása
        """
        self.auto_fordulo_beallitas(False)
    
    def fordulo_naplo_export(self, fajlnev=None):
        """
        Fordulónapló exportálása fájlba
        
        :param fajlnev: Kimeneti fájl neve (opcionális)
        :return: Sikeres volt-e az exportálás
        """
        if not self.esemenyek_naplo:
            return False
        
        if fajlnev is None:
            most = datetime.now().strftime('%Y%m%d_%H%M%S')
            fajlnev = f"{KIMENET_MAPPA}fordulo_naplo_{most}.txt"
        
        try:
            os.makedirs(os.path.dirname(fajlnev), exist_ok=True)
            
            with open(fajlnev, 'w', encoding='utf-8') as f:
                f.write(f"=== Álomváros Szimuláció - Fordulónapló ===\n\n")
                
                for fordulo in self.esemenyek_naplo:
                    f.write(f"--- {fordulo['fordulo']}. forduló ({fordulo['datum']}) ---\n")
                    for esemeny in fordulo['esemenyek']:
                        f.write(f"* {esemeny}\n")
                    f.write("\n")
                
                # Játék végállapot
                allapot = self.game_engine.jatek_allapot()
                f.write("=== Város állapota ===\n")
                f.write(f"Név: {allapot['varos_nev']}\n")
                f.write(f"Pénzügyi keret: {allapot['penzugyi_keret']:,.0f} Ft\n")
                f.write(f"Lakosság elégedettsége: {allapot['lakossag_elegedettseg']:.1f}%\n")
                f.write(f"Lakosok száma: {allapot['lakosok_szama']:,} fő\n")
                f.write(f"Aktuális dátum: {allapot['aktualis_datum']}\n")
                f.write(f"Fordulók száma: {allapot['fordulo']}\n")
                
                if allapot['jatek_vege']:
                    f.write(f"\n=== JÁTÉK VÉGE: {allapot['jatek_vege_ok']} ===\n")
            
            return True
        except Exception as e:
            print(f"Hiba a fordulónapló exportálásakor: {e}")
            return False
    
    def _havi_koltsegek_kezelese(self):
        """
        Havi költségek kezelése egy forduló során
        
        - Épületek fenntartási költségeinek levonása
        - Szolgáltatások havi költségeinek levonása
        - Aktív projektek költségeinek kezelése
        - Állami támogatások kezelése
        """
        if not self.game_engine.varos:
            return
        
        varos = self.game_engine.varos
        osszkoltseg = 0
        
        # Épületek fenntartási költségei
        epulet_koltsegek = 0
        for epulet in varos.epuletek.values():
            epulet_koltseg = epulet.fenntartasi_koltseg
            epulet_koltsegek += epulet_koltseg
            
        osszkoltseg += epulet_koltsegek
        
        # Szolgáltatások havi költségei és támogatások kezelése
        szolgaltatas_koltsegek = 0
        allami_tamogatasok = 0
        
        for szolgaltatas in varos.szolgaltatasok.values():
            if szolgaltatas.aktiv:
                # Alap havi költség
                szolgaltatas_koltsegek += szolgaltatas.havi_koltseg
                
                # Állami támogatás kiszámítása
                tamogatas_osszeg = szolgaltatas.havi_koltseg * (ALLAMI_TAMOGATAS_SZAZALEK / 100)
                allami_tamogatasok += tamogatas_osszeg
        
        # Nettó szolgáltatási költségek (költség - támogatás)
        netto_szolgaltatasi_koltseg = szolgaltatas_koltsegek - allami_tamogatasok
        osszkoltseg += netto_szolgaltatasi_koltseg
        
        # Projektek költségeinek kezelése
        projekt_koltsegek = 0
        for projekt in varos.projektek.values():
            if projekt.aktiv:
                # Projekt költségek arányos fizetése
                havi_projekt_koltseg = projekt.koltseg / projekt.idotartam
                projekt_koltsegek += havi_projekt_koltseg
        
        osszkoltseg += projekt_koltsegek
        
        # Költségek levonása a költségvetésből
        varos.penzugyi_keret -= osszkoltseg
        
        # Adóbevételek hozzáadása - egyszerű modell: lakosonként fix bevétel
        lakosok_szama = varos.lakosok_szama
        havi_ado_per_lakos = BEALLITASOK.get("hatasok", {}).get("havi_ado_per_lakos", 1000)
        adobevetel = lakosok_szama * havi_ado_per_lakos
        
        # Bevételek jóváírása
        varos.penzugyi_keret += adobevetel
        
        # Napló üzenet
        return {
            'osszkoltseg': osszkoltseg,
            'epulet_koltsegek': epulet_koltsegek,
            'szolgaltatas_koltsegek': szolgaltatas_koltsegek,
            'projekt_koltsegek': projekt_koltsegek,
            'allami_tamogatasok': allami_tamogatasok,
            'adobevetel': adobevetel
        }
    
    def _projektek_kezelese(self):
        """
        Aktív projektek előrehaladásának kezelése
        
        - Projektek előrehaladásának nyomon követése
        - Befejezett projektek kezelése
        - Új épületek létrehozása a befejezett építési projekteknél
        """
        if not self.game_engine.varos:
            return
        
        varos = self.game_engine.varos
        
        # Ellenőrizzük, hogy a város dátuma frissítve van-e
        if not hasattr(varos, 'fordulok_szama'):
            varos.fordulok_szama = 1
        
        # Befejezett projektek listája
        befejezett_projektek = []
        
        # Először ellenőrizzük az összes aktív projekt előrehaladását az aktuális dátum szerint
        # és gyűjtsük össze a befejezett projekteket
        for projekt_id, projekt in list(varos.projektek.items()):
            try:
                # Csak az aktív, de még nem befejezett projekteket kezeljük
                if projekt.aktiv and not projekt.befejezett:
                    # Projekt előrehaladás ellenőrzése az aktuális dátummal
                    most_fejezte_be = projekt.elorehaladas(varos.aktualis_datum)
                    
                    # Ha most fejeződött be, adjuk hozzá a befejezett projektekhez
                    if most_fejezte_be:
                        befejezett_projektek.append(projekt_id)
                # Ha már befejezett, de még nem kezeltük
                elif projekt.befejezett and projekt_id not in befejezett_projektek:
                    befejezett_projektek.append(projekt_id)
            except Exception as e:
                print(f"Hiba a projekt ({projekt_id}) előrehaladásának ellenőrzésekor: {e}")
                import traceback
                traceback.print_exc()
        
        # Befejezett projektek hatásainak érvényesítése
        for projekt_id in befejezett_projektek:
            try:
                projekt = varos.projektek.get(projekt_id)
                if not projekt:
                    continue
                
                print(f"Befejezett projekt feldolgozása: {projekt.nev} (ID: {projekt_id})")
                
                # Projekt típusa alapján különböző hatások
                if hasattr(projekt, 'tipus') and projekt.tipus.lower() == "új építés":
                    # Új épület projektje
                    if hasattr(projekt, "uj_epulet_adatok") and projekt.uj_epulet_adatok:
                        adatok = projekt.uj_epulet_adatok
                        
                        # Import the Epulet class if not already imported
                        from alomvaros_szimulator.models.epulet import Epulet
                        
                        # Új épület létrehozása
                        uj_epulet = Epulet(
                            azonosito=max([epulet.azonosito for epulet in varos.epuletek.values()], default=0) + 1,
                            nev=adatok.get("nev", "Új épület"),
                            tipus=adatok.get("tipus", "általános"),
                            alapterulet=adatok.get("alapterulet", 1000),
                            allapot=adatok.get("allapot", 100)  # Számértékként adjuk meg az állapotot (100%)
                        )
                        
                        # Épület hozzáadása a városhoz
                        varos.epuletek[uj_epulet.azonosito] = uj_epulet
                        
                        # Lakosság elégedettségének növelése az új épület miatt
                        varos.lakossag_elegedettseg = min(100, varos.lakossag_elegedettseg + 2)
                        
                        # Eseménynapló bejegyzés
                        from alomvaros_szimulator.models.esemeny import Esemeny
                        esemeny = Esemeny(
                            azonosito=len(varos.epuletek),
                            nev=f"Épület építés: {uj_epulet.nev}",
                            valoszinuseg=0,
                            penzugyi_hatas=0,
                            elegedettsegi_hatas=2,
                            leiras=f"A(z) '{uj_epulet.nev}' építése befejeződött!",
                            tipus="épület",
                            lakossag_hatas=0
                        )
                        if hasattr(self.game_engine, 'event_manager'):
                            self.game_engine.event_manager.esemeny_hozzaadasa(esemeny)
                        
                        # Log a sikeres épület létrehozásról
                        print(f"Új épület létrehozva: {uj_epulet.nev} (ID: {uj_epulet.azonosito})")
                
                # Projekt áthelyezése a befejezett projektek listájába
                if not hasattr(varos, 'befejezett_projektek'):
                    varos.befejezett_projektek = []
                
                if projekt not in varos.befejezett_projektek:    
                    varos.befejezett_projektek.append(projekt)
                
                # Törlés az aktív projektekből
                if projekt_id in varos.projektek:
                    del varos.projektek[projekt_id]
                    
            except Exception as e:
                print(f"Hiba a befejezett projekt ({projekt_id}) kezelésekor: {e}")
                import traceback
                traceback.print_exc()
    
    def _epuletek_allapot_kezelese(self):
        """
        Épületek állapotának időbeli romlásának kezelése
        
        - Minden épület állapota kissé romlik minden fordulóban
        - Az épület típusától függően különböző mértékben romolhat
        """
        if not self.game_engine.varos:
            return
        
        varos = self.game_engine.varos
        
        # Épületek állapotának romlása
        for epulet in varos.epuletek.values():
            # Épület típusa alapján különböző romlási ütem
            if epulet.tipus.lower() == "ipari":
                romlasi_merteke = 0.15  # Ipari épületek gyorsabban romlanak
            elif epulet.tipus.lower() == "lakóház":
                romlasi_merteke = 0.1   # Lakóházak átlagos mértékben romlanak
            else:
                romlasi_merteke = 0.08  # Egyéb épületek lassabban romlanak
            
            # Állapot romlása
            epulet.romlik_allapot(mertekkel=romlasi_merteke)
    
    def _elegedettseg_hatasok_szamitasa(self):
        """
        Lakosság elégedettségének kiszámítása a különböző hatások alapján
        
        - Épületek állapotának hatása
        - Szolgáltatások színvonalának hatása
        - Egyéb tényezők
        """
        if not self.game_engine.varos:
            return
        
        varos = self.game_engine.varos
        
        # Épületek állapotának hatása az elégedettségre
        epulet_allapot_hatas = 0
        ossz_epulet = len(varos.epuletek)
        
        if ossz_epulet > 0:
            # Számszerűsítjük az épület állapotokat, ha szövegesek
            epulet_allapot_osszeg = 0
            for epulet in varos.epuletek.values():
                if isinstance(epulet.allapot, str):
                    # Ha szöveges az állapot, akkor számértékké konvertáljuk
                    allapot_ertek = EPULET_ALLAPOT.get(epulet.allapot.lower(), 3)  # Alapértelmezett: 3
                    epulet_allapot_osszeg += allapot_ertek
                else:
                    # Ha már eleve szám, csak hozzáadjuk
                    epulet_allapot_osszeg += epulet.allapot
            
            atlag_allapot = epulet_allapot_osszeg / ossz_epulet
            
            # Átlag állapot alapján -3 és +3 közötti elégedettség módosítás (1-5 skálán értelmezve)
            epulet_allapot_hatas = ((atlag_allapot - 1) / 4) * 6 - 3
        
        # Szolgáltatások hatása az elégedettségre
        szolgaltatas_hatas = 0
        aktiv_szolgaltatasok = [sz for sz in varos.szolgaltatasok.values() if sz.aktiv]
        
        if aktiv_szolgaltatasok:
            szolgaltatas_hatas_osszeg = sum(sz.elegedettseg_hatas for sz in aktiv_szolgaltatasok)
            # Exponenciálisan csökkenő hozadékkal számolunk (több szolgáltatás esetén)
            szolgaltatas_szorzo = 1 + math.log(len(aktiv_szolgaltatasok), 2) / 10
            szolgaltatas_hatas = szolgaltatas_hatas_osszeg * szolgaltatas_szorzo / len(aktiv_szolgaltatasok)
        
        # Pénzügyi keret hatása (ha túl alacsony, az negatívan hat)
        penzugyi_hatas = 0
        if varos.penzugyi_keret < 0:
            # Negatív pénzügyi keret erős negatív hatása
            penzugyi_hatas = -5
        elif varos.penzugyi_keret < 1000000:
            # Alacsony pénzügyi keret kisebb negatív hatása
            penzugyi_hatas = -2
        
        # Összes hatás számítása és alkalmazása
        ossz_hatas = epulet_allapot_hatas + szolgaltatas_hatas + penzugyi_hatas
        
        # Csillapított változás (maximum 5 pont egy fordulóban)
        max_valtozas = 5
        csillapitott_valtozas = max(-max_valtozas, min(max_valtozas, ossz_hatas))
        
        # Elégedettség módosítása
        varos.lakossag_elegedettseg = max(0, min(100, varos.lakossag_elegedettseg + csillapitott_valtozas))
    
    def _automatikus_naplo_mentes(self, fordulo_esemenyek, havi_koltsegek_info):
        """
        Automatikus naplófájl mentése minden forduló után
        
        :param fordulo_esemenyek: Az aktuális forduló eseményei
        :param havi_koltsegek_info: Havi költségek információi
        """
        if not self.game_engine.varos:
            return
        
        varos = self.game_engine.varos
        
        # Kimenet mappa létrehozása
        kimenet_mappa = BEALLITASOK["fajl_utak"]["kimenet_mappa"]
        os.makedirs(kimenet_mappa, exist_ok=True)
        
        # Fájlnév generálása: varos_nev_YYYYMMDD_forduloX.txt
        datum_str = varos.aktualis_datum.strftime('%Y%m%d')
        fordulo_szam = self.game_engine.fordulo_szamlalo
        fajlnev = f"{varos.nev.replace(' ', '_')}_{datum_str}_fordulo{fordulo_szam}.txt"
        teljes_utvonal = os.path.join(kimenet_mappa, fajlnev)
        
        # Napló mentése
        try:
            with open(teljes_utvonal, 'w', encoding='utf-8') as f:
                # Fejléc
                f.write(f"=================================================\n")
                f.write(f"=== {varos.nev} - {fordulo_szam}. forduló - {varos.aktualis_datum} ===\n")
                f.write(f"=================================================\n\n")
                
                # Város állapota
                f.write("===== VÁROS ÁLLAPOTA =====\n")
                f.write(f"* Pénzügyi keret: {varos.penzugyi_keret:,.0f} Ft\n")
                f.write(f"* Lakosság: {varos.lakosok_szama:,} fő\n")
                f.write(f"* Elégedettség: {varos.lakossag_elegedettseg:.1f}%\n\n")
                
                # Havi költségek részletezése
                if havi_koltsegek_info:
                    f.write("===== HAVI PÉNZÜGYI KIMUTATÁS =====\n")
                    f.write(f"* Összes költség: {havi_koltsegek_info.get('osszkoltseg', 0):,.0f} Ft\n")
                    f.write(f"* Épület fenntartás: {havi_koltsegek_info.get('epulet_koltsegek', 0):,.0f} Ft\n")
                    f.write(f"* Szolgáltatások bruttó költsége: {havi_koltsegek_info.get('szolgaltatas_koltsegek', 0):,.0f} Ft\n")
                    f.write(f"* Állami támogatások ({ALLAMI_TAMOGATAS_SZAZALEK}%): +{havi_koltsegek_info.get('allami_tamogatasok', 0):,.0f} Ft\n")
                    f.write(f"* Nettó szolgáltatási költség: {havi_koltsegek_info.get('szolgaltatas_koltsegek', 0) - havi_koltsegek_info.get('allami_tamogatasok', 0):,.0f} Ft\n")
                    f.write(f"* Projekt költségek: {havi_koltsegek_info.get('projekt_koltsegek', 0):,.0f} Ft\n")
                    f.write(f"* Adóbevétel ({varos.lakosok_szama} lakos után): +{havi_koltsegek_info.get('adobevetel', 0):,.0f} Ft\n\n")
                    
                    # Mérleg
                    bevetel = havi_koltsegek_info.get('adobevetel', 0) + havi_koltsegek_info.get('allami_tamogatasok', 0)
                    kiadas = havi_koltsegek_info.get('osszkoltseg', 0)
                    egyenleg = bevetel - kiadas
                    f.write(f"* Összes bevétel: +{bevetel:,.0f} Ft\n")
                    f.write(f"* Összes kiadás: -{kiadas:,.0f} Ft\n")
                    f.write(f"* Havi egyenleg: {egyenleg:+,.0f} Ft\n\n")
                
                # Események
                f.write("===== FORDULÓ ESEMÉNYEI =====\n")
                if isinstance(fordulo_esemenyek, list) and fordulo_esemenyek:
                    for esemeny in fordulo_esemenyek:
                        if hasattr(esemeny, 'nev') and hasattr(esemeny, 'penzugyi_hatas'):
                            # Esemény objektum
                            f.write(f"* {esemeny.nev}: {esemeny.leiras}\n")
                            f.write(f"  - Pénzügyi hatás: {esemeny.penzugyi_hatas:+,.0f} Ft\n")
                            f.write(f"  - Elégedettség hatás: {esemeny.elegedettseg_hatas:+.1f}%\n")
                            if hasattr(esemeny, 'lakossag_hatas') and esemeny.lakossag_hatas != 0:
                                f.write(f"  - Lakosság hatás: {esemeny.lakossag_hatas:+d} fő\n")
                        else:
                            # String esemény
                            f.write(f"* {esemeny}\n")
                else:
                    f.write("* Nem történt különösebb esemény ebben a fordulóban.\n")
                f.write("\n")
                
                # Épületek állapotának változása
                f.write("===== ÉPÜLETEK ÁLLAPOTA =====\n")
                for epulet_id, epulet in varos.epuletek.items():
                    if hasattr(epulet, 'allapot'):
                        if isinstance(epulet.allapot, (int, float)):
                            allapot_str = f"{epulet.allapot:.1f}"
                        else:
                            allapot_str = epulet.allapot
                        f.write(f"* {epulet.nev} ({epulet.tipus}): {allapot_str}\n")
                f.write("\n")
                
                # Aktív szolgáltatások és állami támogatások
                f.write("===== AKTÍV SZOLGÁLTATÁSOK =====\n")
                aktiv_szolgaltatasok = [szolg for szolg in varos.szolgaltatasok.values() if szolg.aktiv]
                if aktiv_szolgaltatasok:
                    for szolgaltatas in aktiv_szolgaltatasok:
                        tamogatas = szolgaltatas.havi_koltseg * (ALLAMI_TAMOGATAS_SZAZALEK / 100)
                        netto_koltseg = szolgaltatas.havi_koltseg - tamogatas
                        f.write(f"* {szolgaltatas.nev} ({szolgaltatas.tipus})\n")
                        f.write(f"  - Bruttó költség: {szolgaltatas.havi_koltseg:,.0f} Ft/hó\n")
                        f.write(f"  - Állami támogatás: {tamogatas:,.0f} Ft/hó\n")
                        f.write(f"  - Nettó költség: {netto_koltseg:,.0f} Ft/hó\n")
                else:
                    f.write("* Nincs aktív szolgáltatás\n")
                f.write("\n")
                
                # Aktív projektek
                f.write("===== AKTÍV PROJEKTEK =====\n")
                if varos.projektek:
                    for projekt in varos.projektek.values():
                        progress_percent = (projekt.eltelt_ido / projekt.idotartam) * 100 if hasattr(projekt, 'eltelt_ido') and hasattr(projekt, 'idotartam') else 0
                        progress_bar = "=" * int(progress_percent / 5) + " " * (20 - int(progress_percent / 5))
                        f.write(f"* {projekt.nev} ({projekt.tipus})\n")
                        f.write(f"  - Költség: {projekt.koltseg:,.0f} Ft\n")
                        f.write(f"  - Készültség: [{progress_bar}] {progress_percent:.1f}%\n")
                else:
                    f.write("* Nincs aktív projekt\n")
                f.write("\n")
                
                # Ha vége a játéknak
                if hasattr(self.game_engine, 'jatek_aktiv') and not self.game_engine.jatek_aktiv:
                    f.write("=================================================\n")
                    f.write(f"===== JÁTÉK VÉGE: {varos.jatek_vege_ok} =====\n")
                    f.write("=================================================\n")
            
            return True
        except Exception as e:
            print(f"Hiba a naplófájl mentésekor: {e}")
            return False 