import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import SpinCssAnimStyle from "../css-anim-styles/models/spin-style";
import { refresh } from "../utils/game-helper";
import { HTMLButton } from "./native/Button";

export class RefreshButton extends HTMLButton {
    private icon: HTMLImageElement;

    constructor() {
        super();
        this.build();
    }

    build() {
        const statusBar = document.getElementById("status-bar");

        if (!statusBar || statusBar.querySelector("#refreshBtn")) {
            return this.ref;
        }

        this.ref = document.createElement("button");
        this.ref.id = "refreshBtn";
        this.ref.title = "Refresh Game";
        // .btn supplies the :hover/:active/:disabled states from styles.css
        this.ref.className = "btn";
        this.addStyles();

        this.buildIcon();
        this.addClickEventListener();

        // Sits right after the status text, ahead of the game code and switch-player button.
        const status = statusBar.querySelector("#status");
        if (status) {
            status.after(this.ref);
        } else {
            statusBar.prepend(this.ref);
        }

        return this.ref;
    }

    // Only properties the .btn interaction states leave alone, so those rules still apply.
    addStyles() {
        const style = this.ref.style;
        style.display = "flex";
        style.alignItems = "center";
        style.justifyContent = "center";
        style.background = "var(--glass-2)";
        style.border = "none";
        style.borderRadius = "8px";
        style.transition = "background 0.2s ease, transform 0.1s ease";
    }

    private buildIcon() {
        this.icon = document.createElement("img");
        this.icon.src = "assets/refresh-icon.svg";
        this.icon.alt = "Refresh";
        this.icon.draggable = false;

        const style = this.icon.style;
        style.height = "20px";
        // the svg is black; render it white
        style.filter = "brightness(0) invert(1)";
        style.transition = "transform 0.4s ease";

        this.ref.appendChild(this.icon);
    }

    async onClick() {
        this.spin();
        await refresh();
        this.stopSpin();
    }

    spin() {
        new SpinCssAnimStyle().attachTo(this.icon);
    }

    stopSpin() {
        this.icon.style.animation = "";
    }

    updateState(appState?: Partial<IAppState>) {
        this.build();
        const status = appState?.status;

        switch (status) {
            case GameConfig.AppStatus.Initialised:
            case GameConfig.AppStatus.WaitingForPlayers:
            case GameConfig.AppStatus.WaitingForOtherPlayer:
            case GameConfig.AppStatus.ReadyToSubmit:
                this.ref.disabled = false;
                break;
            default:
                this.ref.disabled = true;
                break;
        }
    }
}
