import { IProjectileAnimationProps } from "../../types";
import { MoveAnimation } from "./MoveAnimation";

export class ProjectileAnimation extends MoveAnimation {
    constructor(props: IProjectileAnimationProps) {
        super(props);
        this.elements = [props.element];
    }
}
