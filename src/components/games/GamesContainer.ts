import { BaseComponent } from "../BaseComponent";

export class GamesContainer extends BaseComponent {
    build() {
        this.removeChildren();
        this.ref = document.createElement("div");
        this.addStyles();

        return this.ref;
    }

    addStyles() {
        const style = this.ref.style;
        style.display = "flex";
        style.flexDirection = "column";
        style.gap = "8px";
    }
}