import { v7 as uuidv7 } from "uuid";
import { ICellLoc } from "../../../shared/types/types";
import { animationManager } from "../../models/AnimationManager";
import { ProjectileAnimation } from "../../models/animations/ProjectileAnimation";
import { getPxFromCellLocation, toDegrees } from "../../utils/game-helper";
import { ProjectileIcon } from "./ProjectileIcon";

interface Props {
    origin: ICellLoc;
    target?: ICellLoc;
    parent?: HTMLElement;
}

export class Projectile {
    iconRef: HTMLElement;
    constructor(public props: Props) {}

    createProjectileIcon() {
        const { top, left } = this.getLocation();
        const rotation = this.getRotation();

        this.iconRef = new ProjectileIcon({
            id: uuidv7(),
            top,
            left,
            rotation,
        }).build();
    }

    async runAnimation() {
        const { origin, target } = this.props;

        const moveAnimation = new ProjectileAnimation({
            id: this.iconRef.id,
            fromCell: origin,
            toCell: target,
            duration: 500,
            removeAfterComplete: true,
        });

        animationManager.enqueue(moveAnimation);
        await animationManager.play();
    }

    create() {
        const { parent } = this.props;
        this.createProjectileIcon();
        (parent ?? document.querySelector("#gameBoardContainer")).appendChild(this.iconRef);
    }

    async fire() {
        this.create();
        await this.runAnimation();
    }

    getLocation() {
        const { origin } = this.props;
        return getPxFromCellLocation(origin || [0, 0]);
    }

    getRotation() {
        const { origin, target } = this.props;
        const [startX, startY] = origin || [0, 0];
        const [endX, endY] = target ?? [0, 0];
        return toDegrees(Math.atan2(endY - startY, endX - startX)) - 90;
    }
}
