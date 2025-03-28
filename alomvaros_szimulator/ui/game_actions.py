"""
Játék működését kezelő metódusok a főablakhoz
"""
import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import os
import json

from alomvaros_szimulator.game.game_engine import GameEngine
from alomvaros_szimulator.game.fordulo_manager import ForduloManager
from alomvaros_szimulator.game.event_manager import EventManager
from alomvaros_szimulator.config import BEALLITASOK, EPULETEK_CSV, SZOLGALTATASOK_CSV, LAKOSOK_CSV, MENTES_MAPPA, KIMENET_MAPPA
from alomvaros_szimulator.models.varos import Varos


class GameActions:
    """
    Játék működését kezelő osztály
    """
    
    def __init__(self, main_window):
        """
        Inicializálás
        
        :param main_window: Főablak objektum
        """
        self.main_window = main_window
        self.game_engine = main_window.game_engine
        self.fordulo_manager = main_window.fordulo_manager
        self.event_manager = main_window.event_manager
    
    def _new_game(self):
        """
        Új játék indítása
        """
        # Új játék ablak
        dialog = tk.Toplevel(self.main_window.root)
        dialog.title("Új játék")
        dialog.geometry("400x350")
        
        # Beviteli mezők
        ttk.Label(dialog, text="Város neve:").pack(pady=5)
        varos_nev = ttk.Entry(dialog)
        varos_nev.pack(pady=5)
        varos_nev.insert(0, "Álomváros")
        
        ttk.Label(dialog, text="Pénzügyi keret:").pack(pady=5)
        penzugyi_keret = ttk.Entry(dialog)
        penzugyi_keret.pack(pady=5)
        penzugyi_keret.insert(0, str(BEALLITASOK['alapok']['penzugyi_keret']))
        
        ttk.Label(dialog, text="Lakosság elégedettsége:").pack(pady=5)
        elegedettseg = ttk.Entry(dialog)
        elegedettseg.pack(pady=5)
        elegedettseg.insert(0, str(BEALLITASOK['alapok']['elegedettseg']))
        
        ttk.Label(dialog, text="Minimális elégedettség:").pack(pady=5)
        min_elegedettseg = ttk.Entry(dialog)
        min_elegedettseg.pack(pady=5)
        min_elegedettseg.insert(0, str(BEALLITASOK['alapok']['min_elegedettseg']))
        
        # Automata adatbetöltés beállítás
        auto_adatok = tk.BooleanVar(value=True)
        ttk.Checkbutton(dialog, text="Alapadatok automatikus betöltése", variable=auto_adatok).pack(pady=5)
        
        def start_game():
            try:
                # Értékek beolvasása
                nev = varos_nev.get()
                penz = int(penzugyi_keret.get())
                eleg = float(elegedettseg.get())
                min_eleg = float(min_elegedettseg.get())
                
                # Új játék indítása
                self.game_engine.uj_jatek(
                    varos_nev=nev,
                    penzugyi_keret=penz,
                    lakossag_elegedettseg=eleg,
                    min_elegedettseg=min_eleg
                )
                
                # Forduló és esemény kezelők inicializálása
                self.fordulo_manager = ForduloManager(self.game_engine)
                self.event_manager = EventManager(self.game_engine)
                
                # Adatok automatikus betöltése, ha be van kapcsolva
                if auto_adatok.get():
                    betoltott_elemek = self.game_engine.adatok_betoltese(
                        epuletek_csv=EPULETEK_CSV,
                        szolgaltatasok_csv=SZOLGALTATASOK_CSV,
                        lakosok_csv=LAKOSOK_CSV
                    )
                    
                    if betoltott_elemek > 0:
                        self._log_message(f"Alapadatok betöltve ({betoltott_elemek} elem)")
                        # Frissítsük a város lakossági adatait
                        self.game_engine.varos.frissit_lakosok_szama()
                
                # UI frissítése
                self._update_info()
                self._log_message("Új játék indítva: " + nev)
                
                dialog.destroy()
            except ValueError as e:
                messagebox.showerror("Hiba", f"Érvénytelen értékek! {str(e)}")
        
        # Indítás gomb
        ttk.Button(dialog, text="Indítás", command=start_game).pack(pady=20)
    
    def _next_turn(self):
        """
        Következő forduló végrehajtása
        """
        if not self.game_engine.jatek_fut:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Forduló végrehajtása
        esemenyek = self.fordulo_manager.fordulo_lepes()
        
        # UI frissítése
        self._update_info()
        
        # Események naplózása
        for esemeny in esemenyek:
            self._log_message(esemeny)
        
        # Játék vége ellenőrzése
        if self.game_engine.jatek_vege:
            messagebox.showinfo("Játék vége", self.game_engine.jatek_vege_ok)
    
    def _toggle_auto_turn(self):
        """
        Automatikus forduló be/ki kapcsolása
        """
        if not self.game_engine.jatek_fut:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Állapot váltása
        self.fordulo_manager.auto_fordulo_beallitas(
            not self.fordulo_manager.auto_fordulo
        )
        
        # Gomb szövegének frissítése
        if self.fordulo_manager.auto_fordulo:
            self.main_window.auto_turn_button.configure(text="Automatikus forduló ki")
            self._log_message("Automatikus forduló bekapcsolva")
        else:
            self.main_window.auto_turn_button.configure(text="Automatikus forduló be")
            self._log_message("Automatikus forduló kikapcsolva")
    
    def _new_building(self):
        """
        Új épület építésének indítása
        """
        if not self.game_engine.jatek_fut:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Új épület ablak
        dialog = tk.Toplevel(self.main_window.root)
        dialog.title("Új épület")
        dialog.geometry("400x300")
        
        # Beviteli mezők
        ttk.Label(dialog, text="Épület neve:").pack(pady=5)
        nev = ttk.Entry(dialog)
        nev.pack(pady=5)
        
        ttk.Label(dialog, text="Típus:").pack(pady=5)
        tipus = ttk.Combobox(dialog, values=["lakóház", "iskola", "kórház", "közlekedési csomópont"])
        tipus.pack(pady=5)
        
        ttk.Label(dialog, text="Alapterület (m²):").pack(pady=5)
        alapterulet = ttk.Entry(dialog)
        alapterulet.pack(pady=5)
        
        ttk.Label(dialog, text="Költség:").pack(pady=5)
        koltseg = ttk.Entry(dialog)
        koltseg.pack(pady=5)
        
        ttk.Label(dialog, text="Építési idő (hónap):").pack(pady=5)
        idotartam = ttk.Entry(dialog)
        idotartam.pack(pady=5)
        
        def start_building():
            try:
                # Értékek beolvasása
                epulet_nev = nev.get()
                epulet_tipus = tipus.get()
                epulet_alapterulet = int(alapterulet.get())
                epulet_koltseg = int(koltseg.get())
                epulet_idotartam = int(idotartam.get())
                
                # Épület építésének indítása
                projekt_id, hiba = self.game_engine.uj_epulet_epitese(
                    nev=epulet_nev,
                    tipus=epulet_tipus,
                    alapterulet=epulet_alapterulet,
                    koltseg=epulet_koltseg,
                    idotartam_honapokban=epulet_idotartam
                )
                
                if projekt_id:
                    self._log_message(f"Új épület építése indítva: {epulet_nev}")
                    dialog.destroy()
                else:
                    messagebox.showerror("Hiba", hiba)
            except ValueError as e:
                messagebox.showerror("Hiba", "Érvénytelen értékek!")
        
        # Indítás gomb
        ttk.Button(dialog, text="Építés indítása", command=start_building).pack(pady=20)
    
    def _maintain_building(self):
        """
        Épület karbantartásának indítása
        """
        if not self.game_engine.jatek_fut:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Karbantartás ablak
        dialog = tk.Toplevel(self.main_window.root)
        dialog.title("Épület karbantartás")
        dialog.geometry("400x300")
        
        # Épület választó
        ttk.Label(dialog, text="Épület:").pack(pady=5)
        epuletek = list(self.game_engine.varos.epuletek.values())
        epulet_var = tk.StringVar()
        epulet_combo = ttk.Combobox(dialog, textvariable=epulet_var, 
                                  values=[e.nev for e in epuletek])
        epulet_combo.pack(pady=5)
        
        ttk.Label(dialog, text="Költség:").pack(pady=5)
        koltseg = ttk.Entry(dialog)
        koltseg.pack(pady=5)
        
        ttk.Label(dialog, text="Időtartam (hónap):").pack(pady=5)
        idotartam = ttk.Entry(dialog)
        idotartam.pack(pady=5)
        
        def start_maintenance():
            try:
                # Értékek beolvasása
                epulet_nev = epulet_var.get()
                epulet = next(e for e in epuletek if e.nev == epulet_nev)
                koltseg_ertek = int(koltseg.get())
                idotartam_ertek = int(idotartam.get())
                
                # Karbantartás indítása
                projekt_id, hiba = self.game_engine.epulet_karbantartas(
                    epulet_id=epulet.azonosito,
                    koltseg=koltseg_ertek,
                    idotartam_honapokban=idotartam_ertek
                )
                
                if projekt_id:
                    self._log_message(f"Épület karbantartás indítva: {epulet_nev}")
                    dialog.destroy()
                else:
                    messagebox.showerror("Hiba", hiba)
            except ValueError as e:
                messagebox.showerror("Hiba", "Érvénytelen értékek!")
        
        # Indítás gomb
        ttk.Button(dialog, text="Karbantartás indítása", command=start_maintenance).pack(pady=20)
    
    def _new_service(self):
        """
        Új szolgáltatás indítása
        """
        if not self.game_engine.jatek_fut:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Új szolgáltatás ablak
        dialog = tk.Toplevel(self.main_window.root)
        dialog.title("Új szolgáltatás")
        dialog.geometry("500x350")
        
        # Belső keret
        frame = ttk.Frame(dialog, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Szolgáltatás típusok listája
        szolgaltatas_tipusok = [
            "közlekedés", 
            "egészségügy", 
            "oktatás", 
            "kultúra", 
            "kommunális", 
            "szabadidő",
            "sport",
            "közigazgatás",
            "közbiztonság"
        ]
        
        # Beviteli mezők
        ttk.Label(frame, text="Szolgáltatás neve:").grid(row=0, column=0, sticky=tk.W, pady=5)
        nev = ttk.Entry(frame, width=40)
        nev.grid(row=0, column=1, sticky=tk.W, pady=5)
        
        ttk.Label(frame, text="Típus:").grid(row=1, column=0, sticky=tk.W, pady=5)
        tipus_var = tk.StringVar()
        tipus = ttk.Combobox(frame, textvariable=tipus_var, values=szolgaltatas_tipusok, width=38)
        tipus.grid(row=1, column=1, sticky=tk.W, pady=5)
        tipus.current(0)  # Alapértelmezett érték
        
        ttk.Label(frame, text="Havi költség (Ft):").grid(row=2, column=0, sticky=tk.W, pady=5)
        koltseg = ttk.Entry(frame, width=40)
        koltseg.grid(row=2, column=1, sticky=tk.W, pady=5)
        koltseg.insert(0, "500000")  # Alapértelmezett érték
        
        ttk.Label(frame, text="Elégedettség növelés (%):").grid(row=3, column=0, sticky=tk.W, pady=5)
        elegedettseg_hatas = ttk.Entry(frame, width=40)
        elegedettseg_hatas.grid(row=3, column=1, sticky=tk.W, pady=5)
        elegedettseg_hatas.insert(0, "5")  # Alapértelmezett érték
        
        ttk.Label(frame, text="Lakosság hatás (fő):").grid(row=4, column=0, sticky=tk.W, pady=5)
        lakossag_hatas = ttk.Entry(frame, width=40)
        lakossag_hatas.grid(row=4, column=1, sticky=tk.W, pady=5)
        lakossag_hatas.insert(0, "0")  # Alapértelmezett érték
        
        # Információs mező
        info_frame = ttk.LabelFrame(frame, text="Információ", padding=5)
        info_frame.grid(row=5, column=0, columnspan=2, sticky=tk.EW, pady=10)
        
        info_text = tk.Text(info_frame, wrap=tk.WORD, height=4, width=50)
        info_text.pack(fill=tk.BOTH, expand=True)
        info_text.insert(tk.END, "Az új szolgáltatások növelik a város lakosainak elégedettségét, de havi költséget jelentenek.")
        info_text.configure(state="disabled")
        
        # Típus alapú információk frissítése
        def update_info(*args):
            selected_tipus = tipus_var.get()
            
            from alomvaros_szimulator.config import BEALLITASOK
            alap_hatasok = BEALLITASOK.get("szolgaltatas_hatasok", {})
            
            # Alapértelmezett hatások beállítása ha van ilyen a konfigban
            elegedettseg_ertek = alap_hatasok.get(selected_tipus, {}).get("elegedettseg", 5)
            lakossag_ertek = alap_hatasok.get(selected_tipus, {}).get("lakossag", 0)
            
            # Értékek frissítése
            elegedettseg_hatas.delete(0, tk.END)
            elegedettseg_hatas.insert(0, str(elegedettseg_ertek))
            
            lakossag_hatas.delete(0, tk.END)
            lakossag_hatas.insert(0, str(lakossag_ertek))
            
            # Információs szöveg frissítése
            tipus_leiras = {
                "közlekedés": "Javítja a lakosok közlekedési lehetőségeit, növeli az elégedettséget.",
                "egészségügy": "Biztosítja az egészségügyi ellátást, jelentősen növeli az elégedettséget.",
                "oktatás": "Oktatási lehetőségeket biztosít, növeli a lakosságot és elégedettséget.",
                "kultúra": "Kulturális lehetőségeket biztosít, növeli a lakosok elégedettségét.",
                "kommunális": "Alapvető közszolgáltatások biztosítása (víz, hulladék, stb.).",
                "szabadidő": "Szabadidős tevékenységek lehetősége, növeli az elégedettséget.",
                "sport": "Sportolási lehetőségek, javítja az életminőséget.",
                "közigazgatás": "Hivatali ügyintézés, szükséges a város működéséhez.",
                "közbiztonság": "Közbiztonsági szolgáltatások, növeli az elégedettséget."
            }
            
            info_text.configure(state="normal")
            info_text.delete("1.0", tk.END)
            info_text.insert(tk.END, tipus_leiras.get(selected_tipus, "Nincs elérhető információ."))
            info_text.configure(state="disabled")
        
        # Típus változásának figyelése
        tipus_var.trace("w", update_info)
        
        # Kezdeti információk beállítása
        update_info()
        
        def start_service():
            try:
                # Értékek beolvasása
                szolg_nev = nev.get().strip()
                szolg_tipus = tipus.get()
                
                # Ellenőrzések
                if not szolg_nev:
                    messagebox.showerror("Hiba", "A szolgáltatás neve kötelező!")
                    return
                
                if not szolg_tipus:
                    messagebox.showerror("Hiba", "A szolgáltatás típusa kötelező!")
                    return
                
                try:
                    szolg_koltseg = int(koltseg.get().replace(" ", ""))
                    if szolg_koltseg <= 0:
                        messagebox.showerror("Hiba", "A költségnek pozitív számnak kell lennie!")
                        return
                except ValueError:
                    messagebox.showerror("Hiba", "Érvénytelen költség érték!")
                    return
                
                try:
                    szolg_elegedettseg = float(elegedettseg_hatas.get().replace(" ", ""))
                except ValueError:
                    messagebox.showerror("Hiba", "Érvénytelen elégedettség hatás!")
                    return
                
                try:
                    szolg_lakossag = int(lakossag_hatas.get().replace(" ", ""))
                except ValueError:
                    messagebox.showerror("Hiba", "Érvénytelen lakosság hatás!")
                    return
                
                # Szolgáltatás indítása
                szolg_id, hiba = self.game_engine.uj_szolgaltatas_inditasa(
                    nev=szolg_nev,
                    tipus=szolg_tipus,
                    havi_koltseg=szolg_koltseg,
                    elegedettseg_hatas=szolg_elegedettseg,
                    lakossag_hatas=szolg_lakossag
                )
                
                if szolg_id:
                    self._log_message(f"Új szolgáltatás indítva: {szolg_nev} (típus: {szolg_tipus}, költség: {szolg_koltseg:,} Ft/hó)")
                    self._update_info()
                    dialog.destroy()
                else:
                    messagebox.showerror("Hiba", hiba or "Ismeretlen hiba történt!")
            except Exception as e:
                messagebox.showerror("Hiba", f"Váratlan hiba: {str(e)}")
        
        # Gomb keret
        button_frame = ttk.Frame(frame)
        button_frame.grid(row=6, column=0, columnspan=2, pady=10)
        
        # Indítás gomb
        ttk.Button(button_frame, text="Szolgáltatás indítása", command=start_service, width=20).grid(row=0, column=0, padx=5)
        
        # Mégsem gomb
        ttk.Button(button_frame, text="Mégsem", command=dialog.destroy, width=20).grid(row=0, column=1, padx=5)
    
    def _terminate_service(self):
        """
        Szolgáltatás megszüntetése
        """
        if not self.game_engine.jatek_fut:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Aktív szolgáltatások lekérése
        szolgaltatasok = [s for s in self.game_engine.varos.szolgaltatasok.values() if s.aktiv]
        
        if not szolgaltatasok:
            messagebox.showinfo("Információ", "Nincs aktív szolgáltatás, amit meg lehetne szüntetni!")
            return
        
        # Szolgáltatás megszüntetés ablak
        dialog = tk.Toplevel(self.main_window.root)
        dialog.title("Szolgáltatás megszüntetése")
        dialog.geometry("500x350")
        
        # Belső keret
        frame = ttk.Frame(dialog, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Szolgáltatás választó
        ttk.Label(frame, text="Szolgáltatás:").grid(row=0, column=0, sticky=tk.W, pady=5)
        szolg_var = tk.StringVar()
        szolg_combo = ttk.Combobox(frame, textvariable=szolg_var,
                                 values=[f"{s.nev} ({s.tipus})" for s in szolgaltatasok],
                                 width=40)
        szolg_combo.grid(row=0, column=1, sticky=tk.W, pady=5)
        
        if szolgaltatasok:
            szolg_combo.current(0)  # Alapértelmezett érték
        
        # Információs panel
        info_frame = ttk.LabelFrame(frame, text="Szolgáltatás adatai", padding=5)
        info_frame.grid(row=1, column=0, columnspan=2, sticky=tk.EW, pady=10)
        
        # Szolgáltatás adatok megjelenítése
        info_text = tk.Text(info_frame, wrap=tk.WORD, height=6, width=50)
        info_text.pack(fill=tk.BOTH, expand=True)
        
        # Figyelmeztetés a megszüntetésről
        warning_frame = ttk.LabelFrame(frame, text="Figyelmeztetés", padding=5)
        warning_frame.grid(row=2, column=0, columnspan=2, sticky=tk.EW, pady=10)
        
        warning_text = tk.Text(warning_frame, wrap=tk.WORD, height=4, width=50, foreground="red")
        warning_text.pack(fill=tk.BOTH, expand=True)
        warning_text.insert(tk.END, "A szolgáltatás megszüntetése csökkenteni fogja a lakosság elégedettségét! " +
                                   "Ez a művelet nem vonható vissza!")
        warning_text.configure(state="disabled")
        
        # Szolgáltatás adatok frissítése kiválasztáskor
        def update_szolgaltatas_info(*args):
            try:
                selected = szolg_var.get()
                szolg = next((s for s in szolgaltatasok if f"{s.nev} ({s.tipus})" == selected), None)
                
                info_text.configure(state="normal")
                info_text.delete("1.0", tk.END)
                
                if szolg:
                    info_text.insert(tk.END, f"Név: {szolg.nev}\n")
                    info_text.insert(tk.END, f"Típus: {szolg.tipus}\n")
                    info_text.insert(tk.END, f"Havi költség: {szolg.havi_koltseg:,} Ft\n")
                    info_text.insert(tk.END, f"Elégedettség hatás: +{szolg.elegedettseg_hatas}%\n")
                    info_text.insert(tk.END, f"Lakossági hatás: {szolg.lakossag_hatas:+} fő\n")
                    info_text.insert(tk.END, f"Indítás dátuma: {szolg.indulas_datum}\n")
                else:
                    info_text.insert(tk.END, "Nincs kiválasztva szolgáltatás")
                
                info_text.configure(state="disabled")
                
            except Exception as e:
                print(f"Hiba a szolgáltatás adatainak frissítésekor: {str(e)}")
        
        # Kiválasztás követése
        szolg_var.trace("w", update_szolgaltatas_info)
        
        # Kezdeti adatok megjelenítése
        update_szolgaltatas_info()
        
        def terminate():
            try:
                # Kiválasztott szolgáltatás lekérése
                selected = szolg_var.get()
                
                if not selected:
                    messagebox.showerror("Hiba", "Nincs kiválasztva szolgáltatás!")
                    return
                
                szolg = next((s for s in szolgaltatasok if f"{s.nev} ({s.tipus})" == selected), None)
                
                if not szolg:
                    messagebox.showerror("Hiba", "A kiválasztott szolgáltatás nem található!")
                    return
                
                # Megerősítés kérése
                valasz = messagebox.askyesno("Megerősítés", 
                                           f"Biztosan megszünteti a(z) {szolg.nev} szolgáltatást? " +
                                           "Ez csökkenteni fogja a lakosság elégedettségét!")
                
                if not valasz:
                    return
                
                # Szolgáltatás megszüntetése
                sikeres, hiba = self.game_engine.szolgaltatas_megszuntetese(szolg.azonosito)
                
                if sikeres:
                    self._log_message(f"Szolgáltatás megszüntetve: {szolg.nev} (típus: {szolg.tipus})")
                    self._update_info()
                    dialog.destroy()
                else:
                    messagebox.showerror("Hiba", hiba or "Nem sikerült a szolgáltatás megszüntetése!")
            except Exception as e:
                messagebox.showerror("Hiba", f"Váratlan hiba: {str(e)}")
        
        # Gomb keret
        button_frame = ttk.Frame(frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=10)
        
        # Megszüntetés gomb
        ttk.Button(button_frame, text="Szolgáltatás megszüntetése", 
                 command=terminate, width=25).grid(row=0, column=0, padx=5)
        
        # Mégsem gomb
        ttk.Button(button_frame, text="Mégsem", 
                 command=dialog.destroy, width=15).grid(row=0, column=1, padx=5)
    
    def _update_info(self):
        """
        Információs panel frissítése
        """
        if not self.game_engine.jatek_fut:
            return
        
        allapot = self.game_engine.jatek_allapot()
        
        # Címkék frissítése
        self.main_window.info_labels['varos_nev'].configure(text=allapot['varos_nev'])
        self.main_window.info_labels['penzugyi_keret'].configure(
            text=f"{allapot['penzugyi_keret']:,.0f} Ft")
        self.main_window.info_labels['lakossag_elegedettseg'].configure(
            text=f"{allapot['lakossag_elegedettseg']:.1f}%")
        self.main_window.info_labels['lakossag_szama'].configure(
            text=f"{allapot['lakosok_szama']:,} fő")
        self.main_window.info_labels['aktualis_datum'].configure(
            text=str(allapot['aktualis_datum']))
        self.main_window.info_labels['fordulo'].configure(
            text=str(allapot['fordulo']))
    
    def _log_message(self, message):
        """
        Üzenet naplózása
        
        :param message: Naplózandó üzenet
        """
        # Időbélyeg hozzáadása
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.main_window.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        
        # Automatikus görgetés
        self.main_window.log_text.see(tk.END)
    
    def _show_stats(self):
        """
        Statisztikák megjelenítése
        """
        if not self.game_engine.jatek_fut:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Statisztika ablak
        dialog = tk.Toplevel(self.main_window.root)
        dialog.title("Statisztikák")
        dialog.geometry("600x500")
        
        # Notebook létrehozása a lapokhoz
        notebook = ttk.Notebook(dialog)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Általános statisztikák lap
        altalanos_frame = ttk.Frame(notebook, padding=10)
        notebook.add(altalanos_frame, text="Általános")
        
        # Épületek lap
        epuletek_frame = ttk.Frame(notebook, padding=10)
        notebook.add(epuletek_frame, text="Épületek")
        
        # Szolgáltatások lap
        szolgaltatasok_frame = ttk.Frame(notebook, padding=10)
        notebook.add(szolgaltatasok_frame, text="Szolgáltatások")
        
        # Lakosok lap
        lakosok_frame = ttk.Frame(notebook, padding=10)
        notebook.add(lakosok_frame, text="Lakosok")
        
        # Általános statisztikák megjelenítése
        stats_text = tk.Text(altalanos_frame, wrap=tk.WORD)
        stats_text.pack(fill=tk.BOTH, expand=True)
        
        # Játék állapot
        allapot = self.game_engine.jatek_allapot()
        stats_text.insert(tk.END, "=== Játék állapota ===\n")
        stats_text.insert(tk.END, f"Város: {allapot['varos_nev']}\n")
        stats_text.insert(tk.END, f"Pénzügyi keret: {allapot['penzugyi_keret']:,.0f} Ft\n")
        stats_text.insert(tk.END, f"Lakosság elégedettsége: {allapot['lakossag_elegedettseg']:.1f}%\n")
        stats_text.insert(tk.END, f"Lakosok száma: {allapot['lakosok_szama']:,} fő\n")
        stats_text.insert(tk.END, f"Aktuális dátum: {allapot['aktualis_datum']}\n")
        stats_text.insert(tk.END, f"Forduló: {allapot['fordulo']}\n\n")
        
        # Épületek, szolgáltatások száma
        stats_text.insert(tk.END, "=== Város állapota ===\n")
        stats_text.insert(tk.END, f"Épületek száma: {allapot['epuletek_szama']}\n")
        stats_text.insert(tk.END, f"Aktív szolgáltatások száma: {allapot['szolgaltatasok_szama']}\n")
        stats_text.insert(tk.END, f"Folyamatban lévő projektek száma: {allapot['projektek_szama']}\n")
        
        # Épületek statisztikái
        epuletek_text = tk.Text(epuletek_frame, wrap=tk.WORD)
        epuletek_text.pack(fill=tk.BOTH, expand=True)
        
        epuletek_text.insert(tk.END, "=== Épületek ===\n\n")
        epuletek = self.game_engine.varos.epuletek.values()
        
        for epulet in epuletek:
            epuletek_text.insert(tk.END, f"{epulet.nev} (#{epulet.azonosito}) - {epulet.tipus}\n")
            epuletek_text.insert(tk.END, f"  Állapot: {epulet.allapot}\n")
            epuletek_text.insert(tk.END, f"  Alapterület: {epulet.alapterulet} m²\n")
            epuletek_text.insert(tk.END, f"  Építési dátum: {epulet.epitesi_datum}\n")
            
            # Ha lakóház, akkor lakoskapacitás
            if epulet.tipus.lower() == "lakóház":
                epuletek_text.insert(tk.END, f"  Lakos kapacitás: {epulet.lakos_kapacitas()} fő\n")
            
            epuletek_text.insert(tk.END, "\n")
        
        # Szolgáltatások statisztikái
        szolgaltatasok_text = tk.Text(szolgaltatasok_frame, wrap=tk.WORD)
        szolgaltatasok_text.pack(fill=tk.BOTH, expand=True)
        
        szolgaltatasok_text.insert(tk.END, "=== Szolgáltatások ===\n\n")
        szolgaltatasok = self.game_engine.varos.szolgaltatasok.values()
        
        for szolg in szolgaltatasok:
            if not szolg.aktiv:
                continue
                
            szolgaltatasok_text.insert(tk.END, f"{szolg.nev} (#{szolg.azonosito}) - {szolg.tipus}\n")
            szolgaltatasok_text.insert(tk.END, f"  Havi költség: {szolg.havi_koltseg:,.0f} Ft\n")
            szolgaltatasok_text.insert(tk.END, f"  Elégedettség hatás: +{szolg.elegedettseg_hatas}%\n")
            szolgaltatasok_text.insert(tk.END, f"  Indulás dátuma: {szolg.indulas_datum}\n")
            szolgaltatasok_text.insert(tk.END, "\n")
        
        # Lakosok statisztikái
        lakosok_text = tk.Text(lakosok_frame, wrap=tk.WORD)
        lakosok_text.pack(fill=tk.BOTH, expand=True)
        
        lakosok = self.game_engine.varos.lakosok.values()
        
        if lakosok:
            # Összesített adatok
            osszesitett_frame = ttk.LabelFrame(lakosok_frame, text="Összesített adatok", padding=5)
            osszesitett_frame.pack(fill=tk.X, padx=5, pady=5)
            
            # Kor szerinti eloszlás
            korok = [lakos.eletkor for lakos in lakosok]
            atlag_kor = sum(korok) / len(korok) if korok else 0
            min_kor = min(korok) if korok else 0
            max_kor = max(korok) if korok else 0
            
            ttk.Label(osszesitett_frame, text=f"Lakosok száma: {len(lakosok):,} fő").pack(anchor=tk.W)
            ttk.Label(osszesitett_frame, text=f"Átlagéletkor: {atlag_kor:.1f} év").pack(anchor=tk.W)
            ttk.Label(osszesitett_frame, text=f"Legfiatalabb: {min_kor} év, Legidősebb: {max_kor} év").pack(anchor=tk.W)
            
            # Elégedettség eloszlás
            elegedettsegek = [lakos.elegedettseg for lakos in lakosok]
            atlag_elegedettseg = sum(elegedettsegek) / len(elegedettsegek) if elegedettsegek else 0
            min_elegedettseg = min(elegedettsegek) if elegedettsegek else 0
            max_elegedettseg = max(elegedettsegek) if elegedettsegek else 0
            
            ttk.Label(osszesitett_frame, text=f"Átlagos elégedettség: {atlag_elegedettseg:.1f}%").pack(anchor=tk.W)
            ttk.Label(osszesitett_frame, text=f"Legalacsonyabb: {min_elegedettseg:.1f}%, Legmagasabb: {max_elegedettseg:.1f}%").pack(anchor=tk.W)
            
            # Lakosok listája
            lakossag_frame = ttk.LabelFrame(lakosok_frame, text="Lakosok listája", padding=5)
            lakossag_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
            
            # Táblázat létrehozása
            columns = ("azonosito", "nev", "eletkor", "elegedettseg", "epulet")
            lakosok_tabla = ttk.Treeview(lakossag_frame, columns=columns, show="headings")
            
            # Oszlopok beállítása
            lakosok_tabla.heading("azonosito", text="ID")
            lakosok_tabla.heading("nev", text="Név")
            lakosok_tabla.heading("eletkor", text="Életkor")
            lakosok_tabla.heading("elegedettseg", text="Elégedettség")
            lakosok_tabla.heading("epulet", text="Épület")
            
            lakosok_tabla.column("azonosito", width=30)
            lakosok_tabla.column("nev", width=150)
            lakosok_tabla.column("eletkor", width=50)
            lakosok_tabla.column("elegedettseg", width=80)
            lakosok_tabla.column("epulet", width=50)
            
            # Görgetősáv
            scrollbar = ttk.Scrollbar(lakossag_frame, orient=tk.VERTICAL, command=lakosok_tabla.yview)
            lakosok_tabla.configure(yscroll=scrollbar.set)
            scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
            lakosok_tabla.pack(fill=tk.BOTH, expand=True)
            
            # Adatok feltöltése
            for lakos in lakosok:
                epulet_nev = self.game_engine.varos.epuletek.get(lakos.epulet_id, None)
                epulet_nev = epulet_nev.nev if epulet_nev else str(lakos.epulet_id)
                
                lakosok_tabla.insert("", tk.END, values=(
                    lakos.azonosito,
                    lakos.nev,
                    f"{lakos.eletkor} év",
                    f"{lakos.elegedettseg:.1f}%",
                    epulet_nev
                ))
        else:
            lakosok_text.insert(tk.END, "Nincsenek betöltött lakossági adatok.")
            lakosok_text.pack()
        
        # Bezárás gomb
        ttk.Button(dialog, text="Bezárás", command=dialog.destroy).pack(pady=10)
    
    def _show_log(self):
        """
        Napló megjelenítése
        """
        # Napló ablak
        dialog = tk.Toplevel(self.main_window.root)
        dialog.title("Eseménynapló")
        dialog.geometry("600x400")
        
        # Napló szövegmező
        log_text = tk.Text(dialog, wrap=tk.WORD)
        log_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Napló tartalom másolása
        log_text.insert(tk.END, self.main_window.log_text.get("1.0", tk.END))
        
        # Csak olvasható
        log_text.configure(state=tk.DISABLED)
    
    def _import_from_access(self):
        """
        Importálás Access adatbázisból és CSV fájlokból
        """
        from tkinter import filedialog, messagebox
        import pandas as pd
        import os
        from alomvaros_szimulator.config import BEALLITASOK
        
        try:
            # Elérési útvonal bekérése
            init_dir = BEALLITASOK["fajl_utak"]["adat_mappa"]
            
            # macOS esetén speciális kezelés
            import platform
            if platform.system() == 'Darwin':  # macOS
                import tkinter as tk
                root = tk.Tk()
                root.withdraw()  # Elrejtjük az ablakot
                file_path = filedialog.askopenfilename(
                    title="Válasszon CSV fájlt",
                    filetypes=[("CSV fájlok", "*.csv"), ("Minden fájl", "*.*")],
                    initialdir=init_dir
                )
                root.update()  # Frissítjük a Tk ablakot
            else:
                file_path = filedialog.askopenfilename(
                    title="Válasszon CSV fájlt",
                    filetypes=[("CSV fájlok", "*.csv"), ("Minden fájl", "*.*")],
                    initialdir=init_dir
                )
            
            if not file_path:
                return
            
            # Adatok betöltése
            self.main_window.root.config(cursor="wait")
            self.main_window.root.update()
            
            # Meghatározzuk a fájl típusát a neve alapján
            filename = os.path.basename(file_path).lower()
            
            if "epulet" in filename:
                betoltott_elemek = self.game_engine.adatok_betoltese(epuletek_csv=file_path)
                self._log_message(f"Épületek betöltve: {betoltott_elemek} elem")
            elif "szolg" in filename:
                betoltott_elemek = self.game_engine.adatok_betoltese(szolgaltatasok_csv=file_path)
                self._log_message(f"Szolgáltatások betöltve: {betoltott_elemek} elem")
            elif "lakos" in filename or "lakosok" in filename:
                betoltott_elemek = self.game_engine.adatok_betoltese(lakosok_csv=file_path)
                self._log_message(f"Lakosok betöltve: {betoltott_elemek} elem")
                self.game_engine.varos.frissit_lakosok_szama()
            elif "projekt" in filename:
                betoltott_elemek = self.game_engine.adatok_betoltese(projektek_csv=file_path)
                self._log_message(f"Projektek betöltve: {betoltott_elemek} elem")
            elif "esemeny" in filename:
                betoltott_elemek = self.game_engine.adatok_betoltese(esemenyek_csv=file_path)
                self._log_message(f"Események betöltve: {betoltott_elemek} elem")
            else:
                messagebox.showwarning("Ismeretlen fájltípus", 
                                    "A fájl típusa nem ismerhető fel a neve alapján. Kérem válasszon másik fájlt.")
                self.main_window.root.config(cursor="")
                return
            
            self._update_info()
            self.main_window.root.config(cursor="")
            
            messagebox.showinfo("Adatok importálása", f"Sikeresen betöltve {betoltott_elemek} elem.")
            
        except Exception as e:
            self.main_window.root.config(cursor="")
            messagebox.showerror("Importálási hiba", f"Hiba történt az adatok betöltésekor: {str(e)}")
            
    def _load_game(self):
        """
        Játékállás betöltése JSON fájlból
        """
        from tkinter import filedialog, messagebox
        import json
        import os
        
        try:
            # Try to get the path from config, with fallbacks
            try:
                from alomvaros_szimulator.config import MENTES_MAPPA, KIMENET_MAPPA
                
                # Első próbálkozás a mentések mappával
                init_dir = MENTES_MAPPA
                if not os.path.exists(init_dir):
                    os.makedirs(init_dir, exist_ok=True)
                    print(f"Mentések mappa létrehozva: {init_dir}")
                
                # Ha nem sikerül, próbáljuk a kimenet mappát
                if not os.path.exists(init_dir):
                    init_dir = KIMENET_MAPPA
                    if not os.path.exists(init_dir):
                        os.makedirs(init_dir, exist_ok=True)
                        print(f"Kimenet mappa létrehozva: {init_dir}")
                
            except (ImportError, AttributeError) as e:
                print(f"Hiba a konfigurációs beállítások betöltésekor: {str(e)}")
                # Használjunk alapértelmezett mappákat
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                init_dir = os.path.join(base_dir, "mentesek")
                if not os.path.exists(init_dir):
                    os.makedirs(init_dir, exist_ok=True)
                    print(f"Alapértelmezett mentések mappa létrehozva: {init_dir}")
                
                # Ha ez sem sikerül, használjuk a jelenlegi munkakönyvtárat
                if not os.path.exists(init_dir):
                    init_dir = os.getcwd()
            
            # macOS esetén speciális kezelés
            import platform
            if platform.system() == 'Darwin':  # macOS
                import tkinter as tk
                root = tk.Tk()
                root.withdraw()  # Elrejtjük az ablakot
                file_path = filedialog.askopenfilename(
                    title="Válasszon mentett játékot",
                    filetypes=[("JSON fájlok", "*.json"), ("Minden fájl", "*.*")],
                    initialdir=init_dir
                )
                root.update()  # Frissítjük a Tk ablakot
            else:
                file_path = filedialog.askopenfilename(
                    title="Válasszon mentett játékot",
                    filetypes=[("JSON fájlok", "*.json"), ("Minden fájl", "*.*")],
                    initialdir=init_dir
                )
            
            if not file_path:
                return
            
            # Adatok betöltése
            self.main_window.root.config(cursor="wait")
            self.main_window.root.update()
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Új város létrehozása az adatokból
                uj_varos = Varos.from_dict(data)
                
                # Játék beállítása az új várossal
                self.game_engine.varos = uj_varos
                self._update_info()
                self._log_message(f"Játékállás betöltve: {file_path}")
                
                # Frissítjük a város lakosainak számát
                self.game_engine.varos.frissit_lakosok_szama()
                
                # Ha nincsenek lakosok, figyelmeztetés
                if self.game_engine.varos.lakosok_szama == 0:
                    self._log_message("FIGYELMEZTETÉS: A városnak nincs lakosa!")
                    messagebox.showwarning("Figyelmeztetés", "A városnak nincs lakosa! Importáljon lakosokat, különben a játék hamarosan véget ér.")
                
                messagebox.showinfo("Betöltés", "Játékállás sikeresen betöltve.")
            except Exception as e:
                self._log_message(f"Hiba a fájl betöltésekor: {e}")
                messagebox.showerror("Betöltési hiba", f"Hiba történt a játékállás betöltésekor: {str(e)}")
            
            self.main_window.root.config(cursor="")
            
        except Exception as e:
            self.main_window.root.config(cursor="")
            messagebox.showerror("Betöltési hiba", f"Hiba történt: {str(e)}")
    
    def _save_game(self):
        """
        Játék mentése
        """
        if not self.game_engine.jatek_fut:
            messagebox.showwarning("Figyelmeztetés", "Nincs aktív játék!")
            return
        
        # Mentés ablak
        dialog = tk.Toplevel(self.main_window.root)
        dialog.title("Játék mentése")
        dialog.geometry("400x150")
        
        # Mentés neve
        ttk.Label(dialog, text="Mentés neve:").pack(pady=5)
        mentes_nev = ttk.Entry(dialog)
        mentes_nev.pack(pady=5)
        mentes_nev.insert(0, datetime.now().strftime("%Y%m%d_%H%M%S"))
        
        def save():
            try:
                # Mappák biztosítása
                import os
                try:
                    from alomvaros_szimulator.config import MENTES_MAPPA
                    if not os.path.exists(MENTES_MAPPA):
                        os.makedirs(MENTES_MAPPA, exist_ok=True)
                        print(f"Mentések mappa létrehozva: {MENTES_MAPPA}")
                except (ImportError, AttributeError) as e:
                    print(f"Hiba a konfigurációs beállítások betöltésekor: {str(e)}")
                    # Használjunk alapértelmezett mappát
                    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                    MENTES_MAPPA = os.path.join(base_dir, "mentesek")
                    if not os.path.exists(MENTES_MAPPA):
                        os.makedirs(MENTES_MAPPA, exist_ok=True)
                        print(f"Alapértelmezett mentések mappa létrehozva: {MENTES_MAPPA}")
                
                # Mentés végrehajtása
                sikeres = self.game_engine.jatek_mentes(mentes_nev.get())
                
                if sikeres:
                    self._log_message(f"Játék mentve: {mentes_nev.get()}")
                    dialog.destroy()
                else:
                    messagebox.showerror("Hiba", "A mentés sikertelen!")
            except Exception as e:
                messagebox.showerror("Hiba", f"Hiba a mentés során: {str(e)}") 