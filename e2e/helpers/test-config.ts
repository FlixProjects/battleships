import { mergician } from "mergician";
import type { IGameConfig } from "../../shared/types/config-types";

type TDeepPartial<T> = T extends object ? { [K in keyof T]?: TDeepPartial<T[K]> } : T;

export type TConfigOverride = TDeepPartial<IGameConfig>;

// The game the e2e specs play. Every game is created and joined with this config, so the
// specs' tile ids, ranges and decks hold whatever the app's defaults become.

export const TEST_BOARD = { rows: 7, columns: 5 };

const ISLAND_TILES = ["2/2", "2/4"];

const boardNodes = () => {
    const nodes: NonNullable<NonNullable<NonNullable<TConfigOverride["boardConfig"]>["default"]>["nodes"]> = {};
    for (let col = 0; col < TEST_BOARD.columns; col++) {
        for (let row = 0; row < TEST_BOARD.rows; row++) {
            const tileId = `${col}/${row}`;
            nodes[tileId] = { refNo: ISLAND_TILES.includes(tileId) ? "island0" : "default", location: [col, row] };
        }
    }
    return nodes;
};

export const TEST_DECK = [
    { kind: "Ship" as const, refNo: "tudf_flagship0" as const, count: 1 },
    { kind: "Ship" as const, refNo: "tudf_frigate0" as const, count: 4 },
    { kind: "Ship" as const, refNo: "tudf_destroyer0" as const, count: 2 },
    { kind: "Support" as const, refNo: "flare" as const, count: 2 },
    { kind: "Support" as const, refNo: "inspire" as const, count: 1 },
    { kind: "Support" as const, refNo: "airstrike" as const, count: 1 },
];

export const TEST_CONFIG: TConfigOverride = {
    boardConfig: {
        default: { ...TEST_BOARD, nodes: boardNodes() },
    },
    cellConfig: {
        default: { refNo: "default" },
        island0: { refNo: "island0", imgSrc: "assets/terrain/island0.png" },
    },
    playersConfig: {
        default: { maxCommandPoints: 2, commandPoints: 2, maxHandSize: 4 },
    },
    factionConfig: {
        THE_UNITED_DEFENSE_FLEET: { name: "The United Defense Fleet", deck: TEST_DECK },
    },
    shipsConfig: {
        tudf_flagship0: {
            refNo: "tudf_flagship0",
            name: "L03-Kingmaker",
            description: "The flagship: long ranged, two hulls, and the game is lost with it.",
            deployed: false,
            dimensions: [1, 1],
            commandPointCost: 0,
            movementRange: 1,
            movementCommandPointCost: 1,
            attackCountMax: 1,
            attackCommandPointCost: 1,
            attackRange: 5,
            attackDamage: 2,
            attackMinRange: 3,
            isFlagship: true,
            iconImgName: "tudf_flagship0",
            renderScale: 0.8,
            hullTemplates: [
                {
                    templateLocation: [0, 0],
                    maxHealth: 2,
                    armor: 1,
                    visionRange: 2,
                    imgSrc: "assets/ships/tudf_flagship0-0.png",
                    orientation: 0,
                },
                {
                    templateLocation: [0, 1],
                    maxHealth: 2,
                    armor: 1,
                    visionRange: 2,
                    imgSrc: "assets/ships/tudf_flagship0-1.png",
                    front: true,
                    orientation: 0,
                },
            ],
        },
        tudf_frigate0: {
            refNo: "tudf_frigate0",
            name: "S12-Warrior",
            description: "A fast, fragile scout.",
            deployed: false,
            dimensions: [1, 1],
            commandPointCost: 1,
            movementRange: 3,
            movementCommandPointCost: 1,
            attackCountMax: 1,
            attackCommandPointCost: 1,
            attackRange: 3,
            attackDamage: 1,
            attackMinRange: 1,
            isFlagship: false,
            iconImgName: "tudf_frigate0",
            renderScale: 0.6,
            hullTemplates: [
                {
                    templateLocation: [0, 0],
                    maxHealth: 1,
                    armor: 0,
                    visionRange: 2,
                    imgSrc: "assets/ships/tudf_frigate-0.png",
                    front: true,
                    orientation: 0,
                },
            ],
        },
        tudf_destroyer0: {
            refNo: "tudf_destroyer0",
            name: "M07-Knight",
            description: "An armoured escort.",
            deployed: false,
            dimensions: [1, 1],
            commandPointCost: 1,
            movementRange: 2,
            movementCommandPointCost: 1,
            attackCountMax: 1,
            attackCommandPointCost: 1,
            attackRange: 3,
            attackDamage: 1,
            attackMinRange: 1,
            isFlagship: false,
            iconImgName: "tudf_destroyer0",
            renderScale: 0.8,
            hullTemplates: [
                {
                    templateLocation: [0, 0],
                    maxHealth: 2,
                    armor: 1,
                    visionRange: 2,
                    imgSrc: "assets/ships/tudf_destroyer0-0.png",
                    front: true,
                    orientation: 0,
                },
            ],
        },
    },
    supportsConfig: {
        flare: {
            refNo: "flare",
            name: "Flare",
            description: "Reveals the area around a tile for a couple of rounds.",
            commandPointCost: 1,
            effectTemplates: [{ refNo: "flare_persistent" }],
            imgSrc: "flare.png",
        },
        inspire: {
            refNo: "inspire",
            name: "Inspire",
            description: "Grants an extra command point.",
            commandPointCost: 0,
            effectTemplates: [{ refNo: "gain_command_point", commandPointAmount: 1 }],
            imgSrc: "inspire.png",
        },
        airstrike: {
            refNo: "airstrike",
            name: "Airstrike",
            description: "Marks a 3-tile line that takes 1 damage next round.",
            commandPointCost: 1,
            effectTemplates: [{ refNo: "airstrike" }],
            imgSrc: "airstrike.png",
        },
    },
    effectsConfig: {
        flare_persistent: {
            refNo: "flare_persistent",
            kind: "vision",
            anchor: "any_tile",
            range: 2,
            duration: 2,
            existsOnBoard: true,
        },
        gain_command_point: {
            refNo: "gain_command_point",
            kind: "command_point",
            anchor: "flagship",
            commandPointAmount: 1,
            duration: 0,
            existsOnBoard: false,
        },
        airstrike: {
            refNo: "airstrike",
            kind: "damage",
            anchor: "any_tile",
            range: 1,
            damage: 1,
            duration: 1,
            existsOnBoard: true,
            imgSrc: "warning-icon.png",
        },
    },
};

// Layers a spec's own override over the test config, merged the way the backend merges it
export const withTestConfig = (override: TConfigOverride = {}): TConfigOverride =>
    mergician(TEST_CONFIG, override) as TConfigOverride;
