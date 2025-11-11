import { BaseComponent } from "../BaseComponent";

interface Props {
    shipId: string;
}
export class ShipIcon extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    public build() {
        this.ref = document.createElement("div");
        this.addStyles();

        return this.ref;
    }

    protected addStyles() {
        this.ref.style.width = "0";
        this.ref.style.height = "0";
        this.ref.style.borderLeft = "20px solid transparent";
        this.ref.style.borderRight = "20px solid transparent";
        this.ref.style.borderBottom = "40px solid rgba(110, 231, 183, 0.6)";
        this.ref.style.margin = "20px auto";
        this.ref.style.cursor = "pointer";
        this.ref.style.transition = "all 0.2s ease";

        this.ref.addEventListener("mouseenter", () => {
            this.ref.style.transform = "scale(1.1)";
            this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.9)";
        });

        this.ref.addEventListener("mouseleave", () => {
            this.ref.style.transform = "scale(1)";
            this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
        });
    }
}
