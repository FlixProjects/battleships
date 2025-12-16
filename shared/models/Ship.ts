import { IHull, IHullTemplate, IShip, locationToKey, PathHelper } from "../../shared";
import { Hull } from "./Hull";

export class Ship implements IShip {
    id: string;
    playerId: string;
    refNo: string;
    name: string;
    hullLocations?: Hull[];
    dimensions: [number, number];
    deployed: boolean;
    commandPointCost: number;
    movementRange: number;
    remainingMovement: number;
    movementCommandPointCost: number;
    attackCountMax: number;
    attackRange: number;
    attackCommandPointCost: number;
    attackDamage: number;
    remainingAttacks: number;
    attackMinRange: number;
    destroyed: boolean;
    hullTemplates: IHullTemplate[];
    isFlagship: boolean;
    isVisible: boolean;

    constructor(props: Readonly<IShip>) {
        Object.assign(this, props);
        if (this.hullLocations) {
            this.hullLocations = this.hullLocations.map((hull) => {
                if (hull instanceof Hull) {
                    return hull;
                }
                return new Hull(hull);
            });
        }
    }

    update(ship: Partial<IShip>) {
        if (ship.id && ship.id !== this.id) return this;
        Object.assign(this, ship);
        return this;
    }

    getVisibleTiles() {
        const ph = new PathHelper();
        return ph.getVisibleTilesForPlayer(this.hullLocations);
    }

    updateVisibility(visibleTiles: Set<string>) {
        this.isVisible = !!this.hullLocations?.some((h) => {
            h.updateVisibility(visibleTiles);
            return visibleTiles.has(locationToKey(h.location));
        });
        this.removeInvisibleHullLocations();
        return this;
    }

    removeInvisibleHullLocations() {
        this.hullLocations = this.hullLocations?.filter((h) => h.isVisible);
        return this;
    }

    addHullLocations(hulls: IHull[]) {
        if (!this.hullLocations) {
            this.hullLocations = [];
        }
        hulls.forEach((h) => this.addHullLocation(h));
        return this;
    }

    addHullLocation(hull: IHull) {
        if (!(hull instanceof Hull)) {
            this.hullLocations.push(new Hull(hull));
            return this;
        }
        this.hullLocations.push(hull);
        return this;
    }

    updateHullLocations(newHullLocations: Partial<IHull>[]) {
        newHullLocations.forEach((newHull) => {
            if (!newHull.id) return;
            const index = this.hullLocations.findIndex((h) => h.id === newHull.id);
            const oldHull = this.hullLocations[index];
            const updatedHull = new Hull({ ...oldHull, ...newHull });
            this.hullLocations[index] = updatedHull;
        });
        return this;
    }
}
