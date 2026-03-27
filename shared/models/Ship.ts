import { ICellLoc, IHull, IShip } from "@shared/types";
import { locationToKey, PathHelper } from "@shared/utils";
import { mergician } from "mergician";
import { ShipEntity } from "./entities/ShipEntity";

export class Ship extends ShipEntity {
    constructor(props: Readonly<IShip>) {
        super(props);
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

    getNewHullLocations(endCell: ICellLoc) {
        // TODO: implement proper rotation and multi-tile handling
        const newHulls = this.hulls.map((h) => mergician({}, h)) as IHull[];
        
        newHulls[0].location = endCell;

        return newHulls;
    }
}
