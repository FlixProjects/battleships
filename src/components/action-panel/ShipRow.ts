import { BaseComponent } from "../BaseComponent";
import { ShipIcon } from "../ships/ShipIcon";

interface Props {
    shipId: string;
}
export class ShipRow extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    renderShipIcon() {
        const { shipId } = this.props;
        this.ref.appendChild(new ShipIcon({ shipId }).build());
    }

    build() {
        this.ref = document.createElement("div");
        this.addStyles();
        this.renderShipIcon();
        return this.ref;
    }

    protected addStyles() {
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.justifyContent = "space-between";
        this.ref.style.padding = "12px";
        this.ref.style.background = "rgba(255, 255, 255, 0.02)";
        this.ref.style.borderRadius = "8px";

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
