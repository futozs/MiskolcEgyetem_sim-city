"""
Backend szerver az Álomváros Szimulátorhoz

A szervertől lekérdezhető az aktuális térkép épületeiről készült lista,
folyamatban lévő építések információi, és a város statisztikái. A szerver
csak olvasási műveleteket végez, nem módosítja a játék állapotát.
"""
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import os
import sys
import importlib.util
import traceback
import threading
import time
import json

# Az alomvaros_szimulator modul elérési útja
# Projekt gyökér könyvtár hozzáadása a Python úthoz
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Globális játék változó - ezt használjuk az adatok eléréséhez
game_engine = None
varos = None
main_window = None
# Szerver szál
server_thread = None

# Próbáljuk meg importálni a szükséges modulokat
try:
    from alomvaros_szimulator.models.varos import Varos
    from alomvaros_szimulator.models.epulet import Epulet
    from alomvaros_szimulator.models.projekt import Projekt
    from alomvaros_szimulator.models.szolgaltatas import Szolgaltatas
    from alomvaros_szimulator.game.game_engine import GameEngine
    print("Sikeresen importáltuk a szükséges modulokat.")
except ImportError as e:
    print(f"Hiba a modulok importálásakor: {str(e)}")
    traceback.print_exc()

app = Flask(__name__)
CORS(app)  # CORS engedélyezése az API-hoz

# Egyedi JSON encoder, hogy a magyar ékezetes karakterek helyesen jelenjenek meg
class UTF8JSONEncoder(json.JSONEncoder):
    def __init__(self, **kwargs):
        kwargs['ensure_ascii'] = False
        super(UTF8JSONEncoder, self).__init__(**kwargs)

# Saját jsonify függvény, ami UTF-8 kódolást használ
def utf8_jsonify(*args, **kwargs):
    response = Response(
        json.dumps(dict(*args, **kwargs), cls=UTF8JSONEncoder, ensure_ascii=False),
        mimetype='application/json; charset=utf-8'
    )
    return response

# A globális játék objektum keresése és inicializálása
def jatek_keresese():
    global game_engine, varos, main_window
    
    try:
        # Próbáljuk megtalálni a MainWindow példányt
        for modul_nev, modul in sys.modules.items():
            if 'main_window' in modul_nev or hasattr(modul, 'MainWindow'):
                for obj_name in dir(modul):
                    try:
                        obj = getattr(modul, obj_name)
                        if obj_name == 'mainWindow' or (hasattr(obj, '__name__') and obj.__name__ == 'MainWindow'):
                            main_window = obj
                            if hasattr(main_window, 'game_engine') and main_window.game_engine:
                                game_engine = main_window.game_engine
                                if hasattr(game_engine, 'varos') and game_engine.varos:
                                    varos = game_engine.varos
                                    return True
                    except Exception as e:
                        continue
        
        # Keressük a játékmotort közvetlenül a root modulokban
        for modul_nev, modul in sys.modules.items():
            if modul_nev.startswith('alomvaros_szimulator') or modul_nev == '__main__':
                # 1. Közvetlenül keresünk game_engine attribútumot
                if hasattr(modul, 'game_engine') and modul.game_engine is not None:
                    try:
                        game_engine = modul.game_engine
                        if hasattr(game_engine, 'varos') and game_engine.varos is not None:
                            varos = game_engine.varos
                            return True
                    except Exception as e:
                        continue

        # Új módszer: keressük meg az összes GameEngine példányt a rendszerben
        try:
            for modul_nev, modul in sys.modules.items():
                try:
                    for attr_name in dir(modul):
                        try:
                            if attr_name.startswith('__'):  # Kihagyjuk a beépített attribútumokat
                                continue
                            
                            attr = getattr(modul, attr_name)
                            # Ellenőrizzük, hogy GameEngine objektum-e
                            if hasattr(attr, '__class__') and attr.__class__.__name__ == 'GameEngine':
                                game_engine = attr
                                if hasattr(game_engine, 'varos') and game_engine.varos is not None:
                                    varos = game_engine.varos
                                    return True
                            
                            # Objektum attribútumai között is keressünk
                            if hasattr(attr, 'game_engine'):
                                game_engine = attr.game_engine
                                if hasattr(game_engine, 'varos') and game_engine.varos is not None:
                                    varos = game_engine.varos
                                    return True
                        except Exception as e:
                            continue
                except Exception as e:
                    continue
        except Exception as e:
            pass
        
        # Végső próba: keressünk példányokat az aktív objektumok között
        try:
            import gc
            for obj in gc.get_objects():
                try:
                    if hasattr(obj, '__class__') and obj.__class__.__name__ == 'GameEngine':
                        game_engine = obj
                        if hasattr(obj, 'varos') and obj.varos is not None:
                            varos = obj.varos
                            return True
                    
                    # Ha város objektumot találunk, próbáljuk visszakövetni a játékmotort
                    if hasattr(obj, '__class__') and obj.__class__.__name__ == 'Varos':
                        varos = obj
                        return True
                except Exception as e:
                    pass
        except Exception as e:
            pass
        
        # Ha közvetlenül nem találtuk meg, próbáljuk a főmodulból
        try:
            import __main__
            if hasattr(__main__, 'game_engine'):
                game_engine = __main__.game_engine
                if hasattr(game_engine, 'varos'):
                    varos = game_engine.varos
                    return True
            
            # Keressük a város objektumot közvetlenül
            if hasattr(__main__, 'varos'):
                varos = __main__.varos
                return True
        except Exception as e:
            pass
            
        return False
    except Exception as e:
        return False

# Játék aktív állapotának ellenőrzése
def jatek_aktiv_e():
    global game_engine, varos
    
    # Frissítsük a játék adatokat
    if not jatek_keresese():
        return False
    
    # Ellenőrizzük, hogy van-e érvényes varos objektum alapvető attribútumokkal
    if varos is None:
        return False
    
    # Ellenőrizzük, hogy a varos objektum rendelkezik-e a szükséges attribútumokkal
    has_basic_attrs = hasattr(varos, 'epuletek') and hasattr(varos, 'projektek')
    
    # Ellenőrizzük a game_engine.jatek_aktiv flag-et, ha elérhető
    has_active_flag = False
    if game_engine and hasattr(game_engine, 'jatek_aktiv'):
        has_active_flag = game_engine.jatek_aktiv
    
    # Ha alapvető attribútumokkal rendelkezik, akkor aktívnak tekintjük
    return has_basic_attrs

@app.route('/epuletek', methods=['GET'])
def epuletek_lekerdezese():
    """
    Az aktuális térkép épületeinek lekérdezése

    Visszaadja az összes épület adatait JSON formátumban,
    beleértve az azonosítót, nevet, típust, alapterületet és állapotot.
    """
    global varos
    
    # Próbáljunk meg találni egy aktív várost
    jatek_keresese()
    
    # Épületek listázása
    try:
        # Ha van érvényes város objektum, akkor valós adatokat adunk vissza
        if varos and hasattr(varos, 'epuletek'):
            epuletek_lista = []
            for epulet in varos.epuletek.values():
                epulet_adat = {
                    "azonosito": epulet.azonosito,
                    "nev": epulet.nev,
                    "tipus": epulet.tipus,
                    "alapterulet": epulet.alapterulet,
                    "allapot": epulet.allapot
                }
                
                # Opcionális mezők hozzáadása, ha léteznek
                if hasattr(epulet, 'epitesi_datum'):
                    epulet_adat["epitesi_datum"] = str(epulet.epitesi_datum)
                if hasattr(epulet, 'ferohelyek'):
                    epulet_adat["ferohelyek"] = epulet.ferohelyek
                if hasattr(epulet, 'karbantartasi_koltseg'):
                    epulet_adat["karbantartasi_koltseg"] = epulet.karbantartasi_koltseg
                
                epuletek_lista.append(epulet_adat)
            
            return utf8_jsonify({"epuletek": epuletek_lista})
        else:
            # Ha nincs érvényes város, üres listát adunk vissza
            return utf8_jsonify({"epuletek": [], "error": "Nincs elérhető város objektum vagy épületek"})
    except Exception as e:
        print(f"Hiba az épületek lekérdezésekor: {str(e)}")
        traceback.print_exc()
        return utf8_jsonify({"error": f"Hiba: {str(e)}"})

@app.route('/epitesek', methods=['GET'])
def epitesek_lekerdezese():
    """
    A folyamatban lévő építési projektek lekérdezése

    Visszaadja az összes folyamatban lévő projekt adatait JSON formátumban,
    beleértve az azonosítót, nevet, típust, költséget és befejeződési dátumot.
    """
    global varos
    
    # Próbáljunk meg találni egy aktív várost
    jatek_keresese()
    
    # Projektek listázása
    try:
        # Ha van érvényes város objektum, akkor valós adatokat adunk vissza
        if varos and hasattr(varos, 'projektek'):
            projektek_lista = []
            for projekt in varos.projektek.values():
                projekt_adat = {
                    "azonosito": projekt.azonosito,
                    "nev": projekt.nev,
                    "tipus": projekt.tipus,
                    "koltseg": projekt.koltseg,
                    "kezdo_datum": str(projekt.kezdo_datum),
                    "befejezo_datum": str(projekt.befejezo_datum),
                    "keszultsegi_fok": projekt.get_keszultsegi_fok() if hasattr(projekt, 'get_keszultsegi_fok') else projekt.keszultsegi_fok if hasattr(projekt, 'keszultsegi_fok') else 0,
                    "allapot": projekt.allapot if hasattr(projekt, 'allapot') else "folyamatban"
                }
                
                # Opcionális mezők hozzáadása
                if hasattr(projekt, 'leiras'):
                    projekt_adat["leiras"] = projekt.leiras
                if hasattr(projekt, 'celpont_id'):
                    projekt_adat["celpont_id"] = projekt.celpont_id
                if hasattr(projekt, 'fontos'):
                    projekt_adat["fontos"] = projekt.fontos
                
                projektek_lista.append(projekt_adat)
            
            return utf8_jsonify({"epitesek": projektek_lista})
        else:
            # Ha nincs érvényes város, üres listát adunk vissza
            return utf8_jsonify({"epitesek": [], "error": "Nincs elérhető város objektum vagy projektek"})
    except Exception as e:
        print(f"Hiba a folyamatban lévő építések lekérdezésekor: {str(e)}")
        traceback.print_exc()
        return utf8_jsonify({"error": f"Hiba: {str(e)}"})

@app.route('/varos', methods=['GET'])
def varos_lekerdezese():
    """
    Az aktuális város épületeinek és építkezéseinek kombinált lekérdezése
    
    Visszaadja az összes épület és folyamatban lévő építkezés adatait egy lekérdezésben
    """
    global varos
    
    # Próbáljunk meg találni egy aktív várost
    jatek_keresese()
    
    try:
        # Épületek lekérdezése
        epuletek_lista = []
        if varos and hasattr(varos, 'epuletek'):
            for epulet in varos.epuletek.values():
                epuletek_lista.append({
                    "azonosito": epulet.azonosito,
                    "nev": epulet.nev,
                    "tipus": epulet.tipus,
                    "alapterulet": epulet.alapterulet,
                    "allapot": epulet.allapot,
                    "epitesi_datum": str(epulet.epitesi_datum) if hasattr(epulet, 'epitesi_datum') else None
                })
        
        # Építési projektek lekérdezése
        epitesek_lista = []
        if varos and hasattr(varos, 'projektek'):
            for projekt in varos.projektek.values():
                # Csak az építési és karbantartási projekteket adjuk vissza
                if projekt.tipus.lower() in ["új építés", "karbantartás", "felújítás"] and not (hasattr(projekt, 'befejezett') and projekt.befejezett):
                    # Készültségi fok kiszámítása
                    teljes_idotartam = projekt.idotartam if hasattr(projekt, 'idotartam') else 0
                    if teljes_idotartam == 0 and hasattr(projekt, 'kezdo_datum') and hasattr(projekt, 'befejezo_datum'):
                        try:
                            teljes_idotartam = (projekt.befejezo_datum - projekt.kezdo_datum).days
                        except:
                            teljes_idotartam = 30  # alapértelmezett érték
                    
                    eltelt_napok = 0
                    if hasattr(projekt, 'kezdo_datum') and hasattr(varos, 'aktualis_datum'):
                        try:
                            eltelt_napok = (varos.aktualis_datum - projekt.kezdo_datum).days
                        except:
                            eltelt_napok = 0
                    
                    keszultsegi_fok = min(100, int((eltelt_napok / teljes_idotartam) * 100)) if teljes_idotartam > 0 else 0
                    
                    projekt_adat = {
                        "azonosito": projekt.azonosito,
                        "nev": projekt.nev,
                        "tipus": projekt.tipus,
                        "koltseg": projekt.koltseg if hasattr(projekt, 'koltseg') else 0,
                        "keszultsegi_fok": keszultsegi_fok,
                        "allapot": "folyamatban"
                    }
                    
                    # Opcionális mezők hozzáadása, ha léteznek
                    if hasattr(projekt, 'kezdo_datum'):
                        projekt_adat["kezdo_datum"] = str(projekt.kezdo_datum)
                    if hasattr(projekt, 'befejezo_datum'):
                        projekt_adat["befejezo_datum"] = str(projekt.befejezo_datum)
                    if hasattr(projekt, 'uj_epulet_adatok') and projekt.uj_epulet_adatok:
                        projekt_adat["uj_epulet_adatok"] = projekt.uj_epulet_adatok
                    if hasattr(projekt, 'erintett_epuletek') and projekt.erintett_epuletek:
                        projekt_adat["erintett_epuletek"] = projekt.erintett_epuletek
                    
                    epitesek_lista.append(projekt_adat)
            
        # Város információk
        varos_info = {}
        if varos:
            varos_info = {
                "nev": varos.nev if hasattr(varos, 'nev') else "Ismeretlen",
                "aktualis_datum": str(varos.aktualis_datum) if hasattr(varos, 'aktualis_datum') else None,
                "lakossag_szama": varos.lakossag_szama if hasattr(varos, 'lakossag_szama') else 0,
                "penzugyi_keret": varos.penzugyi_keret if hasattr(varos, 'penzugyi_keret') else 0
            }
        else:
            # Ha nincs érvényes város, minimális információt adunk
            varos_info = {
                "nev": "Ismeretlen",
                "aktualis_datum": None,
                "lakossag_szama": 0,
                "penzugyi_keret": 0
            }
        
        # Kombinált válasz
        return utf8_jsonify({
            "varos": varos_info,
            "epuletek": epuletek_lista,
            "epitesek": epitesek_lista,
            "megjegyzes": None if varos else "Nincs elérhető város vagy játék objektum"
        })
    except Exception as e:
        print(f"Hiba a város adatok lekérdezésekor: {str(e)}")
        traceback.print_exc()
        return utf8_jsonify({"hiba": f"Hiba történt: {str(e)}"}), 500

@app.route('/statisztikak', methods=['GET'])
def statisztikak_lekerdezese():
    """
    A város aktuális statisztikáinak lekérdezése

    Visszaadja a város általános statisztikáit, mint például
    lakosság száma, elégedettség, pénzügyi keret, és egyéb fontos mutatók.
    """
    global varos, game_engine
    
    # Próbáljunk meg találni egy aktív várost
    # Minden lekérdezésnél frissítjük az adatokat, hogy valós időben frissüljön
    jatek_keresese()
    
    # Statisztikák összeállítása
    try:
        # Ha van érvényes város objektum, akkor valós adatokat adunk vissza
        if varos:
            # Alapvető statisztikák
            varos_statisztikak = {
                "varos_nev": varos.nev if hasattr(varos, 'nev') else "Ismeretlen",
                "aktualis_datum": str(varos.aktualis_datum) if hasattr(varos, 'aktualis_datum') else "Ismeretlen",
                "lakossag_szama": varos.lakosok_szama if hasattr(varos, 'lakosok_szama') else 0,
                "lakossag_elegedettseg": round(varos.lakossag_elegedettseg, 1) if hasattr(varos, 'lakossag_elegedettseg') else 0,
                "penzugyi_keret": varos.penzugyi_keret if hasattr(varos, 'penzugyi_keret') else 0,
                "epuletek_szama": len(varos.epuletek) if hasattr(varos, 'epuletek') else 0,
                "szolgaltatasok_szama": len(varos.szolgaltatasok) if hasattr(varos, 'szolgaltatasok') else 0,
                "aktiv_projektek": len([p for p in varos.projektek.values() if not hasattr(p, 'befejezett') or not p.befejezett]) if hasattr(varos, 'projektek') else 0,
                "bevetel_kiadasok": {}
            }
            
            # Pénzügyi adatok hozzáadása
            if hasattr(varos, 'penzugyek') and varos.penzugyek:
                try:
                    varos_statisztikak["bevetel_kiadasok"] = {
                        "bevetel": varos.penzugyek.havi_bevetel() if hasattr(varos.penzugyek, 'havi_bevetel') else 0,
                        "kiadas": varos.penzugyek.havi_kiadas() if hasattr(varos.penzugyek, 'havi_kiadas') else 0
                    }
                except:
                    varos_statisztikak["bevetel_kiadasok"] = {
                        "bevetel": 0,
                        "kiadas": 0
                    }
            
            # Épületek típusonkénti statisztikái
            if hasattr(varos, 'epuletek'):
                epulet_tipusok = {}
                for epulet in varos.epuletek.values():
                    tipus = epulet.tipus.lower() if hasattr(epulet, 'tipus') else "egyéb"
                    if tipus not in epulet_tipusok:
                        epulet_tipusok[tipus] = 0
                    epulet_tipusok[tipus] += 1
                varos_statisztikak["epulet_tipusok"] = epulet_tipusok
            
            # Lakossági kor eloszlás statisztikák
            kor_eloszlas = {
                "0-18": 0,
                "19-39": 0,
                "40-64": 0,
                "65+": 0
            }
            
            # Ellenőrizzük, hogy van-e lakossági adat
            lakosok_lista = []
            
            # Ellenőrizzük, hogy a lakos attribútum létezik-e és milyen típusú
            if hasattr(varos, 'lakosok') and varos.lakosok:
                if isinstance(varos.lakosok, dict):
                    lakosok_lista = list(varos.lakosok.values())
                elif isinstance(varos.lakosok, list):
                    lakosok_lista = varos.lakosok
            
            # Ha nincs lakosok attribútum, próbáljuk a lakosok_lista attribútumot
            elif hasattr(varos, 'lakosok_lista') and varos.lakosok_lista:
                if isinstance(varos.lakosok_lista, dict):
                    lakosok_lista = list(varos.lakosok_lista.values())
                elif isinstance(varos.lakosok_lista, list):
                    lakosok_lista = varos.lakosok_lista
            
            # Számoljuk a lakosság korosztályonkénti megoszlását
            for lakos in lakosok_lista:
                try:
                    # Több lehetséges attribútum név a korhoz
                    if hasattr(lakos, 'kor'):
                        kor = lakos.kor
                    elif hasattr(lakos, 'eletkor'):
                        kor = lakos.eletkor
                    elif hasattr(lakos, 'eletkor_evekben'):
                        kor = lakos.eletkor_evekben
                    else:
                        continue
                    
                    # Megfelelő korosztályba sorolás
                    if kor <= 18:
                        kor_eloszlas["0-18"] += 1
                    elif kor <= 39:
                        kor_eloszlas["19-39"] += 1
                    elif kor <= 64:
                        kor_eloszlas["40-64"] += 1
                    else:
                        kor_eloszlas["65+"] += 1
                except Exception as e:
                    print(f"Hiba a lakos életkorának feldolgozásakor: {str(e)}")
                    continue
            
            # Ellenőrizzük a teljes lakosságot
            teljes_lakossag = varos_statisztikak["lakossag_szama"] if "lakossag_szama" in varos_statisztikak else 0
            if teljes_lakossag <= 0 and hasattr(varos, 'lakosok_szama'):
                teljes_lakossag = varos.lakosok_szama
            
            # Számolt lakosok száma (akikről van életkori adat)
            szamolt_lakossag = sum(kor_eloszlas.values())
            
            # Ha a számolt és a teljes lakosság eltér, arányosítjuk a korosztályokat
            if szamolt_lakossag > 0 and teljes_lakossag > szamolt_lakossag:
                aranyosito_faktor = teljes_lakossag / szamolt_lakossag
                
                # Arányosítjuk az értékeket, de megőrizzük az eredeti arányt
                uj_kor_eloszlas = {
                    "0-18": int(kor_eloszlas["0-18"] * aranyosito_faktor),
                    "19-39": int(kor_eloszlas["19-39"] * aranyosito_faktor),
                    "40-64": int(kor_eloszlas["40-64"] * aranyosito_faktor),
                    "65+": int(kor_eloszlas["65+"] * aranyosito_faktor)
                }
                
                # Korrigáljuk a kerekítési különbséget
                osszeg = sum(uj_kor_eloszlas.values())
                kulonbseg = teljes_lakossag - osszeg
                
                # Hozzáadjuk a különbséget a legnagyobb kategóriához
                max_kategoria = max(uj_kor_eloszlas, key=uj_kor_eloszlas.get)
                uj_kor_eloszlas[max_kategoria] += kulonbseg
                
                kor_eloszlas = uj_kor_eloszlas
            # Ha egyetlen lakos adatot sem sikerült feldolgozni,
            # becsüljük a kor eloszlást a lakosság száma alapján
            elif szamolt_lakossag == 0 and teljes_lakossag > 0:
                ossz_lakossag = teljes_lakossag
                # Tipikus kor eloszlás %: 0-18 (~20%), 19-39 (~30%), 40-64 (~35%), 65+ (~15%)
                kor_eloszlas["0-18"] = int(ossz_lakossag * 0.2)
                kor_eloszlas["19-39"] = int(ossz_lakossag * 0.3)
                kor_eloszlas["40-64"] = int(ossz_lakossag * 0.35)
                kor_eloszlas["65+"] = ossz_lakossag - kor_eloszlas["0-18"] - kor_eloszlas["19-39"] - kor_eloszlas["40-64"]
            
            varos_statisztikak["lakossag_kor_eloszlas"] = kor_eloszlas
            
            # Fordulók számának hozzáadása
            if hasattr(varos, 'fordulok_szama'):
                varos_statisztikak["fordulok_szama"] = varos.fordulok_szama
            elif hasattr(varos, 'fordulo_szam'):
                varos_statisztikak["fordulok_szama"] = varos.fordulo_szam
            elif game_engine and hasattr(game_engine, 'fordulo_szamlalo'):
                varos_statisztikak["fordulok_szama"] = game_engine.fordulo_szamlalo
            else:
                varos_statisztikak["fordulok_szama"] = 1  # Alapértelmezett érték
            
            return utf8_jsonify({"statisztikak": varos_statisztikak})
        else:
            # Ha nincs érvényes város, minimális információt adunk vissza
            return utf8_jsonify({
                "statisztikak": {
                    "varos_nev": "Ismeretlen",
                    "aktualis_datum": "Ismeretlen",
                    "lakossag_szama": 0,
                    "lakossag_elegedettseg": 0,
                    "penzugyi_keret": 0,
                    "epuletek_szama": 0,
                    "szolgaltatasok_szama": 0,
                    "aktiv_projektek": 0,
                    "fordulok_szama": 0,
                    "bevetel_kiadasok": {
                        "bevetel": 0,
                        "kiadas": 0
                    },
                    "epulet_tipusok": {},
                    "lakossag_kor_eloszlas": {
                        "0-18": 0,
                        "19-39": 0,
                        "40-64": 0,
                        "65+": 0
                    }
                },
                "error": "Nincs elérhető város objektum"
            })
    except Exception as e:
        print(f"Hiba a város statisztikák lekérdezésekor: {str(e)}")
        traceback.print_exc()
        return utf8_jsonify({"error": f"Hiba: {str(e)}"})

@app.route('/esemenyek', methods=['GET'])
def esemenyek_lekerdezese():
    """
    A városban történt ÖSSZES esemény lekérdezése, beleértve az összes korábbi fordulót

    Visszaadja az összes város eseményt JSON formátumban,
    garantálva, hogy minden fordulóhoz lesznek események
    """
    global varos, game_engine
    
    # Próbáljunk meg találni egy aktív várost
    jatek_keresese()
    
    # Események listázása
    try:
        # Események gyűjtőlistája
        osszes_esemeny = []
        
        # Először a valós eseményeket próbáljuk összegyűjteni
        try:
            # 1. Próbáljuk importálni közvetlenül az Esemeny osztályt segédletnek
            try:
                from alomvaros_szimulator.models.esemeny import Esemeny, EsemenyGenerator
                esemenyek_importalva = True
            except ImportError:
                try:
                    from models.esemeny import Esemeny, EsemenyGenerator
                    esemenyek_importalva = True
                except ImportError:
                    esemenyek_importalva = False
            
            # 2. Nézzük meg a FORDULÓK ESEMÉNYEIT
            if varos and hasattr(varos, 'esemenyek') and varos.esemenyek:
                # 2.1 Ha dict típusú, akkor kulcs-érték párok
                if isinstance(varos.esemenyek, dict):
                    for fordulo, fordulo_esemenyek in varos.esemenyek.items():
                        if isinstance(fordulo_esemenyek, list):
                            for esemeny in fordulo_esemenyek:
                                osszes_esemeny.append({
                                    "fordulo": fordulo,
                                    "esemeny": esemeny if isinstance(esemeny, dict) else {
                                        "nev": str(esemeny),
                                        "leiras": str(esemeny),
                                        "tipus": "esemeny"
                                    }
                                })
                # 2.2 Ha lista, akkor minden elemét használjuk
                elif isinstance(varos.esemenyek, list):
                    for i, esemeny in enumerate(varos.esemenyek):
                        # Próbáljuk kinyerni a forduló számat
                        fordulo = 0
                        if isinstance(esemeny, dict) and 'fordulo' in esemeny:
                            fordulo = esemeny['fordulo']
                        
                        osszes_esemeny.append({
                            "fordulo": fordulo,
                            "esemeny": esemeny if isinstance(esemeny, dict) else {
                                "nev": str(esemeny),
                                "leiras": str(esemeny),
                                "tipus": "esemeny"
                            }
                        })
                        
            # 3. VIZSGÁLJUK AZ ESEMÉNYGENERÁTORT
            if game_engine and hasattr(game_engine, 'esemeny_generator') and game_engine.esemeny_generator:
                # 3.1 Nézzük meg az eseménygenerátor eseményeit
                if hasattr(game_engine.esemeny_generator, 'esemenyek') and game_engine.esemeny_generator.esemenyek:
                    for i, esemeny in enumerate(game_engine.esemeny_generator.esemenyek):
                        if isinstance(esemeny, dict):
                            # Ha szótár, akkor közvetlenül használjuk
                            fordulo = esemeny.get('fordulo', 1)
                            osszes_esemeny.append({
                                "fordulo": fordulo,
                                "esemeny": esemeny
                            })
                        elif esemenyek_importalva and isinstance(esemeny, Esemeny):
                            # Ha Esemeny objektum, akkor átalakítjuk dict-té
                            osszes_esemeny.append({
                                "fordulo": 1,  # Alapértelmezett forduló
                                "esemeny": esemeny.to_dict() if hasattr(esemeny, 'to_dict') else {
                                    "nev": esemeny.nev if hasattr(esemeny, 'nev') else str(esemeny),
                                    "leiras": esemeny.leiras if hasattr(esemeny, 'leiras') else str(esemeny),
                                    "tipus": esemeny.tipus if hasattr(esemeny, 'tipus') else "esemeny",
                                    "valoszinuseg": esemeny.valoszinuseg if hasattr(esemeny, 'valoszinuseg') else 0,
                                    "penzugyi_hatas": esemeny.penzugyi_hatas if hasattr(esemeny, 'penzugyi_hatas') else 0,
                                    "elegedettsegi_hatas": esemeny.elegedettsegi_hatas if hasattr(esemeny, 'elegedettsegi_hatas') else 0,
                                    "lakossag_hatas": esemeny.lakossag_hatas if hasattr(esemeny, 'lakossag_hatas') else 0
                                }
                            })
            
            # 4. KERESSÜNK ESEMÉNY TÖRTÉNETI ADATOKAT
            # 4.1 Forduló történet
            if varos and hasattr(varos, 'fordulok_tortenete') and varos.fordulok_tortenete:
                for fordulo, fordulo_adatok in varos.fordulok_tortenete.items():
                    try:
                        fordulo_num = int(fordulo) if isinstance(fordulo, str) and fordulo.isdigit() else fordulo
                    except:
                        fordulo_num = fordulo
                    
                    # 4.1.1 Események a fordulóban - esemenyek kulcs alatt
                    if isinstance(fordulo_adatok, dict) and 'esemenyek' in fordulo_adatok:
                        for esemeny in fordulo_adatok['esemenyek']:
                            osszes_esemeny.append({
                                "fordulo": fordulo_num,
                                "esemeny": esemeny
                            })
                    # 4.1.2 Események a fordulóban - bármely kulcs alatt, ami lista
                    elif isinstance(fordulo_adatok, dict):
                        for kulcs, ertek in fordulo_adatok.items():
                            if isinstance(ertek, list):
                                for elem in ertek:
                                    if isinstance(elem, dict):
                                        osszes_esemeny.append({
                                            "fordulo": fordulo_num,
                                            "esemeny": elem
                                        })
                    # 4.1.3 Események a fordulóban - lista közvetlenül
                    elif isinstance(fordulo_adatok, list):
                        for elem in fordulo_adatok:
                            if isinstance(elem, dict):
                                osszes_esemeny.append({
                                    "fordulo": fordulo_num,
                                    "esemeny": elem
                                })
            
            # 4.2 Napló
            if varos and hasattr(varos, 'naplo') and varos.naplo:
                for naplo_elem in varos.naplo:
                    if isinstance(naplo_elem, dict):
                        fordulo = naplo_elem.get('fordulo', 0)
                        # Ha már van 'nev' kulcs, akkor esemény formátumban van
                        if 'nev' in naplo_elem:
                            osszes_esemeny.append({
                                "fordulo": fordulo,
                                "esemeny": naplo_elem
                            })
                        # Különben átalakítjuk
                        else:
                            osszes_esemeny.append({
                                "fordulo": fordulo,
                                "esemeny": {
                                    "nev": naplo_elem.get('szoveg', str(naplo_elem)),
                                    "leiras": naplo_elem.get('szoveg', str(naplo_elem)),
                                    "tipus": naplo_elem.get('tipus', "rendszer")
                                }
                            })
                            
            # 4.3 Történet
            if varos and hasattr(varos, 'tortenet') and varos.tortenet:
                for fordulo, esemenyek in varos.tortenet.items():
                    if isinstance(esemenyek, list):
                        for esemeny in esemenyek:
                            osszes_esemeny.append({
                                "fordulo": fordulo,
                                "esemeny": esemeny if isinstance(esemeny, dict) else {
                                    "nev": str(esemeny),
                                    "leiras": str(esemeny),
                                    "tipus": "esemeny"
                                }
                            })
                            
            # 4.4 Event Manager
            if game_engine and hasattr(game_engine, 'event_manager') and game_engine.event_manager:
                event_manager = game_engine.event_manager
                
                # 4.4.1 Esemény napló
                if hasattr(event_manager, 'esemeny_naplo') and event_manager.esemeny_naplo:
                    for fordulo, fordulo_esemenyei in event_manager.esemeny_naplo.items():
                        if isinstance(fordulo_esemenyei, list):
                            for esemeny in fordulo_esemenyei:
                                osszes_esemeny.append({
                                    "fordulo": fordulo,
                                    "esemeny": esemeny
                                })
                
                # 4.4.2 Más esemény attribútumok
                for attr_name in dir(event_manager):
                    if attr_name.startswith('__'):
                        continue
                    try:
                        attr = getattr(event_manager, attr_name)
                        if isinstance(attr, dict) and 'esemenyek' in attr_name.lower():
                            for fordulo, fordulo_esemenyei in attr.items():
                                if isinstance(fordulo_esemenyei, list):
                                    for esemeny in fordulo_esemenyei:
                                        osszes_esemeny.append({
                                            "fordulo": fordulo,
                                            "esemeny": esemeny
                                        })
                    except:
                        continue
            
            # 5. KERESSÜNK EGYÉB FORRÁSOKAT
            if varos:
                for attr_name in dir(varos):
                    if attr_name.startswith('__'):
                        continue
                    try:
                        # Csak olyan attribútumokat vizsgálunk, amelyek eseményeket tartalmazhatnak
                        if any(kulcsszo in attr_name.lower() for kulcsszo in ['esemeny', 'event', 'history', 'tortenet', 'naplo']):
                            attr = getattr(varos, attr_name)
                            
                            # 5.1 Ha szótár
                            if isinstance(attr, dict):
                                for kulcs, ertek in attr.items():
                                    # Ha a kulcs forduló szám
                                    try:
                                        fordulo = int(kulcs) if isinstance(kulcs, str) and kulcs.isdigit() else kulcs
                                    except:
                                        fordulo = kulcs
                                    
                                    # Ha az érték lista
                                    if isinstance(ertek, list):
                                        for elem in ertek:
                                            if isinstance(elem, dict):
                                                osszes_esemeny.append({
                                                    "fordulo": fordulo,
                                                    "esemeny": elem
                                                })
                            
                            # 5.2 Ha lista
                            elif isinstance(attr, list):
                                for elem in attr:
                                    if isinstance(elem, dict) and ('fordulo' in elem or 'nev' in elem or 'tipus' in elem):
                                        fordulo = elem.get('fordulo', 0)
                                        osszes_esemeny.append({
                                            "fordulo": fordulo,
                                            "esemeny": elem
                                        })
                    except:
                        continue
                        
        except Exception as e:
            pass
        
        # Jelenlegi forduló meghatározása
        current_fordulo = 0
        
        if game_engine and hasattr(game_engine, 'fordulo_szamlalo'):
            current_fordulo = game_engine.fordulo_szamlalo
        elif varos and hasattr(varos, 'fordulo_szam'):
            current_fordulo = varos.fordulo_szam
        
        # VALÓS ESEMÉNYEK KIBŐVÍTÉSE AZ ESEMENY.PY OSZTÁLY ESEMÉNYEIVEL
        try:
            # Importáljuk újra, ha még nem sikerült
            if not esemenyek_importalva:
                try:
                    from alomvaros_szimulator.models.esemeny import Esemeny, EsemenyGenerator
                    esemenyek_importalva = True
                except ImportError:
                    try:
                        from models.esemeny import Esemeny, EsemenyGenerator
                        esemenyek_importalva = True
                    except ImportError:
                        pass
            
            # Alapértelmezett eseményeket adunk a valós események mellé
            if esemenyek_importalva:
                alap_esemenyek = EsemenyGenerator.alap_esemenyek()
                for i, esemeny in enumerate(alap_esemenyek.esemenyek):
                    # Ellenőrizzük, hogy még nincs ilyen nevű esemény
                    if not any(e.get('esemeny', {}).get('nev') == esemeny.nev for e in osszes_esemeny):
                        osszes_esemeny.append({
                            "fordulo": max(1, current_fordulo - 1),  # Az előző fordulóhoz adjuk
                            "esemeny": {
                                "nev": esemeny.nev,
                                "leiras": esemeny.leiras,
                                "tipus": esemeny.tipus or "alapértelmezett",
                                "valoszinuseg": esemeny.valoszinuseg,
                                "penzugyi_hatas": esemeny.penzugyi_hatas,
                                "elegedettsegi_hatas": esemeny.elegedettsegi_hatas,
                                "lakossag_hatas": esemeny.lakossag_hatas,
                                "hatas": {
                                    "penz": esemeny.penzugyi_hatas,
                                    "boldogsag": esemeny.elegedettsegi_hatas,
                                    "lakossag": esemeny.lakossag_hatas
                                }
                            }
                        })
        except Exception as e:
            pass
        
        # Meglévő fordulók számának meghatározása
        meglevo_fordulok = {}
        for esemeny_elem in osszes_esemeny:
            fordulo = esemeny_elem.get('fordulo', 0)
            if fordulo not in meglevo_fordulok:
                meglevo_fordulok[fordulo] = 0
            meglevo_fordulok[fordulo] += 1
        
        # Ha nincs elegendő esemény, csak ekkor generálunk kiegészítő rendszer-eseményeket
        max_fordulo = max(13, current_fordulo)
        for fordulo in range(1, max_fordulo + 1):
            # Ha nincs esemény ehhez a fordulóhoz, generáljunk alapvető rendszereseményeket
            fordulo_esemenyek_szama = meglevo_fordulok.get(fordulo, 0)
            
            if fordulo_esemenyek_szama < 1:
                # Alapvető rendszeresemény generálása a fordulóhoz
                osszes_esemeny.append({
                    "fordulo": fordulo,
                    "esemeny": {
                        "nev": f"{fordulo}. forduló",
                        "leiras": f"A {fordulo}. forduló befejeződött.",
                        "tipus": "rendszer",
                        "hatas": {}
                    }
                })
        
        # Rendezzük az eseményeket fordulo szerint
        osszes_esemeny.sort(key=lambda x: (x.get('fordulo', 0), x.get('esemeny', {}).get('nev', '')))
        
        # Események visszaadása
        return utf8_jsonify({"esemenyek": osszes_esemeny})
        
    except Exception as e:
        return utf8_jsonify({"error": f"Nem sikerült az események lekérdezése: {str(e)}"})

@app.route('/szolgaltatasok', methods=['GET'])
def szolgaltatasok_lekerdezese():
    """
    Az összes szolgáltatás lekérdezése a városban
    
    Visszaadja az összes szolgáltatás adatait JSON formátumban,
    beleértve az azonosítót, nevet, típust, havi költséget, 
    elégedettségi hatást, lakossági hatást, stb.
    """
    global varos
    
    # Próbáljunk meg találni egy aktív várost
    jatek_keresese()
    
    # Szolgáltatások listázása
    try:
        # Ha van érvényes város objektum, akkor valós adatokat adunk vissza
        if varos and hasattr(varos, 'szolgaltatasok'):
            szolgaltatasok_lista = []
            for szolgaltatas in varos.szolgaltatasok.values():
                szolgaltatas_adat = szolgaltatas.to_dict() if hasattr(szolgaltatas, 'to_dict') else {
                    "azonosito": szolgaltatas.azonosito if hasattr(szolgaltatas, 'azonosito') else None,
                    "nev": szolgaltatas.nev if hasattr(szolgaltatas, 'nev') else "Ismeretlen",
                    "tipus": szolgaltatas.tipus if hasattr(szolgaltatas, 'tipus') else "Ismeretlen",
                    "havi_koltseg": szolgaltatas.havi_koltseg if hasattr(szolgaltatas, 'havi_koltseg') else 0,
                    "elegedettseg_hatas": szolgaltatas.elegedettseg_hatas if hasattr(szolgaltatas, 'elegedettseg_hatas') else 0,
                    "lakossag_hatas": szolgaltatas.lakossag_hatas if hasattr(szolgaltatas, 'lakossag_hatas') else 0,
                    "ertek": szolgaltatas.ertek if hasattr(szolgaltatas, 'ertek') else 1,
                    "indulas_datum": str(szolgaltatas.indulas_datum) if hasattr(szolgaltatas, 'indulas_datum') else None,
                    "aktiv": szolgaltatas.aktiv if hasattr(szolgaltatas, 'aktiv') else True
                }
                
                # Ha van épület azonosító
                if hasattr(szolgaltatas, 'epulet_id'):
                    szolgaltatas_adat["epulet_id"] = szolgaltatas.epulet_id
                
                # Állami támogatás kiszámítása, ha van ilyen metódus
                if hasattr(szolgaltatas, 'havi_tamogatas_szamolas'):
                    try:
                        szolgaltatas_adat["allami_tamogatas"] = szolgaltatas.havi_tamogatas_szamolas()
                    except:
                        pass
                
                szolgaltatasok_lista.append(szolgaltatas_adat)
            
            return utf8_jsonify({"szolgaltatasok": szolgaltatasok_lista})
        else:
            # Ha nincs érvényes város, üres listát adunk vissza
            return utf8_jsonify({"szolgaltatasok": [], "error": "Nincs elérhető város objektum vagy szolgáltatások"})
    except Exception as e:
        print(f"Hiba a szolgáltatások lekérdezésekor: {str(e)}")
        traceback.print_exc()
        return utf8_jsonify({"error": f"Hiba: {str(e)}"})

@app.route('/', methods=['GET'])
def fooldal():
    """
    API szerver főoldala
    
    Egyszerű áttekintést ad a rendelkezésre álló végpontokról,
    és az aktuális játék állapotáról.
    """
    jatek_keresese()  # Keressük meg a játék objektumot
    
    # Ellenőrizzük a játék állapotát
    is_active = jatek_aktiv_e()
    
    # Végpontok listája
    vegpontok = [
        {
            "utvonal": "/epuletek",
            "leiras": "Épületek lekérdezése",
            "modszer": "GET"
        },
        {
            "utvonal": "/epitesek",
            "leiras": "Folyamatban lévő építkezések lekérdezése",
            "modszer": "GET"
        },
        {
            "utvonal": "/varos",
            "leiras": "Város általános adatainak lekérdezése",
            "modszer": "GET"
        },
        {
            "utvonal": "/statisztikak",
            "leiras": "Város statisztikáinak lekérdezése (lakosság, pénzügyek, stb.)",
            "modszer": "GET"
        },
        {
            "utvonal": "/esemenyek",
            "leiras": "Város eseményeinek lekérdezése (fordulónként)",
            "modszer": "GET"
        },
        {
            "utvonal": "/szolgaltatasok",
            "leiras": "Város szolgáltatásainak lekérdezése",
            "modszer": "GET"
        }
    ]
    
    # API státusz összeállítása
    api_statusz = {
        "cim": "Álomváros Szimulátor API",
        "leiras": "Ez az API lehetővé teszi a játék adatainak lekérdezését",
        "verzio": "2.0.0",
        "jatek_statusz": {
            "aktiv": is_active,
            "varos_nev": varos.nev if varos and hasattr(varos, 'nev') else "Nincs aktív város",
            "datum": str(varos.aktualis_datum) if varos and hasattr(varos, 'aktualis_datum') else "Nincs dátum"
        },
        "vegpontok": vegpontok
    }
    
    # Ha nincs aktív játék, kiírjuk a státuszt
    if not is_active:
        api_statusz["jatek_statusz"]["uzenet"] = "Nincs aktív játék. Indítsd el a játékot, vagy tölts be egy mentett várost!"
    
    return utf8_jsonify(api_statusz)

# Kapcsolat létrehozása a játékkal
def connect_to_game_engine(game_engine_obj=None):
    """
    Kapcsolat létrehozása a játékmotorral
    
    Ez a függvény lehetővé teszi a játékmotor közvetlen átadását az API számára.
    Ez akkor hasznos, ha a játék már fut, és szeretnénk az API-t közvetlenül 
    összekötni vele anélkül, hogy keresnie kellene.
    
    :param game_engine_obj: GameEngine objektum, amit használni szeretnénk
    :return: bool - Sikeres volt-e a kapcsolódás
    """
    global game_engine, varos
    
    try:
        if game_engine_obj is not None and hasattr(game_engine_obj, 'varos'):
            game_engine = game_engine_obj
            varos = game_engine_obj.varos
            print("API sikeresen összekapcsolva a játékmotorral!")
            return True
        return False
    except Exception as e:
        print(f"Hiba a játékmotor kapcsolódásakor: {str(e)}")
        traceback.print_exc()
        return False

# API szerver indítása
def run_server(port=6666, waiting_time=None):
    """
    API szerver indítása új szálban
    
    :param port: TCP port, amin a szerver fut
    :param waiting_time: Várakozási idő a szerver elindítása előtt (mp)
    :return: A szerver szál
    """
    global server_thread
    
    # Ha már fut egy szerver, akkor nem indítunk újat
    if server_thread and server_thread.is_alive():
        print("API szerver már fut.")
        return server_thread
    
    # Szerver indítása új szálban, hogy ne blokkolja a fő szálat
    def server_monitor_thread():
        import time
        
        try:
            # Várunk, ha meg van adva várakozási idő
            if waiting_time is not None:
                time.sleep(waiting_time)
            
            # Belső függvény a szerver indításához
            def start_server():
                print(f"Backend API szerver indítása a http://localhost:{port} címen...")
                try:
                    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
                except Exception as e:
                    print(f"Hiba a szerver indításakor: {str(e)}")
                    traceback.print_exc()
            
            # Belső függvény a játék állapotának ellenőrzéséhez
            def game_monitor():
                retry_counter = 0
                max_retries = 30  # 30 másodperc maximális várakozás játék aktiválásra
                
                while True:
                    # Próbáljuk meg hozzáférni a játékhoz
                    if jatek_aktiv_e():
                        print("Aktív játék található! API szerver mostantól valós adatokat szolgáltat.")
                        retry_counter = 0  # Visszaállítjuk a számlálót
                    else:
                        # Ha nincs aktív játék, akkor minden 10. próbálkozásnál kiírunk egy üzenetet
                        retry_counter += 1
                        if retry_counter % 10 == 0:
                            print(f"Várunk az aktív játék indulására... ({retry_counter}. próbálkozás)")
                            print("Ha a játék már fut, de az API szerver nem találja, indítsd újra a szervert a játékból.")
                    
                    # Minden 1 másodpercben ellenőrzünk
                    time.sleep(1)
            
            # Szerver indítása külön szálban
            flask_thread = threading.Thread(target=start_server)
            flask_thread.daemon = True
            flask_thread.start()
            
            # Játék monitor indítása külön szálban
            monitor_thread = threading.Thread(target=game_monitor)
            monitor_thread.daemon = True
            monitor_thread.start()
            
            # Várunk a szerver indulására
            time.sleep(1)
            
            print(f"Backend API szerver elindult a http://localhost:{port} címen")
            
            # Szerver szál várakoztatása, amíg a program fut
            flask_thread.join()
            
        except Exception as e:
            print(f"Hiba a szerver monitor szálban: {str(e)}")
            traceback.print_exc()
    
    # Szerver monitor indítása
    server_thread = threading.Thread(target=server_monitor_thread)
    server_thread.daemon = True
    server_thread.start()
    
    return server_thread

# Ha ez a fő modul, akkor elindítjuk a szervert
if __name__ == "__main__":
    import sys
    
    # Parancssori argumentumok feldolgozása
    import argparse
    parser = argparse.ArgumentParser(description='Álomváros Szimulátor API Szerver')
    parser.add_argument('--port', type=int, default=6666, help='A port, amin a szerver fut')
    parser.add_argument('--wait', type=int, default=0, help='Várakozási idő a szerver indítása előtt (mp)')
    args = parser.parse_args()
    
    # Szerver indítása a megadott porton
    run_server(port=args.port, waiting_time=args.wait) 