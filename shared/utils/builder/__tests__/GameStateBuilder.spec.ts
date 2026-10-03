import {
    CELL_NODE_REF_NO,
    DEFAULT_CONFIG,
    EFFECT_REF_NO,
    Faction,
    MAP_REF_NO,
    SUPPORT_REF_NO,
} from "@shared/config/constants";
import { GameStateBuilder } from "../GameStateBuilder";

describe("GameStateBuilder", () => {
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
                } as Parameters<GameStateBuilder["overrideConfig"]>[0])
                .loadMap()
                .build();

            expect(Object.keys(board)).toHaveLength(12);
            expect(board["2/2"]).toMatchObject({ refNo: CELL_NODE_REF_NO.island0, imgSrc: "custom-island.png" });
        });
    });

    describe("loadSupportCard", () => {
        it("should resolve effect templates from the overridden effects config", () => {
            const builder = new GameStateBuilder().overrideConfig({
                effectsConfig: { [EFFECT_REF_NO.flarePersistent]: { duration: 7 } },
            } as Parameters<GameStateBuilder["overrideConfig"]>[0]);
            builder
                .loadEmptyNewPlayer({ id: "p1", name: "Player 1", order: 0 })
                .loadFaction(Faction.THE_UNITED_DEFENSE_FLEET)
                .loadDeck("")
                .loadCards();

            const flare = builder.build().cards.find((c) => c.refNo === SUPPORT_REF_NO.flare);

            expect(flare?.effectTemplates).toMatchObject([{ refNo: EFFECT_REF_NO.flarePersistent, duration: 7 }]);
        });
    });
});
