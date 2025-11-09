import { AppStatus, IAppState } from "../types";
import { refresh } from "../utils/game-helper";
import { HTMLButton } from "./native/Button";

export class RefreshButton extends HTMLButton {
    public ref = document.getElementById("refreshBtn") as HTMLButtonElement;

    constructor() {
        super();
        this.build();
    }

    build() {
        this.addClickEventListener();
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
        const { status } = appState;

        if (status !== AppStatus.Initialised && status !== AppStatus.WaitingForPlayers) {
            this.ref.disabled = true;
        } else {
            this.ref.disabled = false;
        }
    }
}
