import { IconProps } from "../../types";
import { HTMLImage } from "../native/Image";

export class Icon extends HTMLImage {
    constructor(public props: IconProps) {
        super();
    }
    public build(): HTMLElement {
        this.ref = document.createElement("img");
        this.ref.id = this.props.id;
        this.addStyles();
        return this.ref;
    }

    protected addStyles() {
        this.ref.src = this.props.src;
        this.ref.style.width = "20px";
        this.ref.style.height = "20px";
        this.ref.style.filter = "brightness(0) invert(1)";

        if(this.props.addStyles){
            this.props.addStyles(this);
        }
    }
}
