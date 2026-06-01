import type { Board } from "../../types";
import type { Action } from "../actions";
import type { Card } from "../Card";
import type { Deck } from "../Deck";
import type { Effect } from "../effects/Effect";
import type { GameState } from "../GameState";
import type { Hull } from "../Hull";
import { Listener } from "../listeners/Listener";
import { IListener } from "../listeners/types";
import type { Player } from "../Player";
import type { Ship } from "../Ship";
import { GameStateCreateEffectSignalHandler } from "../signal-handlers/GameStateCreateEffectSignalHandler";
import { GameStateCreateHullSignalHandler } from "../signal-handlers/GameStateCreateHullSignalHandler";
import { SignalType } from "../signals/types";
import { GameObjectEntity } from "./GameObjectEntity";

export class GameStateEntity extends GameObjectEntity<GameState> {
    code: string;
    currentRound: number;
    initiative?: string;
    players: Player[];
    ships: Ship[];
    hulls: Hull[];
    cards: Card[];
    decks: Deck[];
    effects: Effect[];
    board?: Board;
    winners: string[];
    isOver: boolean;
    actions: Action[] = [];

    protected getDefaultListeners(): IListener[] {
        return [this.createGameStateCreateHullListener(), this.createGameStateCreateEffectListener()];
    }

    // Lifecycle signals address "the world", not a specific entity id, so the
    // single GameState handles them all (default predicate is always-true).
    protected createGameStateCreateHullListener() {
        return new Listener([SignalType.GameStateCreateHull], (ctx) => {
            new GameStateCreateHullSignalHandler().handle(ctx);
        });
    }

    protected createGameStateCreateEffectListener() {
        return new Listener([SignalType.GameStateCreateEffect], (ctx) => {
            new GameStateCreateEffectSignalHandler().handle(ctx);
        });
    }

    /**
     * Shareable creation primitive: instantiate a domain entity and add it to
     * its collection. Entity-agnostic — concrete `create*` methods supply the
     * collection, class, and any linking.
     */
    protected createEntity<P, E>(collection: E[], EntityClass: new (props: P) => E, props: P): E {
        const entity = new EntityClass(props);
        collection.push(entity);
        return entity;
    }
}
