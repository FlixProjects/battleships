import { IPlayer, IPlayerAction, IShip } from "../../types";
import { Action } from "../actions/Action";
import { Ship } from "../Ship";
import { Entity } from "./Entity";

export class PlayerEntity extends Entity<PlayerEntity> implements IPlayer {
    id: string;
    name: string;
    order: number;
    ready: boolean;
    shipIds: string[];
    ships: Ship[];
    pendingActions: IPlayerAction[];
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

        this.ships =
            ships?.map((ship) => {
                if (ship instanceof Ship) {
                    return ship;
                }
                return new Ship(ship);
            }) ?? [];
    }

    public getShip(shipId: string) {
        const ship = this.ships.find((s) => s.id === shipId);
        if (!ship) {
            throw new Error(`Ship with id ${shipId} not found for player ${this.id}`);
        }
        return new Ship(ship);
    }

    public updateShip(ship: Partial<IShip>) {
        if (!ship.id) return this;
        const index = this.ships.findIndex((s) => s.id === ship.id);
        const oldShip = this.getShip(ship.id);
        const newShip = new Ship({ ...oldShip, ...ship });
        this.ships[index] = newShip;
        return this;
    }
}
