import { IPlayer } from "../types";
import { PlayerEntity } from "./entities/PlayerEntity";

export class Player extends PlayerEntity {
    constructor(props: IPlayer) {
        super(props);
    }

    public getVisibilityFromShips() {
        const visibleTilesets = this.ships.map((ship) => ship.getVisibleTiles());

        const visibleTiles = new Set<string>();

        visibleTilesets.forEach((tileset) => {
            tileset.forEach((tile) => {
                visibleTiles.add(tile);
            });
        });

        return visibleTiles;
    }

    public updateVisibility(visibleTiles: Set<string>) {
        this.ships.forEach((ship) => {
            ship.updateVisibility(visibleTiles);
        });
        this.removeInvisibleShips();
        return this;
    }

    public removeInvisibleShips() {
        this.ships = this.ships.filter((ship) => ship.isVisible);
        return this;
    }
}
