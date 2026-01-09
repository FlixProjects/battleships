import { IMoveAnimationProps } from "../../types";
import { MoveAnimation } from "./MoveAnimation";

export class ProjectileAnimation extends MoveAnimation {
    constructor(protected props: IMoveAnimationProps) {
        super(props);
    }
}
