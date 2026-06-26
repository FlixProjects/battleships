import { IPlayer, IPlayerAction, IShip, TFaction } from "../../types";
import { Action } from "../actions/Action";
import { Listener } from "../listeners/Listener";
import { IListener } from "../listeners/types";
import { Ship } from "../Ship";
import { PlayerGainCommandPointsSignalHandler } from "../signal-handlers/PlayerGainCommandPointsSignalHandler";
import { PlayerRemoveCardFromHandSignalHandler } from "../signal-handlers/PlayerRemoveCardFromHandSignalHandler";
import { PlayerSpendCommandPointsSignalHandler } from "../signal-handlers/PlayerSpendCommandPointsSignalHandler";
import { SignalType } from "../signals/types";
import { GameObjectEntity } from "./GameObjectEntity";

export class PlayerEntity extends GameObjectEntity<PlayerEntity> implements IPlayer {
    id: string;
    name: string;
    order: number;
    ready: boolean;
    shipIds: string[];
    ships: Ship[];
    pendingActions: IPlayerAction[];
    maxCommandPoints: number;
    commandPoints: number;
    faction: TFaction;
    hand: string[];
    deck: string;

    constructor(props: IPlayer) {
        super();
        const { id, name, order, ready, ships, maxCommandPoints, commandPoints, pendingActions, faction, hand, deck } =
            props;
        this.id = id;
        this.name = name;
        this.order = order;
        this.ready = ready;
        this.commandPoints = commandPoints;
        this.maxCommandPoints = maxCommandPoints;
        this.faction = faction;
        this.hand = hand ?? [];
        this.deck = deck;
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

    protected getDefaultListeners(): IListener[] {
        return [
            this.createPlayerSpendCommandPointsListener(),
            this.createPlayerGainCommandPointsListener(),
            this.createPlayerRemoveCardFromHandListener(),
        ];
    }

    protected createPlayerSpendCommandPointsListener() {
        return new Listener(
            [SignalType.PlayerSpendCommandPoints],
            (ctx) => {
                new PlayerSpendCommandPointsSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    protected createPlayerGainCommandPointsListener() {
        return new Listener(
            [SignalType.PlayerGainCommandPoints],
            (ctx) => {
                new PlayerGainCommandPointsSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    protected createPlayerRemoveCardFromHandListener() {
        return new Listener(
            [SignalType.PlayerRemoveCardFromHand],
            (ctx) => {
                new PlayerRemoveCardFromHandSignalHandler().handle(ctx);
            },
            this.defaultHandlerShouldHandleSignal,
        );
    }

    public spendCommandPoints(amount: number) {
        this.commandPoints -= amount;
        return this;
    }

    public gainCommandPoints(amount: number) {
        this.commandPoints += amount;
        return this;
    }

    public removeCardFromHand(cardId: string) {
        this.hand = this.hand.filter((id) => id !== cardId);
        return this;
    }

    public addPendingAction(action: IPlayerAction) {
        const isExistingPendingAction = this.pendingActions.some((a) => a.id === action.id);
        if (!isExistingPendingAction) {
            this.pendingActions = [...this.pendingActions, action];
        }
        return this;
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
