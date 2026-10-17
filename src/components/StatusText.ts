import { IAppState } from "@shared/types";
import { HTMLSpan } from "./native/Span";

export class StatusText extends HTMLSpan {
    constructor() {
        super();
        this.build();
    }

    updateState(appState: Partial<IAppState>) {
        this.build();
        const { status } = appState;

        this.ref.innerText = status;
    }

    build() {
        const statusBar = document.getElementById("status-bar");

        if (!statusBar || statusBar.querySelector("#status")) {
            return this.ref;
        }

        const status = document.createElement("div");
        status.id = "status";
        status.className = "status";
        status.append("Status: ");

        this.ref = document.createElement("span");
        this.ref.id = "status-value";
        this.ref.innerText = "idle";
        status.appendChild(this.ref);

        statusBar.prepend(status);

        return this.ref;
    }
}
