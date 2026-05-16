import { BaseAnimStyle } from "./base-anim-style";
import { CSS_ANIMATION_NAMES } from "../enum";

export default class WobbleCssAnimStyle extends BaseAnimStyle {
    name: string = CSS_ANIMATION_NAMES.WOBBLE;
    textContent: string = `
        @keyframes effect-wobble {
            0% {
                transform: rotate(0deg) scale(1);
            }
            20% {
                transform: rotate(-6deg) scale(1.03);
            }
            40% {
                transform: rotate(6deg) scale(1.03);
            }
            60% {
                transform: rotate(-4deg) scale(1.02);
            }
            80% {
                transform: rotate(4deg) scale(1.01);
            }
            100% {
                transform: rotate(0deg) scale(1);
            }
        }
    `;
}
