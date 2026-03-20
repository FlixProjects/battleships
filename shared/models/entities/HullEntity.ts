import { ICellLoc, IHull } from "../../types";
import { Entity } from "./Entity";

export class HullEntity extends Entity<HullEntity> implements IHull {
    id: string;
    shipId: string; // ties the hull to the ship
    location: ICellLoc;
    destroyed: boolean;
    remainingHealth: number;
    remainingArmor: number;
    // template
    templateLocation: ICellLoc;
    maxHealth: number;
    armor: number;
    visionRange: number;
    // extra
    isVisible: boolean;

    constructor(props: Readonly<IHull>) {
        super();
        Object.assign(this, props);
    }
}
