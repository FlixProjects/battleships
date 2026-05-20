import { ICellLoc, IHull } from "../../types";
import { GameObjectEntity } from "./GameObjectEntity";

export class HullEntity extends GameObjectEntity<HullEntity> implements IHull {
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
    imgSrc?: string | undefined; // TODO: amend to non-optional once ships config is updated
    front?: boolean | undefined;
    orientation: number;
    // extra
    isVisible: boolean;

    constructor(props: Readonly<IHull>) {
        super();
        Object.assign(this, props);
    }
}
