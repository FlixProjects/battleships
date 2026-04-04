import { Selectable } from "../Selectable";
import { COLOR, TColor } from "@shared/constants";
import { getColorFilter } from "../../utils/game-helper";

interface Props {
    hullId: string;
    shipId: string;
    playerId?: string;
    imgSrc: string;
    invert?: boolean;
    color?: TColor;
}

export class HullIcon extends Selectable {
    constructor(private props: Props) {
        super(props.hullId);
    }

    public build() {
        this.ref = document.createElement("img");
        this.id = this.props.hullId;

        this.ref.id = this.props.hullId;
        (this.ref as HTMLImageElement).src = this.props.imgSrc;
        (this.ref as HTMLImageElement).alt = this.props.shipId;
        this.ref.style.objectFit = "contain";

        this.addStyles();

        return this.ref;
    }

    protected addStyles() {
        this.ref.style.maxWidth = "40px";
        this.ref.style.maxHeight = "100%";
        this.ref.style.cursor = "pointer";
        this.ref.style.transition = "all 0.2s ease";

        this.ref.style.filter = getColorFilter(this.props.color ?? COLOR.PINK);

        if (this.props.invert) {
            this.ref.style.transform = "scaleY(-1)";
        }
    }
}
