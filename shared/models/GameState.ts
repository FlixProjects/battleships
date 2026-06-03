import clone from "lodash.clonedeep";
import {
    EffectKind,
    ICard,
    ICellLoc,
    IDeck,
    IEffect,
    IGameState,
    IGameStateData,
    IHull,
    IPlainDeck,
    IPlainGameState,
    IPlainPlayer,
    IPlainShip,
    IPlayer,
    IPlayerAction,
    IShip,
    IVisionEffectPayload,
} from "../types";
import { mergeSets } from "../utils";
import { createCard } from "../utils/card-helper";
import { createEffect } from "../utils/effect-helper";
import { locationToKey } from "../utils/helpers";
import { PathHelper } from "../utils/path-helper";
import { Action } from "./actions";
import { Deck } from "./Deck";
import { Effect } from "./effects/Effect";
import { Entity } from "./entities/Entity";
import { GameStateEntity } from "./entities/GameStateEntity";
import { Hull } from "./Hull";
import { Player } from "./Player";
import { Ship } from "./Ship";

// GameObjects should not be nested within other GameObjects unless they have their equivalent on this layer
export class GameState extends GameStateEntity implements IGameState {
    // TODO: Can we just pass in the props and do Object.assign(this, props) in Entity-level?
    constructor(props: Readonly<IGameStateData | IPlainGameState>) {
        super();
        this.id = props.code;
        this.code = props.code;
        this.initiative = props.initiative;
        this.board = props.board;
        this.winners = props.winners;
        this.isOver = props.isOver;
        this.currentRound = props.currentRound;

        // Construction is always rehydration: the input is plain or
        // domain-shaped data, never an already-built class instance. The
        // from FK arrays) before delegating to each entity's strict toDomain.

        // Phase 1 — independent collections (no cross-refs needed).
        this.hulls = (props.hulls ?? []).map((h) => Hull.toDomain(h));
        this.cards = (props.cards ?? []).map((c) => createCard(c));
        this.actions = (props.actions ?? []).map((a) => Action.toDomain(a));
        this.effects = (props.effects ?? []).map((e) => createEffect(e));

        // Phase 2 — depends on Phase 1.
        this.ships = (props.ships ?? []).map((s) => Ship.toDomain(GameState.toPlainShip(s), this));
        this.decks = (props.decks ?? []).map((d) => Deck.toDomain(GameState.toPlainDeck(d), this));

        // Phase 3 — depends on Phase 2.
        this.players = (props.players ?? []).map((p) => Player.toDomain(GameState.toPlainPlayer(p), this));

        // Phase 4 — wire runtime back-references (Card → Deck).
        this.bindCardsToDecks();
    }

    /**
     * The next three helpers normalise an `IShip | IPlainShip` (etc.) input
     * to its strict plain shape — `string[]` for any FK-array field. Used
     * only by the constructor, so the entity `toDomain`s can stay strict.
     */
    private static idOf<T extends { id: string }>(ref: string | T): string {
        return typeof ref === "string" ? ref : ref.id;
    }

    private static toPlainShip(s: IShip | IPlainShip): IPlainShip {
        return { ...s, hulls: (s.hulls ?? []).map((h: string | IHull) => GameState.idOf(h)) } as IPlainShip;
    }

    private static toPlainDeck(d: IDeck | IPlainDeck): IPlainDeck {
        return {
            ...d,
            cards: (d.cards ?? []).map((c: string | ICard) => GameState.idOf(c)),
            played: (d.played ?? []).map((c: string | ICard) => GameState.idOf(c)),
        } as IPlainDeck;
    }

    private static toPlainPlayer(p: IPlayer | IPlainPlayer): IPlainPlayer {
        return {
            ...p,
            ships: (p.ships ?? []).map((s: string | IShip) => GameState.idOf(s)),
            pendingActions: (p.pendingActions ?? []).map((a: string | IPlayerAction) => GameState.idOf(a)),
        } as IPlainPlayer;
    }

    public toPlain(): IPlainGameState {
        return {
            code: this.code,
            currentRound: this.currentRound,
            initiative: this.initiative,
            board: this.board,
            winners: this.winners,
            isOver: this.isOver,
            hulls: this.hulls.map((h) => h.toPlain()),
            ships: this.ships.map((s) => s.toPlain()),
            actions: this.actions.map((a) => a.toPlain()),
            cards: this.cards.map((c) => c.toPlain()),
            decks: this.decks.map((d) => d.toPlain()),
            effects: this.effects.map((e) => e.toPlain()),
            players: this.players.map((p) => p.toPlain()),
        };
    }

    /** Static counterpart — equivalent to `new GameState(plain)`. */
    public static toDomain(plain: IPlainGameState | IGameStateData): GameState {
        return new GameState(plain);
    }

    update(_gameState: Partial<IGameState>) {
        this.code = _gameState.code ?? this.code;
        this.initiative = _gameState.initiative ?? this.initiative;
        this.winners = _gameState.winners ?? this.winners;
        this.board = _gameState.board ?? this.board;
        this.isOver = _gameState.isOver ?? this.isOver;

        _gameState.players?.forEach((player: IPlayer) => this.updatePlayer(player));

        return this;
    }

    updateEntity<T extends Entity<T>, P>(entity: Partial<T>, collection: T[], EntityClass: new (props: P) => T): this {
        if (!entity.id) return this;
        const index = collection.findIndex((e) => e.id === entity.id);
        if (index === -1) return this;
        collection[index] = new EntityClass({ ...collection[index], ...entity } as P);
        return this;
    }

    /**
     * Draws cards from the player's deck into their hand until the hand is at
     * `maxHandSize` (or the deck runs out). Mutates the deck and the player.
     */
    public refillPlayerHand(playerId: string, maxHandSize: number): this {
        const player = this.players.find((p) => p.id === playerId);
        if (!player) return this;

        const deck = this.decks.find((d) => d.id === player.deck);
        if (!deck) return this;

        const cardsNeeded = Math.max(0, maxHandSize - player.hand.length);
        if (cardsNeeded === 0) return this;

        const drawn = deck.draw(cardsNeeded);
        player.hand = [...player.hand, ...drawn.map((c) => c.id)];
        return this;
    }

    public playCard(playerId: string, cardId: string): this {
        const player = this.players.find((p) => p.id === playerId);
        if (!player) return this;

        const card = this.cards.find((c) => c.id === cardId);
        if (!card) return this;

        if (!card.hasDeckBound()) return this;

        player.playCard(card);
        return this;
    }

    private bindCardsToDecks(): void {
        const decksById = new Map(this.decks.map((d) => [d.id, d]));
        this.cards.forEach((card) => {
            const deck = decksById.get(card.deckId);
            if (deck) card.bindDeck(deck);
        });
    }

    updatePlayer(player: Partial<IPlayer>) {
        return this.updateEntity(player, this.players, Player);
    }

    getPlayer(playerId: string): Player {
        const player = this.players.find((p) => p.id === playerId);
        if (!player) {
            throw new Error(`Player with id ${playerId} not found`);
        }
        return player;
    }

    getPlayers() {
        return this.players.map((player) => new Player(player));
    }

    getShip(shipId: string) {
        const ship = this.ships.find((s) => s.id === shipId);
        if (!ship) {
            throw new Error(`Ship with id ${shipId} not found`);
        }
        return ship;
    }

    updateShip(ship: Partial<IShip>) {
        return this.updateEntity(ship, this.ships, Ship);
    }

    addHull(hull: IHull) {
        if (!hull.id) return this;

        const hullIndex = this.hulls.findIndex((h) => h.id === hull.id);
        if (hullIndex !== -1) {
            return this.updateHull(hull);
        }

        this.hulls.push(new Hull(hull));
        return this;
    }

    createHull(hull: IHull, shipId: string): Hull {
        const created = this.createEntity(this.hulls, Hull, hull);
        const ship = this.ships.find((s) => s.id === shipId);
        ship?.addHullLocation(created);
        return created;
    }

    getHull(hullId: string) {
        const hull = this.hulls.find((h) => h.id === hullId);
        if (!hull) {
            throw new Error(`Hull with id ${hullId} not found`);
        }
        return hull;
    }

    getHulls() {
        return this.hulls;
    }

    getHullsByLocations(locations: ICellLoc[]) {
        const hullMap = new Map(this.hulls.map((h) => [locationToKey(h.location), h]));
        return locations.map((loc) => hullMap.get(locationToKey(loc))).filter((h): h is Hull => h !== undefined);
    }

    getShipHulls(shipId: string) {
        const hulls = this.hulls?.filter((h) => h.shipId === shipId);
        if (!this.hulls || hulls.length === 0) {
            throw new Error(`Ship ${shipId} has no hulls`);
        }
        return hulls;
    }

    updateHull(hull: Partial<IHull>) {
        return this.updateEntity(hull, this.hulls, Hull);
    }

    addPendingAction(playerId: string, action: IPlayerAction) {
        this.getPlayer(playerId)?.addPendingAction(action);
        return this;
    }

    addAction(action: IPlayerAction) {
        if (!action.id) return this;
        const actionIndex = this.actions.findIndex((a) => a.id === action.id);
        if (actionIndex !== -1) {
            return this.updateAction(action);
        }
        this.actions.push(action instanceof Action ? action : new Action(action));
        return this;
    }

    updateAction(action: Partial<IPlayerAction>) {
        return this.updateEntity(action, this.actions, Action);
    }

    addEffect(effect: IEffect) {
        if (!effect.id) return this;
        const existingIndex = this.effects.findIndex((e) => e.id === effect.id);
        if (existingIndex !== -1) {
            this.effects[existingIndex] = effect instanceof Effect ? effect : createEffect(effect);
            return this;
        }
        this.effects.push(effect instanceof Effect ? effect : createEffect(effect));
        return this;
    }

    removeEffect(effectId: string) {
        this.effects = this.effects.filter((e) => e.id !== effectId);
        return this;
    }

    /**
     * Returns Effects that are still alive on the current round, optionally
     * filtered by owner. Effects without `expiresAfterRound` (one-shots) are
     * never persisted in `effects` so this is a simple round-window filter.
     */
    getActiveEffects(playerId?: string): Effect[] {
        return this.effects.filter((e) => {
            if (e.hasExpired(this.currentRound)) return false;
            if (playerId !== undefined && e.playerId !== playerId) return false;
            return true;
        });
    }

    removeInvisibleFromPlayer(visibleTiles: Set<string>, playerId: string) {
        // TODO: we should be able to achieve this without linking.
        this.linkShipHulls().linkPlayerShips();
        this.players = this.players.map((p) => (p.id !== playerId ? p.updateVisibility(visibleTiles) : p));
        this.effects = this.effects.map((e) => e.updateVisibility(visibleTiles));
        this.removeInvisibleEffects();

        this.linkPlayerShips({ reverse: true }).linkShipHulls({ reverse: true });
        return clone(this);
    }

    removeInvisibleEffects() {
        this.effects = this.effects.filter((e) => e.isVisible);
        return this;
    }

    getVisibleTilesforPlayer(playerId: string) {
        this.linkShipHulls();
        const visibilityFromShips = mergeSets(
            this.ships.filter((s) => s.playerId === playerId).map((s) => s.getVisibleTiles()),
        );
        const visibilityFromEffects = this.getVisionFromEffectsForPlayer(playerId);

        return mergeSets([visibilityFromShips, visibilityFromEffects]);
    }

    private getVisionFromEffectsForPlayer(playerId: string): Set<string> {
        const tiles = new Set<string>();
        const pathHelper = new PathHelper();

        this.getActiveEffects(playerId)
            .filter((e) => e.kind === EffectKind.Vision)
            .forEach((e) => {
                const payload = e.payload as IVisionEffectPayload;
                tiles.add(locationToKey(payload.center));
                pathHelper
                    .getReachableCells({ start: payload.center, range: payload.range })
                    .forEach((cell) => tiles.add(locationToKey(cell)));
            });

        return tiles;
    }

    linkPlayerShips(options: { reverse?: boolean } = {}) {
        if (options.reverse) {
            this.ships = this.players.flatMap((p) => p.ships);
            return this;
        }

        this.players.forEach((p) => {
            p.ships = this.ships.filter((s) => s.playerId === p.id);
        });
        return this;
    }

    linkShipHulls(options: { reverse?: boolean } = {}) {
        if (options.reverse) {
            this.hulls = this.ships.flatMap((s) => s.hulls);
            return this;
        }

        this.ships.forEach((s) => {
            s.hulls = this.hulls.filter((h) => h.shipId === s.id);
        });
        return this;
    }

    getPlayerIndex(playerId: string) {
        const playerIndex = this.players.findIndex((p) => p.id === playerId);
        return playerIndex;
    }

    getFirstPlayerId() {
        return this.players.find((p) => p.order === 0)?.id;
    }

    isFirstPlayer(playerId: string) {
        return this.getFirstPlayerId() === playerId;
    }

    // ================= Turn-lifecycle logic =================
    // The mutation behind each non-action (turn-lifecycle) signal. Handlers call
    // these; GameStateEntity holds the matching listeners.

    tickPersistentEffects() {
        this.getActiveEffects().forEach((effect) => effect.resolveTick(this));
        return this;
    }

    determineWinner() {
        const losers = new Set<string>();
        this.ships
            .filter((s) => s.isFlagship)
            .forEach((flagship) => {
                if (flagship.destroyed) losers.add(flagship.playerId);
            });

        const playerIds = this.players.map((p) => p.id);

        if (losers.size === playerIds.length) {
            this.winners = playerIds; // all flagships down → draw
            this.isOver = true;
        } else if (losers.size === playerIds.length - 1) {
            this.winners = playerIds.filter((id) => !losers.has(id)); // one survivor
            this.isOver = true;
        } else {
            this.winners = [];
            this.isOver = false;
        }
        return this;
    }

    rotateInitiative() {
        const players = this.getPlayers();
        if (players.length === 0) return this;
        const currentIndex = players.findIndex((p) => p.id === this.initiative);
        const nextIndex = (currentIndex + 1) % players.length;
        this.initiative = players[nextIndex].id;
        return this;
    }

    removeSubmissionCommandPoints(playerId: string) {
        this.updatePlayer({ id: playerId, commandPoints: 0 });
        return this;
    }

    removeExpiredEffects() {
        this.effects.filter((e) => e.hasExpired(this.currentRound)).forEach((e) => this.removeEffect(e.id));
        return this;
    }

    refillHands(maxHandSize: number) {
        if (this.isOver) return this;
        this.players.forEach((player) => this.refillPlayerHand(player.id, maxHandSize));
        return this;
    }
}
