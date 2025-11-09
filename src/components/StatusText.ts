import { IAppState } from "../types";
import { HTMLSpan } from "./native/Span";

export class StatusText extends HTMLSpan {
    public ref = document.getElementById("status-value") as HTMLSpanElement;

    updateState(appState: Partial<IAppState>) {
        const { status } = appState;

        this.ref.innerText = status;
    }
}
