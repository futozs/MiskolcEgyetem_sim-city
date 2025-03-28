"""
Álomváros Szimulátor - Fő program
"""
import os
import sys
import argparse
import glob
from datetime import datetime

# Projekt gyökér könyvtár hozzáadása a Python úthoz
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from alomvaros_szimulator.ui.main_window import MainWindow
from alomvaros_szimulator.game.game_engine import GameEngine
from alomvaros_szimulator.game.fordulo_manager import ForduloManager
from alomvaros_szimulator.game.event_manager import EventManager
from alomvaros_szimulator.config import BEALLITASOK, EPULETEK_CSV, SZOLGALTATASOK_CSV, LAKOSOK_CSV


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
        # Grafikus felület
        app = MainWindow()
        
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