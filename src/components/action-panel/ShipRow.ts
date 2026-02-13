import { gameManager } from "../..";
import { COLOR, IAppState } from "../../../shared";
import { Selectable } from "../Selectable";
import { ShipIcon } from "../ships/ShipIcon";

interface Props {
    shipId: string;
    refNo: string;
    selected: boolean;
    onSelect?: (id: string) => void;
    isSelectable?: boolean;
}
export class ShipRow extends Selectable {
    constructor(public props: Props) {
        const { shipId } = props;
        super(shipId);
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
        const { shipId, refNo } = this.props;

        const shipIcon = new ShipIcon({
            refNo,
            shipId,
            color: gameManager.isFirstPlayer ? COLOR.TEAL : COLOR.ORANGE,
        });

        this.addChild(shipIcon);
        this.ref.appendChild(shipIcon.build());
    }

    build() {
        this.ref = document.createElement("div");
        this.ref.classList.add("ship-row");

        this.addStyles();

        if (this.props.isSelectable) {
            this.setAsSelectable();
        } else {
            this.setAsUnselectable();
        }

        this.renderShipIcon();
        return this.ref;
    }

    public setAsUnselectable(): void {
        // TODO: Extract to a ActionRow base class
        this.removeClickEventListener();
        this.ref.removeEventListener("mouseenter", this.mouseEnter);
        this.ref.removeEventListener("mouseleave", this.mouseLeave);
    }

    public setAsSelectable(): void {
        this.addClickEventListener();
        this.ref.addEventListener("mouseenter", this.mouseEnter);
        this.ref.addEventListener("mouseleave", this.mouseLeave);
    }

    private mouseEnter = () => {
        this.ref.style.transform = "scale(1.1)";
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.9)";
    };

    private mouseLeave = () => {
        this.ref.style.transform = "scale(1)";
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
    };

    public async onClick(): Promise<void> {
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
