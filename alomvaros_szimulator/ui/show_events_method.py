def _show_events(self, esemenyek):
    """
    Megjeleníti a fordulóban történt eseményeket egy felugró ablakban
    
    :param esemenyek: Az események listája, amit meg kell jeleníteni
    """
    # Ha nincsenek események, nem csinálunk semmit
    if not esemenyek or len(esemenyek) == 0:
        return
        
    # Felugró ablak létrehozása
    events_popup = ctk.CTkToplevel(self.root)
    events_popup.title(f"{self.fordulo_szamlalo}. forduló eseményei")
    events_popup.geometry("550x400")
    events_popup.transient(self.root)  # Az ablak a főablak felett marad
    events_popup.grab_set()  # Modális ablak
    
    # Fejléc
    header_frame = ctk.CTkFrame(events_popup)
    header_frame.pack(fill="x", padx=10, pady=10)
    
    ctk.CTkLabel(
        header_frame, 
        text=f"{self.fordulo_szamlalo}. forduló eseményei - {self.game_engine.varos.nev}",
        font=ctk.CTkFont(size=16, weight="bold")
    ).pack(pady=5)
    
    # Görgetett tartalomterület az eseményekhez
    scroll_frame = ctk.CTkScrollableFrame(events_popup)
    scroll_frame.pack(fill="both", expand=True, padx=10, pady=10)
    
    # Események megjelenítése
    for i, esemeny in enumerate(esemenyek):
        # Esemény kártya
        card_frame = ctk.CTkFrame(scroll_frame)
        card_frame.pack(fill="x", padx=5, pady=5)
        
        # Esemény színezése típus alapján
        bg_color = "#2a2d2e"  # Alapértelmezett szín
        event_color = "#3a7ebf"  # Alapértelmezett kék
        
        # Egyszerű szöveges esemény esetén egyszerű megjelenítés
        if isinstance(esemeny, str):
            leiras_label = ctk.CTkLabel(
                card_frame, 
                text=esemeny,
                font=ctk.CTkFont(size=13),
                wraplength=500,
                justify="left"
            )
            leiras_label.pack(anchor="w", padx=10, pady=10)
        else:
            # Összetett esemény struktúra esetén részletesebb megjelenítés
            # (Ezt akkor használnánk, ha nem szöveges, hanem objektum formában lennének az események)
            leiras = str(esemeny)
            leiras_label = ctk.CTkLabel(
                card_frame, 
                text=leiras,
                font=ctk.CTkFont(size=13),
                wraplength=500,
                justify="left"
            )
            leiras_label.pack(anchor="w", padx=10, pady=10)
    
    # Bezáró gomb
    btn_frame = ctk.CTkFrame(events_popup)
    btn_frame.pack(fill="x", padx=10, pady=10)
    
    ctk.CTkButton(
        btn_frame, 
        text="Bezárás",
        command=events_popup.destroy
    ).pack(side="right", padx=10) 