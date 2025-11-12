import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";

export class Tile extends BaseComponent {
    private isSelectable = false;

    constructor() {
        super();
    }
    updateState(_state?: IAppState): void {
        if (this.isSelectable) {
            this.setSelectableStyle();
        } else {
            this.setUnselectableStyle();
        }
    }

    build() {
        this.ref = document.createElement("div");
        this.addStyles();
        return this.ref;
    }

    protected addStyles(): void {
        this.ref.style.aspectRatio = "1";
        this.ref.style.background = "rgba(255, 255, 255, 0.04)";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.08)";
        this.ref.style.borderRadius = "6px";
        this.ref.style.transition = "all 0.2s ease";
        this.ref.style.cursor = "pointer";
    }

    setSelectable(selectable: boolean) {
        this.isSelectable = selectable;
        this.updateState();
    }

    private setSelectableStyle() {
        this.ref.style.background = "rgba(110, 231, 183, 0.2)";
        this.ref.style.border = "1px solid rgba(110, 231, 183, 0.5)";
        this.ref.style.animation = "pulse 1.5s ease-in-out infinite";

        this.ref.addEventListener("mouseenter", this.mouseEnterStyle);
        this.ref.addEventListener("mouseleave", this.mouseLeaveStyle);
    }

    mouseEnterStyle = () => {
        this.ref.style.transform = "scale(1.05)";
    };

    mouseLeaveStyle = () => {
        this.ref.style.transform = "scale(1)";
    };

    private setUnselectableStyle() {
        this.ref.style.background = "rgba(255, 255, 255, 0.04)";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.08)";
        this.ref.style.animation = "";

        this.ref.removeEventListener("mouseenter", this.mouseEnterStyle);
        this.ref.removeEventListener("mouseleave", this.mouseLeaveStyle);
    }
}
