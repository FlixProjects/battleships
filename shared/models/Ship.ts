import { IHull, IHullTemplate, IShip, locationToKey, PathHelper } from "../../shared";
import { Hull } from "./Hull";

export class Ship implements IShip {
    id: string;
    playerId: string;
    refNo: string;
    name: string;
    hullIds?: string[];
    hulls?: Hull[];
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
        if (this.hulls) {
            this.hulls = props.hulls.map((hull) => {
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
        if (this.destroyed || !this.deployed || !this.hulls) {
            return new Set<string>();
        }
        const ph = new PathHelper();
        return ph.getVisibleTilesForPlayer(this.hulls);
    }

    updateVisibility(visibleTiles: Set<string>) {
        this.isVisible = !!this.hulls?.some((h) => {
            h.updateVisibility(visibleTiles);
            return visibleTiles.has(locationToKey(h.location));
        });
        this.removeInvisibleHullLocations();
        return this;
    }

    removeInvisibleHullLocations() {
        this.hulls = this.hulls?.filter((h) => h.isVisible);
        return this;
    }

    addHullLocations(hulls: IHull[]) {
        if (!this.hulls) {
            this.hulls = [];
        }
        hulls.forEach((h) => this.addHullLocation(h));
        return this;
    }

    addHullLocation(hull: IHull) {
        if (!(hull instanceof Hull)) {
            this.hulls.push(new Hull(hull));
            return this;
        }
        this.hulls.push(hull);
        return this;
    }

    updateHullLocations(newHullLocations: Partial<IHull>[]) {
        newHullLocations.forEach((newHull) => {
            if (!newHull.id) return;
            const index = this.hulls.findIndex((h) => h.id === newHull.id);
            const oldHull = this.hulls[index];
            const updatedHull = new Hull({ ...oldHull, ...newHull });
            this.hulls[index] = updatedHull;
        });
        return this;
    }
}
