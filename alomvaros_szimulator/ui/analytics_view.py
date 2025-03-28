"""
Elemzések megjelenítéséért felelős modul az Álomváros Szimulátor alkalmazáshoz.
Ez a modul kezeli a város adatainak részletes elemzését és megjelenítését.
"""
import customtkinter as ctk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import os
import json
from datetime import datetime
import pandas as pd
import numpy as np

class AnalyticsView:
    """
    Elemzések megjelenítéséért és kezeléséért felelős osztály
    """
    
    # Téma színek
    THEME_COLORS = {
        "primary": "#1f538d",
        "accent": "#3a7ebf", 
        "secondary": "#404040",
        "background": "#242424",
        "selected": "#2a5d9e",
        "card_bg": "#2d2d2d",
    }
    
    def __init__(self, parent, game_engine):
        """
        Elemzések nézet inicializálása
        
        :param parent: Szülő widget (tkinter vagy customtkinter widget)
        :param game_engine: Játék motor objektum
        """
        self.parent = parent
        self.game_engine = game_engine
        
        # Adatok tárolása
        self.data_history = []
        self.load_history_data()
        
        # UI elemek
        self.charts = {}
        
        # Nézet létrehozása
        self.create_view()
    
    def create_view(self):
        """
        Elemzések nézet létrehozása
        """
        # Fő keret
        self.main_frame = ctk.CTkFrame(self.parent)
        self.main_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Fejléc
        header_frame = ctk.CTkFrame(self.main_frame)
        header_frame.pack(fill="x", padx=10, pady=10)
        
        # Cím
        title_label = ctk.CTkLabel(
            header_frame, 
            text="Város Elemzések és Statisztikák",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(side="left", padx=10, pady=10)
        
        # Exportálás gomb
        export_button = ctk.CTkButton(
            header_frame,
            text="Exportálás CSV",
            command=self.export_data_to_csv,
            width=150,
            height=30,
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        export_button.pack(side="right", padx=10, pady=10)
        
        # Szűrő panel
        filter_frame = ctk.CTkFrame(self.main_frame)
        filter_frame.pack(fill="x", padx=10, pady=5)
        
        # Időszak szerinti szűrő
        period_label = ctk.CTkLabel(filter_frame, text="Időszak:", font=ctk.CTkFont(size=14))
        period_label.pack(side="left", padx=10, pady=10)
        
        self.period_var = ctk.StringVar(value="összes")
        period_options = ["összes", "utolsó 10 forduló", "utolsó 30 forduló", "utolsó 50 forduló"]
        
        period_combobox = ctk.CTkOptionMenu(
            filter_frame, 
            values=period_options,
            variable=self.period_var,
            command=self.filter_data,
            width=180
        )
        period_combobox.pack(side="left", padx=10, pady=10)
        
        # Adat típus szűrő
        data_type_label = ctk.CTkLabel(filter_frame, text="Adat típus:", font=ctk.CTkFont(size=14))
        data_type_label.pack(side="left", padx=(20, 10), pady=10)
        
        self.data_type_var = ctk.StringVar(value="összes")
        data_type_options = ["összes", "pénzügyi", "lakossági", "elégedettségi", "infrastruktúra"]
        
        data_type_combobox = ctk.CTkOptionMenu(
            filter_frame, 
            values=data_type_options,
            variable=self.data_type_var,
            command=self.filter_data,
            width=150
        )
        data_type_combobox.pack(side="left", padx=10, pady=10)
        
        # Frissítés gomb
        refresh_button = ctk.CTkButton(
            filter_frame,
            text="Frissítés",
            command=self.update_view,
            width=100,
            height=30,
            fg_color=self.THEME_COLORS["secondary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        refresh_button.pack(side="right", padx=10, pady=10)
        
        # Tartalom keret - Scrollozható
        self.content_frame = ctk.CTkScrollableFrame(self.main_frame)
        self.content_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Két oszlopos elrendezés a grafikonoknak
        self.left_column = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.left_column.pack(side="left", fill="both", expand=True, padx=(0, 5))
        
        self.right_column = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.right_column.pack(side="right", fill="both", expand=True, padx=(5, 0))
        
        # Adatok frissítése és megjelenítése
        self.update_view()
    
    def filter_data(self, *args):
        """
        Adatok szűrése a beállítások alapján
        """
        self.update_view()
    
    def update_view(self):
        """
        Frissíti az elemzés nézetet az aktuális adatokkal
        """
        # Aktuális adatok lekérése és mentése
        self.update_history_data()
        
        # Tisztítsuk a korábban létrehozott grafikonokat
        for widget in self.left_column.winfo_children():
            widget.destroy()
            
        for widget in self.right_column.winfo_children():
            widget.destroy()
        
        # Ellenőrizzük, van-e elegendő adat
        if not self.data_history or len(self.data_history) < 2:
            # Ha nincs elég adat, információs üzenet
            info_label = ctk.CTkLabel(
                self.left_column, 
                text="Nincs elegendő adat az elemzések megjelenítéséhez.\nLegalább 2 forduló adata szükséges.",
                font=ctk.CTkFont(size=16)
            )
            info_label.pack(expand=True, pady=50)
            return
        
        # Szűrések alkalmazása
        filtered_data = self.apply_filters(self.data_history)
        
        if not filtered_data:
            # Ha nincs a szűrésnek megfelelő adat
            info_label = ctk.CTkLabel(
                self.left_column, 
                text="Nincs a szűrésnek megfelelő adat.",
                font=ctk.CTkFont(size=16)
            )
            info_label.pack(expand=True, pady=50)
            return
        
        # Grafikonok létrehozása
        self.create_charts(filtered_data)
    
    def apply_filters(self, data):
        """
        Szűrők alkalmazása az adatokra
        
        :param data: A szűrendő adatok listája
        :return: Szűrt adatok listája
        """
        # Ha nincs adat, üres listát adunk vissza
        if not data:
            return []
            
        # Másolatot készítünk az eredeti adatokról
        filtered_data = data.copy()
        
        # Időszak szerinti szűrés
        period = self.period_var.get()
        if period != "összes":
            # Fordulók számának meghatározása
            if "10" in period:
                limit = 10
            elif "30" in period:
                limit = 30
            elif "50" in period:
                limit = 50
            else:
                limit = len(filtered_data)
            
            # Utolsó N forduló kiválasztása
            filtered_data = filtered_data[-limit:]
        
        # Adat típus szerinti szűrés logikája itt jönne...
        # (A data_type_var értéke alapján nem szűrünk explicit, csak a megjelenített grafikonokat fogjuk szűrni)
        
        return filtered_data
    
    def update_history_data(self):
        """
        Játékállapot adatainak frissítése
        """
        if not hasattr(self.game_engine, 'varos') or self.game_engine.varos is None:
            # Ha nincs város, nincs mit frissíteni
            return
            
        # Jelenlegi fordulószám
        current_turn = getattr(self.game_engine.varos, 'aktualis_fordulo', 0)
        
        # Ha már van adat az aktuális fordulóról, akkor nem kell újat hozzáadni
        if self.data_history and self.data_history[-1].get('fordulo') == current_turn:
            return
            
        # Város adatok összegyűjtése
        varos_data = {
            'fordulo': current_turn,
            'idopont': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'penz': getattr(self.game_engine.varos, 'penz', 0),
            'koltsegvetes': {
                'bevetel': getattr(self.game_engine.varos, 'teljes_bevetel', 0),
                'kiadas': getattr(self.game_engine.varos, 'teljes_kiadas', 0),
                'egyenleg': getattr(self.game_engine.varos, 'egyenleg', 0)
            },
            'lakossag': {
                'osszesen': getattr(self.game_engine.varos, 'lakossag', 0),
                'aktiv_dolgozok': getattr(self.game_engine.varos, 'aktiv_dolgozok', 0),
                'munkanelkuli': getattr(self.game_engine.varos, 'munkanelkuli_lakossag', 0),
                'hajlektalan': getattr(self.game_engine.varos, 'hajlektalan_lakossag', 0)
            },
            'elegedettseg': getattr(self.game_engine.varos, 'elegedettseg', 0),
            'infrastruktura': {
                'lakas': {
                    'osszesen': getattr(self.game_engine.varos, 'osszes_lakas', 0),
                    'szabad': getattr(self.game_engine.varos, 'szabad_lakas', 0),
                    'foglalt': getattr(self.game_engine.varos, 'foglalt_lakas', 0)
                },
                'munkahely': {
                    'osszesen': getattr(self.game_engine.varos, 'osszes_munkahely', 0),
                    'szabad': getattr(self.game_engine.varos, 'szabad_munkahely', 0),
                    'foglalt': getattr(self.game_engine.varos, 'foglalt_munkahely', 0)
                }
            },
            'szolgaltatasok': {
                'osszesen': len(getattr(self.game_engine.varos, 'szolgaltatasok', {})),
                'aktiv': sum(1 for s in getattr(self.game_engine.varos, 'szolgaltatasok', {}).values() 
                           if getattr(s, 'aktiv', False))
            },
            'epuletek': {
                'osszesen': len(getattr(self.game_engine.varos, 'epuletek', {}))
            },
            'projektek': {
                'osszesen': len(getattr(self.game_engine.varos, 'projektek', {})),
                'folyamatban': sum(1 for p in getattr(self.game_engine.varos, 'projektek', {}).values() 
                                 if getattr(p, 'allapot', '') == 'folyamatban'),
                'befejezett': sum(1 for p in getattr(self.game_engine.varos, 'projektek', {}).values() 
                                if getattr(p, 'allapot', '') == 'befejezett')
            }
        }
        
        # Adat hozzáadása a történethez
        self.data_history.append(varos_data)
        
        # Adatok mentése
        self.save_history_data()
    
    def load_history_data(self):
        """
        Adatok betöltése a történetből
        """
        # Kimeneti könyvtár elérési útja
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'output')
        history_file = os.path.join(output_dir, 'varos_history.json')
        
        # Fájl betöltése, ha létezik
        if os.path.exists(history_file):
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    self.data_history = json.load(f)
            except Exception as e:
                print(f"Hiba a város történeti adatok betöltésekor: {e}")
                self.data_history = []
    
    def save_history_data(self):
        """
        Adatok mentése a történetbe
        """
        if not self.data_history:
            return
            
        # Kimeneti könyvtár elérési útja
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'output')
        
        # Könyvtár létrehozása, ha nem létezik
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        history_file = os.path.join(output_dir, 'varos_history.json')
        
        # Adatok mentése
        try:
            with open(history_file, 'w', encoding='utf-8') as f:
                json.dump(self.data_history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Hiba a város történeti adatok mentésekor: {e}")
    
    def export_data_to_csv(self):
        """
        Adatok exportálása CSV formátumban
        """
        if not self.data_history:
            # Ha nincs adat, tájékoztató üzenet
            msg = ctk.CTkToplevel(self.parent)
            msg.title("Exportálás")
            msg.geometry("400x150")
            msg.resizable(False, False)
            
            # Képernyő közepére pozicionálás
            msg.geometry("+%d+%d" % (
                self.parent.winfo_rootx() + self.parent.winfo_width() // 2 - 200,
                self.parent.winfo_rooty() + self.parent.winfo_height() // 2 - 75
            ))
            
            ctk.CTkLabel(
                msg, 
                text="Nincs elérhető adat az exportáláshoz.",
                font=ctk.CTkFont(size=14)
            ).pack(expand=True, padx=20, pady=20)
            
            # Ok gomb
            ctk.CTkButton(
                msg,
                text="OK",
                command=msg.destroy,
                width=100
            ).pack(pady=10)
            
            return
            
        # Kimeneti könyvtár elérési útja
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'output')
        
        # Könyvtár létrehozása, ha nem létezik
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # Fájlnév generálása időbélyeggel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(output_dir, f'varos_elemzes_export_{timestamp}.csv')
        
        try:
            # Adatok átalakítása DataFrame formátumba
            df_data = []
            
            for record in self.data_history:
                # Alapadatok
                row = {
                    'Forduló': record.get('fordulo', 0),
                    'Időpont': record.get('idopont', ''),
                    'Pénz': record.get('penz', 0),
                    'Bevétel': record.get('koltsegvetes', {}).get('bevetel', 0),
                    'Kiadás': record.get('koltsegvetes', {}).get('kiadas', 0),
                    'Egyenleg': record.get('koltsegvetes', {}).get('egyenleg', 0),
                    'Lakosság': record.get('lakossag', {}).get('osszesen', 0),
                    'Aktív dolgozók': record.get('lakossag', {}).get('aktiv_dolgozok', 0),
                    'Munkanélküli': record.get('lakossag', {}).get('munkanelkuli', 0),
                    'Hajléktalan': record.get('lakossag', {}).get('hajlektalan', 0),
                    'Elégedettség': record.get('elegedettseg', 0),
                    'Összes lakás': record.get('infrastruktura', {}).get('lakas', {}).get('osszesen', 0),
                    'Szabad lakás': record.get('infrastruktura', {}).get('lakas', {}).get('szabad', 0),
                    'Foglalt lakás': record.get('infrastruktura', {}).get('lakas', {}).get('foglalt', 0),
                    'Összes munkahely': record.get('infrastruktura', {}).get('munkahely', {}).get('osszesen', 0),
                    'Szabad munkahely': record.get('infrastruktura', {}).get('munkahely', {}).get('szabad', 0),
                    'Foglalt munkahely': record.get('infrastruktura', {}).get('munkahely', {}).get('foglalt', 0),
                    'Szolgáltatások': record.get('szolgaltatasok', {}).get('osszesen', 0),
                    'Aktív szolgáltatások': record.get('szolgaltatasok', {}).get('aktiv', 0),
                    'Épületek': record.get('epuletek', {}).get('osszesen', 0),
                    'Projektek': record.get('projektek', {}).get('osszesen', 0),
                    'Folyamatban lévő projektek': record.get('projektek', {}).get('folyamatban', 0),
                    'Befejezett projektek': record.get('projektek', {}).get('befejezett', 0)
                }
                
                df_data.append(row)
            
            # DataFrame létrehozása és mentése
            df = pd.DataFrame(df_data)
            df.to_csv(filename, sep=';', index=False, encoding='utf-8')
            
            # Sikeres exportálás üzenet
            msg = ctk.CTkToplevel(self.parent)
            msg.title("Exportálás sikeres")
            msg.geometry("400x150")
            msg.resizable(False, False)
            
            # Képernyő közepére pozicionálás
            msg.geometry("+%d+%d" % (
                self.parent.winfo_rootx() + self.parent.winfo_width() // 2 - 200,
                self.parent.winfo_rooty() + self.parent.winfo_height() // 2 - 75
            ))
            
            ctk.CTkLabel(
                msg, 
                text=f"Az adatok sikeresen exportálva:\n{filename}",
                font=ctk.CTkFont(size=14)
            ).pack(expand=True, padx=20, pady=20)
            
            # Ok gomb
            ctk.CTkButton(
                msg,
                text="OK",
                command=msg.destroy,
                width=100
            ).pack(pady=10)
            
        except Exception as e:
            print(f"Hiba az adatok exportálásakor: {e}")
            
            # Hibaüzenet
            msg = ctk.CTkToplevel(self.parent)
            msg.title("Exportálási hiba")
            msg.geometry("400x150")
            msg.resizable(False, False)
            
            # Képernyő közepére pozicionálás
            msg.geometry("+%d+%d" % (
                self.parent.winfo_rootx() + self.parent.winfo_width() // 2 - 200,
                self.parent.winfo_rooty() + self.parent.winfo_height() // 2 - 75
            ))
            
            ctk.CTkLabel(
                msg, 
                text=f"Hiba történt az exportálás során:\n{str(e)}",
                font=ctk.CTkFont(size=14)
            ).pack(expand=True, padx=20, pady=20)
            
            # Ok gomb
            ctk.CTkButton(
                msg,
                text="OK",
                command=msg.destroy,
                width=100
            ).pack(pady=10)
    
    def create_charts(self, data):
        """
        Grafikonok létrehozása az adatok alapján
        
        :param data: A grafikonokhoz szükséges adatok listája
        """
        # Az adat típus szűréshez
        data_type = self.data_type_var.get().lower()
        
        # Fordulószámok kinyerése az x tengelyhez
        fordulok = [d.get('fordulo', 0) for d in data]
        
        # ---- PÉNZÜGYI GRAFIKONOK ----
        if data_type in ['összes', 'pénzügyi']:
            # Pénzügyi adatok kinyerése
            penz_adatok = [d.get('penz', 0) for d in data]
            bevetel_adatok = [d.get('koltsegvetes', {}).get('bevetel', 0) for d in data]
            kiadas_adatok = [d.get('koltsegvetes', {}).get('kiadas', 0) for d in data]
            egyenleg_adatok = [d.get('koltsegvetes', {}).get('egyenleg', 0) for d in data]
            
            # Pénzügyi keret
            financial_frame = ctk.CTkFrame(self.left_column)
            financial_frame.pack(fill="x", pady=10, padx=5)
            
            # Cím
            ctk.CTkLabel(
                financial_frame,
                text="Pénzügyi Mutatók",
                font=ctk.CTkFont(size=18, weight="bold")
            ).pack(pady=5)
            
            # 1. Pénzügyi összesítő adatok kijelzése
            summary_frame = ctk.CTkFrame(financial_frame)
            summary_frame.pack(fill="x", pady=5, padx=10)
            
            # Jelenlegi egyenleg
            current_money = penz_adatok[-1] if penz_adatok else 0
            ctk.CTkLabel(
                summary_frame,
                text=f"Jelenlegi egyenleg: {current_money:,} Ft",
                font=ctk.CTkFont(size=16)
            ).grid(row=0, column=0, padx=5, pady=5, sticky="w")
            
            # Bevétel az utolsó fordulóban
            last_income = bevetel_adatok[-1] if bevetel_adatok else 0
            ctk.CTkLabel(
                summary_frame,
                text=f"Utolsó bevétel: {last_income:,} Ft",
                font=ctk.CTkFont(size=16),
                text_color="#4CAF50"
            ).grid(row=0, column=1, padx=5, pady=5, sticky="w")
            
            # Kiadás az utolsó fordulóban
            last_expense = kiadas_adatok[-1] if kiadas_adatok else 0
            ctk.CTkLabel(
                summary_frame,
                text=f"Utolsó kiadás: {last_expense:,} Ft",
                font=ctk.CTkFont(size=16),
                text_color="#F44336"
            ).grid(row=0, column=2, padx=5, pady=5, sticky="w")
            
            # Egyenleg az utolsó fordulóban
            last_balance = egyenleg_adatok[-1] if egyenleg_adatok else 0
            balance_color = "#4CAF50" if last_balance >= 0 else "#F44336"
            ctk.CTkLabel(
                summary_frame,
                text=f"Utolsó egyenleg: {last_balance:,} Ft",
                font=ctk.CTkFont(size=16),
                text_color=balance_color
            ).grid(row=1, column=0, padx=5, pady=5, sticky="w")
            
            # Trend számítása
            if len(penz_adatok) >= 2:
                penz_diff = penz_adatok[-1] - penz_adatok[-2]
                trend_text = f"Változás: {penz_diff:+,} Ft"
                trend_color = "#4CAF50" if penz_diff >= 0 else "#F44336"
                ctk.CTkLabel(
                    summary_frame,
                    text=trend_text,
                    font=ctk.CTkFont(size=16),
                    text_color=trend_color
                ).grid(row=1, column=1, padx=5, pady=5, sticky="w")
            
            for i in range(3):
                summary_frame.columnconfigure(i, weight=1)
            
            # 2. Pénzügyi grafikon
            chart_frame = ctk.CTkFrame(financial_frame)
            chart_frame.pack(fill="both", pady=5, padx=10, expand=True)
            
            # Matplotlib grafikon létrehozása
            fig, ax = plt.subplots(figsize=(8, 4))
            
            # Pénz alakulása
            ax.plot(fordulok, penz_adatok, marker='o', linewidth=2, label='Város pénze')
            
            # Bevétel és kiadás
            if len(data) > 1:  # Csak ha van elég adat
                ax2 = ax.twinx()  # Második y tengely
                ax2.plot(fordulok, bevetel_adatok, marker='^', color='green', linewidth=1.5, label='Bevétel')
                ax2.plot(fordulok, kiadas_adatok, marker='v', color='red', linewidth=1.5, label='Kiadás')
                ax2.set_ylabel('Bevétel / Kiadás (Ft)')
                
                # Mindkét tengely jelmagyarázatának egyesítése
                lines1, labels1 = ax.get_legend_handles_labels()
                lines2, labels2 = ax2.get_legend_handles_labels()
                ax.legend(lines1 + lines2, labels1 + labels2, loc='upper left')
            else:
                ax.legend(loc='upper left')
            
            ax.set_xlabel('Forduló')
            ax.set_ylabel('Város pénze (Ft)')
            ax.set_title('Pénzügyi mutatók alakulása')
            ax.grid(True, linestyle='--', alpha=0.7)
            
            # X tengely egész számok
            ax.xaxis.set_major_locator(plt.MaxNLocator(integer=True))
            
            # Határok beállítása a minimális és maximális értékek alapján
            if penz_adatok:
                ax.set_ylim(min(penz_adatok) * 0.9, max(penz_adatok) * 1.1)
            
            fig.tight_layout()
            
            # Grafikon hozzáadása a kerethez
            canvas = FigureCanvasTkAgg(fig, master=chart_frame)
            canvas.draw()
            canvas.get_tk_widget().pack(fill="both", expand=True)
            
            # 3. Bevétel-kiadás egyenleg grafikon
            if len(data) > 1:  # Csak ha van elég adat
                balance_frame = ctk.CTkFrame(financial_frame)
                balance_frame.pack(fill="both", pady=5, padx=10, expand=True)
                
                fig2, ax2 = plt.subplots(figsize=(8, 4))
                
                # Egyenleg grafikon
                bars = ax2.bar(fordulok, egyenleg_adatok, alpha=0.7)
                
                # Pozitív és negatív értékek különböző színnel
                for i, bar in enumerate(bars):
                    if egyenleg_adatok[i] >= 0:
                        bar.set_color('#4CAF50')  # Zöld
                    else:
                        bar.set_color('#F44336')  # Piros
                
                ax2.axhline(y=0, color='gray', linestyle='-', alpha=0.3)
                ax2.set_xlabel('Forduló')
                ax2.set_ylabel('Egyenleg (Ft)')
                ax2.set_title('Bevétel-Kiadás Egyenleg')
                ax2.grid(True, linestyle='--', alpha=0.7)
                
                # X tengely egész számok
                ax2.xaxis.set_major_locator(plt.MaxNLocator(integer=True))
                
                fig2.tight_layout()
                
                # Grafikon hozzáadása a kerethez
                canvas2 = FigureCanvasTkAgg(fig2, master=balance_frame)
                canvas2.draw()
                canvas2.get_tk_widget().pack(fill="both", expand=True)
        
        # ---- LAKOSSÁGI GRAFIKONOK ----
        if data_type in ['összes', 'lakossági']:
            # Lakossági adatok kinyerése
            lakossag_adatok = [d.get('lakossag', {}).get('osszesen', 0) for d in data]
            aktiv_dolgozok = [d.get('lakossag', {}).get('aktiv_dolgozok', 0) for d in data]
            munkanelkuli = [d.get('lakossag', {}).get('munkanelkuli', 0) for d in data]
            hajlektalan = [d.get('lakossag', {}).get('hajlektalan', 0) for d in data]
            
            # Lakossági keret
            population_frame = ctk.CTkFrame(self.right_column)
            population_frame.pack(fill="x", pady=10, padx=5)
            
            # Cím
            ctk.CTkLabel(
                population_frame,
                text="Lakossági Mutatók",
                font=ctk.CTkFont(size=18, weight="bold")
            ).pack(pady=5)
            
            # 1. Lakossági összesítő adatok
            pop_summary_frame = ctk.CTkFrame(population_frame)
            pop_summary_frame.pack(fill="x", pady=5, padx=10)
            
            # Jelenlegi lakosság
            current_pop = lakossag_adatok[-1] if lakossag_adatok else 0
            ctk.CTkLabel(
                pop_summary_frame,
                text=f"Jelenlegi lakosság: {current_pop:,} fő",
                font=ctk.CTkFont(size=16)
            ).grid(row=0, column=0, padx=5, pady=5, sticky="w")
            
            # Aktív dolgozók
            current_active = aktiv_dolgozok[-1] if aktiv_dolgozok else 0
            ctk.CTkLabel(
                pop_summary_frame,
                text=f"Aktív dolgozók: {current_active:,} fő",
                font=ctk.CTkFont(size=16),
                text_color="#4CAF50"
            ).grid(row=0, column=1, padx=5, pady=5, sticky="w")
            
            # Munkanélküliek
            current_unemployed = munkanelkuli[-1] if munkanelkuli else 0
            ctk.CTkLabel(
                pop_summary_frame,
                text=f"Munkanélküliek: {current_unemployed:,} fő",
                font=ctk.CTkFont(size=16),
                text_color="#F44336" if current_unemployed > 0 else "#2196F3"
            ).grid(row=1, column=0, padx=5, pady=5, sticky="w")
            
            # Hajléktalanok
            current_homeless = hajlektalan[-1] if hajlektalan else 0
            ctk.CTkLabel(
                pop_summary_frame,
                text=f"Hajléktalanok: {current_homeless:,} fő",
                font=ctk.CTkFont(size=16),
                text_color="#F44336" if current_homeless > 0 else "#2196F3"
            ).grid(row=1, column=1, padx=5, pady=5, sticky="w")
            
            # Trend számítása a lakosságra
            if len(lakossag_adatok) >= 2:
                pop_diff = lakossag_adatok[-1] - lakossag_adatok[-2]
                trend_text = f"Változás: {pop_diff:+,} fő"
                trend_color = "#4CAF50" if pop_diff > 0 else "#F44336" if pop_diff < 0 else "#2196F3"
                ctk.CTkLabel(
                    pop_summary_frame,
                    text=trend_text,
                    font=ctk.CTkFont(size=16),
                    text_color=trend_color
                ).grid(row=2, column=0, padx=5, pady=5, sticky="w")
            
            for i in range(2):
                pop_summary_frame.columnconfigure(i, weight=1)
            
            # 2. Lakossági grafikon
            pop_chart_frame = ctk.CTkFrame(population_frame)
            pop_chart_frame.pack(fill="both", pady=5, padx=10, expand=True)
            
            # Matplotlib grafikon létrehozása
            fig3, ax3 = plt.subplots(figsize=(8, 4))
            
            # Lakosság alakulása
            ax3.plot(fordulok, lakossag_adatok, marker='o', linewidth=2, label='Összes lakos')
            ax3.plot(fordulok, aktiv_dolgozok, marker='^', linewidth=1.5, label='Aktív dolgozók')
            
            # Munkanélküliek és hajléktalanok
            if max(munkanelkuli) > 0 or max(hajlektalan) > 0:
                ax3.plot(fordulok, munkanelkuli, marker='v', color='orange', linewidth=1.5, label='Munkanélküliek')
                ax3.plot(fordulok, hajlektalan, marker='x', color='red', linewidth=1.5, label='Hajléktalanok')
            
            ax3.set_xlabel('Forduló')
            ax3.set_ylabel('Lakosság (fő)')
            ax3.set_title('Lakossági mutatók alakulása')
            ax3.grid(True, linestyle='--', alpha=0.7)
            ax3.legend()
            
            # X tengely egész számok
            ax3.xaxis.set_major_locator(plt.MaxNLocator(integer=True))
            
            # Határok beállítása
            if lakossag_adatok:
                ax3.set_ylim(0, max(lakossag_adatok) * 1.1)
            
            fig3.tight_layout()
            
            # Grafikon hozzáadása a kerethez
            canvas3 = FigureCanvasTkAgg(fig3, master=pop_chart_frame)
            canvas3.draw()
            canvas3.get_tk_widget().pack(fill="both", expand=True)
            
            # 3. Lakossági megoszlás kördiagram (utolsó forduló)
            if len(data) > 0:
                pop_pie_frame = ctk.CTkFrame(population_frame)
                pop_pie_frame.pack(fill="both", pady=5, padx=10, expand=True)
                
                fig4, ax4 = plt.subplots(figsize=(8, 4))
                
                # Utolsó forduló adatai
                last_active = aktiv_dolgozok[-1] if aktiv_dolgozok else 0
                last_unemployed = munkanelkuli[-1] if munkanelkuli else 0
                last_homeless = hajlektalan[-1] if hajlektalan else 0
                
                # Kördiagram létrehozása
                labels = ['Aktív dolgozók', 'Munkanélküliek', 'Hajléktalanok']
                sizes = [last_active, last_unemployed, last_homeless]
                colors = ['#4CAF50', '#FF9800', '#F44336']
                
                # Csak azokat jelenítjük meg, amelyek értéke > 0
                filtered_labels = []
                filtered_sizes = []
                filtered_colors = []
                
                for i, size in enumerate(sizes):
                    if size > 0:
                        filtered_labels.append(labels[i])
                        filtered_sizes.append(size)
                        filtered_colors.append(colors[i])
                
                if filtered_sizes:
                    wedges, texts, autotexts = ax4.pie(
                        filtered_sizes, 
                        labels=filtered_labels, 
                        colors=filtered_colors,
                        autopct='%1.1f%%', 
                        startangle=90
                    )
                    
                    # Címkék formázása
                    for text in texts:
                        text.set_fontsize(10)
                    
                    for autotext in autotexts:
                        autotext.set_fontsize(9)
                        autotext.set_weight('bold')
                    
                    ax4.axis('equal')  # Kör alakú diagram
                    ax4.set_title('Lakossági megoszlás')
                    
                    fig4.tight_layout()
                    
                    # Grafikon hozzáadása a kerethez
                    canvas4 = FigureCanvasTkAgg(fig4, master=pop_pie_frame)
                    canvas4.draw()
                    canvas4.get_tk_widget().pack(fill="both", expand=True)
        
        # ---- ELÉGEDETTSÉGI GRAFIKONOK ----
        if data_type in ['összes', 'elégedettségi']:
            # Elégedettségi adatok kinyerése
            elegedettseg_adatok = [d.get('elegedettseg', 0) for d in data]
            
            # Elégedettségi keret
            satisfaction_frame = ctk.CTkFrame(self.left_column if data_type != 'összes' else self.right_column)
            satisfaction_frame.pack(fill="x", pady=10, padx=5)
            
            # Cím
            ctk.CTkLabel(
                satisfaction_frame,
                text="Elégedettségi Mutatók",
                font=ctk.CTkFont(size=18, weight="bold")
            ).pack(pady=5)
            
            # 1. Elégedettségi összesítő adatok
            sat_summary_frame = ctk.CTkFrame(satisfaction_frame)
            sat_summary_frame.pack(fill="x", pady=5, padx=10)
            
            # Jelenlegi elégedettség
            current_sat = elegedettseg_adatok[-1] if elegedettseg_adatok else 0
            
            # Elégedettség színe kategória szerint
            if current_sat >= 80:
                sat_color = "#4CAF50"  # Zöld
                sat_text = "Kiváló"
            elif current_sat >= 60:
                sat_color = "#8BC34A"  # Világos zöld
                sat_text = "Jó"
            elif current_sat >= 40:
                sat_color = "#FFEB3B"  # Sárga
                sat_text = "Közepes"
            elif current_sat >= 20:
                sat_color = "#FF9800"  # Narancssárga
                sat_text = "Gyenge"
            else:
                sat_color = "#F44336"  # Piros
                sat_text = "Kritikus"
            
            ctk.CTkLabel(
                sat_summary_frame,
                text=f"Jelenlegi elégedettség: {current_sat}% ({sat_text})",
                font=ctk.CTkFont(size=16, weight="bold"),
                text_color=sat_color
            ).pack(padx=5, pady=5)
            
            # Trend számítása
            if len(elegedettseg_adatok) >= 2:
                sat_diff = elegedettseg_adatok[-1] - elegedettseg_adatok[-2]
                trend_text = f"Változás: {sat_diff:+}%"
                trend_color = "#4CAF50" if sat_diff > 0 else "#F44336" if sat_diff < 0 else "#2196F3"
                ctk.CTkLabel(
                    sat_summary_frame,
                    text=trend_text,
                    font=ctk.CTkFont(size=16),
                    text_color=trend_color
                ).pack(padx=5, pady=5)
            
            # 2. Elégedettségi grafikon
            sat_chart_frame = ctk.CTkFrame(satisfaction_frame)
            sat_chart_frame.pack(fill="both", pady=5, padx=10, expand=True)
            
            # Matplotlib grafikon létrehozása
            fig5, ax5 = plt.subplots(figsize=(8, 4))
            
            # Elégedettség alakulása
            ax5.plot(fordulok, elegedettseg_adatok, marker='o', linewidth=2, 
                    color='#2196F3', label='Elégedettség')
            
            # Kategória határvonalak
            ax5.axhline(y=80, color='#4CAF50', linestyle='--', alpha=0.5, label='Kiváló határ')
            ax5.axhline(y=60, color='#8BC34A', linestyle='--', alpha=0.5, label='Jó határ')
            ax5.axhline(y=40, color='#FFEB3B', linestyle='--', alpha=0.5, label='Közepes határ')
            ax5.axhline(y=20, color='#FF9800', linestyle='--', alpha=0.5, label='Gyenge határ')
            
            ax5.set_xlabel('Forduló')
            ax5.set_ylabel('Elégedettség (%)')
            ax5.set_title('Elégedettségi szint alakulása')
            ax5.grid(True, linestyle='--', alpha=0.7)
            ax5.legend()
            
            # Y tengely 0-100 között
            ax5.set_ylim(0, 100)
            
            # X tengely egész számok
            ax5.xaxis.set_major_locator(plt.MaxNLocator(integer=True))
            
            fig5.tight_layout()
            
            # Grafikon hozzáadása a kerethez
            canvas5 = FigureCanvasTkAgg(fig5, master=sat_chart_frame)
            canvas5.draw()
            canvas5.get_tk_widget().pack(fill="both", expand=True)
        
        # ---- INFRASTRUKTÚRA GRAFIKONOK ----
        if data_type in ['összes', 'infrastruktúra']:
            # Infrastruktúra adatok kinyerése
            osszes_lakas = [d.get('infrastruktura', {}).get('lakas', {}).get('osszesen', 0) for d in data]
            szabad_lakas = [d.get('infrastruktura', {}).get('lakas', {}).get('szabad', 0) for d in data]
            foglalt_lakas = [d.get('infrastruktura', {}).get('lakas', {}).get('foglalt', 0) for d in data]
            
            osszes_munkahely = [d.get('infrastruktura', {}).get('munkahely', {}).get('osszesen', 0) for d in data]
            szabad_munkahely = [d.get('infrastruktura', {}).get('munkahely', {}).get('szabad', 0) for d in data]
            foglalt_munkahely = [d.get('infrastruktura', {}).get('munkahely', {}).get('foglalt', 0) for d in data]
            
            # Infrastruktúra keret
            infra_frame = ctk.CTkFrame(self.right_column if data_type != 'összes' else self.left_column)
            infra_frame.pack(fill="x", pady=10, padx=5)
            
            # Cím
            ctk.CTkLabel(
                infra_frame,
                text="Infrastruktúra Mutatók",
                font=ctk.CTkFont(size=18, weight="bold")
            ).pack(pady=5)
            
            # 1. Infrastruktúra összesítő adatok
            infra_summary_frame = ctk.CTkFrame(infra_frame)
            infra_summary_frame.pack(fill="x", pady=5, padx=10)
            
            # Jelenlegi lakások
            current_houses = osszes_lakas[-1] if osszes_lakas else 0
            current_free_houses = szabad_lakas[-1] if szabad_lakas else 0
            
            ctk.CTkLabel(
                infra_summary_frame,
                text=f"Összes lakás: {current_houses:,} (Szabad: {current_free_houses:,})",
                font=ctk.CTkFont(size=16)
            ).grid(row=0, column=0, padx=5, pady=5, sticky="w")
            
            # Jelenlegi munkahelyek
            current_jobs = osszes_munkahely[-1] if osszes_munkahely else 0
            current_free_jobs = szabad_munkahely[-1] if szabad_munkahely else 0
            
            ctk.CTkLabel(
                infra_summary_frame,
                text=f"Összes munkahely: {current_jobs:,} (Szabad: {current_free_jobs:,})",
                font=ctk.CTkFont(size=16)
            ).grid(row=1, column=0, padx=5, pady=5, sticky="w")
            
            # Szolgáltatások
            current_services = data[-1].get('szolgaltatasok', {}).get('osszesen', 0) if data else 0
            current_active_services = data[-1].get('szolgaltatasok', {}).get('aktiv', 0) if data else 0
            
            ctk.CTkLabel(
                infra_summary_frame,
                text=f"Szolgáltatások: {current_services:,} (Aktív: {current_active_services:,})",
                font=ctk.CTkFont(size=16)
            ).grid(row=2, column=0, padx=5, pady=5, sticky="w")
            
            # Épületek és projektek
            current_buildings = data[-1].get('epuletek', {}).get('osszesen', 0) if data else 0
            current_projects = data[-1].get('projektek', {}).get('osszesen', 0) if data else 0
            current_active_projects = data[-1].get('projektek', {}).get('folyamatban', 0) if data else 0
            
            ctk.CTkLabel(
                infra_summary_frame,
                text=f"Épületek: {current_buildings:,} | Projektek: {current_projects:,} (Folyamatban: {current_active_projects:,})",
                font=ctk.CTkFont(size=16)
            ).grid(row=3, column=0, padx=5, pady=5, sticky="w")
            
            infra_summary_frame.columnconfigure(0, weight=1)
            
            # 2. Lakás és munkahely grafikon
            infra_chart_frame = ctk.CTkFrame(infra_frame)
            infra_chart_frame.pack(fill="both", pady=5, padx=10, expand=True)
            
            # Matplotlib grafikon létrehozása
            fig6, ax6 = plt.subplots(figsize=(8, 4))
            
            # Lakások alakulása
            ax6.plot(fordulok, osszes_lakas, marker='o', linewidth=2, color='#2196F3', label='Összes lakás')
            ax6.plot(fordulok, szabad_lakas, marker='^', linewidth=1.5, color='#4CAF50', label='Szabad lakás')
            
            # Második y tengely a munkahelyeknek
            ax7 = ax6.twinx()
            ax7.plot(fordulok, osszes_munkahely, marker='s', linewidth=2, color='#9C27B0', label='Összes munkahely')
            ax7.plot(fordulok, szabad_munkahely, marker='d', linewidth=1.5, color='#FFC107', label='Szabad munkahely')
            
            # Tengelyek címkézése
            ax6.set_xlabel('Forduló')
            ax6.set_ylabel('Lakások száma')
            ax7.set_ylabel('Munkahelyek száma')
            ax6.set_title('Lakások és munkahelyek alakulása')
            ax6.grid(True, linestyle='--', alpha=0.7)
            
            # Mindkét tengely jelmagyarázatának egyesítése
            lines1, labels1 = ax6.get_legend_handles_labels()
            lines2, labels2 = ax7.get_legend_handles_labels()
            ax6.legend(lines1 + lines2, labels1 + labels2, loc='upper left')
            
            # X tengely egész számok
            ax6.xaxis.set_major_locator(plt.MaxNLocator(integer=True))
            
            fig6.tight_layout()
            
            # Grafikon hozzáadása a kerethez
            canvas6 = FigureCanvasTkAgg(fig6, master=infra_chart_frame)
            canvas6.draw()
            canvas6.get_tk_widget().pack(fill="both", expand=True)
            
            # 3. Infrastruktúra kihasználtsági grafikon
            if len(data) > 0:
                usage_frame = ctk.CTkFrame(infra_frame)
                usage_frame.pack(fill="both", pady=5, padx=10, expand=True)
                
                fig7, ax8 = plt.subplots(figsize=(8, 4))
                
                # Idősorok generálása
                lakas_kihasznaltsag = []
                munkahely_kihasznaltsag = []
                
                for i in range(len(data)):
                    # Lakás kihasználtság
                    osszes = osszes_lakas[i]
                    if osszes > 0:
                        kihasznaltsag = (osszes - szabad_lakas[i]) / osszes * 100
                    else:
                        kihasznaltsag = 0
                    lakas_kihasznaltsag.append(kihasznaltsag)
                    
                    # Munkahely kihasználtság
                    osszes_m = osszes_munkahely[i]
                    if osszes_m > 0:
                        kihasznaltsag_m = (osszes_m - szabad_munkahely[i]) / osszes_m * 100
                    else:
                        kihasznaltsag_m = 0
                    munkahely_kihasznaltsag.append(kihasznaltsag_m)
                
                # Kihasználtság ábrázolása
                ax8.plot(fordulok, lakas_kihasznaltsag, marker='o', linewidth=2, 
                        color='#2196F3', label='Lakás kihasználtság')
                ax8.plot(fordulok, munkahely_kihasznaltsag, marker='s', linewidth=2, 
                        color='#9C27B0', label='Munkahely kihasználtság')
                
                # Optimális kihasználtság jelölése
                ax8.axhline(y=90, color='#4CAF50', linestyle='--', alpha=0.5, label='Optimális (90%)')
                ax8.axhline(y=50, color='#FF9800', linestyle='--', alpha=0.5, label='Kritikus (50%)')
                
                ax8.set_xlabel('Forduló')
                ax8.set_ylabel('Kihasználtság (%)')
                ax8.set_title('Infrastruktúra kihasználtsági mutatók')
                ax8.grid(True, linestyle='--', alpha=0.7)
                ax8.legend()
                
                # Y tengely 0-100 között
                ax8.set_ylim(0, 100)
                
                # X tengely egész számok
                ax8.xaxis.set_major_locator(plt.MaxNLocator(integer=True))
                
                fig7.tight_layout()
                
                # Grafikon hozzáadása a kerethez
                canvas7 = FigureCanvasTkAgg(fig7, master=usage_frame)
                canvas7.draw()
                canvas7.get_tk_widget().pack(fill="both", expand=True) 