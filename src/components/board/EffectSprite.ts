import { TILE_GAP_PX, TILE_SIZE_PX } from "@shared/constants";
import { ICellLoc, IEffect } from "@shared/types";
import { BaseComponent } from "../BaseComponent";
import FlickerCssAnimStyle from "../../css-anim-styles/models/flicker-style";

interface Props {
    effect: IEffect;
}

export class EffectSprite extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    public build() {
        this.ref = document.createElement("img");
        const center = this.getCenter();
        if (!center) {
            // Returning an empty (unplaced) ref keeps the parent's appendChild
            // tolerant; the element is just invisible.
            this.ref.style.display = "none";
            return this.ref;
        }

        (this.ref as HTMLImageElement).src =
            `./assets/sprites/${this.props.effect.refNo.replace(/_persistent$/, "")}.png`;
        (this.ref as HTMLImageElement).alt = this.props.effect.refNo;
        this.applyPositioning(center);
        return this.ref;
    }

    private getCenter(): ICellLoc | undefined {
        return this.props.effect.location;
    }

    private applyPositioning(center: ICellLoc) {
        const [col, row] = center;
        const tileStride = TILE_SIZE_PX + TILE_GAP_PX;
        this.ref.style.position = "absolute";
        this.ref.style.left = `${col * tileStride}px`;
        this.ref.style.top = `${row * tileStride}px`;
        this.ref.style.width = `${TILE_SIZE_PX}px`;
        this.ref.style.height = `${TILE_SIZE_PX}px`;
        this.ref.style.objectFit = "contain";
        this.ref.style.pointerEvents = "none";
        this.ref.style.zIndex = "5";

        new FlickerCssAnimStyle().attachTo(this.ref);
    }
}
