import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { refresh } from "../utils/game-helper";
import { HTMLButton } from "./native/Button";

export class RefreshButton extends HTMLButton {
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
        this.ref.className = "btn icon-btn";
        this.ref.title = "Refresh Game";

        const icon = document.createElement("img");
        icon.src = "assets/refresh-icon.svg";
        icon.alt = "Refresh";
        icon.className = "refresh-icon";
        icon.draggable = false;
        this.ref.appendChild(icon);

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

    async onClick() {
        this.spin();
        await refresh();
        this.stopSpin();
    }

    spin() {
        this.ref.classList.add("loading");
    }

    stopSpin() {
        this.ref.classList.remove("loading");
    }

    updateState(appState: Partial<IAppState>) {
        this.build();
        const { status } = appState;

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
