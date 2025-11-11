import { BaseComponent } from "../BaseComponent";

export class Tile extends BaseComponent {
    constructor() {
        super();
    }

    build() {
        this.ref = document.createElement("div");
        this.addStyles();
        return this.ref;
    }

    protected addStyles(): void {
        this.ref.style.aspectRatio = "1";
        this.ref.style.background = "rgba(255, 255, 255, 0.04)";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.08)";
        this.ref.style.borderRadius = "6px";
        this.ref.style.transition = "all 0.2s ease";
        this.ref.style.cursor = "pointer";

        this.ref.addEventListener("mouseenter", () => {
            this.ref.style.background = "rgba(110, 231, 183, 0.1)";
            this.ref.style.transform = "scale(1.05)";
        });

        this.ref.addEventListener("mouseleave", () => {
            this.ref.style.background = "rgba(255, 255, 255, 0.04)";
            this.ref.style.transform = "scale(1)";
        });
    }
}
