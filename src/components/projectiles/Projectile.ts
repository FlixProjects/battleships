import { v7 as uuidv7 } from "uuid";
import { ICellLoc } from "../../../shared/types/types";
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

    create() {
        const { parent } = this.props;
        this.createProjectileIcon();
        (parent ?? document.querySelector("#gameBoardContainer")).appendChild(this.iconRef);
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
