import { IPlayer, IPlayerAction } from "../types";
import { Ship } from ".";

export class Player implements IPlayer {
    id: string;
    name: string;
    ready: boolean;
    ships: Ship[];
    pendingActions?: IPlayerAction[];
    maxCommandPoints: number;
    commandPoints: number;

    constructor(props: IPlayer) {
        const { id, name, ready, ships, maxCommandPoints, commandPoints, pendingActions } = props;
        this.id = id;
        this.name = name;
        this.ready = ready;
        this.commandPoints = commandPoints;
        this.maxCommandPoints = maxCommandPoints;
        this.pendingActions = pendingActions ?? [];

        this.ships = ships.map((ship) => {
            if (ship instanceof Ship) {
                return ship;
            }
            return new Ship(ship);
        });
    }

    public getShip(shipId: string) {
        return this.ships.find((ship) => ship.id === shipId);
    }
}
