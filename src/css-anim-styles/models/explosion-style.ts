import { BaseAnimStyle } from "./base-anim-style";
import { CSS_ANIMATION_NAMES } from "../enum";

/** One-shot detonation burst: the sprite blooms from nothing to full size,
 *  holds, then fades — run with `forwards` so it ends invisible. */
export default class ExplosionCssAnimStyle extends BaseAnimStyle {
    name: string = CSS_ANIMATION_NAMES.EXPLOSION;
    textContent: string = `
        @keyframes ${CSS_ANIMATION_NAMES.EXPLOSION} {
            0% {
                transform: scale(0);
                opacity: 1;
            }

            70% {
                transform: scale(1);
                opacity: 1;
            }

            100% {
                transform: scale(1);
                opacity: 0;
            }
        }`;
}
