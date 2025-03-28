"""
Játékmentési és betöltési funkciókat tartalmazó modul
"""

import os
import json
import shutil
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import customtkinter as ctk
from PIL import Image, ImageTk
import traceback

# Relatív import a konfigurációkhoz
from alomvaros_szimulator.config import MENTES_MAPPA, get_config


class GameSaveManager:
    """
    Játék mentési és betöltési funkcióit kezelő osztály.
    
    Ez az osztály felelős a játék állapotának mentéséért és betöltéséért,
    valamint a mentésfájlok kezeléséért.
    """
    
    def __init__(self, game_engine):
        """
        Játékmentés-kezelő inicializálása
        
        :param game_engine: A játék motor objektum, ami a játék állapotát tárolja
        """
        self.game_engine = game_engine
        self.mentes_mappa = MENTES_MAPPA
        
        # Mappa létrehozása, ha még nem létezik
        os.makedirs(self.mentes_mappa, exist_ok=True)
    
    def save_game(self, mentes_nev=None, show_dialog=True):
        """
        Játék mentése fájlba
        
        :param mentes_nev: A mentés neve (opcionális, ha None, akkor automatikusan generálódik)
        :param show_dialog: Jelenjen-e meg mentési párbeszédablak (True/False)
        :return: True, ha sikeres volt a mentés, False egyébként
        """
        if not self.game_engine.jatek_aktiv:
            if show_dialog:
                messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék amit menteni lehetne!")
            return False
        
        # Ha nincs megadva mentés név, és kell dialógus, akkor megjelenítjük a mentés ablakot
        if mentes_nev is None and show_dialog:
            return self._show_save_dialog()
        
        # Ha nincs megadva mentés név, de nem kell dialógus, akkor automatikus névgenerálás
        if mentes_nev is None:
            mentes_nev = f"{self.game_engine.varos.nev}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        try:
            # Mentés adatok összeállítása
            jatek_adatok = self.game_engine.mentes()
            
            # Mentés fájl útvonala
            mentes_utvonal = os.path.join(self.mentes_mappa, f"{mentes_nev}.json")
            
            # Fájl létrehozása
            with open(mentes_utvonal, 'w', encoding='utf-8') as file:
                json.dump(jatek_adatok, file, ensure_ascii=False, indent=4)
            
            # Üzenet megjelenítése, ha kell
            if show_dialog:
                messagebox.showinfo("Mentés", f"Játék sikeresen mentve: {mentes_nev}")
            
            print(f"Játék sikeresen mentve: {mentes_utvonal}")
            return True
            
        except Exception as e:
            # Hiba üzenet megjelenítése, ha kell
            if show_dialog:
                messagebox.showerror("Hiba", f"Hiba történt a mentés során: {str(e)}")
            
            print(f"Hiba a játék mentése során: {str(e)}")
            traceback.print_exc()
            return False
    
    def _show_save_dialog(self):
        """
        Mentés párbeszédablak megjelenítése
        
        :return: True, ha sikeres volt a mentés, False egyébként
        """
        # Létrehozunk egy új ablakot
        dialog = tk.Toplevel()
        dialog.title("Játék mentése")
        dialog.geometry("400x150")
        dialog.transient()  # Modális ablak
        dialog.grab_set()   # Input fókusz
        
        # Mentés neve mező
        ttk.Label(dialog, text="Mentés neve:").pack(pady=5)
        mentes_nev = ttk.Entry(dialog, width=40)
        mentes_nev.pack(pady=5, padx=10)
        
        # Alapértelmezett mentési név
        default_name = f"{self.game_engine.varos.nev}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        mentes_nev.insert(0, default_name)
        
        # Mentés eredménye
        result = [False]  # List to store the result (needed for closure)
        
        # Mentés gomb callback függvénye
        def on_save():
            if not mentes_nev.get().strip():
                messagebox.showerror("Hiba", "A mentés neve nem lehet üres!")
                return
            
            # Karakter korlátok ellenőrzése
            illegalis_karakterek = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
            if any(c in mentes_nev.get() for c in illegalis_karakterek):
                messagebox.showerror(
                    "Hiba", 
                    "A mentés neve nem tartalmazhat a következő karaktereket: / \\ : * ? \" < > |"
                )
                return
            
            # Mentés végrehajtása
            save_success = self.save_game(mentes_nev.get(), show_dialog=False)
            result[0] = save_success
            
            # Üzenet és ablak bezárása
            if save_success:
                messagebox.showinfo("Sikeres mentés", f"A játék sikeresen elmentve: {mentes_nev.get()}")
                dialog.destroy()
            else:
                messagebox.showerror("Mentési hiba", "Nem sikerült elmenteni a játékot!")
        
        # Mégse gomb callback függvénye
        def on_cancel():
            dialog.destroy()
        
        # Gombok
        button_frame = ttk.Frame(dialog)
        button_frame.pack(pady=10)
        
        ttk.Button(button_frame, text="Mentés", command=on_save).pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Mégse", command=on_cancel).pack(side=tk.LEFT)
        
        # Várjuk meg, amíg bezáródik az ablak
        dialog.wait_window()
        
        # Visszatérés az eredménnyel
        return result[0]
    
    def load_game(self, mentes_fajl=None, show_dialog=True, callback=None):
        """
        Játék betöltése fájlból
        
        :param mentes_fajl: A mentés fájl elérési útja (opcionális)
        :param show_dialog: Jelenjen-e meg betöltési párbeszédablak (True/False)
        :param callback: Callback függvény sikeres betöltés után (opcionális)
        :return: True, ha sikeres volt a betöltés, False egyébként
        """
        # Ha nincs megadva mentés fájl, és kell dialógus, akkor megjelenítjük a betöltés ablakot
        if mentes_fajl is None and show_dialog:
            return self._show_load_dialog(callback=callback)
        
        # Ha van megadva mentés fájl, akkor betöltjük
        if mentes_fajl:
            try:
                # Betöltjük a játékot
                varos = self.game_engine.jatek_betoltese(mentes_fajl)
                
                # Ellenőrizzük, hogy sikeres volt-e a betöltés
                if varos is None:
                    if show_dialog:
                        messagebox.showerror("Hiba", "A játék betöltése sikertelen volt.")
                    return False
                
                # Üzenet megjelenítése, ha kell
                if show_dialog:
                    messagebox.showinfo("Betöltés", f"Játék sikeresen betöltve: {os.path.basename(mentes_fajl)}")
                
                print(f"Játék sikeresen betöltve: {mentes_fajl}")
                
                # Callback hívása, ha van és sikeres volt a betöltés
                if callback and self.game_engine.varos is not None:
                    callback()
                
                return True
                
            except Exception as e:
                # Hiba üzenet megjelenítése, ha kell
                if show_dialog:
                    messagebox.showerror("Hiba", f"Hiba történt a betöltés során: {str(e)}")
                
                print(f"Hiba a játék betöltése során: {str(e)}")
                traceback.print_exc()
                return False
        
        return False
    
    def _show_load_dialog(self, callback=None):
        """
        Betöltés párbeszédablak megjelenítése
        
        :param callback: Callback függvény sikeres betöltés után (opcionális)
        :return: True, ha sikeres volt a betöltés, False egyébként
        """
        try:
            # Mentésfájlok listázása
            save_files = self._list_save_files()
            
            if not save_files:
                messagebox.showinfo("Nincs mentés", "Nem található mentett játék!")
                return False
            
            # Létrehozunk egy új ablakot
            dialog = tk.Toplevel()
            dialog.title("Játék betöltése")
            dialog.geometry("600x400")
            dialog.transient()  # Modális ablak
            dialog.grab_set()   # Input fókusz
            
            # Betöltés eredménye
            result = [False]  # List to store the result (needed for closure)
            
            # Mentésfájlok lista felület
            ttk.Label(dialog, text="Válassz egy mentést a betöltéshez:", font=("Helvetica", 12)).pack(pady=10)
            
            # Lista keret
            list_frame = ttk.Frame(dialog)
            list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
            
            # Görgetősáv
            scrollbar = ttk.Scrollbar(list_frame)
            scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
            
            # Oszlopok
            columns = ("fajlnev", "datum", "fordulo", "varos_nev", "lakossag", "egyenleg")
            
            # Treeview (táblázat)
            save_list = ttk.Treeview(list_frame, columns=columns, show="headings", yscrollcommand=scrollbar.set)
            save_list.pack(fill=tk.BOTH, expand=True)
            
            # Oszlopok beállítása
            save_list.heading("fajlnev", text="Fájlnév")
            save_list.heading("datum", text="Dátum")
            save_list.heading("fordulo", text="Forduló")
            save_list.heading("varos_nev", text="Város neve")
            save_list.heading("lakossag", text="Lakosság")
            save_list.heading("egyenleg", text="Egyenleg")
            
            # Oszlopok szélességének beállítása
            save_list.column("fajlnev", width=150)
            save_list.column("datum", width=100)
            save_list.column("fordulo", width=60)
            save_list.column("varos_nev", width=120)
            save_list.column("lakossag", width=80)
            save_list.column("egyenleg", width=100)
            
            # Görgetősáv hozzárendelése
            scrollbar.config(command=save_list.yview)
            
            # Adatok feltöltése
            for save_file in save_files:
                file_name = os.path.basename(save_file['fajl_utvonal'])
                save_list.insert("", tk.END, values=(
                    file_name,
                    save_file['datum'],
                    save_file['fordulo'],
                    save_file['varos_nev'],
                    f"{save_file['lakossag']} fő",
                    f"{save_file['egyenleg']:,} Ft".replace(",", " ")
                ))
                
            # Kijelölés callback függvénye
            def on_select(event):
                # Gombok engedélyezése, ha van kijelölés
                selected_items = save_list.selection()
                load_button["state"] = "normal" if selected_items else "disabled"
                delete_button["state"] = "normal" if selected_items else "disabled"
            
            save_list.bind("<<TreeviewSelect>>", on_select)
            
            # Betöltés gomb callback függvénye
            def on_load():
                # Kijelölt elem lekérése
                selected_items = save_list.selection()
                if not selected_items:
                    return
                
                # Kijelölt fájl neve
                selected_item = selected_items[0]
                file_name = save_list.item(selected_item, "values")[0]
                
                # Teljes elérési út
                mentes_fajl = os.path.join(self.mentes_mappa, file_name)
                
                # Betöltés végrehajtása
                load_success = self.load_game(mentes_fajl, show_dialog=False)
                result[0] = load_success
                
                # Üzenet és ablak bezárása
                if load_success:
                    messagebox.showinfo("Sikeres betöltés", f"A játék sikeresen betöltve: {file_name}")
                    dialog.destroy()
                    
                    # Callback hívása, ha van
                    if callback:
                        callback()
                else:
                    messagebox.showerror("Betöltési hiba", "Nem sikerült betölteni a játékot!")
            
            # Törlés gomb callback függvénye
            def on_delete():
                # Kijelölt elem lekérése
                selected_items = save_list.selection()
                if not selected_items:
                    return
                
                # Kijelölt fájl neve
                selected_item = selected_items[0]
                file_name = save_list.item(selected_item, "values")[0]
                
                # Megerősítés kérése
                if messagebox.askyesno("Mentés törlése", f"Biztosan törölni szeretnéd a következő mentést: {file_name}?"):
                    # Teljes elérési út
                    mentes_fajl = os.path.join(self.mentes_mappa, file_name)
                    
                    try:
                        # Fájl törlése
                        os.remove(mentes_fajl)
                        
                        # Elem törlése a listából
                        save_list.delete(selected_item)
                        
                        # Üzenet
                        messagebox.showinfo("Törlés", f"A mentés sikeresen törölve: {file_name}")
                        
                        # Ha a lista üres, bezárjuk az ablakot
                        if not save_list.get_children():
                            messagebox.showinfo("Nincs több mentés", "Nincs több mentett játék!")
                            dialog.destroy()
                    except Exception as e:
                        messagebox.showerror("Hiba", f"Hiba történt a mentés törlése során: {str(e)}")
            
            # Mégse gomb callback függvénye
            def on_cancel():
                dialog.destroy()
            
            # Gombok
            button_frame = ttk.Frame(dialog)
            button_frame.pack(pady=10)
            
            load_button = ttk.Button(button_frame, text="Betöltés", command=on_load, state="disabled")
            load_button.pack(side=tk.LEFT, padx=10)
            
            delete_button = ttk.Button(button_frame, text="Törlés", command=on_delete, state="disabled")
            delete_button.pack(side=tk.LEFT, padx=10)
            
            ttk.Button(button_frame, text="Mégse", command=on_cancel).pack(side=tk.LEFT)
            
            # Várjuk meg, amíg bezáródik az ablak
            dialog.wait_window()
            
            # Visszatérés az eredménnyel
            return result[0]
            
        except Exception as e:
            messagebox.showerror("Hiba", f"Váratlan hiba történt: {str(e)}")
            traceback.print_exc()
            return False
    
    def _list_save_files(self):
        """
        Mentésfájlok listázása a mentések mappából
        
        :return: Mentésfájlok listája részletes adatokkal
        """
        try:
            # Ellenőrizzük, hogy a könyvtár létezik-e
            if not os.path.exists(self.mentes_mappa):
                os.makedirs(self.mentes_mappa, exist_ok=True)
                return []
            
            # Mentésfájlok keresése
            save_files = []
            for file_name in os.listdir(self.mentes_mappa):
                if file_name.endswith('.json'):
                    file_path = os.path.join(self.mentes_mappa, file_name)
                    
                    try:
                        # Fájl adatainak beolvasása
                        with open(file_path, 'r', encoding='utf-8') as f:
                            save_data = json.load(f)
                        
                        # Alapvető adatok kinyerése
                        varos_data = save_data.get('varos', {})
                        mentes_idopont = save_data.get('mentes_idopontja', datetime.now().isoformat())
                        fordulo = save_data.get('fordulo_szamlalo', 0)
                        
                        # Datetime objektummá alakítás
                        try:
                            dt = datetime.fromisoformat(mentes_idopont)
                            mentes_datum = dt.strftime('%Y.%m.%d %H:%M')
                        except (ValueError, TypeError):
                            mentes_datum = "Ismeretlen"
                            
                        # Adatok formázása
                        save_info = {
                            'fajl_utvonal': file_path,
                            'fajlnev': file_name,
                            'datum': mentes_datum,
                            'fordulo': fordulo,
                            'varos_nev': varos_data.get('nev', 'Ismeretlen'),
                            'lakossag': varos_data.get('lakosok_szama', 0),
                            'egyenleg': varos_data.get('penzugyi_keret', 0)
                        }
                        
                        save_files.append(save_info)
                    except Exception as e:
                        print(f"Hiba a mentésfájl olvasásakor: {file_path}, hiba: {str(e)}")
                        continue
            
            # Rendezés módosítási dátum szerint (legfrissebb elöl)
            save_files.sort(
                key=lambda x: os.path.getmtime(x['fajl_utvonal']), 
                reverse=True
            )
            
            return save_files
            
        except Exception as e:
            print(f"Hiba a mentésfájlok listázásakor: {str(e)}")
            traceback.print_exc()
            return []
    
    def auto_save(self, mentes_nev=None):
        """
        Automata mentés
        
        :param mentes_nev: A mentés neve (opcionális, ha None, akkor automatikusan generálódik)
        :return: True, ha sikeres volt a mentés, False egyébként
        """
        if not self.game_engine.jatek_aktiv:
            return False
        
        # Automatikus mentési név generálása
        if mentes_nev is None:
            mentes_nev = f"auto_{self.game_engine.varos.nev}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Mentés végrehajtása
        return self.save_game(mentes_nev, show_dialog=False)
    
    def get_latest_save(self):
        """
        Legfrissebb mentés lekérése
        
        :return: A legfrissebb mentésfájl elérési útja, vagy None, ha nincs mentés
        """
        try:
            # Mentésfájlok lekérése
            save_files = self._list_save_files()
            
            # Ha nincs mentésfájl, visszaadunk None-t
            if not save_files:
                return None
            
            # Visszaadjuk a legfrissebb mentésfájl elérési útját
            return save_files[0]['fajl_utvonal']
            
        except Exception as e:
            print(f"Hiba a legfrissebb mentés lekérésekor: {str(e)}")
            return None
    
    def check_auto_save(self, fordulo_szam):
        """
        Automatikus mentés végrehajtása, ha a forduló száma osztható a mentési gyakorisággal
        
        :param fordulo_szam: Az aktuális forduló száma
        :return: True, ha történt automatikus mentés, False egyébként
        """
        # Ha nincs aktív játék, kilépünk
        if not self.game_engine.jatek_aktiv:
            return False
        
        # Automatikus mentés gyakorisága
        auto_save_frequency = get_config("jatekmenet.auto_mentes_gyakorisag", 6)
        
        # Ha a forduló száma osztható a mentési gyakorisággal, akkor automatikus mentés
        if fordulo_szam > 0 and fordulo_szam % auto_save_frequency == 0:
            # Mentés név generálása
            auto_save_name = f"auto_{self.game_engine.varos.nev}_fordulo{fordulo_szam}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Mentés végrehajtása
            return self.auto_save(auto_save_name)
        
        return False 