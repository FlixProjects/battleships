import { BaseAnimStyle } from "./base-anim-style";
import { CSS_ANIMATION_NAMES } from "../enum";

/** Continuous rotation — the refresh icon while a refresh is in flight. */
export default class SpinCssAnimStyle extends BaseAnimStyle {
    name: string = CSS_ANIMATION_NAMES.SPIN;
    textContent: string = `
        @keyframes ${CSS_ANIMATION_NAMES.SPIN} {
            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }`;

    attachTo(ref: HTMLElement) {
        ref.style.animation = `${this.name} 1.4s linear infinite`;
    }
}
