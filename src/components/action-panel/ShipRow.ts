import { gameEngine } from "../..";
import { BaseComponent } from "../BaseComponent";
import { getComponents } from "../component-helper";
import { ShipIcon } from "../ships/ShipIcon";

interface Props {
    shipId: string;
    selected: boolean;
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
        this.addClickEventListener();
        this.renderShipIcon();
        return this.ref;
    }

    async onClick(): Promise<void> {
        const { shipId } = this.props;
        const validCells = gameEngine.prime().deployShip(shipId);
        this.ref.style.animation = "pulse 1.5s ease-in-out infinite";
        getComponents().div.gameBoard.updateSelectableTiles(validCells);
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
        // TODO: Deselect logic
    }
}
