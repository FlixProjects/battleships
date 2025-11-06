import { AppStatus, IAppState } from "../types";
import { refresh } from "../utils/game-helper";

export class RefreshButton {
    public ref = document.getElementById("refreshBtn") as HTMLButtonElement;

    constructor() {
        this.ref.addEventListener("click", async () => {
            this.spin();
            await refresh();
            this.stopSpin();
        });
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
