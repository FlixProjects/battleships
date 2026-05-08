import { ICellLoc, IGameState, IHull, IPlainShip, IShip } from "@shared/types";
import { PathHelper } from "@shared/utils";
import { SegmentBuilder } from "@shared/utils/segment-builder";
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

    getNewHullLocations(endCell: ICellLoc, route?: ICellLoc[]) {
        const segmentBuilder = new SegmentBuilder();
        const startingOrientation = this.getFrontHull().orientation;
        const oldFrontLocation = this.getFrontHull().location;

        const { finalOrientation, backLocation } = this.computeRouteOutcome({
            segmentBuilder,
            startingOrientation,
            oldFrontLocation,
            endCell,
            route,
        });

        const newHulls = this.hulls?.map((h) => mergician({}, h)) as IHull[];

        // TODO: to inject movement behaviour calculator
        // TODO: barely serviceable implementation for 2-tile ships
        newHulls.forEach((h) => {
            h.location = h.front ? endCell : backLocation;
            h.orientation = finalOrientation;
        });

        return newHulls;
    }

    private computeRouteOutcome(args: {
        segmentBuilder: SegmentBuilder;
        startingOrientation: number;
        oldFrontLocation: ICellLoc;
        endCell: ICellLoc;
        route?: ICellLoc[];
    }): { finalOrientation: number; backLocation: ICellLoc } {
        const { segmentBuilder, startingOrientation, oldFrontLocation, endCell, route } = args;

        if (route && route.length >= 2) {
            let orientation = startingOrientation;
            for (let i = 1; i < route.length; i++) {
                orientation += segmentBuilder.rotationToFace(route[i - 1], route[i], orientation);
            }
            return { finalOrientation: orientation, backLocation: route[route.length - 2] };
        }

        const segments = segmentBuilder.buildSegments(oldFrontLocation, endCell, startingOrientation);
        const finalOrientation = segments.reduce(
            (sum, curr) => sum + curr.rotateDegrees,
            startingOrientation,
        );
        return { finalOrientation, backLocation: oldFrontLocation };
    }

    /** Flattens hulls (IHull[]) → string[] of hull IDs. */
    public toPlain(): IPlainShip {
        return {
            ...this,
            hulls: this.hulls?.map((h) => h.id) ?? [],
        };
    }

    /**
     * Rebuilds a Ship from its plain shape, joining hulls from `state.hulls`
     * by FK (`hull.shipId === plain.id`). Caller must hydrate hulls first.
     */
    public static toDomain(plain: IPlainShip | IShip, state: IGameState): Ship {
        if (plain instanceof Ship) return plain;
        const hulls: IHull[] = state.hulls?.filter((h) => h.shipId === plain.id) ?? [];
        return new Ship({ ...plain, hulls });
    }
}
