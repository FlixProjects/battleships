import { IconProps } from "../../types";
import { Icon } from "../ships/Icon";

interface Props extends IconProps {
    top: number;
    left: number;
    rotation?: number;
}

export class ProjectileIcon extends Icon {
    top: number;
    left: number;
    rotation: number = 0;
    constructor(props: Partial<Props>) {
        super({
            src: "assets/sprites/bullet.png",
            ...props,
        });
        this.top = props.top || 0;
        this.left = props.left || 0;
        this.rotation = props.rotation || 0;
    }
    protected addStyles() {
        super.addStyles();
        this.ref.style.position = "absolute";
        this.ref.style.width = "32px";
        this.ref.style.height = "32px";
        this.ref.style.filter = "";
        this.ref.style.top = `${this.top - 16}px`;
        this.ref.style.left = `${this.left - 16}px`;
        this.ref.style.transform = `rotate(${this.rotation}deg)`;
        this.ref.style.zIndex = "100";
    }
}
