import { AppStatus, IAppState } from "../types";
import { HTMLSpan } from "./native/Span";

export class GameCodeText extends HTMLSpan {
    constructor() {
        super();
        this.ref = document.getElementById("gameCode") as HTMLSpanElement;
    }

    enableGameCodeCopy() {
        const element = this.ref;

        if (!element) return;

        this.addClickEventListener();
    }

    onClickFeedback() {
        const element = this.ref;
        // Temporary visual feedback
        const original = element.textContent;
        element.textContent = "✅ Copied!";
        element.classList.add("copied");

        setTimeout(() => {
            element.textContent = original!;
            element.classList.remove("copied");
        }, 1200);
    }

    async onClick(): Promise<void> {
        const element = this.ref;
        const code = element.textContent?.trim();
        if (!code) return;

        try {
            await navigator.clipboard.writeText(code);
            this.onClickFeedback();
        } catch (err) {
            console.error("Clipboard copy failed:", err);
        }
    }

    updateState(_state?: IAppState): void {
        const element = this.ref;
        const { status, gameState } = _state;

        switch (status) {
            case AppStatus.Initialising:
                element.innerText = "";
                break;
            case AppStatus.Error:
                element.innerHTML = "error";
            default:
                element.innerText = gameState.code;

                if (gameState.code) {
                    this.enableGameCodeCopy();
                }
                break;
        }
    }
}
