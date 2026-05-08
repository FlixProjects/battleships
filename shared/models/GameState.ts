import clone from "lodash.clonedeep";
import {
    Board,
    ICard,
    IDeck,
    IGameState,
    IHull,
    IPlainDeck,
    IPlainGameState,
    IPlainPlayer,
    IPlainShip,
    IPlayer,
    IPlayerAction,
    IShip,
} from "../types";
import { mergeSets } from "../utils";
import { createCard } from "../utils/card-helper";
import { Action } from "./actions";
import { Card } from "./Card";
import { Deck } from "./Deck";
import { Entity } from "./entities";
import { Hull } from "./Hull";
import { Player } from "./Player";
import { Ship } from "./Ship";

export class GameState implements IGameState {
    code: string;
    currentRound: number;
    initiative?: string;
    players: Player[];
    ships: Ship[];
    hulls: Hull[];
    cards: Card[];
    decks: Deck[];
    board?: Board;
    winners: string[];
    isOver: boolean;
    actions: Action[] = [];

    constructor(props: Readonly<IGameState | IPlainGameState>) {
        this.code = props.code;
        this.initiative = props.initiative;
        this.board = props.board;
        this.winners = props.winners;
        this.isOver = props.isOver;
        this.currentRound = props.currentRound;

        // Phase 1 — independent collections (no cross-refs needed).
        this.hulls = (props.hulls ?? []).map((h) => (h instanceof Hull ? h : Hull.toDomain(h)));
        this.cards = (props.cards ?? []).map((c) => createCard(c));
        this.actions = (props.actions ?? []).map((a) => (a instanceof Action ? a : Action.toDomain(a)));

        // Phase 2 — depends on Phase 1.
        this.ships = (props.ships ?? []).map((s) => {
            if (s instanceof Ship) return s;
            return Ship.toDomain(GameState.toPlainShip(s), this);
        });
        this.decks = (props.decks ?? []).map((d) => {
            if (d instanceof Deck) return d;
            return Deck.toDomain(GameState.toPlainDeck(d), this);
        });

        // Phase 3 — depends on Phase 2.
        this.players = (props.players ?? []).map((p) => {
            if (p instanceof Player) return p;
            return Player.toDomain(GameState.toPlainPlayer(p), this);
        });

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
            players: this.players.map((p) => p.toPlain()),
        };
    }

    /** Static counterpart — equivalent to `new GameState(plain)`. */
    public static toDomain(plain: IPlainGameState | IGameState): GameState {
        return plain instanceof GameState ? plain : new GameState(plain);
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

    getHull(hullId: string) {
        const hull = this.hulls.find((h) => h.id === hullId);
        if (!hull) {
            throw new Error(`Hull with id ${hullId} not found`);
        }
        return hull;
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

    removeInvisibleFromPlayer(visibleTiles: Set<string>, playerId: string) {
        // TODO: we should be able to achieve this without linking.
        this.linkShipHulls().linkPlayerShips();
        this.players = this.players.map((p) => (p.id !== playerId ? p.updateVisibility(visibleTiles) : p));

        this.linkPlayerShips({ reverse: true }).linkShipHulls({ reverse: true });
        return clone(this);
    }

    getVisibleTilesforPlayer(playerId: string) {
        this.linkShipHulls();
        const visibilityFromShips = mergeSets(
            this.ships.filter((s) => s.playerId === playerId).map((s) => s.getVisibleTiles()),
        );
        // TEMP: only Ships give visibility for now
        const visibleTilesForPlayer = mergeSets([visibilityFromShips]);

        return visibleTilesForPlayer;
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

    getFirstPlayerId() {
        return this.players.find((p) => p.order === 0)?.id;
    }

    isFirstPlayer(playerId: string) {
        return this.getFirstPlayerId() === playerId;
    }
}
