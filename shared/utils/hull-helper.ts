import { ICellLoc, IGameStateManager } from "@shared/types";
import { getOccupiedLocations } from "./helpers";
import { BOARD_COLUMNS, BOARD_ROWS } from "../constants";

export const computeDeployedHullLocation = (
    selectedLoc: ICellLoc,
    hullTemplateLoc: ICellLoc,
    isFirstPlayer: boolean,
): ICellLoc => {
    const offset = isFirstPlayer ? hullTemplateLoc : [hullTemplateLoc[0], -hullTemplateLoc[1]];
    return [offset[0] + selectedLoc[0], offset[1] + selectedLoc[1]];
};

export class HullCalculator {
    constructor(
        private gsm: IGameStateManager,
        private isFirstPlayer: boolean,
    ) {}

    public getDeployedHullLocation(selectedLoc: ICellLoc, _hullTemplateLoc: ICellLoc): ICellLoc {
        return computeDeployedHullLocation(selectedLoc, _hullTemplateLoc, this.isFirstPlayer);
    }

    public getDeployedHullLocations(selectedLoc: ICellLoc, _hullTemplateLocs: ICellLoc[]): ICellLoc[] {
        return _hullTemplateLocs.map((htl) => this.getDeployedHullLocation(selectedLoc, htl));
    }

    public getValidDeploymentLocations(selectableLocations: ICellLoc[], hullTemplateLocs: ICellLoc[]): ICellLoc[] {
        const occupiedLocations = getOccupiedLocations(this.gsm.gameState);
        const occupiedLocationsSet = new Set(occupiedLocations.map((loc) => loc.join(",")));

        return selectableLocations.filter((selectedLoc: ICellLoc) => {
            const deployedHullLocations = this.getDeployedHullLocations(selectedLoc, hullTemplateLocs);

            if (!deployedHullLocations.every((loc) => this.isWithinBoardLimits(loc))) {
                return false;
            }
            const isLocationOccupied = deployedHullLocations.some((loc) => occupiedLocationsSet.has(loc.join(",")));

            return !isLocationOccupied;
        });
    }

    private isWithinBoardLimits(loc: ICellLoc): boolean {
        const [x, y] = loc;
        return x >= 0 && x < BOARD_COLUMNS && y >= 0 && y < BOARD_ROWS;
    }
}
