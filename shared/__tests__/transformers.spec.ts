import { HullBuilder } from "../factories/hull-builder";
import { PlayerBuilder } from "../factories/player-builder";
import { ShipBuilder } from "../factories/ship-builder";
import {
    transformAppStateToPlain,
    transformDeckToPlain,
    transformGameStateToPlain,
    transformObjectToPlain,
    transformPlainAppStateToDomain,
    transformPlainDeckToDomain,
    transformPlainGameStateToDomain,
    transformPlainShipToDomain,
    transformPlayerToPlain,
    transformPlayersToPlain,
    transformShipToPlain,
    transformShipsToPlain,
} from "../transformers";
import {
    AppStatus,
    IAppState,
    IGameState,
    IHull,
    IPlainAppState,
    IPlainGameState,
    IPlainPlayer,
    IPlayer,
    IShip,
} from "../types/types";

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

describe("transformObjectToPlain", () => {
    it("transforms array properties to id arrays", () => {
        const obj = {
            id: "parent1",
            name: "test",
            items: [{ id: "item1" }, { id: "item2" }],
        };
        const result = transformObjectToPlain(obj, ["items"]);
        expect(result.items).toEqual(["item1", "item2"]);
        expect(result.name).toBe("test");
    });

    it("handles undefined array properties", () => {
        const obj = { id: "parent1", name: "test" };
        const result = transformObjectToPlain(obj, ["items"] as any);
        expect(result).toEqual(obj);
    });
});

describe("transformShipToPlain", () => {
    it("converts ship hulls to id array", () => {
        const ship: IShip = shipBuilder.build({
            id: "ship1",
            hulls: [hullBuilder.build({ id: "hull1" }), hullBuilder.build({ id: "hull2" })],
        });
        const result = transformShipToPlain(ship);
        expect(result.hulls).toEqual(["hull1", "hull2"]);
        expect(result.id).toBe("ship1");
    });
});

describe("transformShipsToPlain", () => {
    it("converts multiple ships", () => {
        const ships: IShip[] = [
            { id: "ship1", hulls: [{ id: "hull1" } as IHull] } as IShip,
            { id: "ship2", hulls: [{ id: "hull2" } as IHull] } as IShip,
        ];
        const result = transformShipsToPlain(ships);
        expect(result).toHaveLength(2);
        expect(result[0].hulls).toEqual(["hull1"]);
        expect(result[1].hulls).toEqual(["hull2"]);
    });
});

describe("transformPlayerToPlain", () => {
    it("converts player ships and pendingActions to id arrays", () => {
        const player: IPlayer = playerBuilder.build({
            id: "player1",
            name: "Player 1",
            ships: [{ id: "ship1" } as IShip, { id: "ship2" } as IShip],
            pendingActions: [{ id: "action1" } as any, { id: "action2" } as any],
        });

        const result = transformPlayerToPlain(player);
        expect(result.ships).toEqual(["ship1", "ship2"]);
        expect(result.pendingActions).toEqual(["action1", "action2"]);
        expect(result.name).toBe("Player 1");
    });
});

describe("transformPlayersToPlain", () => {
    it("converts multiple players", () => {
        const players: IPlayer[] = [
            playerBuilder.build({
                id: "player1",
                name: "Player 1",
                ships: [{ id: "ship1" } as IShip],
                pendingActions: [],
            }),
            playerBuilder.build({
                id: "player2",
                name: "Player 2",
                ships: [{ id: "ship2" } as IShip],
                pendingActions: [],
            }),
        ];
        const result = transformPlayersToPlain(players);
        expect(result).toHaveLength(2);
        expect(result[0].ships).toEqual(["ship1"]);
        expect(result[1].ships).toEqual(["ship2"]);
    });
});

describe("transformGameStateToPlain", () => {
    it("converts game state with players and ships", () => {
        const gameState: IGameState = {
            code: "GAME123",
            currentRound: 1,
            players: [
                playerBuilder.build({
                    id: "player1",
                    ships: [{ id: "ship1", hulls: [] } as IShip],
                    pendingActions: [],
                }),
            ],
            ships: [{ id: "ship1", hulls: [{ id: "hull1" } as IHull] } as IShip],
            hulls: [{ id: "hull1" } as IHull],
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
});

describe("transformAppStateToPlain", () => {
    it("converts app state with nested game state", () => {
        const appState: IAppState = {
            status: AppStatus.Initialised,
            loading: false,
            currentPlayer: "player1",
            gameState: {
                code: "GAME123",
                currentRound: 1,
                players: [],
                ships: [],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            },
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
            players: [{ id: "player1", name: "Player 1", ships: ["ship1"], pendingActions: [] } as IPlainPlayer],
            ships: [{ id: "ship1", playerId: "player1", hulls: ["hull1"] } as any],
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

describe("transformPlainShipToDomain", () => {
    it("links ship with its hulls", () => {
        const plainShip = { id: "ship1", playerId: "player1", hulls: ["hull1", "hull2"] } as any;
        const hulls: IHull[] = [
            { id: "hull1", shipId: "ship1" } as IHull,
            { id: "hull2", shipId: "ship1" } as IHull,
            { id: "hull3", shipId: "ship2" } as IHull,
        ];
        const result = transformPlainShipToDomain(plainShip, hulls);
        expect(result.hulls).toHaveLength(2);
        expect(result.hulls[0].id).toBe("hull1");
        expect(result.hulls[1].id).toBe("hull2");
    });
});

describe("transformDeckToPlain", () => {
    it("flattens deck.cards and deck.played to ID arrays", () => {
        const deck = {
            id: "deck-1",
            playerId: "p1",
            faction: "THE_UNITED_FLEET" as const,
            cards: [
                { id: "card-1", deckId: "deck-1", instanceId: "ship-1", kind: "Ship" as const, refNo: "frigate0" },
                { id: "card-2", deckId: "deck-1", instanceId: "ship-2", kind: "Ship" as const, refNo: "flagship0" },
            ],
            played: [
                { id: "card-3", deckId: "deck-1", instanceId: "ship-3", kind: "Ship" as const, refNo: "frigate0" },
            ],
        };
        const result = transformDeckToPlain(deck);
        expect(result.cards).toEqual(["card-1", "card-2"]);
        expect(result.played).toEqual(["card-3"]);
        expect(result.id).toBe("deck-1");
    });
});

describe("transformPlainDeckToDomain", () => {
    it("rehydrates deck.cards and deck.played from the flat cards list", () => {
        const plainDeck = {
            id: "deck-1",
            playerId: "p1",
            faction: "THE_UNITED_FLEET" as const,
            cards: ["card-1", "card-2"],
            played: ["card-3"],
        };
        const allCards = [
            { id: "card-1", deckId: "deck-1", instanceId: "ship-1", kind: "Ship" as const, refNo: "frigate0" },
            { id: "card-2", deckId: "deck-1", instanceId: "ship-2", kind: "Ship" as const, refNo: "flagship0" },
            { id: "card-3", deckId: "deck-1", instanceId: "ship-3", kind: "Ship" as const, refNo: "frigate0" },
            { id: "card-4", deckId: "deck-other", instanceId: "ship-4", kind: "Ship" as const, refNo: "frigate0" },
        ];
        const result = transformPlainDeckToDomain(plainDeck, allCards);
        expect(result.cards.map((c) => c.id)).toEqual(["card-1", "card-2"]);
        expect(result.played.map((c) => c.id)).toEqual(["card-3"]);
    });
});
