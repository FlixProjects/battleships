import { HTMLButton } from "./native/Button";
import { applyButtonStyles } from "./styles/inline-styles";

export class LoginButton extends HTMLButton {
    constructor(private onPress: () => void) {
        super();
        this.build();
    }

    build() {
        this.ref = document.createElement("button");
        this.ref.id = "loginBtn";
        this.ref.textContent = "Log In";

        this.addStyles();
        this.addClickEventListener();

        return this.ref;
    }

    // Takes the remaining width of the action row; the sign-up link sits beside it.
    protected addStyles() {
        applyButtonStyles(this.ref);

        const style = this.ref.style;
        style.flex = "1";
        style.padding = "12px";
        style.border = "1px solid var(--glass-border)";
    }

    async onClick() {
        this.onPress();
    }
}
