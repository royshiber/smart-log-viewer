from __future__ import annotations

import os
import shutil
import threading
from pathlib import Path
from queue import Empty, Queue
import tkinter as tk
from tkinter import filedialog, messagebox

import customtkinter as ctk
from PIL import Image

from ..core.file_organizer import create_component_folder, create_root_output, sanitize_name
from ..core.models import ProgressEvent
from ..core.runner import run_collection

# Why: single place for UI tokens; What: consistent light “tooling” chrome without heavy custom assets.
_BG_APP = ("#eef2f7", "#0f1419")
_BG_PANEL = ("#ffffff", "#1e2430")
_BG_HEADER = ("#ffffff", "#1a2030")
_ACCENT = "#2563eb"
_ACCENT_HOVER = "#1d4ed8"
_IMPORT = "#15803d"
_IMPORT_HOVER = "#166534"
_TEXT_MUTED = ("#64748b", "#94a3b8")
_TEXT = ("#0f172a", "#e2e8f0")
_BORDER = ("#e2e8f0", "#334155")


class StepCollectorApp(ctk.CTk):
    def __init__(self) -> None:
        # Why: provide a desktop control panel for the collector; What: builds UI and wires worker thread events.
        super().__init__()
        self.title("Desktop STEP Collector")
        self.minsize(880, 520)

        self.events: Queue = Queue()
        self.stop_event = threading.Event()
        self.worker: threading.Thread | None = None
        self.output_root: Path | None = None
        self.cards: dict[str, dict[str, object]] = {}
        self.card_images: dict[str, ctk.CTkImage] = {}
        self._startup_progress_active = False

        self._build_ui()
        self.bind("<Control-Return>", lambda _event: self._start())
        self.after(80, self._fit_window_to_screen)
        self.after(200, self._poll_events)

    def _fit_window_to_screen(self) -> None:
        # Why: fixed tall geometry hid the log behind the Windows taskbar; What: clamp window size to visible work area.
        try:
            self.update_idletasks()
            sh = int(self.winfo_screenheight())
            sw = int(self.winfo_screenwidth())
            reserve = 108
            h = max(520, min(760, sh - reserve))
            w = max(880, min(1040, sw - 40))
            x = max(0, (sw - w) // 2)
            y = max(0, min(24, (sh - h) // 4))
            self.geometry(f"{w}x{h}+{x}+{y}")
        except tk.TclError:
            self.geometry("1040x720")

    def _build_ui(self) -> None:
        self.configure(fg_color=_BG_APP)

        header = ctk.CTkFrame(self, corner_radius=16, fg_color=_BG_HEADER, border_width=1, border_color=_BORDER)
        header.grid_columnconfigure(0, weight=1)

        title_row = ctk.CTkFrame(header, fg_color="transparent")
        title_row.grid(row=0, column=0, sticky="ew", padx=20, pady=(12, 2))
        title_row.grid_columnconfigure(1, weight=1)
        accent = ctk.CTkFrame(title_row, width=4, height=36, corner_radius=2, fg_color=_ACCENT)
        accent.grid(row=0, column=0, sticky="ns", padx=(0, 12))
        accent.grid_propagate(False)
        ctk.CTkLabel(
            title_row,
            text="Desktop STEP Collector",
            font=ctk.CTkFont(family="Segoe UI", size=22, weight="bold"),
            text_color=_TEXT,
        ).grid(row=0, column=1, sticky="w")

        ctk.CTkLabel(
            header,
            text="אוטומציה כשהאתרים מאפשרים · חיפוש ידני בכמה טאבים · מעקב הורדות · ייבוא קובץ מקומי\n"
            "Automation when sites allow · multi-tab manual search · download watch · local file import",
            font=ctk.CTkFont(family="Segoe UI", size=12),
            text_color=_TEXT_MUTED,
            justify="left",
            anchor="w",
            wraplength=960,
        ).grid(row=1, column=0, sticky="ew", padx=20, pady=(0, 4))

        self.status_banner = ctk.CTkLabel(
            header,
            text="מוכן — הזן רכיבים ולחץ Start / Ready — add parts and press Start",
            text_color=_TEXT_MUTED,
            font=ctk.CTkFont(family="Segoe UI", size=12),
            anchor="w",
            justify="left",
            wraplength=960,
        )
        self.status_banner.grid(row=2, column=0, sticky="ew", padx=20, pady=(0, 10))

        mid = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent")
        mid.grid_columnconfigure(0, weight=3)
        mid.grid_columnconfigure(1, weight=2)
        mid.grid_rowconfigure(0, weight=1)

        left_panel = ctk.CTkFrame(mid, corner_radius=16, fg_color=_BG_PANEL, border_width=1, border_color=_BORDER)
        left_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        left_panel.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            left_panel,
            text="רכיבים (שורה לכל חלק) / Components (one per line)",
            font=ctk.CTkFont(family="Segoe UI", size=14, weight="bold"),
            text_color=_TEXT,
        ).grid(row=0, column=0, sticky="w", padx=16, pady=(14, 6))

        self.input_box = ctk.CTkTextbox(
            left_panel,
            height=132,
            font=ctk.CTkFont(family="Consolas", size=13),
            corner_radius=12,
            border_width=1,
            border_color=_BORDER,
        )
        self.input_box.grid(row=1, column=0, sticky="ew", padx=14, pady=(0, 10))

        controls = ctk.CTkFrame(left_panel, corner_radius=12, fg_color=("gray95", "#252b38"))
        controls.grid(row=2, column=0, sticky="ew", padx=14, pady=(0, 8))
        for i in range(4):
            controls.grid_columnconfigure(i, weight=1)

        btn_kw = {"corner_radius": 10, "height": 36, "font": ctk.CTkFont(family="Segoe UI", size=13, weight="bold")}
        ctk.CTkButton(controls, text="Load .txt", command=self._load_txt, fg_color=("gray75", "#3d4554"), hover_color=("gray65", "#4b5568"), **btn_kw).grid(
            row=0, column=0, padx=8, pady=(10, 4), sticky="ew"
        )
        self.start_btn = ctk.CTkButton(
            controls, text="Start", command=self._start, fg_color=_ACCENT, hover_color=_ACCENT_HOVER, **btn_kw
        )
        self.start_btn.grid(row=0, column=1, padx=8, pady=(10, 4), sticky="ew")
        self.stop_btn = ctk.CTkButton(
            controls, text="Stop", command=self._stop, state="disabled", fg_color="#b45309", hover_color="#92400e", **btn_kw
        )
        self.stop_btn.grid(row=0, column=2, padx=8, pady=(10, 4), sticky="ew")
        self.open_btn = ctk.CTkButton(
            controls,
            text="Open Folder",
            command=self._open_folder,
            state="disabled",
            fg_color=("gray75", "#3d4554"),
            hover_color=("gray65", "#4b5568"),
            **btn_kw,
        )
        self.open_btn.grid(row=0, column=3, padx=8, pady=(10, 4), sticky="ew")
        ctk.CTkButton(
            controls,
            text="ייבוא STEP מקומי / Import local STEP…",
            command=self._import_local,
            fg_color=_IMPORT,
            hover_color=_IMPORT_HOVER,
            height=38,
            corner_radius=10,
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
        ).grid(row=1, column=0, columnspan=4, padx=8, pady=(0, 10), sticky="ew")

        ctk.CTkLabel(
            left_panel,
            text="טיפ: Ctrl+Enter מתחיל ריצה · Tip: Ctrl+Enter starts run",
            text_color=_TEXT_MUTED,
            font=ctk.CTkFont(size=12),
        ).grid(row=3, column=0, sticky="w", padx=16, pady=(0, 10))

        right_panel = ctk.CTkFrame(mid, corner_radius=16, fg_color=_BG_PANEL, border_width=1, border_color=_BORDER)
        right_panel.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        right_panel.grid_rowconfigure(1, weight=1)
        right_panel.grid_columnconfigure(0, weight=1)
        ctk.CTkLabel(
            right_panel,
            text="לוח סטטוס / Status board",
            font=ctk.CTkFont(family="Segoe UI", size=15, weight="bold"),
            text_color=_TEXT,
        ).grid(row=0, column=0, sticky="w", padx=16, pady=(14, 8))
        self.cards_frame = ctk.CTkScrollableFrame(right_panel, corner_radius=12, fg_color=("gray96", "#252b38"), border_width=1, border_color=_BORDER)
        self.cards_frame.grid(row=1, column=0, sticky="nsew", padx=14, pady=(0, 14))
        self.cards_frame.grid_columnconfigure(0, weight=1)

        bottom_dock = ctk.CTkFrame(self, corner_radius=16, fg_color=_BG_PANEL, border_width=1, border_color=_BORDER)
        bottom_dock.grid_columnconfigure(0, weight=1)

        self.progress = ctk.CTkProgressBar(bottom_dock, height=10, corner_radius=5, progress_color=_ACCENT)
        self.progress.grid(row=0, column=0, sticky="ew", padx=16, pady=(10, 4))
        self.progress.set(0)

        self.progress_label = ctk.CTkLabel(
            bottom_dock,
            text="Progress: 0/0",
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            text_color=_TEXT,
        )
        self.progress_label.grid(row=1, column=0, sticky="w", padx=16, pady=(0, 6))

        log_frame = ctk.CTkFrame(bottom_dock, corner_radius=14, fg_color=("gray96", "#252b38"), border_width=1, border_color=_BORDER)
        log_frame.grid(row=2, column=0, sticky="ew", padx=16, pady=(0, 10))
        log_frame.grid_columnconfigure(0, weight=1)
        ctk.CTkLabel(
            log_frame,
            text="יומן ריצה / Run Log",
            font=ctk.CTkFont(family="Segoe UI", size=14, weight="bold"),
            text_color=_TEXT,
        ).grid(row=0, column=0, sticky="w", padx=12, pady=(8, 4))
        self.log = ctk.CTkTextbox(
            log_frame,
            height=120,
            font=ctk.CTkFont(family="Consolas", size=12),
            corner_radius=10,
            border_width=1,
            border_color=_BORDER,
        )
        self.log.grid(row=1, column=0, sticky="ew", padx=12, pady=(0, 10))

        # Why: pack order reserves bottom strip first so the log stays above the taskbar; What: header top, dock bottom, mid fills middle.
        header.pack(side=tk.TOP, fill=tk.X, padx=16, pady=(12, 4))
        bottom_dock.pack(side=tk.BOTTOM, fill=tk.X, padx=16, pady=(0, 10))
        mid.pack(side=tk.TOP, fill=tk.BOTH, expand=True, padx=16, pady=(0, 4))

    def _status_colors(self, state: str) -> tuple[str, str]:
        mapping = {
            "pending": ("#64748b", "ממתין / Pending"),
            "queued": ("#64748b", "בתור / Queued"),
            "in_progress": (_ACCENT, "בתהליך / Working"),
            "found": ("#059669", "נמצאה התאמה / Found"),
            "done": ("#16a34a", "נשמר / Saved"),
            "failed": ("#dc2626", "נכשל / Failed"),
        }
        color, label = mapping.get(state, ("#64748b", "—"))
        return color, label

    def _build_component_cards(self, components: list[str]) -> None:
        # Why: user requested an easy visual summary; What: renders one status card per component with placeholder thumbnail.
        for child in self.cards_frame.winfo_children():
            child.destroy()
        self.cards.clear()
        self.card_images.clear()
        for idx, component in enumerate(components):
            card = ctk.CTkFrame(self.cards_frame, corner_radius=14, fg_color=_BG_PANEL, border_width=1, border_color=_BORDER)
            card.grid(row=idx, column=0, sticky="ew", padx=6, pady=6)
            card.grid_columnconfigure(1, weight=1)
            thumb = ctk.CTkLabel(
                card,
                text="—",
                width=96,
                height=72,
                corner_radius=10,
                fg_color=("gray88", "#2d3544"),
                text_color=_TEXT_MUTED,
                font=ctk.CTkFont(size=11),
            )
            thumb.grid(row=0, column=0, rowspan=2, padx=10, pady=10)
            name_lbl = ctk.CTkLabel(
                card,
                text=component,
                anchor="w",
                font=ctk.CTkFont(family="Segoe UI", size=14, weight="bold"),
                text_color=_TEXT,
                wraplength=360,
                justify="left",
            )
            name_lbl.grid(row=0, column=1, sticky="ew", padx=(0, 10), pady=(10, 2))
            status_lbl = ctk.CTkLabel(
                card,
                text="בתור — לחץ Start / Queued — press Start",
                text_color=_TEXT_MUTED,
                anchor="w",
                justify="left",
                wraplength=360,
                font=ctk.CTkFont(family="Segoe UI", size=12),
            )
            status_lbl.grid(row=1, column=1, sticky="ew", padx=(0, 10), pady=(0, 10))
            self.cards[component] = {"card": card, "thumb": thumb, "status": status_lbl, "name": name_lbl}

    def _update_component_card(self, component: str, state: str, message: str, preview_path: Path | None) -> None:
        card = self.cards.get(component)
        if not card:
            return
        color, status_text = self._status_colors(state)
        status_lbl = card["status"]
        thumb = card["thumb"]
        detail = message if message else status_text
        status_lbl.configure(text=f"{status_text}\n{detail}", text_color=color)
        if preview_path and preview_path.exists():
            try:
                image = Image.open(preview_path)
                ctk_image = ctk.CTkImage(light_image=image, dark_image=image, size=(96, 72))
                self.card_images[component] = ctk_image
                thumb.configure(text="", image=ctk_image)
            except Exception:
                pass

    def _append_log(self, text: str) -> None:
        self.log.insert(tk.END, text + "\n")
        self.log.see(tk.END)

    def _begin_startup_progress(self) -> None:
        # Why: first Chromium launch can take tens of seconds; What: indeterminate bar so the UI does not look frozen.
        self._startup_progress_active = True
        try:
            self.progress.configure(mode="indeterminate")
            self.progress.start()
        except tk.TclError:
            self._startup_progress_active = False

    def _end_startup_progress(self) -> None:
        if not self._startup_progress_active:
            return
        self._startup_progress_active = False
        try:
            self.progress.stop()
        except tk.TclError:
            pass
        try:
            self.progress.configure(mode="determinate")
        except tk.TclError:
            pass
        self.progress.set(0)

    def _load_txt(self) -> None:
        # Why: quick bulk input from file; What: loads text lines into component textbox.
        path = filedialog.askopenfilename(filetypes=[("Text files", "*.txt")])
        if not path:
            return
        with open(path, "r", encoding="utf-8") as f:
            content = f.read().strip()
        self.input_box.delete("1.0", tk.END)
        self.input_box.insert("1.0", content)

    def _import_local(self) -> None:
        # Why: many catalogs block automation; What: copies user-selected STEP/STP into a fresh Drone_Components run folder.
        out_dir = filedialog.askdirectory(title="Select output base directory")
        if not out_dir:
            return
        paths = filedialog.askopenfilenames(
            title="Select STEP or STP files",
            filetypes=[("STEP / STP", "*.step *.stp"), ("All files", "*.*")],
        )
        if not paths:
            return
        root = create_root_output(Path(out_dir))
        self.output_root = root
        self.log.delete("1.0", tk.END)
        self._append_log(f"Import: {len(paths)} file(s) → {root}")
        imported = 0
        for p in paths:
            src = Path(p)
            ext = src.suffix.lower()
            if ext not in (".step", ".stp"):
                self._append_log(f"Skipped (not STEP/STP): {src.name}")
                continue
            comp = src.stem
            folder = create_component_folder(root, comp)
            dest_ext = ".stp" if ext == ".stp" else ".step"
            dest = folder / f"{sanitize_name(comp)}{dest_ext}"
            shutil.copy2(src, dest)
            imported += 1
            self._append_log(f"Imported {src.name} → {dest.relative_to(root)}")
        self.open_btn.configure(state="normal")
        self.status_banner.configure(
            text=f"ייבוא הושלם — {imported} קבצים / Import done — {imported} file(s)",
        )
        messagebox.showinfo("Import done", f"Saved under:\n{root}")

    def _start(self) -> None:
        # Why: keep UI responsive during automation; What: starts background thread with run parameters.
        if self.worker and self.worker.is_alive():
            return
        raw = self.input_box.get("1.0", tk.END)
        components = [line.strip() for line in raw.splitlines() if line.strip()]
        if not components:
            messagebox.showwarning("Missing input", "Please add at least one component.")
            return

        out_dir = filedialog.askdirectory(title="Select output base directory")
        if not out_dir:
            return

        self.stop_event.clear()
        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.open_btn.configure(state="disabled")
        self._begin_startup_progress()
        self.progress_label.configure(
            text="מתחיל… טעינת Chromium (לעיתים 1–10 דק׳ בפעם הראשונה — עוקבים ביומן) / Starting… Chromium can take 1–10+ min first time — watch log",
        )
        self.log.delete("1.0", tk.END)
        self._append_log("Starting job…")
        self._build_component_cards(components)
        self.status_banner.configure(
            text="מריץ… אנא המתן לטעינת הדפדפן הפנימי / Running… loading embedded Chromium (please wait)",
        )

        self.worker = threading.Thread(
            target=run_collection,
            args=(components, Path(out_dir), self.events, self.stop_event),
            daemon=True,
        )
        self.worker.start()

    def _stop(self) -> None:
        self.stop_event.set()
        self._append_log("Stop requested.")

    def _open_folder(self) -> None:
        if not self.output_root:
            return
        os.startfile(str(self.output_root))

    def _poll_events(self) -> None:
        try:
            while True:
                event: ProgressEvent = self.events.get_nowait()
                self._append_log(event.message)

                if event.kind == "root":
                    self.output_root = Path(event.message.strip())

                if event.kind == "phase" and event.message == "startup_done":
                    self._end_startup_progress()
                    if event.total > 0:
                        self.progress_label.configure(text=f"Progress: {event.current}/{event.total}")

                if (
                    event.total > 0
                    and event.kind not in ("phase",)
                    and not self._startup_progress_active
                ):
                    self.progress.set(min(1.0, event.current / max(event.total, 1)))
                    self.progress_label.configure(text=f"Progress: {event.current}/{event.total}")

                if event.kind == "component_state" and event.component and event.component_state:
                    self._update_component_card(event.component, event.component_state, event.message, event.preview_image)
                    self.status_banner.configure(text=event.message)
                elif event.kind in ("info", "manual", "result", "root"):
                    short = event.message.split("\n")[0]
                    if len(short) > 220:
                        short = short[:217] + "…"
                    self.status_banner.configure(text=short)

                if event.kind == "done":
                    self._end_startup_progress()
                    self.start_btn.configure(state="normal")
                    self.stop_btn.configure(state="disabled")
                    self.open_btn.configure(state="normal")
                    self.progress.set(1.0)
                    self.status_banner.configure(text="סיום — Open Folder לתוצאות / Done — use Open Folder for results")
                if event.kind == "error":
                    self._end_startup_progress()
                    self.start_btn.configure(state="normal")
                    self.stop_btn.configure(state="disabled")
                    err = event.message[:240] + ("…" if len(event.message) > 240 else "")
                    self.status_banner.configure(text=f"שגיאה / Error: {err}")
        except Empty:
            pass
        self.after(200, self._poll_events)
