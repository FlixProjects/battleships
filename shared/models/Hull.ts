import { ICellLoc, IHull } from "../types";
import { locationToKey } from "../utils";

export class Hull implements IHull {
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
    owner?: string;
    // extra
    isVisible: boolean;

    constructor(props: Readonly<IHull>) {
        Object.assign(this, props);
    }

    update(hull: Partial<IHull>) {
        if (hull.id && hull.id !== this.id) return this;
        Object.assign(this, hull);
        return this;
    }

    updateVisibility(visibleTiles: Set<string>) {
        this.isVisible = visibleTiles.has(locationToKey(this.location));
        return this.isVisible;
    }
}
