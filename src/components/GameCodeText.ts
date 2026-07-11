import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { HTMLSpan } from "./native/Span";

export class GameCodeText extends HTMLSpan {
    constructor(parent: HTMLElement) {
        super();
        this.ref = document.createElement("span");
        this.ref.title = "Copy game code";
        this.addStyles();
        this.addHoverListeners();
        this.addClickEventListener();

        parent.appendChild(this.ref);
    }

    addStyles() {
        const style = this.ref.style;
        style.display = "inline-block";
        style.minWidth = "80px";
        style.textAlign = "center";
        style.fontSize = "20px";
        style.fontWeight = "700";
        style.letterSpacing = "3px";
        style.color = "var(--accent)";
        style.textShadow = "0 0 10px rgba(110, 231, 183, 0.6), 0 0 20px rgba(110, 231, 183, 0.2)";
        style.cursor = "pointer";
        style.userSelect = "all";
        style.transition = "transform 0.25s ease, color 0.25s ease, text-shadow 0.25s ease";
    }

    private addHoverListeners() {
        const style = this.ref.style;

        this.ref.addEventListener("mouseenter", () => {
            style.transform = "scale(1.1)";
            style.color = "var(--accent-2)";
            style.textShadow = "0 0 16px rgba(96, 165, 250, 0.8), 0 0 26px rgba(96, 165, 250, 0.4)";
        });
        this.ref.addEventListener("mouseleave", () => {
            style.transform = "";
            style.color = "var(--accent)";
            style.textShadow = "0 0 10px rgba(110, 231, 183, 0.6), 0 0 20px rgba(110, 231, 183, 0.2)";
        });
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
        const gameState = _state?.gameState;
        const status = _state?.status;

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
                break;
        }
    }
}
