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
        this.hulls?.forEach((h) => {
            h.updateVisibility(visibleTiles);
        });

        this.isVisible = !!this.hulls?.some((h) => h.isVisible);

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

    getFrontHull() {
        if (!this.hulls || this.hulls.length === 0) {
            throw new Error("[Error] Trying to get front hull when there are no hulls!");
        }
        return this.hulls?.find((h) => h.front) ?? this.hulls?.[0];
    }

    getNewHullLocations(endCell: ICellLoc) {
        const newHulls = this.hulls?.map((h) => mergician({}, h)) as IHull[];
        const frontHull = this.getFrontHull();
        const oldFrontLocation = frontHull.location;

        // TODO: to inject movement behaviour calculator
        // TODO: barely serviceable implementation for 2-tile ships
        newHulls.forEach((h) => {
            if (h.front) {
                h.location = endCell;
                h.orientation = this.getOrientation(oldFrontLocation, endCell, h.orientation);
            } else {
                h.location = oldFrontLocation;
                h.orientation = this.getOrientation(h.location, oldFrontLocation, h.orientation);
            }
        });

        return newHulls;
    }

    getOrientation(prevLocation: ICellLoc, newLocation: ICellLoc, currentOrientation?: number) {
        const [prevX, prevY] = prevLocation;
        const [newX, newY] = newLocation;

        if (prevX === newX) {
            // pure vertical movement
            return prevY > newY ? 0 : 180; // up: 0, down: 180
        } else if (prevY === newY) {
            // pure horizontal movement
            return prevX > newX ? 270 : 90; // left: 270, right: 90
        } else {
            return currentOrientation;
        }
    }
}
