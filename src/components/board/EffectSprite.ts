import { COLOR, COLOR_FILTER, TILE_GAP_PX, TILE_SIZE_PX, Z_INDEX } from "@shared/constants";
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

        const spriteUrl = this.getSpriteUrl();
        (this.ref as HTMLImageElement).src = spriteUrl;
        (this.ref as HTMLImageElement).alt = effect.refNo;
        this.applyPositioning(center);
        return this.ref;
    }

    private getSpriteUrl(): string {
        const { effect } = this.props;
        // FIXME: remove persistent patch
        if (effect.imgSrc) return `./assets/sprites/${effect.imgSrc}`;
        if (effect.refNo.includes("_persistent")) {
            return `./assets/sprites/${effect.refNo.replace(/_persistent$/, "")}.png`;
        }
        return `./assets/sprites/${effect.refNo}.png`;
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

        if (isDamageEffect(this.props.effect)) {
            this.ref.style.zIndex = Z_INDEX.EFFECT_WARNING;
            this.ref.style.filter = COLOR_FILTER[COLOR.RED];
            new PulseCssAnimStyle().attachTo(this.ref);
            return;
        }

        this.ref.style.zIndex = "5";
        new FlickerCssAnimStyle().attachTo(this.ref);
    }
}
