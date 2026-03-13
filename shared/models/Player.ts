import { Action, Ship } from ".";
import { IPlayer, IPlayerAction, IShip } from "../types";
import { Entity } from "./Entity";

export class Player extends Entity<Player> implements IPlayer {
    id: string;
    name: string;
    order: number;
    ready: boolean;
    shipIds: string[];
    ships?: Ship[];
    pendingActions?: IPlayerAction[];
    maxCommandPoints: number;
    commandPoints: number;

    constructor(props: IPlayer) {
        super();
        const { id, name, order, ready, ships, maxCommandPoints, commandPoints, pendingActions } = props;
        this.id = id;
        this.name = name;
        this.order = order;
        this.ready = ready;
        this.commandPoints = commandPoints;
        this.maxCommandPoints = maxCommandPoints;
        this.pendingActions =
            pendingActions?.map((action) => {
                if (action instanceof Action) {
                    return action;
                }
                return new Action(action);
            }) ?? [];

        this.ships = ships?.map((ship) => {
                if (ship instanceof Ship) {
                    return ship;
                }
                return new Ship(ship);
            }) ?? [];
    }

    public getShip(shipId: string) {
        return new Ship(this.ships.find((ship) => ship.id === shipId));
    }

    public updateShip(ship: Partial<IShip>) {
        if (!ship.id) return this;
        const index = this.ships.findIndex((s) => s.id === ship.id);
        const oldShip = this.getShip(ship.id);
        const newShip = new Ship({ ...oldShip, ...ship });
        this.ships[index] = newShip;
        return this;
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
