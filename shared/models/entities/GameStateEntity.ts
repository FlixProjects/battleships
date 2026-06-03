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
import { GameCreateEffectSignalHandler } from "../signal-handlers/GameCreateEffectSignalHandler";
import { GameCreateHullSignalHandler } from "../signal-handlers/GameCreateHullSignalHandler";
import { GamePersistentEffectsTickSignalHandler } from "../signal-handlers/GamePersistentEffectsTickSignalHandler";
import { GameRefillHandsSignalHandler } from "../signal-handlers/GameRefillHandsSignalHandler";
import { GameRemoveExpiredEffectsSignalHandler } from "../signal-handlers/GameRemoveExpiredEffectsSignalHandler";
import { GameRemoveSubmissionCommandPointsSignalHandler } from "../signal-handlers/GameRemoveSubmissionCommandPointsSignalHandler";
import { GameRotateInitiativeSignalHandler } from "../signal-handlers/GameRotateInitiativeSignalHandler";
import { GameWinnerDeterminedSignalHandler } from "../signal-handlers/GameWinnerDeterminedSignalHandler";
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
        return [
            this.createGameStateCreateHullListener(),
            this.createGameStateCreateEffectListener(),
            this.createPersistentEffectsTickListener(),
            this.createWinnerDeterminedListener(),
            this.createRotateInitiativeListener(),
            this.createRemoveSubmissionCommandPointsListener(),
            this.createRemoveExpiredEffectsListener(),
            this.createRefillHandsListener(),
        ];
    }

    // Lifecycle signals address "the world", not a specific entity id, so the
    // single GameState handles them all (default predicate is always-true).
    protected createGameStateCreateHullListener() {
        return new Listener([SignalType.GameStateCreateHull], (ctx) => {
            new GameCreateHullSignalHandler().handle(ctx);
        });
    }

    protected createGameStateCreateEffectListener() {
        return new Listener([SignalType.GameCreateEffect], (ctx) => {
            new GameCreateEffectSignalHandler().handle(ctx);
        });
    }

    protected createPersistentEffectsTickListener() {
        return new Listener([SignalType.GamePersistentEffectsTick], (ctx) => {
            new GamePersistentEffectsTickSignalHandler().handle(ctx);
        });
    }

    protected createWinnerDeterminedListener() {
        return new Listener([SignalType.GameWinnerDetermined], (ctx) => {
            new GameWinnerDeterminedSignalHandler().handle(ctx);
        });
    }

    protected createRotateInitiativeListener() {
        return new Listener([SignalType.GameRotateInitiative], (ctx) => {
            new GameRotateInitiativeSignalHandler().handle(ctx);
        });
    }

    protected createRemoveSubmissionCommandPointsListener() {
        return new Listener([SignalType.GameRemoveSubmissionCommandPoints], (ctx) => {
            new GameRemoveSubmissionCommandPointsSignalHandler().handle(ctx);
        });
    }

    protected createRemoveExpiredEffectsListener() {
        return new Listener([SignalType.GameRemoveExpiredEffects], (ctx) => {
            new GameRemoveExpiredEffectsSignalHandler().handle(ctx);
        });
    }

    protected createRefillHandsListener() {
        return new Listener([SignalType.GameRefillHands], (ctx) => {
            new GameRefillHandsSignalHandler().handle(ctx);
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
