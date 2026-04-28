import { v7 as uuidv7 } from "uuid";
import { ANIMATION_LAYER_ID } from "@shared/constants";
import { ICellLoc } from "@shared/types/types";
import { animationManager } from "../../models/AnimationManager";
import { ProjectileAnimation } from "../../models/animations/ProjectileAnimation";
import { getPxFromCellLocation, toDegrees } from "../../utils/game-helper";
import { ProjectileIcon } from "./ProjectileIcon";

interface Props {
    origin: ICellLoc;
    target: ICellLoc;
    parent?: HTMLElement;
}

export class Projectile {
    private iconRef: HTMLElement;
    constructor(public props: Props) {}

    public createAnimation() {
        const { origin, target } = this.props;

        if (!this.iconRef) {
            this.create();
        }

        return new ProjectileAnimation({
            fromCell: origin,
            toCell: target,
            duration: 500,
            removeAfterComplete: true,
            element: this.iconRef,
        });
    }

    public queueAnimation() {
        const moveAnimation = this.createAnimation();
        animationManager.enqueue(moveAnimation);
    }

    public async runAnimation() {
        this.queueAnimation();
        await animationManager.play();
    }

    public async fire() {
        this.create();
        await this.runAnimation();
    }

    public create() {
        const { parent } = this.props;
        this.createProjectileIcon();
        (parent ?? document.getElementById(ANIMATION_LAYER_ID))?.appendChild(this.iconRef);
        return this;
    }

    private createProjectileIcon() {
        const { top, left } = this.getLocation();
        const rotation = this.getRotation();

        this.iconRef = new ProjectileIcon({
            id: uuidv7(),
            top,
            left,
            rotation,
        }).build();
    }

    private getLocation() {
        const { origin } = this.props;
        return getPxFromCellLocation(origin || [0, 0]);
    }

    private getRotation() {
        const { origin, target } = this.props;
        const [startX, startY] = origin || [0, 0];
        const [endX, endY] = target ?? [0, 0];
        return toDegrees(Math.atan2(endY - startY, endX - startX)) - 90;
    }
}
