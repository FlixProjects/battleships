import { TColor } from "../../../shared";
import { getColorFilter } from "../../utils/game-helper";
import { BaseComponent } from "../BaseComponent";

interface Props {
    hullId?: string;
    shipId: string;
    imgSrc?: string;
    invert?: boolean;
    color?: TColor;
    refNo?: string;
}
export class ShipIcon extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    public build() {
        this.ref = document.createElement("img");
        this.id = this.props.hullId;
        (this.ref as HTMLImageElement).id = this.props.hullId;
        (this.ref as HTMLImageElement).src =
            this.props.imgSrc || this.props.refNo
                ? `./assets/ships/${this.props.refNo}.png`
                : `./assets/ships/frigate0.png`;
        (this.ref as HTMLImageElement).alt = this.props.shipId;
        (this.ref as HTMLImageElement).style.objectFit = "contain";
        this.addStyles();

        return this.ref;
    }

    protected addStyles() {
        this.ref.style.maxWidth = "40px";
        this.ref.style.maxHeight = "100%";
        this.ref.style.cursor = "pointer";
        this.ref.style.transition = "all 0.2s ease";

        this.ref.style.filter = getColorFilter(this.props.color);

        if (this.props.invert) {
            this.ref.style.transform = "scaleY(-1)";
        }

        this.ref.addEventListener("mouseenter", () => {
            this.ref.style.transform = `scale(1.1, ${this.props.invert ? -1.1 : 1.1})`;
            this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.9)";
        });

        this.ref.addEventListener("mouseleave", () => {
            this.ref.style.transform = `scale(1, ${this.props.invert ? -1 : 1})`;
            this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
        });
    }
}
