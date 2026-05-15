import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
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

        setTimeout(() => {
            element.textContent = original ?? "";
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

        if (!gameState) {
            return;
        }

        switch (status) {
            case GameConfig.AppStatus.Initialising:
                element.innerText = "";
                break;
            case GameConfig.AppStatus.Error:
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
