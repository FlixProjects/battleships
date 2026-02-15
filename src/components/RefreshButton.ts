import { AppStatus, IAppState } from "../../shared/types";
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
        const { status } = appState;

        switch (status) {
            case AppStatus.Initialised:
            case AppStatus.WaitingForPlayers:
            case AppStatus.WaitingForOtherPlayer:
            case AppStatus.ReadyToSubmit:
                this.ref.disabled = false;
                break;
            default:
                this.ref.disabled = true;
                break;
        }
    }
}
