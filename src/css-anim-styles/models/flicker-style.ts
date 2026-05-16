import { BaseAnimStyle } from "./base-anim-style";
import { CSS_ANIMATION_NAMES } from "../enum";

export default class FlickerCssAnimStyle extends BaseAnimStyle {
    name: string = CSS_ANIMATION_NAMES.FLICKER;
    textContent: string = `
        @keyframes ${CSS_ANIMATION_NAMES.FLICKER} {
            0% {
                transform: translateY(0px) scaleY(1);
                opacity: 0.9;
                filter: brightness(1);
            }

            25% {
                transform: translateY(-3px) scaleY(1.08);
                opacity: 1;
                filter: brightness(1.15);
            }

            50% {
                transform: translateY(-6px) scaleY(1.15);
                opacity: 0.75;
                filter: brightness(1.35);
            }

            75% {
                transform: translateY(-3px) scaleY(1.05);
                opacity: 1;
                filter: brightness(1.1);
            }

            100% {
                transform: translateY(0px) scaleY(1);
                opacity: 0.9;
                filter: brightness(1);
            }
        }`;
}
