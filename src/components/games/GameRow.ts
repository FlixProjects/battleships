import { GameConfig } from "@shared/index";
import { setAppScreen } from "../../utils/screen-helper";
import { BaseComponent } from "../BaseComponent";
import { updateComponents } from "../component-helper";

interface Props {
    gameCode: string;
}

export class GameRow extends BaseComponent {
    gameCode: string;
    constructor(props: Props) {
        super();
        this.gameCode = props.gameCode;
    }
    build() {
        this.ref = document.createElement("button");
        this.addStyles();

        this.ref.appendChild(this.buildGameCode());
        this.ref.appendChild(this.buildResumeText());
        this.addEventListeners();

        return this.ref;
    }
    addStyles() {
        const style = this.ref.style;
        style.display = "flex";
        style.alignItems = "center";
        style.justifyContent = "space-between";
        style.padding = "12px 14px";
        style.background = "var(--glass-2)";
        style.border = "1px solid var(--glass-border)";
        style.borderRadius = "10px";
        style.color = "inherit";
        style.font = "inherit";
        style.textAlign = "left";
        style.cursor = "pointer";
        style.transition = "background var(--transition)";
    }

    buildGameCode() {
        const code = document.createElement("span");
        code.textContent = this.gameCode;
        code.style.fontWeight = "700";
        code.style.fontSize = "16px";
        code.style.letterSpacing = "3px";
        code.style.color = "var(--accent)";
        code.style.textShadow = "0 0 10px rgba(110, 231, 183, 0.4)";
        return code;
    }

    buildResumeText() {
        const resume = document.createElement("span");
        resume.textContent = "Resume →";
        resume.style.fontSize = "13px";
        resume.style.color = "var(--muted)";
        return resume;
    }

    addEventListeners() {
        this.ref.addEventListener("mouseenter", () => (this.ref.style.background = "var(--glass)"));
        this.ref.addEventListener("mouseleave", () => (this.ref.style.background = "var(--glass-2)"));
        this.ref.addEventListener("click", (event) => {
            event.stopPropagation();
            setAppScreen(GameConfig.AppScreen.Game);
            updateComponents();
        });
    }
}
