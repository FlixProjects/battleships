import { AppStatus, CardKind, Faction } from "../config/constants";
import { HullBuilder } from "../factories/hull-builder";
import { PlayerBuilder } from "../factories/player-builder";
import { ShipBuilder } from "../factories/ship-builder";
import { GameState } from "../models";
import {
    transformAppStateToPlain,
    transformGameStateToPlain,
    transformPlainAppStateToDomain,
    transformPlainGameStateToDomain,
} from "../transformers";
import { IAppState, IGameStateData, IHull, IPlainAppState, IPlainGameState, IShip } from "../types/types";

const playerBuilder = new PlayerBuilder({
    id: "player1",
    name: "Player 1",
    ready: false,
    maxCommandPoints: 2,
    commandPoints: 2,
});

const shipBuilder = new ShipBuilder({
    playerId: "player1",
    refNo: "ref1",
    name: "Destroyer",
});

const hullBuilder = new HullBuilder();

describe("transformGameStateToPlain", () => {
    it("flattens players, ships, hulls and decks via each entity's toPlain", () => {
        const gameState: IGameStateData = {
            code: "GAME123",
            currentRound: 1,
            players: [
                playerBuilder.build({
                    id: "player1",
                    ships: [shipBuilder.build({ id: "ship1", hulls: [] })],
                    pendingActions: [],
                }),
            ],
            ships: [shipBuilder.build({ id: "ship1", hulls: [hullBuilder.build({ id: "hull1" })] })],
            hulls: [hullBuilder.build({ id: "hull1" })],
            cards: [],
            decks: [],
            winners: [],
            isOver: false,
        };
        const result = transformGameStateToPlain(gameState);
        expect(result.players[0].ships).toEqual(["ship1"]);
        expect(result.ships[0].hulls).toEqual(["hull1"]);
        expect(result.code).toBe("GAME123");
    });

    it("flattens deck.cards and deck.played to ID arrays via Deck.toPlain", () => {
        const card1 = { id: "card-1", deckId: "deck-1", instanceId: "ship-1", kind: CardKind.Ship, refNo: "frigate0" };
        const card2 = { id: "card-2", deckId: "deck-1", instanceId: "ship-2", kind: CardKind.Ship, refNo: "flagship0" };
        const card3 = { id: "card-3", deckId: "deck-1", instanceId: "ship-3", kind: CardKind.Ship, refNo: "frigate0" };

        const gs = new GameState({
            code: "GAME123",
            currentRound: 1,
            players: [],
            ships: [],
            hulls: [],
            cards: [card1, card2, card3],
            decks: [
                {
                    id: "deck-1",
                    playerId: "p1",
                    faction: Faction.THE_UNITED_FLEET,
                    cards: [card1, card2],
                    played: [card3],
                },
            ],
            winners: [],
            isOver: false,
        });

        const result = transformGameStateToPlain(gs);
        expect(result.decks[0].cards).toEqual(["card-1", "card-2"]);
        expect(result.decks[0].played).toEqual(["card-3"]);
    });
});

describe("transformAppStateToPlain", () => {
    it("converts app state with nested game state", () => {
        const appState: IAppState = {
            status: AppStatus.Initialised,
            loading: false,
            currentPlayer: "player1",
            gameState: new GameState({
                code: "GAME123",
                currentRound: 1,
                players: [],
                ships: [],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            }),
        };
        const result = transformAppStateToPlain(appState);
        expect(result.status).toBe(AppStatus.Initialised);
        expect(result.gameState.code).toBe("GAME123");
    });
});

describe("transformPlainGameStateToDomain", () => {
    it("links ships with hulls and players with ships", () => {
        const plainGameState: IPlainGameState = {
            code: "GAME123",
            currentRound: 1,
            players: [
                {
                    ...playerBuilder.build({ id: "player1", name: "Player 1" }),
                    ships: ["ship1"],
                    pendingActions: [],
                },
            ],
            ships: [{ id: "ship1", playerId: "player1", hulls: ["hull1"] } as unknown as any],
            hulls: [{ id: "hull1", shipId: "ship1" } as IHull],
            cards: [],
            decks: [],
            actions: [],
            winners: [],
            isOver: false,
        };
        const result = transformPlainGameStateToDomain(plainGameState);
        expect(result.players[0].ships).toHaveLength(1);
        expect(result.players[0].ships![0].id).toBe("ship1");
        expect(result.ships[0].hulls).toHaveLength(1);
        expect(result.ships[0].hulls![0].id).toBe("hull1");
    });

    it("round-trips a vision Effect through plain and domain forms", () => {
        const plain: IPlainGameState = {
            code: "GAME123",
            currentRound: 2,
            players: [],
            ships: [],
            hulls: [],
            cards: [],
            decks: [],
            effects: [
                {
                    id: "effect-1",
                    refNo: "flare_persistent",
                    kind: "vision",
                    sourceCardId: "card-flare",
                    playerId: "player1",
                    createdOnRound: 1,
                    expiresAfterRound: 2,
                    payload: { kind: "vision", center: [1, 1], range: 2 },
                    existsOnBoard: true,
                },
            ],
            winners: [],
            isOver: false,
        };
        const domain = transformPlainGameStateToDomain(plain);
        expect(domain.effects).toHaveLength(1);
        expect(domain.effects[0].refNo).toBe("flare_persistent");

        const replain = transformGameStateToPlain(domain);
        expect(replain.effects?.[0]).toEqual(plain.effects?.[0]);
    });

    it("rehydrates deck.cards and deck.played from the flat cards list", () => {
        const cards = [
            { id: "card-1", deckId: "deck-1", instanceId: "ship-1", kind: CardKind.Ship, refNo: "frigate0" },
            { id: "card-2", deckId: "deck-1", instanceId: "ship-2", kind: CardKind.Ship, refNo: "flagship0" },
            { id: "card-3", deckId: "deck-1", instanceId: "ship-3", kind: CardKind.Ship, refNo: "frigate0" },
        ];
        const plain: IPlainGameState = {
            code: "GAME123",
            currentRound: 1,
            players: [],
            ships: [] as unknown as IShip[] as any,
            hulls: [],
            cards,
            decks: [
                {
                    id: "deck-1",
                    playerId: "p1",
                    faction: Faction.THE_UNITED_FLEET,
                    cards: ["card-1", "card-2"],
                    played: ["card-3"],
                },
            ],
            actions: [],
            winners: [],
            isOver: false,
        };
        const result = transformPlainGameStateToDomain(plain);
        expect(result.decks[0].cards.map((c) => c.id)).toEqual(["card-1", "card-2"]);
        expect(result.decks[0].played.map((c) => c.id)).toEqual(["card-3"]);
    });
});

describe("transformPlainAppStateToDomain", () => {
    it("converts plain app state to domain with nested game state", () => {
        const plainAppState: IPlainAppState = {
            status: AppStatus.Initialised,
            loading: false,
            currentPlayer: "player1",
            gameState: {
                code: "GAME123",
                currentRound: 1,
                players: [],
                ships: [],
                hulls: [],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            },
        };
        const result = transformPlainAppStateToDomain(plainAppState);
        expect(result.status).toBe(AppStatus.Initialised);
        expect(result.gameState.code).toBe("GAME123");
    });

    it("handles partial app state without game state", () => {
        const plainAppState: Partial<IPlainAppState> = {
            status: AppStatus.NewGame,
            loading: true,
        };
        const result = transformPlainAppStateToDomain(plainAppState);
        expect(result.status).toBe(AppStatus.NewGame);
        expect(result.loading).toBe(true);
    });
});
