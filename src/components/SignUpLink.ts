import { BaseComponent } from "./BaseComponent";

export class SignUpLink extends BaseComponent {
    public ref: HTMLAnchorElement;

    constructor(private onPress: () => void) {
        super();
        this.build();
    }

    build() {
        this.ref = document.createElement("a");
        this.ref.id = "signUpLink";
        this.ref.href = "#";
        this.ref.textContent = "Sign up";

        this.addStyles();
        this.addHoverListeners();

        this.ref.addEventListener("click", (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            this.onPress();
        });

        return this.ref;
    }

    protected addStyles() {
        const style = this.ref.style;
        style.flexShrink = "0";
        style.whiteSpace = "nowrap";
        style.fontSize = "13px";
        style.color = "var(--muted)";
        style.textDecoration = "none";
        style.cursor = "pointer";
        style.transition = "color var(--transition)";
    }

    private addHoverListeners() {
        this.ref.addEventListener("mouseenter", () => {
            this.ref.style.color = "var(--accent)";
            this.ref.style.textDecoration = "underline";
        });

        this.ref.addEventListener("mouseleave", () => {
            this.ref.style.color = "var(--muted)";
            this.ref.style.textDecoration = "none";
        });
    }
}
