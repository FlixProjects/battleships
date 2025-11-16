import { gameEngine } from "../..";
import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";
import { getComponents } from "../component-helper";
import { ShipIcon } from "../ships/ShipIcon";

interface Props {
    shipId: string;
    selected: boolean;
    onSelect?: (id: string) => void;
}
export class ShipRow extends BaseComponent {
    constructor(public props: Props) {
        super();
    }

    updateState(_state?: IAppState): void {
        this.remove();
        this.build();
    }

    setSelected(selected: boolean) {
        this.props.selected = selected;
        this.updateStyles();
    }

    renderShipIcon() {
        const { shipId } = this.props;
        const shipIcon = new ShipIcon({ shipId });
        this.addChild(shipIcon);
        this.ref.appendChild(shipIcon.build());
    }

    build() {
        this.ref = document.createElement("div");
        this.ref.classList.add("ship-row");
        this.addStyles();
        this.addClickEventListener();
        this.renderShipIcon();
        return this.ref;
    }

    async onClick(): Promise<void> {
        const { shipId, onSelect } = this.props;
        onSelect?.(shipId);
    }

    protected addStyles() {
        this.ref.style.animation = "";
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.justifyContent = "space-between";
        this.ref.style.padding = "12px";
        this.ref.style.borderRadius = "8px";
        this.ref.style.cursor = "pointer";

        this.updateStyles();

        this.ref.addEventListener("mouseenter", () => {
            this.ref.style.transform = "scale(1.1)";
            this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.9)";
        });

        this.ref.addEventListener("mouseleave", () => {
            this.ref.style.transform = "scale(1)";
            this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
        });
    }

    private updateStyles() {
        if (this.props.selected) {
            this.ref.style.background = "rgba(110, 231, 183, 0.15)";
            this.ref.style.animation = "pulse 1.5s ease-in-out infinite";
        } else {
            this.ref.style.background = "rgba(255, 255, 255, 0.02)";
            this.ref.style.animation = "";
        }
    }
}
