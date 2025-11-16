import { Board, ICellLoc, Player } from "../types/types";

export class LocationHelper {
    private occupiedCells: ICellLoc[] = [];
    constructor(players: Player[], board?: Board) {
        this.occupiedCells = this.getOccupiedCells(players);
    }

    public getOccupiedCells(players: Player[]) {
        const occuipiedLocations: ICellLoc[] = players.flatMap((p) =>
            p.ships.flatMap((s) => s.hullLocations?.map((h) => h.location) ?? []),
        );

        return occuipiedLocations;
    }

    public isLocationOccupied(loc: ICellLoc) {
        for (const occLoc of this.occupiedCells) {
            if (occLoc[0] === loc[0] && occLoc[1] === loc[1]) {
                return true;
            }
        }
        return false;
    }

    public hasSpaceForShip(newHullLocations: ICellLoc[]) {
        for (const loc of newHullLocations) {
            if (this.isLocationOccupied(loc)) {
                return false;
            }
        }
        return true;
    }
}
