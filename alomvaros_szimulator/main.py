"""
Álomváros Szimulátor - Fő program
"""
import os
import sys
import argparse
import glob
from datetime import datetime
import tkinter as tk
from tkinter import messagebox

# Projekt gyökér könyvtár hozzáadása a Python úthoz
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from alomvaros_szimulator.ui.main_window import MainWindow
from alomvaros_szimulator.game.game_engine import GameEngine
from alomvaros_szimulator.game.fordulo_manager import ForduloManager
from alomvaros_szimulator.game.event_manager import EventManager
from alomvaros_szimulator.config import BEALLITASOK, EPULETEK_CSV, SZOLGALTATASOK_CSV, LAKOSOK_CSV

# Importáljuk az API szervert
try:
    from backend_server import run_server, connect_to_game_engine
    api_server_available = True
    print("Backend API szerver sikeresen importálva")
except ImportError:
    api_server_available = False
    print("Backend API szerver nem elérhető")


def parse_arguments():
    """
    Parancssori argumentumok feldolgozása
    
    Támogatott paraméterek:
    - --nogui: Parancssori interfész használata grafikus felület helyett
    - --varos: Város neve
    - --penz: Kezdő pénzügyi keret
    - --elegedettseg: Kezdeti lakossági elégedettség
    - --min-elegedettseg: Minimális elfogadható elégedettség (0-100)
    - --fordulok: Futtatandó fordulók száma (automatikus futtatás esetén)
    - --autosave: Automatikus mentés bekapcsolása minden forduló után
    - --exportcsv: Projektek exportálása CSV-be a futtatás végén
    - --noapi: Backend API szerver ne induljon el
    
    :return: Feldolgozott argumentumok
    """
    parser = argparse.ArgumentParser(description='Álomváros Szimulátor')
    
    parser.add_argument('--nogui', action='store_true', help='Parancssori interfész használata GUI helyett')
    parser.add_argument('--varos', type=str, default=None, help='Város neve')
    parser.add_argument('--penz', type=int, default=None, help='Kezdő pénzügyi keret')
    parser.add_argument('--elegedettseg', type=int, default=None, help='Kezdeti lakossági elégedettség (0-100)')
    parser.add_argument('--min-elegedettseg', type=int, default=None, help='Minimális elfogadható elégedettség (0-100)')
    parser.add_argument('--fordulok', type=int, default=0, help='Automatikusan futtatandó fordulók száma')
    parser.add_argument('--autosave', action='store_true', help='Automatikus mentés minden forduló után')
    parser.add_argument('--exportcsv', type=str, default=None, help='Projektek exportálása a megadott CSV fájlba')
    parser.add_argument('--importepulet', type=str, default=None, help='Épületek importálása a megadott CSV fájlból')
    parser.add_argument('--importszolgaltatas', type=str, default=None, help='Szolgáltatások importálása a megadott CSV fájlból')
    parser.add_argument('--importlakos', type=str, default=None, help='Lakosok importálása a megadott CSV fájlból')
    parser.add_argument('--noapi', action='store_true', help='Backend API szerver ne induljon el')
    parser.add_argument('--apiport', type=int, default=6666, help='Backend API szerver port (alapértelmezett: 6666)')
    
    return parser.parse_args()


def command_line_mode(args):
    """
    Parancssori módban futtatás
    
    :param args: Parancssori argumentumok
    """
    print("=" * 60)
    print("ÁLOMVÁROS SZIMULÁTOR - Parancssori mód")
    print("=" * 60)
    
    # GameEngine inicializálása
    game_engine = GameEngine()
    
    # Új játék indítása a megadott paraméterekkel
    varos_nev = args.varos if args.varos else "Álomváros"
    penzugyi_keret = args.penz if args.penz is not None else 100000000  # Alapértelmezett érték ha nincs megadva
    elegedettseg = args.elegedettseg
    min_elegedettseg = args.min_elegedettseg
    
    print(f"\nÚj játék indítása: {varos_nev}")
    game_engine.uj_jatek(
        varos_nev=varos_nev,
        kezdeti_penz=penzugyi_keret,
        kezdeti_lakossag=500  # Alapértelmezett lakosságszám
    )
    
    # Elégedettség beállítása, ha meg van adva
    if elegedettseg is not None:
        game_engine.varos.lakossag_elegedettseg = elegedettseg
        print(f"Lakossági elégedettség beállítva: {elegedettseg}%")
        
    # Minimális elégedettség beállítása, ha meg van adva
    if min_elegedettseg is not None:
        game_engine.varos.min_elegedettseg = min_elegedettseg
        print(f"Minimális elfogadható elégedettség beállítva: {min_elegedettseg}%")
    
    # Automatikus CSV export a projektek számára
    kimenet_mappa = BEALLITASOK["fajl_utak"]["kimenet_mappa"]
    os.makedirs(kimenet_mappa, exist_ok=True)
    csv_fajlnev = f"{kimenet_mappa}{varos_nev.replace(' ', '_')}_projektek_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    game_engine.projektek_exportalasa(csv_fajlnev)
    print(f"Projektek automatikusan exportálva: {csv_fajlnev}")
    
    # Adatok importálása, ha meg van adva
    if args.importepulet or args.importszolgaltatas or args.importlakos:
        print("\nAdatok importálása...")
        betoltott_elemek = game_engine.adatok_betoltese(
            epuletek_csv=args.importepulet,
            szolgaltatasok_csv=args.importszolgaltatas,
            lakosok_csv=args.importlakos
        )
        print(f"Betöltött elemek: {betoltott_elemek}")
        
        # Játék aktiválása, ha sikerült adatokat betölteni
        if betoltott_elemek > 0:
            if not game_engine.jatek_aktiv:
                game_engine.jatek_aktiv = True
                print("Játék aktiválva az adatok importálása után.")
        else:
            print("Figyelmeztetés: Nem sikerült adatokat betölteni, vagy 0 elemet sikerült betölteni.")
        
        # Mindenképp ellenőrizzük a lakosok számát, akár sikeres volt a betöltés, akár nem
        if not hasattr(game_engine.varos, 'lakosok_szama') or game_engine.varos.lakosok_szama <= 0:
            print("Figyelmeztetés: A lakosok száma 0 vagy negatív. Alapértelmezett értékre állítjuk.")
            # Hívjuk meg a lakosok generálását, ami automatikusan kezeli a lakosságszámot
            if hasattr(game_engine.varos, '_lakosok_generalasa'):
                game_engine.varos._lakosok_generalasa(500)
            else:
                game_engine.varos.lakossag_modositasa(500)  # Ha nincs _lakosok_generalasa metódus
            print(f"Lakosságszám beállítva: {game_engine.varos.lakosok_szama}")
        
        # Biztosítsuk, hogy a játék aktív legyen
        game_engine.jatek_aktiv = True
        game_engine.varos.jatek_vege = False
        game_engine.varos.jatek_vege_ok = None
    
    # Forduló kezelő és esemény kezelő létrehozása
    fordulo_manager = ForduloManager(game_engine)
    event_manager = EventManager(game_engine)
    
    # Automatikus fordulók futtatása
    if args.fordulok > 0:
        print(f"\nAutomatikusan futtatandó fordulók száma: {args.fordulok}")
        
        # Adatok automatikus betöltése
        print("\nAlapadatok automatikus betöltése...")
        betoltott_elemek = game_engine.adatok_betoltese(
            epuletek_csv=EPULETEK_CSV,
            szolgaltatasok_csv=SZOLGALTATASOK_CSV,
            lakosok_csv=args.importlakos if args.importlakos else LAKOSOK_CSV
        )
        print(f"Betöltött elemek száma: {betoltott_elemek}")
        
        # Backend API szerver indítása, ha engedélyezve van
        api_thread = None
        if api_server_available and not args.noapi:
            try:
                # Nem-blokkoló indítás, nem várunk semmire
                api_thread = run_server(port=args.apiport)
                if api_thread:
                    print(f"Backend API szerver inicializálva a {args.apiport} porton")
                else:
                    print("Backend API szerver nem tudott inicializálódni")
            except Exception as e:
                print(f"Hiba a Backend API szerver indításakor: {str(e)}")
                import traceback
                traceback.print_exc()
        
        for i in range(args.fordulok):
            print(f"\n--- {i+1}. forduló ---")
            
            # Forduló végrehajtása
            esemenyek = fordulo_manager.kovetkezo_fordulo()
            
            # Város állapotának kiírása
            varos = game_engine.varos
            print(f"Dátum: {varos.aktualis_datum}")
            print(f"Pénzügyi keret: {varos.penzugyi_keret:,} Ft")
            print(f"Lakosság: {varos.lakosok_szama:,} fő")
            print(f"Elégedettség: {varos.lakossag_elegedettseg:.1f}%")
            
            # Automatikus mentés, ha be van kapcsolva
            if args.autosave:
                kimenet_mappa = BEALLITASOK["fajl_utak"]["kimenet_mappa"]
                os.makedirs(kimenet_mappa, exist_ok=True)
                
                # Fájl neve: varos_nev_YYYYMMDD_forduloX.txt
                fajlnev = f"{varos_nev.replace(' ', '_')}_{varos.aktualis_datum.strftime('%Y%m%d')}_fordulo{i+1}.txt"
                teljes_utvonal = os.path.join(kimenet_mappa, fajlnev)
                
                # Város állapotának mentése
                varos.naplo_mentes(esemenyek, teljes_utvonal)
                print(f"Forduló állapota mentve ide: {fajlnev}")
            
            # Ha vége a játéknak, leállítjuk a ciklust
            if not game_engine.jatek_aktiv:
                print("\nJÁTÉK VÉGE:")
                print(varos.jatek_vege_ok)
                break
    
    # Projektek exportálása, ha meg van adva
    if args.exportcsv:
        print(f"\nProjektek exportálása: {args.exportcsv}")
        success = game_engine.projektek_exportalasa(args.exportcsv)
        if success:
            print("Projektek sikeresen exportálva.")
        else:
            print("Hiba a projektek exportálása közben.")
    
    print("\n" + "=" * 60)
    print("Szimuláció befejezve.")
    print("=" * 60)


class ApiServerManager:
    """
    API szerver kezelő osztály, amely lehetővé teszi a szerver késleltetett indítását
    """
    def __init__(self, args):
        self.args = args
        self.api_thread = None
        self.initialized = False
    
    def start_server(self):
        """
        Elindítja a szervert, ha még nem indult el
        """
        if self.initialized or not api_server_available or self.args.noapi:
            return
        
        try:
            # Nem-blokkoló indítás, nem várunk semmire
            self.api_thread = run_server(port=self.args.apiport)
            if self.api_thread:
                print(f"Backend API szerver inicializálva a http://localhost:{self.args.apiport} címen")
            else:
                print("Backend API szerver nem tudott inicializálódni. Próbáld később újra.")
            
            self.initialized = True
        except Exception as e:
            print(f"Hiba a Backend API szerver indításakor: {str(e)}")
            import traceback
            traceback.print_exc()


def extend_main_window(MainWindow, api_server_manager):
    """
    MainWindow osztály kibővítése API szerver integrációval
    """
    original_update_ui = MainWindow._update_ui
    
    def new_update_ui(self):
        # Eredeti UI frissítés
        result = original_update_ui(self)
        
        # Ha van aktív játék, biztosítsuk, hogy az API szerver kapcsolódjon hozzá
        if self.game_engine and hasattr(self.game_engine, 'varos') and self.game_engine.varos:
            # Csak akkor frissítjük az API kapcsolatot, ha van aktív játék
            if hasattr(self.game_engine, 'jatek_aktiv') and self.game_engine.jatek_aktiv:
                # Indítjuk az API szervert, ha még nem fut
                api_server_manager.start_server()
                
                try:
                    # Kapcsolódás a játékmotorhoz - ez frissíti az API-t a legújabb adatokkal
                    if api_server_available:
                        connect_to_game_engine(self.game_engine)
                except Exception as e:
                    # Hibakezelés - nem kritikus, csak logoljuk
                    print(f"API szerver frissítési hiba: {str(e)}")
        
        return result
    
    # Frissítsük a MainWindow osztály _update_ui metódusát
    MainWindow._update_ui = new_update_ui
    return MainWindow


def main():
    """
    Fő program belépési pont
    """
    # Parancssori argumentumok feldolgozása
    args = parse_arguments()
    
    # Futtatási mód kiválasztása
    if args.nogui:
        # Parancssori mód
        command_line_mode(args)
    else:
        # API szerver kezelő létrehozása
        api_server_manager = ApiServerManager(args)
        
        # MainWindow osztály kiterjesztése az API szerver indítási képességgel
        ExtendedMainWindow = extend_main_window(MainWindow, api_server_manager)
        
        # Grafikus felület
        app = ExtendedMainWindow()
        
        # Felülírjuk az eredeti print függvényt, hogy a GUI naplóba is írja az üzeneteket
        eredeti_print = print
        def ui_print(*args, **kwargs):
            # Eredeti konzolos kimenet megőrzése
            eredeti_print(*args, **kwargs)
            # Üzenet hozzáadása a GUI naplóhoz
            if app and hasattr(app, '_log'):
                uzenet = " ".join(str(arg) for arg in args)
                app._log(uzenet)
        
        # Felülírjuk a globális print függvényt
        sys.modules['builtins'].print = ui_print
        
        # Alkalmazás futtatása
        app.run()


if __name__ == "__main__":
    main() 