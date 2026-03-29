import { Selectable } from "../Selectable";

interface Props {
    id: string;
}

export class Tile extends Selectable {
    public isSelectable = false;
    private isVisible = true;

    constructor(props: Props) {
        super(props.id);
    }

    public build() {
        this.ref = document.createElement("div");
        this.ref.id = this.id;
        this.ref.classList.add("tile");
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
        this.ref.style.height = "100%";
        this.ref.style.width = "100%";
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.justifyContent = "center";
        this.ref.style.padding = "4px";
        this.ref.style.position = "relative";
    }

    public setVisible(isVisible: boolean) {
        this.isVisible = isVisible;
        this.applyVisibility();
    }

    private applyVisibility() {
        if (this.isVisible) {
            this.ref.style.opacity = "1";
            if (!this.isSelectable) {
                this.setUnselectableStyle();
            }
        } else {
            this.setInvisibleStyle();
        }
    }

    private setInvisibleStyle() {
        this.ref.style.background = "rgba(0, 0, 0, 0.8)";
        this.ref.style.border = "1px solid rgba(0, 0, 0, 0.9)";
        this.ref.style.opacity = "0.3";
    }

    protected setSelectableStyle() {
        this.loadDefaultSelectableStyle();

        this.ref.addEventListener("mouseenter", this.mouseEnterStyle);
        this.ref.addEventListener("mouseleave", this.mouseLeaveStyle);
    }

    protected setUnselectableStyle() {
        this.ref.style.background = "rgba(255, 255, 255, 0.04)";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.08)";
        this.ref.style.animation = "";

        this.ref.removeEventListener("mouseenter", this.mouseEnterStyle);
        this.ref.removeEventListener("mouseleave", this.mouseLeaveStyle);
    }

    private loadDefaultSelectableStyle() {
        this.ref.style.background = "rgba(110, 231, 183, 0.2)";
        this.ref.style.border = "1px solid rgba(110, 231, 183, 0.5)";
        this.ref.style.animation = "pulse 1.5s ease-in-out infinite";
    }

    mouseEnterStyle = () => {
        this.ref.style.transform = "scale(1.05)";
    };

    mouseLeaveStyle = () => {
        this.ref.style.transform = "scale(1)";
    };
}
