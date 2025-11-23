import { HTMLImage } from "../native/Image";

interface Props {
    src: string;
}

export class Icon extends HTMLImage {
    constructor(public props: Props) {
        super();
    }
    public build(): HTMLElement {
        this.ref = document.createElement("img");
        this.addStyles();
        return this.ref;
    }

    protected addStyles() {
        this.ref.src = this.props.src;
        this.ref.style.width = "20px";
        this.ref.style.height = "20px";
        this.ref.style.filter = "brightness(0) invert(1)";
    }
}
