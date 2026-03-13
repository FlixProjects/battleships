import { ICellLoc, IHull } from "../types";
import { locationToKey } from "../utils";
import { Entity } from "./Entity";

export class Hull extends Entity<Hull> implements IHull {
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

    updateVisibility(visibleTiles: Set<string>) {
        this.isVisible = visibleTiles.has(locationToKey(this.location));
        return this.isVisible;
    }

    getDamaged(incomingDamage: number) {
        this.remainingHealth -= incomingDamage;
        if (this.remainingHealth <= 0) {
            this.destroyed = true;
            this.remainingHealth = 0;
        }
    }
}
