import {
    COLOR_FILTER,
    EffectAnimation,
    IEffectRenderSpec,
    TEffectAnimation,
    TILE_GAP_PX,
    TILE_SIZE_PX,
} from "@shared/constants";
import { ICellLoc, isDamageEffect, isVisionEffect } from "@shared/types";
import type { Effect } from "@shared/models/effects";
import { BaseComponent } from "../BaseComponent";
import { BaseAnimStyle } from "../../css-anim-styles/models/base-anim-style";
import FlickerCssAnimStyle from "../../css-anim-styles/models/flicker-style";
import FrameCycleAnimStyle from "../../css-anim-styles/models/frame-cycle-style";
import PulseCssAnimStyle from "../../css-anim-styles/models/pulse-style";

interface Props {
    effect: Effect;
}

/** Maps an Effect's semantic animation token → the concrete CSS anim style. */
const ANIMATION_STYLES: Record<TEffectAnimation, () => BaseAnimStyle> = {
    [EffectAnimation.PULSE]: () => new PulseCssAnimStyle(),
    [EffectAnimation.FLICKER]: () => new FlickerCssAnimStyle(),
};

export class EffectSprite extends BaseComponent {
    constructor(private props: Props) {
        super();
    }

    public build() {
        const { effect } = this.props;
        const spec = effect.getRenderSpec();
        const frames = spec.frames ?? [];

        // Frame-cycled sprites are a div animating background-image (an <img>'s
        // src can't be driven by CSS keyframes); static sprites stay an <img>.
        this.ref = document.createElement(frames.length > 0 ? "div" : "img");
        const center = this.getCenter();
        if (!center) {
            // Returning an empty (unplaced) ref keeps the parent's appendChild
            // tolerant; the element is just invisible.
            this.ref.style.display = "none";
            return this.ref;
        }

        if (frames.length > 0) {
            this.applyFrameBackground(frames);
        } else {
            (this.ref as HTMLImageElement).src = this.getSpriteUrl();
            (this.ref as HTMLImageElement).alt = effect.refNo;
        }
        this.applyPositioning(center, spec);
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

    private applyFrameBackground(frames: string[]) {
        // Static first frame under the animation, so a stalled animation (e.g.
        // prefers-reduced-motion) still shows the sprite.
        this.ref.style.backgroundImage = `url("./assets/sprites/${frames[0]}")`;
        this.ref.style.backgroundSize = "contain";
        this.ref.style.backgroundPosition = "center";
        this.ref.style.backgroundRepeat = "no-repeat";
    }

    private applyPositioning(center: ICellLoc, spec: IEffectRenderSpec) {
        const [col, row] = center;
        const tileStride = TILE_SIZE_PX + TILE_GAP_PX;
        this.ref.style.position = "absolute";
        this.ref.style.left = `${col * tileStride}px`;
        this.ref.style.top = `${row * tileStride}px`;
        this.ref.style.width = `${TILE_SIZE_PX}px`;
        this.ref.style.height = `${TILE_SIZE_PX}px`;
        this.ref.style.objectFit = "contain";
        this.ref.style.pointerEvents = "none";

        // The Effect declares its own look (layer / tint / animation / frames);
        // the sprite just applies it — no per-effect branching here.
        this.ref.style.zIndex = spec.zIndex;
        if (spec.tint) {
            this.ref.style.filter = COLOR_FILTER[spec.tint];
        }
        ANIMATION_STYLES[spec.animation]().attachTo(this.ref);
        if (spec.frames?.length) {
            const urls = spec.frames.map((frame) => `./assets/sprites/${frame}`);
            // After the base style — attachTo appends to ref.style.animation.
            new FrameCycleAnimStyle(`frame-cycle-${this.props.effect.refNo}`, urls).attachTo(this.ref);
        }
    }
}
