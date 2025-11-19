import { ICellLoc, Player } from "../types/types";

export class LocationHelper {
    private occupiedCells: ICellLoc[] = [];
    constructor(players: Player[]) {
        this.occupiedCells = this.getOccupiedCells(players);
    }

    public getAvailableCells(possibleCells: ICellLoc[]) {
        return possibleCells.filter((loc) => !this.isLocationOccupied(loc));
    }

    public hasSpaceForShip(newHullLocations: ICellLoc[]) {
        for (const loc of newHullLocations) {
            if (this.isLocationOccupied(loc)) {
                return false;
            }
        }
        return true;
    }

    public isLocationOccupied(loc: ICellLoc) {
        for (const occLoc of this.occupiedCells) {
            if (occLoc[0] === loc[0] && occLoc[1] === loc[1]) {
                return true;
            }
        }
        return false;
    }

    public getOccupiedCells(players: Player[]) {
        const occuipiedLocations: ICellLoc[] = players.flatMap((p) =>
            p.ships.flatMap((s) => s.hullLocations?.map((h) => h.location) ?? []),
        );

        return occuipiedLocations;
    }
}
