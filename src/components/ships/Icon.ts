import { HTMLImage } from "../native/Image";

interface Props {
    id?: string;
    src: string;
    addStyles?: (ref: HTMLImage) => void;
}

export class Icon extends HTMLImage {
    constructor(public props: Props) {
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
