import { BaseComponent } from "../BaseComponent";

interface Props {
    shipId: string;
    imgSrc?: string;
}
export class ShipIcon extends BaseComponent {
    constructor(private props: Props) {
        super();
        props.imgSrc = props.imgSrc || `./assets/ships/frigate0.png`;
    }

    public build() {
        this.ref = document.createElement("img");
        (this.ref as HTMLImageElement).src = this.props.imgSrc;
        (this.ref as HTMLImageElement).alt = this.props.shipId;
        (this.ref as HTMLImageElement).style.objectFit = "contain";
        this.addStyles();

        return this.ref;
    }

    protected addStyles() {
        this.ref.style.maxWidth = "40px";
        this.ref.style.maxHeight = "100%";
        this.ref.style.cursor = "pointer";
        this.ref.style.transition = "all 0.2s ease";

        this.ref.addEventListener("mouseenter", () => {
            this.ref.style.transform = "scale(1.1)";
            this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.9)";
        });

        this.ref.addEventListener("mouseleave", () => {
            this.ref.style.transform = "scale(1)";
            this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
        });
    }
}
