import customtkinter as ctk

from step_collector.ui.app_window import StepCollectorApp


def main() -> None:
    # Why: application entry point; What: configures theme and runs the UI loop.
    ctk.set_appearance_mode("System")
    ctk.set_default_color_theme("blue")
    app = StepCollectorApp()
    app.mainloop()


if __name__ == "__main__":
    main()
