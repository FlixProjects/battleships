import { BaseComponent } from "../BaseComponent";

export class InitiativeIcon extends BaseComponent {
    constructor(private isFirstPlayer: boolean) {
        super();
    }

    build() {
        this.ref = document.createElement("div");
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.innerHTML = `
            <svg style="width: 18px; height: 18px; color: ${this.isFirstPlayer ? "#6ee7b7" : "#fbbf24"}; filter: ${this.isFirstPlayer ? "drop-shadow(0 0 4px rgba(110, 231, 183, 0.6))" : "drop-shadow(0 0 3px rgba(251, 191, 36, 0.5))"}; display: block;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/>
            </svg>
        `;
        return this.ref;
    }
}
