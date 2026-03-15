import { IHull, IHullTemplate, IShip, locationToKey, PathHelper } from "../../shared";
import { Entity } from "./entities";
import { Hull } from "./Hull";

export class Ship extends Entity<Ship> implements IShip {
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
        super();
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

    updateHull(hull: Partial<IHull>) {
        if (!hull.id) return this;
        const index = this.hulls.findIndex((h) => h.id === hull.id);

        if (index === -1) return this;
        const oldHull = this.hulls[index];
        const updatedHull = new Hull({ ...oldHull, ...hull });
        this.hulls[index] = updatedHull;
        return this;
    }

    updateHulls(hulls: Partial<IHull>[]) {
        hulls.forEach((hull) => {
            this.updateHull(hull);
        });
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

    resolveDestroyed() {
        if (!this.hulls || this.hulls.length === 0 || !this.deployed || this.destroyed) return this;

        // non-zero no. of hulls
        if (this.hulls.every((h) => h.destroyed)) {
            this.destroyed = true;
        }
        return this;
    }

    resolveAttack() {
        this.remainingAttacks -= 1;
        return this;
    }
}
