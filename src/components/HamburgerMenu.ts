import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { deleteAuthCookie } from "../utils/cookie-helper";
import { getGameCode } from "../utils/game-helper";
import { getAppScreen, setAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { updateComponents } from "./component-helper";
import { applyButtonStyles } from "./styles/inline-styles";

/**
 * Top-right hamburger menu, mounted into the HeroSection row (so it must be
 * registered after HeroSection in loadComponents). Visible once the player is
 * past the login screen (guest included): "Lobby" routes back to the lobby,
 * "Exit" ends the session and returns to login.
 */
export class HamburgerMenu extends BaseComponent {
    private dropdown: HTMLDivElement;
    private isOpen = false;

    updateState(_state?: IAppState): void {
        this.build();

        if (!this.ref) {
            return;
        }

        const screen = _state?.screen ?? getAppScreen();
        const isVisible = screen !== GameConfig.AppScreen.Login;
        this.ref.style.display = isVisible ? "block" : "none";

        if (!isVisible) {
            this.closeDropdown();
        }
    }

    build() {
        const hero = document.getElementById("hero-section");

        if (!hero || hero.querySelector("#hamburger-menu")) {
            return this.ref;
        }

        this.ref = document.createElement("div");
        this.ref.id = "hamburger-menu";
        this.addStyles();

        this.ref.appendChild(this.buildToggleButton());
        this.ref.appendChild(this.buildDropdown());
        this.addCloseListeners();

        hero.appendChild(this.ref);

        return this.ref;
    }

    addStyles() {
        const style = this.ref.style;
        style.position = "relative";
        style.marginLeft = "auto";
    }

    private buildToggleButton() {
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "hamburgerBtn";
        toggleBtn.title = "Menu";
        applyButtonStyles(toggleBtn);
        toggleBtn.style.display = "flex";
        toggleBtn.style.flexDirection = "column";
        toggleBtn.style.gap = "4px";
        toggleBtn.style.padding = "12px 10px";
        toggleBtn.style.borderRadius = "10px";

        toggleBtn.append(this.buildBar(), this.buildBar(), this.buildBar());

        toggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            this.toggleDropdown();
        });

        return toggleBtn;
    }

    private buildBar() {
        const bar = document.createElement("span");
        const style = bar.style;
        style.display = "block";
        style.width = "18px";
        style.height = "2px";
        style.borderRadius = "1px";
        style.background = "#ddebff";

        return bar;
    }

    private buildDropdown() {
        this.dropdown = document.createElement("div");

        const style = this.dropdown.style;
        style.display = "none";
        style.position = "absolute";
        style.top = "calc(100% + 8px)";
        style.right = "0";
        style.minWidth = "160px";
        style.padding = "6px";
        style.flexDirection = "column";
        style.gap = "2px";
        style.background = "linear-gradient(180deg, rgba(15, 23, 36, 0.97), rgba(11, 18, 32, 0.97))";
        style.border = "1px solid var(--glass-border)";
        style.borderRadius = "12px";
        style.boxShadow = "0 10px 30px rgba(3, 7, 18, 0.6)";
        style.zIndex = "1000";

        this.dropdown.append(
            this.buildMenuItem("Game", () => this.onGameClick()),
            this.buildMenuItem("Lobby", () => this.onLobbyClick()),
            this.buildMenuItem(this.getExitLabel(), async () => await this.onExitClick(), { danger: true }),
        );

        return this.dropdown;
    }

    // Guest sessions "Exit"; becomes "Logout" once Stage C account auth lands.
    private getExitLabel() {
        return "Exit";
    }

    private buildMenuItem(label: string, onSelect: () => void, options: { danger?: boolean } = {}) {
        const { danger = false } = options;
        const item = document.createElement("button");
        item.textContent = label;

        const style = item.style;
        style.display = "block";
        style.width = "100%";
        style.padding = "10px 14px";
        style.textAlign = "left";
        style.background = "transparent";
        style.border = "none";
        style.borderRadius = "8px";
        style.cursor = "pointer";
        style.font = "inherit";
        style.fontSize = "14px";
        style.letterSpacing = "0.4px";
        style.color = danger ? "#fca5a5" : "#ddebff";
        style.transition = "background var(--transition)";

        item.addEventListener("mouseenter", () => (item.style.background = "var(--glass)"));
        item.addEventListener("mouseleave", () => (item.style.background = "transparent"));
        item.addEventListener("click", (event) => {
            event.stopPropagation();
            this.closeDropdown();
            onSelect();
        });

        return item;
    }

    private addCloseListeners() {
        document.addEventListener("click", () => this.closeDropdown());
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.closeDropdown();
            }
        });
    }

    private toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    private openDropdown() {
        this.isOpen = true;
        this.dropdown.style.display = "flex";
    }

    private closeDropdown() {
        if (!this.dropdown) {
            return;
        }

        this.isOpen = false;
        this.dropdown.style.display = "none";
    }

    private onGameClick() {
        // Nothing to return to without a joined game.
        if (!getGameCode()) {
            return;
        }

        setAppScreen(GameConfig.AppScreen.InGame);
        updateComponents();
    }

    private onLobbyClick() {
        setAppScreen(GameConfig.AppScreen.Lobby);
        updateComponents();
    }

    private async onExitClick() {
        await sessionStorage.clear();
        await location.reload();
        deleteAuthCookie();
        setAppScreen(GameConfig.AppScreen.Login);
        updateComponents({ status: GameConfig.AppStatus.NewGame, loading: false });
    }
}
