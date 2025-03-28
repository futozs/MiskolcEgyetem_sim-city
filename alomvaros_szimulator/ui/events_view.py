"""
Események megjelenítéséért felelős modul az Álomváros Szimulátor alkalmazáshoz.
Ez a modul kezeli az események naplózását, megjelenítését és elemzését.
"""
import customtkinter as ctk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import os
import json
from datetime import datetime

class EventsView:
    """
    Események megjelenítéséért és kezeléséért felelős osztály
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
        Események nézet inicializálása
        
        :param parent: Szülő widget (tkinter vagy customtkinter widget)
        :param game_engine: Játék motor objektum
        """
        self.parent = parent
        self.game_engine = game_engine
        self.event_cards = []
        self.events_stats = {}
        
        # Adatok betöltése, ha van
        self.events_log = []
        self.load_events_log()
        
        # Nézet létrehozása
        self.create_view()
    
    def create_view(self):
        """
        Események nézet létrehozása
        """
        # Scrollozható főkeret az egész nézethez
        self.main_frame = ctk.CTkScrollableFrame(self.parent)
        self.main_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Split layout - bal oldalon szűrők és statisztikák, jobb oldalon események lista
        self.split_frame = ctk.CTkFrame(self.main_frame)
        self.split_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Bal oldali panel
        self.left_panel = ctk.CTkFrame(self.split_frame, width=300)
        self.left_panel.pack(side="left", fill="y", padx=(0, 5), pady=0)
        
        # Jobb oldali panel - események listája
        self.right_panel = ctk.CTkFrame(self.split_frame)
        self.right_panel.pack(side="right", fill="both", expand=True, padx=0, pady=0)
        
        # Bal oldali panel tartalma
        
        # Cím
        title_label = ctk.CTkLabel(
            self.left_panel, 
            text="Szűrés és statisztikák",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_label.pack(pady=(10, 15), padx=10)
        
        # Szűrő panel
        filter_frame = ctk.CTkFrame(self.left_panel)
        filter_frame.pack(fill="x", padx=10, pady=5)
        
        # Szűrés címke
        filter_title = ctk.CTkLabel(
            filter_frame, 
            text="Események szűrése",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        filter_title.pack(pady=5, padx=10, anchor="w")
        
        # Esemény típusa
        filter_label = ctk.CTkLabel(filter_frame, text="Esemény típusa:", font=ctk.CTkFont(size=14))
        filter_label.pack(pady=2, padx=10, anchor="w")
        
        # Szűrő választó - típus
        self.event_filter_var = ctk.StringVar(value="összes")
        event_filter_options = ["összes", "gazdasági", "társadalmi", "politikai", "természeti", "katasztrófa", "rendszer"]
        
        event_filter_combobox = ctk.CTkOptionMenu(
            filter_frame, 
            values=event_filter_options,
            variable=self.event_filter_var,
            command=self.filter_events,
            width=250
        )
        event_filter_combobox.pack(pady=(0, 10), padx=10)
        
        # Hatás szerinti szűrés
        effect_label = ctk.CTkLabel(filter_frame, text="Hatás típusa:", font=ctk.CTkFont(size=14))
        effect_label.pack(pady=2, padx=10, anchor="w")
        
        self.effect_var = ctk.StringVar(value="összes")
        effect_options = ["összes", "pozitív", "negatív", "semleges", "kritikus"]
        
        effect_combobox = ctk.CTkOptionMenu(
            filter_frame, 
            values=effect_options,
            variable=self.effect_var,
            command=self.filter_events,
            width=250
        )
        effect_combobox.pack(pady=(0, 10), padx=10)
        
        # Időszak szerinti szűrő
        period_label = ctk.CTkLabel(filter_frame, text="Időszak:", font=ctk.CTkFont(size=14))
        period_label.pack(pady=2, padx=10, anchor="w")
        
        self.period_var = ctk.StringVar(value="összes")
        period_options = ["összes", "legutóbbi 10 forduló", "legutóbbi 30 forduló", "legutóbbi 50 forduló", "legutóbbi 100 forduló", "legutóbbi 500 forduló"]
        
        period_combobox = ctk.CTkOptionMenu(
            filter_frame, 
            values=period_options,
            variable=self.period_var,
            command=self.filter_events,
            width=250
        )
        period_combobox.pack(pady=(0, 10), padx=10)
        
        # Keresés
        search_label = ctk.CTkLabel(filter_frame, text="Keresés:", font=ctk.CTkFont(size=14))
        search_label.pack(pady=2, padx=10, anchor="w")
        
        self.search_var = ctk.StringVar()
        self.search_var.trace_add("write", self.filter_events)
        
        search_entry = ctk.CTkEntry(
            filter_frame,
            placeholder_text="Esemény keresése...",
            width=250,
            textvariable=self.search_var
        )
        search_entry.pack(pady=(0, 10), padx=10)
        
        # Szűrések törlése gomb
        reset_button = ctk.CTkButton(
            filter_frame, 
            text="Szűrések törlése", 
            command=self.reset_filters,
            width=250,
            fg_color=self.THEME_COLORS["secondary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        reset_button.pack(pady=10, padx=10)
        
        # Események statisztikák
        stats_frame = ctk.CTkFrame(self.left_panel)
        stats_frame.pack(fill="x", padx=10, pady=10)
        
        # Statisztika címke
        stats_label = ctk.CTkLabel(
            stats_frame, 
            text="Események Statisztikái",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        stats_label.pack(pady=5, padx=10, anchor="w")
        
        # Statisztika adatok keret
        self.stats_data_frame = ctk.CTkFrame(stats_frame)
        self.stats_data_frame.pack(fill="x", padx=10, pady=5)
        
        # Statisztikák helye - egyszerűbb, vertikális elrendezés
        self.events_stats = {
            "total": ctk.CTkLabel(self.stats_data_frame, text="Összes esemény: 0", font=ctk.CTkFont(size=14), anchor="w"),
            "positive": ctk.CTkLabel(self.stats_data_frame, text="Pozitív hatású: 0", font=ctk.CTkFont(size=14), text_color="#4CAF50", anchor="w"),
            "negative": ctk.CTkLabel(self.stats_data_frame, text="Negatív hatású: 0", font=ctk.CTkFont(size=14), text_color="#FF9800", anchor="w"),
            "critical": ctk.CTkLabel(self.stats_data_frame, text="Kritikus hatású: 0", font=ctk.CTkFont(size=14), text_color="#F44336", anchor="w"),
            "neutral": ctk.CTkLabel(self.stats_data_frame, text="Semleges hatású: 0", font=ctk.CTkFont(size=14), text_color="#2196F3", anchor="w")
        }
        
        # Elhelyezés - függőleges
        self.events_stats["total"].pack(fill="x", padx=10, pady=3, anchor="w")
        self.events_stats["positive"].pack(fill="x", padx=10, pady=3, anchor="w")
        self.events_stats["negative"].pack(fill="x", padx=10, pady=3, anchor="w")
        self.events_stats["critical"].pack(fill="x", padx=10, pady=3, anchor="w")
        self.events_stats["neutral"].pack(fill="x", padx=10, pady=3, anchor="w")
        
        # Exportálás gomb a bal oldali panelen
        export_button = ctk.CTkButton(
            self.left_panel,
            text="Exportálás CSV",
            command=self.export_events_to_csv,
            width=250,
            height=35,
            fg_color=self.THEME_COLORS["primary"],
            hover_color=self.THEME_COLORS["accent"]
        )
        export_button.pack(pady=15, padx=10)
        
        # Jobb oldali panel tartalma
        
        # Események napló címke
        events_title = ctk.CTkLabel(
            self.right_panel, 
            text="Események Napló",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        events_title.pack(pady=10, anchor="w", padx=10)
        
        # Eseménye táblázat header
        header_frame = ctk.CTkFrame(self.right_panel, height=30)
        header_frame.pack(fill="x", padx=10, pady=(0, 5))
        
        # Oszlopnevek
        ctk.CTkLabel(header_frame, text="Forduló", width=60, font=ctk.CTkFont(weight="bold")).pack(side="left", padx=5, pady=5)
        ctk.CTkLabel(header_frame, text="Típus", width=100, font=ctk.CTkFont(weight="bold")).pack(side="left", padx=5, pady=5)
        ctk.CTkLabel(header_frame, text="Esemény", width=250, font=ctk.CTkFont(weight="bold")).pack(side="left", padx=5, pady=5)
        ctk.CTkLabel(header_frame, text="Hatás", width=200, font=ctk.CTkFont(weight="bold")).pack(side="left", padx=5, pady=5)
        
        # Események scrollozható keret - maximalizáljuk a magasságot a jobb görgethetőségért
        self.events_scroll_frame = ctk.CTkScrollableFrame(self.right_panel)
        self.events_scroll_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Adatok betöltése
        self.update_view()
    
    def update_view(self):
        """
        Frissíti az események nézetet az aktuális adatokkal
        """
        # Események lekérése a játékmotortól, ha elérhető
        if hasattr(self.game_engine, 'event_manager') and self.game_engine.event_manager is not None:
            # Probáljuk betölteni a korábban mentett eseményeket először
            self.load_events_log()
            previously_saved_events = self.events_log.copy() if self.events_log else []
            
            new_events = []
            
            # Elsőként ellenőrizzük az eseménytörténetet
            if hasattr(self.game_engine.event_manager, 'esemenyek_tortenete'):
                new_events = self.game_engine.event_manager.esemenyek_tortenete.copy()
            
            # Ha nincs a történetben, próbáljuk a korábbi eseményekből 
            # Nincs limit megadva, hogy minden eseményt lekérjünk
            if not new_events and hasattr(self.game_engine.event_manager, 'get_korabbi_esemenyek'):
                try:
                    new_events = self.game_engine.event_manager.get_korabbi_esemenyek(limit=None)
                except:
                    # Ha a None érték hibát okoz, próbáljunk egy nagy számot
                    try:
                        new_events = self.game_engine.event_manager.get_korabbi_esemenyek(limit=100000)
                    except Exception as e:
                        print(f"Hiba az események lekérésekor: {e}")
            
            # Aktuális forduló eseményeinek ellenőrzése
            if hasattr(self.game_engine, 'varos') and hasattr(self.game_engine.varos, 'aktualis_fordulo_esemenyei'):
                aktualis_esemenyek = self.game_engine.varos.aktualis_fordulo_esemenyei
                if aktualis_esemenyek:
                    # Az aktuális eseményeket is adjuk a listához
                    if new_events is None:
                        new_events = []
                    
                    for esemeny in aktualis_esemenyek:
                        # Ellenőrizzük, hogy az esemény már szerepel-e a listában
                        if isinstance(esemeny, dict):
                            # Új esemény, adjuk hozzá
                            if 'fordulo' not in esemeny:
                                esemeny['fordulo'] = self.game_engine.fordulo_szamlalo
                            new_events.append(esemeny)
                        elif isinstance(esemeny, str):
                            # Szöveges esemény
                            new_events.append({
                                'fordulo': self.game_engine.fordulo_szamlalo,
                                'esemeny': {
                                    'nev': esemeny,
                                    'leiras': esemeny,
                                    'tipus': 'rendszer',
                                    'hatas': {
                                        'penz': 0,
                                        'boldogsag': 0,
                                        'lakossag': 0
                                    }
                                }
                            })
            
            # Ellenőrizzük az előző fordulók eseményeit is
            if hasattr(self.game_engine, 'varos') and hasattr(self.game_engine.varos, 'elozo_fordulo_esemenyei'):
                elozo_esemenyek = self.game_engine.varos.elozo_fordulo_esemenyei
                if elozo_esemenyek:
                    if new_events is None:
                        new_events = []
                    
                    for esemeny in elozo_esemenyek:
                        if isinstance(esemeny, str):
                            # Szöveges esemény konvertálása
                            event_obj = {
                                'fordulo': self.game_engine.fordulo_szamlalo - 1,
                                'esemeny': {
                                    'nev': esemeny,
                                    'leiras': esemeny,
                                    'tipus': 'rendszer',
                                    'hatas': {
                                        'penz': 0,
                                        'boldogsag': 0,
                                        'lakossag': 0
                                    }
                                }
                            }
                            new_events.append(event_obj)
            
            # Egységesítjük az események formátumát
            all_events = []
            
            # 1. Feldolgozzuk az új eseményeket
            if new_events:
                for event in new_events:
                    if isinstance(event, dict):
                        # Ellenőrizzük, hogy az eseményeknek van-e 'fordulo' attribútuma
                        if 'fordulo' not in event:
                            event['fordulo'] = self.game_engine.fordulo_szamlalo
                        
                        # Ellenőrizzük, hogy az esemény objektumban van-e 'esemeny' kulcs
                        if 'esemeny' not in event:
                            # Átalakítjuk az új formátumra
                            event = {
                                'fordulo': event.get('fordulo', 0),
                                'esemeny': {
                                    'nev': event.get('nev', 'Ismeretlen esemény'),
                                    'leiras': event.get('leiras', ''),
                                    'tipus': event.get('tipus', 'rendszer'),
                                    'hatas': {
                                        'penz': event.get('penzugyi_hatas', 0),
                                        'boldogsag': event.get('elegedettsegi_hatas', 0),
                                        'lakossag': event.get('lakossag_hatas', 0)
                                    }
                                }
                            }
                        
                        all_events.append(event)
            
            # 2. Hozzáadjuk a korábban mentett eseményeket
            for event in previously_saved_events:
                if isinstance(event, dict):
                    all_events.append(event)
            
            # 3. Töröljük a duplikátumokat
            egyedi_esemenyek = []
            esemeny_kulcsok = set()
            
            for esemeny in all_events:
                if isinstance(esemeny, dict):
                    # Egyedi kulcs generálása a forduló és név alapján
                    fordulo = esemeny.get('fordulo', 0)
                    nev = esemeny.get('esemeny', {}).get('nev', '')
                    kulcs = f"{fordulo}_{nev}"
                    
                    if kulcs not in esemeny_kulcsok:
                        esemeny_kulcsok.add(kulcs)
                        egyedi_esemenyek.append(esemeny)
            
            # Frissítsük az események naplót és mentsük
            if egyedi_esemenyek:
                self.events_log = egyedi_esemenyek
                self.save_events_log()
        
        # Statisztikák frissítése
        self.update_statistics()
        
        # Események lista frissítése
        self.update_events_list()
        
        # Méretezéshez frissítsük a főkeretet
        self.main_frame.update()
    
    def update_statistics(self):
        """
        Frissíti az esemény statisztikákat
        """
        # Alap értékek
        total_events = len(self.events_log)
        positive_events = 0
        negative_events = 0
        critical_events = 0
        neutral_events = 0
        
        # Események típus szerinti számlálása
        for event in self.events_log:
            if not isinstance(event, dict):
                continue
            
            esemeny = event.get('esemeny', {})
            
            # Ellenőrizzük, hogy az esemény 'hatas' vagy a régi 'penzugyi_hatas' formátumot használja-e
            if 'hatas' in esemeny:
                hatasok = esemeny.get('hatas', {})
                penz_hatas = hatasok.get('penz', 0)
                elegedettsegi_hatas = hatasok.get('boldogsag', 0)
                lakossag_hatas = hatasok.get('lakossag', 0)
            else:
                # Régebbi formátum
                penz_hatas = esemeny.get('penzugyi_hatas', 0)
                elegedettsegi_hatas = esemeny.get('elegedettsegi_hatas', 0)
                lakossag_hatas = esemeny.get('lakossag_hatas', 0)
            
            if penz_hatas > 0 or elegedettsegi_hatas > 0 or lakossag_hatas > 0:
                positive_events += 1
            elif penz_hatas < 0 or elegedettsegi_hatas < 0 or lakossag_hatas < 0:
                # Különbséget teszünk a negatív és kritikus között
                if (penz_hatas < -500000 or elegedettsegi_hatas < -5 or lakossag_hatas < -100):
                    critical_events += 1
                else:
                    negative_events += 1
            else:
                neutral_events += 1
        
        # Frissítsük a statisztika címkéket
        self.events_stats["total"].configure(text=f"Összes esemény: {total_events}")
        self.events_stats["positive"].configure(text=f"Pozitív hatású: {positive_events}")
        self.events_stats["negative"].configure(text=f"Negatív hatású: {negative_events}")
        self.events_stats["critical"].configure(text=f"Kritikus hatású: {critical_events}")
        self.events_stats["neutral"].configure(text=f"Semleges hatású: {neutral_events}")
        
        # Grafikon frissítése
        self.update_charts()
    
    def update_charts(self):
        """
        Frissíti az események grafikonjait
        """
        # Töröljük a meglévő grafikont, ha van
        for widget in self.stats_data_frame.winfo_children():
            if isinstance(widget, FigureCanvasTkAgg):
                widget.get_tk_widget().destroy()
        
        if not self.events_log:
            return
        
        # Adatok gyűjtése a grafikonhoz
        event_types = {}
        event_impacts = {"pozitív": 0, "negatív": 0, "kritikus": 0, "semleges": 0}
        
        for esemeny_rekord in self.events_log:
            esemeny = esemeny_rekord.get('esemeny', {})
            
            # Esemény típus számlálása
            tipus = esemeny.get('tipus', 'ismeretlen')
            event_types[tipus] = event_types.get(tipus, 0) + 1
            
            # Hatások összesítése
            penzugyi_hatas = esemeny.get('penzugyi_hatas', 0)
            elegedettsegi_hatas = esemeny.get('elegedettsegi_hatas', 0)
            lakossag_hatas = esemeny.get('lakossag_hatas', 0)
            
            if penzugyi_hatas > 0 or elegedettsegi_hatas > 0 or lakossag_hatas > 0:
                event_impacts["pozitív"] += 1
            elif penzugyi_hatas < 0 or elegedettsegi_hatas < 0 or lakossag_hatas < 0:
                # Kritikus események elkülönítése
                if (penzugyi_hatas < -500000 or elegedettsegi_hatas < -5 or lakossag_hatas < -100):
                    event_impacts["kritikus"] += 1
                else:
                    event_impacts["negatív"] += 1
            else:
                event_impacts["semleges"] += 1
        
        # Grafikon létrehozása
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
        
        # Típusok kördiagram
        labels = list(event_types.keys())
        sizes = list(event_types.values())
        ax1.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90)
        ax1.axis('equal')
        ax1.set_title('Események típus szerint')
        
        # Hatások oszlopdiagram
        impacts = list(event_impacts.keys())
        values = list(event_impacts.values())
        bars = ax2.bar(impacts, values)
        
        # Oszlopok színezése
        bars[0].set_color('#4CAF50')  # Pozitív: zöld
        if len(bars) > 1:
            bars[1].set_color('#FF9800')  # Negatív: narancs
        if len(bars) > 2:
            bars[2].set_color('#F44336')  # Kritikus: piros
        if len(bars) > 3:
            bars[3].set_color('#2196F3')  # Semleges: kék
        
        ax2.set_title('Események hatás szerint')
        fig.tight_layout()
        
        # Grafikon hozzáadása a kerethez
        canvas = FigureCanvasTkAgg(fig, master=self.stats_data_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True, padx=10, pady=10)
    
    def update_events_list(self):
        """
        Frissíti az események listáját az aktuális szűrőbeállítások alapján
        """
        # Előző kártyák törlése
        for widget in self.events_scroll_frame.winfo_children():
            widget.destroy()
        
        if not self.events_log:
            # Ha nincs esemény
            no_events = ctk.CTkLabel(
                self.events_scroll_frame, 
                text="Még nem történtek események a városban.",
                font=ctk.CTkFont(size=14)
            )
            no_events.pack(expand=True, pady=20)
            return
        
        # Szűrések alkalmazása
        filtered_events = self.apply_filters(self.events_log)
        
        if not filtered_events:
            # Ha nincs a szűrésnek megfelelő esemény
            no_results = ctk.CTkLabel(
                self.events_scroll_frame, 
                text="Nincs a szűrésnek megfelelő esemény.",
                font=ctk.CTkFont(size=14)
            )
            no_results.pack(expand=True, pady=20)
            return
        
        # Események megjelenítése
        self.display_events(filtered_events)
    
    def apply_filters(self, events):
        """
        Szűrők alkalmazása az eseményekre
        
        :param events: Események listája
        :return: Szűrt események listája
        """
        filtered_events = events.copy()
        
        # Típus szerinti szűrés
        event_type = self.event_filter_var.get()
        if event_type != "összes":
            # Normalizáljuk a típusneveket (eltávolítjuk az ékezeteket és egységesítjük)
            def normalize_type(tipus):
                replacements = {
                    'gazdasági': 'gazdasagi',
                    'társadalmi': 'tarsadalmi',
                    'politikai': 'politikai',
                    'természeti': 'termeszeti',
                    'katasztrófa': 'katasztrofa',
                    'rendszer': 'rendszer'
                }
                return replacements.get(tipus.lower(), tipus.lower())
            
            normalized_type = normalize_type(event_type)
            filtered_events = [e for e in filtered_events if 
                          normalize_type(e.get('esemeny', {}).get('tipus', '')) == normalized_type]
        
        # Hatás szerinti szűrés
        effect_type = self.effect_var.get()
        if effect_type != "összes":
            temp_events = []
            for esemeny_rekord in filtered_events:
                esemeny = esemeny_rekord.get('esemeny', {})
                
                # Pénzügyi és elégedettségi hatás vizsgálata
                penzugyi_hatas = esemeny.get('penzugyi_hatas', 0)
                elegedettsegi_hatas = esemeny.get('elegedettsegi_hatas', 0)
                lakossag_hatas = esemeny.get('lakossag_hatas', 0)
                
                # Hatás kategória meghatározása
                hatás_kategoria = "semleges"
                if penzugyi_hatas > 0 or elegedettsegi_hatas > 0 or lakossag_hatas > 0:
                    hatás_kategoria = "pozitív"
                elif penzugyi_hatas < 0 or elegedettsegi_hatas < 0 or lakossag_hatas < 0:
                    # Különbséget teszünk a negatív és kritikus között
                    if (penzugyi_hatas < -500000 or elegedettsegi_hatas < -5 or lakossag_hatas < -100):
                        hatás_kategoria = "kritikus"
                    else:
                        hatás_kategoria = "negatív"
                
                # Csak akkor adjuk hozzá, ha megfelel a szűrésnek
                if hatás_kategoria == effect_type:
                    temp_events.append(esemeny_rekord)
            
            filtered_events = temp_events
        
        # Időszak szerinti szűrés
        period = self.period_var.get()
        if period != "összes":
            # Limitek meghatározása
            if "10" in period:
                limit = 10
            elif "30" in period:
                limit = 30
            elif "50" in period:
                limit = 50
            elif "100" in period:
                limit = 100
            elif "500" in period:
                limit = 500
            else:
                limit = len(filtered_events)
            
            # Fordulók szerint rendezzük
            fordulok = set(e.get('fordulo', 0) for e in filtered_events)
            if fordulok:
                legutolso_fordulok = sorted(fordulok, reverse=True)[:limit]
                filtered_events = [e for e in filtered_events 
                              if e.get('fordulo', 0) in legutolso_fordulok]
        
        # Keresés szerinti szűrés
        search_term = self.search_var.get().lower()
        if search_term:
            filtered_events = [e for e in filtered_events if 
                          search_term in e.get('esemeny', {}).get('nev', '').lower() or 
                          search_term in e.get('esemeny', {}).get('leiras', '').lower() or
                          search_term in str(e.get('fordulo', '')).lower()]
        
        return filtered_events
    
    def display_events(self, events):
        """
        Események megjelenítése a lista keretben
        
        :param events: Megjelenítendő események listája
        """
        # Események sorok színezése
        row_colors = ["#2a2d2e", "#262b2c"]  # Váltakozó sorok színei
        
        # Minden korábbi widget törlése az events_scroll_frame-ből
        for widget in self.events_scroll_frame.winfo_children():
            widget.destroy()

        # Ha nincsenek események, jelezzük
        if not events:
            no_events = ctk.CTkLabel(
                self.events_scroll_frame, 
                text="Még nem történtek események a városban.",
                font=ctk.CTkFont(size=14)
            )
            no_events.pack(expand=True, pady=20)
            return

        # Események rendezése fordulók szerint (csökkenő sorrendben)
        events_sorted = sorted(events, key=lambda e: e.get('fordulo', 0), reverse=True)
        
        # Compact container létrehozása az eseményekhez
        events_container = ctk.CTkFrame(self.events_scroll_frame, fg_color="transparent")
        events_container.pack(fill="both", expand=True, padx=0, pady=0)
        
        # Események megjelenítése soronként
        row_i = 0
        for esemeny_rekord in events_sorted:
            esemeny = esemeny_rekord.get('esemeny', {})
            fordulo = esemeny_rekord.get('fordulo', 0)
            
            # Esemény adatok kinyerése
            tipus = esemeny.get('tipus', 'ismeretlen')
            nev = esemeny.get('nev', 'Ismeretlen esemény')
            leiras = esemeny.get('leiras', '')
            
            # Hatások összegzése
            hatások = []
            
            # Ellenőrizzük, hogy az esemény 'hatas' vagy a régi 'penzugyi_hatas' formátumot használja-e
            if 'hatas' in esemeny:
                hatasok = esemeny.get('hatas', {})
                penzugyi_hatas = hatasok.get('penz', 0)
                elegedettsegi_hatas = hatasok.get('boldogsag', 0)
                lakossag_hatas = hatasok.get('lakossag', 0)
            else:
                # Régebbi formátum
                penzugyi_hatas = esemeny.get('penzugyi_hatas', 0)
                elegedettsegi_hatas = esemeny.get('elegedettsegi_hatas', 0)
                lakossag_hatas = esemeny.get('lakossag_hatas', 0)
            
            if penzugyi_hatas != 0:
                prefix = '+' if penzugyi_hatas >= 0 else ''
                hatások.append(f"{prefix}{penzugyi_hatas:,} Ft")
            
            if elegedettsegi_hatas != 0:
                prefix = '+' if elegedettsegi_hatas >= 0 else ''
                hatások.append(f"Elégedettség: {prefix}{elegedettsegi_hatas}%")
            
            if lakossag_hatas != 0:
                prefix = '+' if lakossag_hatas >= 0 else ''
                hatások.append(f"Lakosság: {prefix}{lakossag_hatas} fő")
            
            hatas_text = "\n".join(hatások) if hatások else "Nincs hatás"
            
            # Esemény hatás-súlyosság számítása
            sulyossag = "semleges"
            if penzugyi_hatas > 0 or elegedettsegi_hatas > 0 or lakossag_hatas > 0:
                sulyossag = "pozitív"
            elif penzugyi_hatas < 0 or elegedettsegi_hatas < 0 or lakossag_hatas < 0:
                # Különbséget teszünk a negatív és kritikus között
                if (penzugyi_hatas < -500000 or elegedettsegi_hatas < -5 or lakossag_hatas < -100):
                    sulyossag = "kritikus"
                else:
                    sulyossag = "negatív"
            
            # Sor háttérszíne a váltakozó színekből
            bg_color = row_colors[row_i % 2]
            row_i += 1
            
            # Esemény típus színe
            tipus_szin = "#3a7ebf"  # Alapértelmezett kék
            if tipus == 'gazdasagi':
                tipus_szin = "#2d8659"  # Zöld
            elif tipus == 'tarsadalmi':
                tipus_szin = "#7c3a9d"  # Lila
            elif tipus == 'politikai':
                tipus_szin = "#2d7186"  # Kék
            elif tipus == 'termeszeti':
                tipus_szin = "#86762d"  # Sárga
            elif tipus == 'katasztrofa':
                tipus_szin = "#863a2d"  # Piros
            
            # Súlyosság jelző színe
            if sulyossag == "pozitív":
                sulyossag_szin = "#4CAF50"  # Zöld 
            elif sulyossag == "negatív":
                sulyossag_szin = "#FF9800"  # Narancs
            elif sulyossag == "kritikus":
                sulyossag_szin = "#F44336"  # Piros
            else:
                sulyossag_szin = "#2196F3"  # Kék (semleges)
            
            # Esemény sor kerete
            row_frame = ctk.CTkFrame(events_container, fg_color=bg_color)
            row_frame.pack(fill="x", pady=(1, 0))
            
            # Forduló szám
            fordulo_label = ctk.CTkLabel(
                row_frame, 
                text=str(fordulo), 
                width=60,
                font=ctk.CTkFont(weight="bold"),
                bg_color=bg_color
            )
            fordulo_label.pack(side="left", padx=5, pady=2)
            
            # Súlyosság jelző sáv
            priority_indicator = ctk.CTkFrame(row_frame, width=3, height=40, fg_color=sulyossag_szin)
            priority_indicator.pack(side="left", padx=(0, 5), pady=2)
            
            # Esemény adatok megjelenítése
            tipus_label = ctk.CTkLabel(row_frame, text=tipus, width=100, fg_color=tipus_szin, 
                                      corner_radius=5)
            tipus_label.pack(side="left", padx=5, pady=2)
            
            # Esemény név és leírás
            nev_frame = ctk.CTkFrame(row_frame, fg_color=bg_color)
            nev_frame.pack(side="left", fill="x", expand=True, padx=5)
            
            ctk.CTkLabel(nev_frame, text=nev, font=ctk.CTkFont(weight="bold")).pack(anchor="w", pady=1)
            if leiras and leiras != nev:  # Csak akkor jelenítsük meg, ha különbözik a névtől
                ctk.CTkLabel(nev_frame, text=leiras, font=ctk.CTkFont(size=12)).pack(anchor="w", pady=1)
            
            # Hatások
            hatas_label = ctk.CTkLabel(row_frame, text=hatas_text, width=200, justify="left", text_color=sulyossag_szin)
            hatas_label.pack(side="left", padx=5, pady=2)
    
    def filter_events(self, *args):
        """
        Események szűrése a beállítások alapján
        """
        self.update_events_list()
    
    def reset_filters(self):
        """
        Az összes szűrő visszaállítása alaphelyzetbe
        """
        self.event_filter_var.set("összes")
        self.period_var.set("összes")
        self.effect_var.set("összes")
        self.search_var.set("")
        self.filter_events()
    
    def load_events_log(self):
        """
        Események napló betöltése fájlból
        """
        events_log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'output')
        events_log_file = os.path.join(events_log_dir, 'events_log.json')
        
        if os.path.exists(events_log_file):
            try:
                with open(events_log_file, 'r', encoding='utf-8') as f:
                    self.events_log = json.load(f)
            except Exception as e:
                print(f"Hiba az események napló betöltésekor: {e}")
                self.events_log = []
    
    def save_events_log(self):
        """
        Események napló mentése fájlba
        """
        if not self.events_log:
            return
            
        events_log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'output')
        
        # Könyvtár létrehozása, ha nem létezik
        if not os.path.exists(events_log_dir):
            os.makedirs(events_log_dir)
            
        events_log_file = os.path.join(events_log_dir, 'events_log.json')
        
        try:
            with open(events_log_file, 'w', encoding='utf-8') as f:
                json.dump(self.events_log, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Hiba az események napló mentésekor: {e}")
    
    def export_events_to_csv(self):
        """
        Események exportálása CSV fájlba
        """
        if not self.events_log:
            return
            
        # Kimeneti könyvtár
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'output')
        
        # Könyvtár létrehozása, ha nem létezik
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # Fájlnév generálása
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(output_dir, f'esemenyek_export_{timestamp}.csv')
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                # Fejléc
                f.write("Forduló;Típus;Név;Leírás;Pénzügyi hatás;Elégedettségi hatás;Lakossági hatás\n")
                
                # Adatok
                for esemeny_rekord in self.events_log:
                    esemeny = esemeny_rekord.get('esemeny', {})
                    fordulo = esemeny_rekord.get('fordulo', 0)
                    
                    tipus = esemeny.get('tipus', 'ismeretlen')
                    nev = esemeny.get('nev', 'Ismeretlen esemény').replace(';', ',')
                    leiras = esemeny.get('leiras', '').replace(';', ',')
                    penzugyi_hatas = esemeny.get('penzugyi_hatas', 0)
                    elegedettsegi_hatas = esemeny.get('elegedettsegi_hatas', 0)
                    lakossag_hatas = esemeny.get('lakossag_hatas', 0)
                    
                    f.write(f"{fordulo};{tipus};{nev};{leiras};{penzugyi_hatas};{elegedettsegi_hatas};{lakossag_hatas}\n")
            
            # Értesítés
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
                text=f"Az események sikeresen exportálva:\n{filename}",
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
            print(f"Hiba az események exportálásakor: {e}") 