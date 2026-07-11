import { CSS_ANIMATION_NAMES } from "../enum";
import { BaseAnimStyle } from "./base-anim-style";

/** One-shot entrance for the login card — rises and settles into place. */
export default class LoginInCssAnimStyle extends BaseAnimStyle {
    name: string = CSS_ANIMATION_NAMES.LOGIN_IN;
    textContent: string = `
        @keyframes ${CSS_ANIMATION_NAMES.LOGIN_IN} {
            from {
                opacity: 0;
                transform: translateY(16px) scale(0.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }`;

    attachTo(ref: HTMLElement) {
        ref.style.animation = `${this.name} 480ms cubic-bezier(0.2, 0.9, 0.3, 1) both`;
    }
}
