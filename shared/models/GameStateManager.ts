import clone from "lodash.clonedeep";
import {
    IEffect,
    IGameState,
    IGameStateData,
    IGameStateManager,
    IHull,
    IPlainAction,
    IPlainGameState,
    IPlayer,
    IShip,
} from "../types";
import { ActionResolver } from "../utils/action-handler/ActionResolver";
import { GameState } from "./GameState";

type GameStateInput = IGameState | IGameStateData | IPlainGameState;

export class GameStateManager implements IGameStateManager {
    private _gameState: GameState;
    constructor(_gameState: GameStateInput) {
        // each time we instantiate we deep clone the gameState
        const plain = clone(_gameState);
        this._gameState = this.transformToDomain(plain);
    }

    private transformToDomain(_gameState: GameStateInput) {
        return new GameState(_gameState);
    }

    get gameState() {
        return this._gameState;
    }

    setGameState(_gameState: IGameState | IPlainGameState) {
        this._gameState = this.transformToDomain(_gameState);
    }

    /**
     * If the player has already submitted (`ready === true`), runs
     * `ActionResolver` over the current state so the local view shows the
     * resolved outcome while we wait for the opponent. Server's stored state
     * is unaffected — this is a client-only optimistic projection.
     *
     * Returns `this` for chaining; no-op when the player isn't ready.
     */
    public resolveLocalActionsForPlayer(playerId: string): this {
        const player = this._gameState.getPlayer(playerId);
        if (!player.ready) return this;

        const resolver = new ActionResolver(playerId, this._gameState);
        const { gameState: resolved } = resolver.resolve();
        this.setGameState(resolved);
        return this;
    }

    getCurrentRound() {
        return this.gameState.currentRound;
    }

    getPlayer(playerId: string) {
        return this.gameState.getPlayer(playerId);
    }

    getPlayers() {
        return this.gameState.getPlayers();
    }

    getPlayerShips(playerId: string) {
        return this.gameState.ships.filter((s) => s.playerId === playerId);
    }

    getShip(shipId: string) {
        return this.gameState.getShip(shipId);
    }

    getShipHulls(shipId: string) {
        return this.gameState.getShipHulls(shipId);
    }

    getCard(cardId: string) {
        return this.gameState.cards.find((c) => c.id === cardId);
    }

    getDeck(deckId: string) {
        return this.gameState.decks.find((d) => d.id === deckId);
    }

    getPlayerHand(playerId: string) {
        const player = this.gameState.getPlayer(playerId);
        return player.hand
            .map((cardId) => this.getCard(cardId))
            .filter((c): c is NonNullable<typeof c> => c !== undefined);
    }

    updatePlayer(player: Partial<IPlayer>) {
        this._gameState = this.gameState.updatePlayer(player);
        return this;
    }

    updatePlayers(players: Partial<IPlayer>[]) {
        players.forEach((p) => this.updatePlayer(p));
        return this;
    }

    updateShip(ship: Partial<IShip>) {
        this._gameState = this.gameState.updateShip(ship);
        return this;
    }

    updateShips(ships: Partial<IShip>[]) {
        ships.forEach((ship) => this.updateShip(ship));
        return this;
    }

    updateHull(hull: Partial<IHull>) {
        this._gameState = this.gameState.updateHull(hull);
        return this;
    }

    addHull(hull: IHull) {
        this._gameState = this.gameState.addHull(hull);
        return this;
    }

    addHulls(hulls: IHull[]) {
        hulls.forEach((hull) => this.addHull(hull));
        return this;
    }

    updateHulls(hulls: Partial<IHull>[]) {
        hulls.forEach((hull) => this.updateHull(hull));
        return this;
    }

    updateAction(action: Partial<IPlainAction>) {
        this._gameState = this.gameState.updateAction(action);
        return this;
    }

    addAction(action: IPlainAction) {
        this._gameState = this.gameState.addAction(action);
        return this;
    }

    updateActions(actions: Partial<IPlainAction>[]) {
        actions.forEach((action) => this.updateAction(action));
        return this;
    }

    addEffect(effect: IEffect) {
        this._gameState = this.gameState.addEffect(effect);
        return this;
    }

    addEffects(effects: IEffect[]) {
        effects.forEach((effect) => this.addEffect(effect));
        return this;
    }

    removeEffect(effectId: string) {
        this._gameState = this.gameState.removeEffect(effectId);
        return this;
    }

    getActiveEffects(playerId?: string) {
        return this.gameState.getActiveEffects(playerId);
    }
}
