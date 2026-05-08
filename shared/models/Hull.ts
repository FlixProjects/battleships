import { IHull } from "../types";
import { locationToKey } from "../utils";
import { HullEntity } from "./entities/HullEntity";

export class Hull extends HullEntity {
    constructor(props: Readonly<IHull>) {
        super(props);
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

    /** IHull is its own plain shape — no children to flatten. */
    public toPlain(): IHull {
        return { ...this };
    }

    public static toDomain(plain: IHull): Hull {
        return plain instanceof Hull ? plain : new Hull(plain);
    }
}
