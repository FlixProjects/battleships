import { COLOR, TColor } from "@shared/constants";
import { getColorFilter } from "../../utils/game-helper";
import { BaseComponent } from "../BaseComponent";

interface Props {
    cardId: string;
    refNo: string;
    imgSrc?: string;
    color?: TColor;
}

/**
 * Renders the visual for a SupportCard in the player's hand. Mirrors
 * `ShipIcon` (scoped to ./assets/support/<refNo>.png).
 */
export class SupportIcon extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    public build() {
        this.ref = document.createElement("img");
        this.id = this.props.cardId;
        (this.ref as HTMLImageElement).id = this.props.cardId;
        (this.ref as HTMLImageElement).src =
            `./assets/support/${this.props.imgSrc}` || `./assets/support/${this.props.refNo}.png`;
        (this.ref as HTMLImageElement).alt = this.props.refNo;
        (this.ref as HTMLImageElement).style.objectFit = "contain";
        this.addStyles();
        return this.ref;
    }

    protected addStyles() {
        this.ref.style.maxWidth = "40px";
        this.ref.style.width = "40px";
        this.ref.style.maxHeight = "100%";
        this.ref.style.cursor = "pointer";
        this.ref.style.transition = "all 0.2s ease";
        this.ref.style.filter = getColorFilter(this.props.color ?? COLOR.PINK);
    }
}
