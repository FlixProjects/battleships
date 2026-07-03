import { BaseAnimStyle } from "./base-anim-style";
import { CSS_ANIMATION_NAMES } from "../enum";

/** Steady breathing pulse — used by the Airstrike warning marker so it reads as
 *  a live, incoming threat rather than static terrain. */
export default class PulseCssAnimStyle extends BaseAnimStyle {
    name: string = CSS_ANIMATION_NAMES.PULSE;
    textContent: string = `
        @keyframes ${CSS_ANIMATION_NAMES.PULSE} {
            0% {
                transform: scale(0.9);
                opacity: 0.65;
            }

            50% {
                transform: scale(1.05);
                opacity: 1;
            }

            100% {
                transform: scale(0.9);
                opacity: 0.65;
            }
        }`;
}
