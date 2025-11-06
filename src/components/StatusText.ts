import { AppStatus, IAppState } from "../types";
import { refresh } from "../utils/game-helper";

export class StatusText {
    public ref = document.getElementById("status-value") as HTMLSpanElement;

    updateState(appState: Partial<IAppState>) {
        const { status } = appState;

        this.ref.innerText = status;
    }
}
