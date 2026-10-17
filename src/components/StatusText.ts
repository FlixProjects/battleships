import { IAppState } from "@shared/types";
import { HTMLSpan } from "./native/Span";

export class StatusText extends HTMLSpan {
    constructor() {
        super();
        this.build();
    }

    updateState(appState?: Partial<IAppState>) {
        this.build();
        const status = appState?.status;

        this.ref.innerText = status ?? "";
    }

    build() {
        const statusBar = document.getElementById("status-bar");

        if (!statusBar || statusBar.querySelector("#status")) {
            return this.ref;
        }

        const status = document.createElement("div");
        status.id = "status";
        this.addContainerStyles(status);
        status.append("Status: ");

        this.ref = document.createElement("span");
        this.ref.id = "status-value";
        this.ref.innerText = "idle";
        status.appendChild(this.ref);

        statusBar.prepend(status);

        return this.ref;
    }

    private addContainerStyles(status: HTMLDivElement) {
        const style = status.style;
        style.display = "flex";
        style.alignItems = "center";
        style.justifyContent = "center";
        style.height = "40px";
        style.width = "fit-content";
        style.padding = "8px 12px";
        style.borderRadius = "10px";
        style.background = "var(--glass-2)";
        style.color = "var(--muted)";
        style.fontSize = "13px";
        style.fontWeight = "500";
    }
}
