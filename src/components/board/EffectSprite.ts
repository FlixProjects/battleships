import { TILE_GAP_PX, TILE_SIZE_PX, Z_INDEX } from "@shared/constants";
import { ICellLoc, IEffect, isDamageEffect, isVisionEffect } from "@shared/types";
import { BaseComponent } from "../BaseComponent";
import FlickerCssAnimStyle from "../../css-anim-styles/models/flicker-style";
import PulseCssAnimStyle from "../../css-anim-styles/models/pulse-style";

interface Props {
    effect: IEffect;
}

export class EffectSprite extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    public build() {
        const { effect } = this.props;
        this.ref = document.createElement("img");
        const center = this.getCenter();
        if (!center) {
            // Returning an empty (unplaced) ref keeps the parent's appendChild
            // tolerant; the element is just invisible.
            this.ref.style.display = "none";
            return this.ref;
        }

        // FIXME: remove persistent patch
        (this.ref as HTMLImageElement).src = effect.imgSrc
            ? `./assets/sprites/${effect.imgSrc}`
            : this.props.effect.refNo.includes("_persistent")
              ? `./assets/sprites/${this.props.effect.refNo.replace(/_persistent$/, "")}.png`
              : `./assets/sprites/${this.props.effect.refNo}.png`;
        (this.ref as HTMLImageElement).alt = this.props.effect.refNo;
        this.applyPositioning(center);
        return this.ref;
    }

    private getCenter(): ICellLoc | undefined {
        const { effect } = this.props;
        if (isVisionEffect(effect)) return effect.location;
        if (isDamageEffect(effect)) return effect.location;
        return undefined;
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

        // Damage warnings (Airstrike) are terrain-like: they render beneath ships
        // and pulse. Vision markers keep their prior on-top flicker.
        if (isDamageEffect(this.props.effect)) {
            this.ref.style.zIndex = Z_INDEX.EFFECT_WARNING;
            new PulseCssAnimStyle().attachTo(this.ref);
            return;
        }

        this.ref.style.zIndex = "5";
        new FlickerCssAnimStyle().attachTo(this.ref);
    }
}
