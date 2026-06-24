import { Selectable } from "../Selectable";
import { COLOR, TColor, TILE_SIZE_PX } from "@shared/constants";
import { getColorFilter } from "../../utils/game-helper";

interface Props {
    hullId: string;
    shipId: string;
    playerId?: string;
    imgSrc: string;
    color?: TColor;
    rotation?: number;
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
        this.ref.style.maxWidth = `${TILE_SIZE_PX}px`;
        this.ref.style.maxHeight = "100%";
        this.ref.style.cursor = "pointer";
        this.ref.style.transition = "all 0.2s ease";
        this.ref.style.filter = getColorFilter(this.props.color ?? COLOR.PINK);

        this.ref.style.transform = `rotate(${this.props.rotation}deg)`;
    }
}
