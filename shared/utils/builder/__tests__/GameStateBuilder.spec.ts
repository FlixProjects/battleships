import {
    CardKind,
    CELL_NODE_REF_NO,
    DEFAULT_CONFIG,
    EFFECT_REF_NO,
    Faction,
    MAP_REF_NO,
    PLAYER_REF_NO,
    SHIP_REF_NO,
    SUPPORT_REF_NO,
} from "@shared/config/constants";
import { RandomFn } from "@shared/models/Deck";
import { GameState } from "@shared/models/GameState";
import { IGameConfig } from "@shared/types/config-types";
import { ActionTypes, IPlayCardAction } from "@shared/types/action-types";
import { ActionResolver } from "../../action-handler/ActionResolver";
import { GameStateBuilder } from "../GameStateBuilder";

const faction = Faction.THE_UNITED_DEFENSE_FLEET;
const defaultPlayerConfig = DEFAULT_CONFIG.playersConfig[PLAYER_REF_NO.default];
const defaultDeckConfig = DEFAULT_CONFIG.factionConfig[faction].deck;
const defaultCardCount = defaultDeckConfig.reduce((total, entry) => total + entry.count, 0);

const player1 = { id: "p1", name: "Player 1", order: 0 };
const player2 = { id: "p2", name: "Player 2", order: 1 };

const loadPlayerCards = (builder: GameStateBuilder, player = player1) =>
    builder.loadEmptyNewPlayer(player).loadFaction(faction).loadDeck().loadCards();

const loadPlayerShips = (builder: GameStateBuilder, player = player1) => loadPlayerCards(builder, player).loadShips();

const loadPlayerHand = (builder: GameStateBuilder, player = player1, rngFn: RandomFn = Math.random) =>
    loadPlayerShips(builder, player).loadHand(rngFn);

const seededRng = (seed: number[]): RandomFn => {
    let i = 0;
    return () => seed[i++ % seed.length];
};

// hand followed by the rest of the deck, as each card's position in creation order
const getDrawOrder = (builder: GameStateBuilder) => {
    const { players, cards, decks } = builder.build();
    const cardIds = cards.map((c) => c.id);
    return [...players[0].hand, ...decks[0].cards].map((id) => cardIds.indexOf(id));
};

describe("GameStateBuilder", () => {
    describe("constructor", () => {
        it("should start from a fresh empty game state", () => {
            const gameState = new GameStateBuilder().build();

            expect(gameState).toEqual({
                code: "",
                currentRound: 0,
                players: [],
                ships: [],
                cards: [],
                effects: [],
                decks: [],
                board: {},
                initiative: "",
                winners: [],
                isOver: false,
                actions: [],
            });
        });

        it("should continue from an existing game state", () => {
            const existingBuilder = new GameStateBuilder().loadCode("ABCD");
            loadPlayerCards(existingBuilder);
            const existing = existingBuilder.build();

            const builder = new GameStateBuilder(existing);
            loadPlayerCards(builder, player2);
            const gameState = builder.build();

            expect(gameState.code).toBe("ABCD");
            expect(gameState.players.map((p) => p.id)).toEqual(["p1", "p2"]);
            expect(gameState.decks.map((d) => d.playerId)).toEqual(["p1", "p2"]);
            expect(gameState.cards).toHaveLength(defaultCardCount * 2);
        });
    });

    describe("loadCode", () => {
        it("should set the game code", () => {
            expect(new GameStateBuilder().loadCode("ABCD").build().code).toBe("ABCD");
        });
    });

    describe("overrideConfig", () => {
        it("should override only the given leaf and keep its sibling configs", () => {
            const builder = new GameStateBuilder().overrideConfig({
                playersConfig: { [PLAYER_REF_NO.default]: { commandPoints: 9 } },
            } as Partial<IGameConfig>);
            builder.loadEmptyNewPlayer(player1);

            expect(builder.build().players[0]).toMatchObject({
                commandPoints: 9,
                maxCommandPoints: defaultPlayerConfig.maxCommandPoints,
            });
        });

        it("should not mutate the default config", () => {
            const { commandPoints } = defaultPlayerConfig;

            new GameStateBuilder().overrideConfig({
                playersConfig: { [PLAYER_REF_NO.default]: { commandPoints: commandPoints + 5 } },
            } as Partial<IGameConfig>);

            expect(DEFAULT_CONFIG.playersConfig[PLAYER_REF_NO.default].commandPoints).toBe(commandPoints);
        });
    });

    describe("loadMap", () => {
        it("should build the default board from the board and cell configs", () => {
            const { board = {} } = new GameStateBuilder().loadMap().build();
            const { rows, columns } = DEFAULT_CONFIG.boardConfig[MAP_REF_NO.default];
            const ids = Object.values(board).map((cellNode) => cellNode.id);

            expect(ids).toHaveLength(rows * columns);
            expect(new Set(ids).size).toBe(ids.length);
            expect(board["0/0"]).toMatchObject({ refNo: CELL_NODE_REF_NO.default, location: [0, 0] });
            expect(board["2/2"]).toMatchObject({
                refNo: CELL_NODE_REF_NO.island0,
                location: [2, 2],
                imgSrc: DEFAULT_CONFIG.cellConfig[CELL_NODE_REF_NO.island0].imgSrc,
            });
        });

        it("should build the board from an overridden config", () => {
            const { board = {} } = new GameStateBuilder()
                .overrideConfig({
                    boardConfig: { [MAP_REF_NO.default]: { rows: 3, columns: 4 } },
                    cellConfig: { [CELL_NODE_REF_NO.island0]: { imgSrc: "custom-island.png" } },
                } as Partial<IGameConfig>)
                .loadMap()
                .build();

            expect(Object.keys(board)).toHaveLength(12);
            expect(board["2/2"]).toMatchObject({ refNo: CELL_NODE_REF_NO.island0, imgSrc: "custom-island.png" });
        });
    });

    describe("loadEmptyNewPlayer", () => {
        it("should add an empty player with the given params and the players config", () => {
            const builder = new GameStateBuilder();
            builder.loadEmptyNewPlayer(player1);

            expect(builder.build().players).toEqual([
                {
                    ...player1,
                    ...defaultPlayerConfig,
                    ready: false,
                    ships: [],
                    pendingActions: [],
                    faction,
                    hand: [],
                    deck: "",
                },
            ]);
        });

        it("should default the id and order when they are not given", () => {
            const builder = new GameStateBuilder();
            builder.loadEmptyNewPlayer({ name: "Player 1" });
            const [player] = builder.build().players;

            expect(player.id).toEqual(expect.stringMatching(/^uuid-/));
            expect(player.order).toBe(1);
        });

        it("should take the player's values from an overridden players config", () => {
            const builder = new GameStateBuilder().overrideConfig({
                playersConfig: { [PLAYER_REF_NO.default]: { maxCommandPoints: 5, commandPoints: 4, maxHandSize: 3 } },
            });
            builder.loadEmptyNewPlayer(player1);

            expect(builder.build().players[0]).toMatchObject({ maxCommandPoints: 5, commandPoints: 4 });
        });

        it("should not add more than two players", () => {
            const builder = new GameStateBuilder();
            builder.loadEmptyNewPlayer(player1);
            builder.loadEmptyNewPlayer(player2);
            builder.loadEmptyNewPlayer({ id: "p3", name: "Player 3" });

            expect(builder.build().players.map((p) => p.id)).toEqual(["p1", "p2"]);
        });
    });

    describe("loadFaction", () => {
        it("should set the player's faction", () => {
            const builder = new GameStateBuilder();
            builder.loadEmptyNewPlayer(player1).loadFaction(faction);

            expect(builder.build().players[0].faction).toBe(faction);
        });
    });

    describe("loadDeck", () => {
        it("should add an empty deck for the player and link it to them", () => {
            const builder = new GameStateBuilder();
            builder.loadEmptyNewPlayer(player1).loadFaction(faction).loadDeck();
            const { players, decks } = builder.build();

            expect(decks).toEqual([{ id: players[0].deck, playerId: "p1", faction, cards: [], played: [] }]);
        });

        it("should give each player their own deck", () => {
            const builder = new GameStateBuilder();
            builder.loadEmptyNewPlayer(player1).loadFaction(faction).loadDeck();
            builder.loadEmptyNewPlayer(player2).loadFaction(faction).loadDeck();
            const { players, decks } = builder.build();

            expect(decks.map((d) => d.id)).toEqual(players.map((p) => p.deck));
            expect(decks[0].id).not.toBe(decks[1].id);
        });
    });

    describe("loadCards", () => {
        it("should create a card for every count of every entry in the faction deck", () => {
            const builder = new GameStateBuilder();
            loadPlayerCards(builder);
            const { cards } = builder.build();

            expect(cards).toHaveLength(defaultCardCount);
            defaultDeckConfig.forEach((entry) => {
                expect(cards.filter((c) => c.refNo === entry.refNo && c.kind === entry.kind)).toHaveLength(entry.count);
            });
        });

        it("should give every card its own id and put them all in the player's deck", () => {
            const builder = new GameStateBuilder();
            loadPlayerCards(builder);
            const { cards, decks } = builder.build();
            const cardIds = cards.map((c) => c.id);

            expect(new Set(cardIds).size).toBe(cardIds.length);
            expect(cards.every((c) => c.deckId === decks[0].id)).toBe(true);
            expect([...decks[0].cards].sort()).toEqual([...cardIds].sort());
        });

        it("should not create ships until loadShips is called", () => {
            const builder = new GameStateBuilder();
            loadPlayerCards(builder);

            expect(builder.build().ships).toEqual([]);
        });

        it("should keep each player's cards in their own deck", () => {
            const builder = new GameStateBuilder();
            loadPlayerCards(builder);
            loadPlayerCards(builder, player2);
            const { cards, decks } = builder.build();

            expect(cards).toHaveLength(defaultCardCount * 2);
            decks.forEach((deck) => {
                const deckCardIds = cards.filter((c) => c.deckId === deck.id).map((c) => c.id);
                expect([...deck.cards].sort()).toEqual(deckCardIds.sort());
                expect(deck.cards).toHaveLength(defaultCardCount);
            });
        });

        it("should build the cards from an overridden faction deck", () => {
            const builder = new GameStateBuilder().overrideConfig({
                factionConfig: {
                    [faction]: {
                        deck: [
                            { kind: CardKind.Ship, refNo: SHIP_REF_NO.tudf_flagship0, count: 1 },
                            { kind: CardKind.Support, refNo: SUPPORT_REF_NO.inspire, count: 3 },
                        ],
                    },
                },
            } as Partial<IGameConfig>);
            loadPlayerCards(builder);

            expect(builder.build().cards.map((c) => c.refNo)).toEqual([
                SHIP_REF_NO.tudf_flagship0,
                SUPPORT_REF_NO.inspire,
                SUPPORT_REF_NO.inspire,
                SUPPORT_REF_NO.inspire,
            ]);
        });
    });

    describe("loadShips", () => {
        it("should create a ship for every ship card, linked by the card's instanceId", () => {
            const builder = new GameStateBuilder();
            loadPlayerShips(builder);
            const { ships, cards } = builder.build();
            const shipCards = cards.filter((c) => c.kind === CardKind.Ship);

            expect(ships.map((s) => s.id)).toEqual(shipCards.map((c) => c.instanceId));
            expect(ships.map((s) => s.refNo)).toEqual(shipCards.map((c) => c.refNo));
            expect(new Set(ships.map((s) => s.id)).size).toBe(shipCards.length);
        });

        it("should build an undeployed ship from the ships config", () => {
            const builder = new GameStateBuilder();
            loadPlayerShips(builder);
            const { ships, cards } = builder.build();
            const card = cards.find((c) => c.refNo === SHIP_REF_NO.tudf_destroyer0);
            const shipTemplate = DEFAULT_CONFIG.shipsConfig[SHIP_REF_NO.tudf_destroyer0];

            expect(ships.find((s) => s.id === card?.instanceId)).toEqual({
                ...shipTemplate,
                id: card?.instanceId,
                playerId: "p1",
                hulls: [],
                remainingMovement: shipTemplate.movementRange,
                remainingAttacks: shipTemplate.attackCountMax,
                destroyed: false,
                deployed: false,
            });
        });

        it("should link the ships to the player", () => {
            const builder = new GameStateBuilder();
            loadPlayerShips(builder);
            const { ships, players } = builder.build();

            expect(ships.every((s) => s.playerId === "p1")).toBe(true);
            expect(players[0].ships).toEqual(ships.map((s) => s.id));
        });

        it("should keep each player's ships separate", () => {
            const builder = new GameStateBuilder();
            loadPlayerShips(builder);
            loadPlayerShips(builder, player2);
            const { ships, players } = builder.build();

            players.forEach((player) => {
                expect(player.ships).toEqual(ships.filter((s) => s.playerId === player.id).map((s) => s.id));
                expect(player.ships).toHaveLength(ships.length / 2);
            });
        });

        it("should build the ships from an overridden ships config", () => {
            const builder = new GameStateBuilder().overrideConfig({
                shipsConfig: {
                    [SHIP_REF_NO.tudf_frigate0]: { movementRange: 9, attackCountMax: 3, commandPointCost: 0 },
                },
            } as Partial<IGameConfig>);
            loadPlayerShips(builder);
            const { ships } = builder.build();
            const frigates = ships.filter((s) => s.refNo === SHIP_REF_NO.tudf_frigate0);
            const destroyer = ships.find((s) => s.refNo === SHIP_REF_NO.tudf_destroyer0);

            frigates.forEach((frigate) => {
                expect(frigate).toMatchObject({
                    movementRange: 9,
                    remainingMovement: 9,
                    attackCountMax: 3,
                    remainingAttacks: 3,
                    commandPointCost: 0,
                });
            });
            expect(destroyer?.movementRange).toBe(
                DEFAULT_CONFIG.shipsConfig[SHIP_REF_NO.tudf_destroyer0].movementRange,
            );
        });

        it("should only create ships for the ship cards of an overridden faction deck", () => {
            const builder = new GameStateBuilder().overrideConfig({
                factionConfig: {
                    [faction]: {
                        deck: [
                            { kind: CardKind.Ship, refNo: SHIP_REF_NO.tudf_flagship0, count: 1 },
                            { kind: CardKind.Support, refNo: SUPPORT_REF_NO.inspire, count: 3 },
                        ],
                    },
                },
            } as Partial<IGameConfig>);
            loadPlayerShips(builder);

            expect(builder.build().ships.map((s) => s.refNo)).toEqual([SHIP_REF_NO.tudf_flagship0]);
        });

        it("should let the flagship card in the starting hand be played to deploy its ship", () => {
            const builder = new GameStateBuilder().loadCode("ABCD").loadMap();
            loadPlayerHand(builder);
            loadPlayerHand(builder, player2);
            const gameState = builder.build({ initiative: "p1", currentRound: 1 });
            const [flagshipCardId] = gameState.players[0].hand;
            const flagshipCard = gameState.cards.find((c) => c.id === flagshipCardId);

            const next = new ActionResolver("p1", new GameState(gameState)).resolveAction({
                id: "play-flagship",
                type: ActionTypes.PLAY_CARD,
                playerId: "p1",
                round: 1,
                order: 0,
                commandPointCost: 0,
                cardId: flagshipCardId,
                payload: { kind: "Ship", location: [1, 0] },
            } as IPlayCardAction);
            const flagship = next.ships.find((s) => s.id === flagshipCard?.instanceId);

            expect(flagship?.deployed).toBe(true);
            expect(next.hulls?.filter((h) => h.shipId === flagship?.id)).toHaveLength(
                flagship?.hullTemplates.length ?? 0,
            );
            expect(next.players.find((p) => p.id === "p1")?.hand).not.toContain(flagshipCardId);
        });
    });

    describe("loadShipCard", () => {
        it("should build a ship card from the ships config", () => {
            const builder = new GameStateBuilder();
            loadPlayerCards(builder);
            const { cards, decks } = builder.build();
            const card = cards.find((c) => c.refNo === SHIP_REF_NO.tudf_destroyer0);

            expect(card).toEqual({
                id: expect.stringMatching(/^uuid-/),
                deckId: decks[0].id,
                instanceId: expect.stringMatching(/^uuid-/),
                kind: CardKind.Ship,
                refNo: SHIP_REF_NO.tudf_destroyer0,
                name: DEFAULT_CONFIG.shipsConfig[SHIP_REF_NO.tudf_destroyer0].name,
            });
        });

        it("should build a ship card from an overridden ships config", () => {
            const builder = new GameStateBuilder().overrideConfig({
                shipsConfig: { [SHIP_REF_NO.tudf_destroyer0]: { name: "Custom Destroyer" } },
            } as Partial<IGameConfig>);
            loadPlayerCards(builder);
            const { cards } = builder.build();
            const destroyers = cards.filter((c) => c.refNo === SHIP_REF_NO.tudf_destroyer0);
            const frigate = cards.find((c) => c.refNo === SHIP_REF_NO.tudf_frigate0);

            expect(destroyers.every((c) => c.name === "Custom Destroyer")).toBe(true);
            expect(frigate?.name).toBe(DEFAULT_CONFIG.shipsConfig[SHIP_REF_NO.tudf_frigate0].name);
        });
    });

    describe("loadSupportCard", () => {
        it("should build a support card from the supports and effects configs", () => {
            const builder = new GameStateBuilder();
            loadPlayerCards(builder);
            const { cards, decks } = builder.build();
            const card = cards.find((c) => c.refNo === SUPPORT_REF_NO.inspire);
            const inspireConfig = DEFAULT_CONFIG.supportsConfig[SUPPORT_REF_NO.inspire];

            expect(card).toEqual({
                id: expect.stringMatching(/^uuid-/),
                deckId: decks[0].id,
                instanceId: expect.stringMatching(/^uuid-/),
                kind: CardKind.Support,
                refNo: SUPPORT_REF_NO.inspire,
                name: inspireConfig.name,
                description: inspireConfig.description,
                commandPointCost: inspireConfig.commandPointCost,
                effectTemplates: [
                    { ...DEFAULT_CONFIG.effectsConfig[EFFECT_REF_NO.gainCommandPoint], commandPointAmount: 1 },
                ],
                imgSrc: inspireConfig.imgSrc,
            });
        });

        it("should build a support card from an overridden supports config", () => {
            const builder = new GameStateBuilder().overrideConfig({
                supportsConfig: { [SUPPORT_REF_NO.flare]: { name: "Custom Flare", commandPointCost: 3 } },
            } as Partial<IGameConfig>);
            loadPlayerCards(builder);
            const flare = builder.build().cards.find((c) => c.refNo === SUPPORT_REF_NO.flare);

            expect(flare).toMatchObject({
                name: "Custom Flare",
                commandPointCost: 3,
                description: DEFAULT_CONFIG.supportsConfig[SUPPORT_REF_NO.flare].description,
            });
        });

        it("should resolve effect templates from the overridden effects config", () => {
            const builder = new GameStateBuilder().overrideConfig({
                effectsConfig: { [EFFECT_REF_NO.flarePersistent]: { duration: 7 } },
            } as Partial<IGameConfig>);
            loadPlayerCards(builder);
            const flare = builder.build().cards.find((c) => c.refNo === SUPPORT_REF_NO.flare);

            expect(flare?.effectTemplates).toMatchObject([{ refNo: EFFECT_REF_NO.flarePersistent, duration: 7 }]);
        });

        it("should let the support's effect override win over the effects config", () => {
            const builder = new GameStateBuilder().overrideConfig({
                effectsConfig: { [EFFECT_REF_NO.gainCommandPoint]: { commandPointAmount: 4, duration: 2 } },
            } as Partial<IGameConfig>);
            loadPlayerCards(builder);
            const inspire = builder.build().cards.find((c) => c.refNo === SUPPORT_REF_NO.inspire);

            expect(inspire?.effectTemplates).toMatchObject([{ commandPointAmount: 1, duration: 2 }]);
        });

        it("should throw when a support references an effect missing from the config", () => {
            const builder = new GameStateBuilder().overrideConfig({
                supportsConfig: { [SUPPORT_REF_NO.flare]: { effectTemplates: [{ refNo: "missing_effect" }] } },
            } as Partial<IGameConfig>);

            expect(() => loadPlayerCards(builder)).toThrow("missing_effect");
        });
    });

    describe("loadHand", () => {
        it("should draw the player's max hand size from their deck into their hand", () => {
            const builder = new GameStateBuilder();
            loadPlayerHand(builder);
            const { players, cards } = builder.build();
            const cardIds = cards.map((c) => c.id);

            expect(players[0].hand).toHaveLength(defaultPlayerConfig.maxHandSize);
            expect(players[0].hand.every((id) => cardIds.includes(id))).toBe(true);
        });

        it("should remove the drawn cards from the deck", () => {
            const builder = new GameStateBuilder();
            loadPlayerHand(builder);
            const { players, cards, decks } = builder.build();

            expect(decks[0].cards).toHaveLength(defaultCardCount - defaultPlayerConfig.maxHandSize);
            expect([...players[0].hand, ...decks[0].cards].sort()).toEqual(cards.map((c) => c.id).sort());
        });

        it("should always start the flagship card in hand", () => {
            Array.from({ length: 10 }).forEach(() => {
                const builder = new GameStateBuilder();
                loadPlayerHand(builder);
                const { players, cards } = builder.build();
                const flagshipCard = cards.find((c) => c.refNo === SHIP_REF_NO.tudf_flagship0);

                expect(players[0].hand[0]).toBe(flagshipCard?.id);
            });
        });

        it("should persist the rest of the deck in its shuffled order", () => {
            const builder = new GameStateBuilder();
            loadPlayerHand(builder, player1, () => 0);
            const { players, cards, decks } = builder.build();
            const unshuffledRest = cards.map((c) => c.id).filter((id) => !players[0].hand.includes(id));

            expect(decks[0].cards).toHaveLength(unshuffledRest.length);
            expect(decks[0].cards).not.toEqual(unshuffledRest);
        });

        it("should keep the hand and deck pointing at the exact cards that were loaded", () => {
            const builder = new GameStateBuilder();
            loadPlayerHand(builder);
            const gameState = builder.build();
            const [player] = gameState.players;
            const [deck] = gameState.decks;
            const drawnIds = [...player.hand, ...deck.cards];

            expect(new Set(drawnIds).size).toBe(drawnIds.length);
            expect([...drawnIds].sort()).toEqual(gameState.cards.map((c) => c.id).sort());

            const rehydrated = new GameState(gameState).toPlain();

            expect(rehydrated.cards).toEqual(gameState.cards);
            expect(rehydrated.decks).toEqual(gameState.decks);
            expect(rehydrated.players[0].hand).toEqual(player.hand);
        });

        it("should shuffle with the given rng", () => {
            const seed = [0.1, 0.5, 0.9, 0.3, 0.7];
            const builderA = new GameStateBuilder();
            const builderB = new GameStateBuilder();
            const builderC = new GameStateBuilder();
            loadPlayerHand(builderA, player1, seededRng(seed));
            loadPlayerHand(builderB, player1, seededRng(seed));
            loadPlayerHand(builderC, player1, () => 0);

            expect(getDrawOrder(builderA)).toEqual(getDrawOrder(builderB));
            expect(getDrawOrder(builderA)).not.toEqual(getDrawOrder(builderC));
        });

        it("should draw the whole deck when it is smaller than the max hand size", () => {
            const builder = new GameStateBuilder().overrideConfig({
                factionConfig: {
                    [faction]: { deck: [{ kind: CardKind.Support, refNo: SUPPORT_REF_NO.flare, count: 2 }] },
                },
            } as Partial<IGameConfig>);
            loadPlayerHand(builder);
            const { players, cards, decks } = builder.build();

            expect([...players[0].hand].sort()).toEqual(cards.map((c) => c.id).sort());
            expect(decks[0].cards).toEqual([]);
        });

        it("should draw the overridden max hand size", () => {
            const builder = new GameStateBuilder().overrideConfig({
                playersConfig: { [PLAYER_REF_NO.default]: { maxHandSize: 2 } },
            } as Partial<IGameConfig>);
            loadPlayerHand(builder);

            expect(builder.build().players[0].hand).toHaveLength(2);
        });

        it("should draw each player's hand from their own deck", () => {
            const builder = new GameStateBuilder();
            loadPlayerHand(builder);
            loadPlayerHand(builder, player2);
            const { players, cards } = builder.build();

            players.forEach((player) => {
                const handCards = cards.filter((c) => player.hand.includes(c.id));
                expect(handCards).toHaveLength(defaultPlayerConfig.maxHandSize);
                expect(handCards.every((c) => c.deckId === player.deck)).toBe(true);
            });
        });
    });

    describe("setCurrentPlayer", () => {
        it("should return the builder when the player exists", () => {
            const builder = new GameStateBuilder();
            builder.loadEmptyNewPlayer(player1);

            expect(builder.setCurrentPlayer("p1")).toBe(builder);
        });

        it("should throw when the player does not exist", () => {
            expect(() => new GameStateBuilder().setCurrentPlayer("missing")).toThrow("missing");
        });
    });

    describe("build", () => {
        it("should let the override win over the loaded state", () => {
            const gameState = new GameStateBuilder().loadCode("ABCD").build({ initiative: "p1", currentRound: 3 });

            expect(gameState).toMatchObject({ code: "ABCD", initiative: "p1", currentRound: 3 });
        });
    });
});
