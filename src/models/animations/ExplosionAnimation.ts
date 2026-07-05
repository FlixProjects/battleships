import { TILE_GAP_PX, TILE_SIZE_PX, Z_INDEX } from "@shared/constants";
import { CSS_ANIMATION_NAMES } from "../../css-anim-styles/enum";
import { IExplosionAnimationProps } from "../../types/animations/types";
import { BaseAnimation } from "./Animation";

const EXPLOSION_SPRITE_SRC = "./assets/sprites/explosion.png";

/** One-shot detonation burst over a single tile. Creates its own sprite on the
 *  animation layer (there is no board element to copy — the effect is already
 *  gone from state by the time this plays) and removes it when done. */
export class ExplosionAnimation extends BaseAnimation {
    constructor(private props: IExplosionAnimationProps) {
        super({ duration: 600, ...props });
    }

    public async execute(): Promise<void> {
        const layer = this.animationLayer.layer;
        if (!layer) return;

        const sprite = this.createSprite();
        layer.appendChild(sprite);

        await this.animate(() => {
            sprite.style.animation = `${CSS_ANIMATION_NAMES.EXPLOSION} ${this.durationToSeconds()}s ease-out forwards`;
        });

        sprite.remove();
    }

    private createSprite(): HTMLImageElement {
        const [col, row] = this.props.location;
        const tileStride = TILE_SIZE_PX + TILE_GAP_PX;

        const sprite = document.createElement("img");
        sprite.src = EXPLOSION_SPRITE_SRC;
        sprite.alt = "explosion";
        sprite.style.position = "absolute";
        sprite.style.left = `${col * tileStride}px`;
        sprite.style.top = `${row * tileStride}px`;
        sprite.style.width = `${TILE_SIZE_PX}px`;
        sprite.style.height = `${TILE_SIZE_PX}px`;
        sprite.style.objectFit = "contain";
        sprite.style.pointerEvents = "none";
        sprite.style.zIndex = Z_INDEX.PROJECTILE;
        sprite.style.transformOrigin = "center center";
        // Invisible until the keyframes kick in — avoids a full-size flash.
        sprite.style.transform = "scale(0)";
        return sprite;
    }
}
