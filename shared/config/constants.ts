import {
    DeckTemplate,
    EffectAnchor,
    EffectKind,
    IBoardConfig,
    IEffectTemplate,
    IHullTemplate,
    IShipTemplate,
    ISupportConfig,
    ICellNodeConfig,
    TCellNodeRefNo,
    TEffectRefNo,
    TFaction,
    TMapRefNo,
    TShipRefNo,
    TSupportRefNo,
    TSupportConfig,
} from "../types";

export const CELL_SEPARATOR = "/";

export const BOARD_ROWS = 7;
export const BOARD_COLUMNS = 5;

export const AppStatus = {
    NewGame: "NewGame",
    Initialising: "Initialising",
    Initialised: "Initialised",
    Error: "Error",
    WaitingForPlayers: "WaitingForPlayers",
    WaitingForOtherPlayer: "WaitingForOtherPlayer",
    ReadyToSubmit: "ReadyToSubmit",
    GameOver: "GameOver",
} as const;

export const SHIP_REF_NO = {
    frigate0: "frigate0",
    flagship0: "flagship0",
    tudf_frigate0: "tudf_frigate0",
    tudf_flagship0: "tudf_flagship0",
    tudf_destroyer0: "tudf_destroyer0",
} as const;

export const CardKind = {
    Ship: "Ship",
    Support: "Support",
} as const;

export const EFFECT_REF_NO = {
    flare: "flare",
    flarePersistent: "flare_persistent",
    gainCommandPoint: "gain_command_point",
    armorPiercingRounds: "armor_piercing_rounds",
    airstrike: "airstrike",
} as const;

export const SUPPORT_REF_NO = {
    flare: "flare",
    inspire: "inspire",
    airstrike: "airstrike",
} as const;

export const MAP_REF_NO = {
    default: "default",
} as const;

export const CELL_NODE_REF_NO = {
    default: "default",
    island0: "island0",
} as const;

export const Faction = {
    THE_UNITED_DEFENSE_FLEET: "THE_UNITED_DEFENSE_FLEET",
} as const;

export const HULLS_CONFIG: Record<TShipRefNo, IHullTemplate[]> = {
    // TODO: deprecate
    [SHIP_REF_NO.frigate0]: [
        {
            templateLocation: [0, 0],
            maxHealth: 1,
            armor: 0,
            visionRange: 2,
            imgSrc: "assets/ships/frigate0.png",
            front: true,
            orientation: 0,
        },
    ],
    // TODO: deprecate
    [SHIP_REF_NO.flagship0]: [
        {
            templateLocation: [0, 0],
            maxHealth: 1,
            armor: 0,
            visionRange: 2,
            imgSrc: "assets/ships/flagship-0.png",
            orientation: 0,
        },
        {
            templateLocation: [0, 1],
            maxHealth: 1,
            armor: 0,
            visionRange: 2,
            imgSrc: "assets/ships/flagship-1.png",
            front: true,
            orientation: 0,
        },
    ],
    [SHIP_REF_NO.tudf_frigate0]: [
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
    [SHIP_REF_NO.tudf_flagship0]: [
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
    [SHIP_REF_NO.tudf_destroyer0]: [
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
};

export const SHIPS_CONFIG: Record<TShipRefNo, IShipTemplate> = {
    [SHIP_REF_NO.frigate0]: {
        refNo: SHIP_REF_NO.frigate0,
        name: "Frigate",
        description: "A nimble scout. Short range but quick to reposition, ideal for screening and harassing.",
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
        hullTemplates: HULLS_CONFIG[SHIP_REF_NO.frigate0],
        isFlagship: false,
        iconImgName: "frigate0",
    },
    [SHIP_REF_NO.flagship0]: {
        refNo: SHIP_REF_NO.flagship0,
        name: "Flagship",
        description: "Your command vessel. Long-ranged and durable across two hulls — lose it and you lose the game.",
        deployed: false,
        dimensions: [1, 1],
        commandPointCost: 0,
        movementRange: 1,
        movementCommandPointCost: 1,
        attackCountMax: 1,
        attackCommandPointCost: 1,
        attackRange: 5,
        attackDamage: 1,
        attackMinRange: 1,
        hullTemplates: HULLS_CONFIG[SHIP_REF_NO.flagship0],
        isFlagship: true,
        iconImgName: "flagship0",
        renderScale: 0.8,
    },
    [SHIP_REF_NO.tudf_frigate0]: {
        refNo: SHIP_REF_NO.tudf_frigate0,
        name: "S12-Warrior",
        description: "A nimble scout. Short range but quick to reposition, ideal for screening and harassing.",
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
        hullTemplates: HULLS_CONFIG[SHIP_REF_NO.tudf_frigate0],
        isFlagship: false,
        iconImgName: "tudf_frigate0",
        renderScale: 0.3,
    },
    [SHIP_REF_NO.tudf_flagship0]: {
        refNo: SHIP_REF_NO.tudf_flagship0,
        name: "L03-Kingmaker",
        description: "The TUDF's most reliable flagship design - it boasts a high caliber and long ranged main cannon.",
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
        hullTemplates: HULLS_CONFIG[SHIP_REF_NO.tudf_flagship0],
        isFlagship: true,
        iconImgName: "tudf_flagship0",
        renderScale: 0.8,
    },
    [SHIP_REF_NO.tudf_destroyer0]: {
        refNo: SHIP_REF_NO.tudf_destroyer0,
        name: "M07-Knight",
        description:
            "The Knight class is the workhorse of the TUDF - armed with Armor-piercing rounds and thick Titasteel plating, they deliver their escorted ships to their destination without fail",
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
        hullTemplates: HULLS_CONFIG[SHIP_REF_NO.tudf_destroyer0],
        isFlagship: false,
        iconImgName: "tudf_destroyer0",
        renderScale: 0.8,
    },
};

export const EFFECTS_CONFIG: Record<TEffectRefNo, IEffectTemplate> = {
    [EFFECT_REF_NO.flare]: {
        refNo: EFFECT_REF_NO.flare,
        kind: EffectKind.Vision,
        anchor: EffectAnchor.AnyTile,
        range: 2,
        duration: 0,
        existsOnBoard: true,
    },
    [EFFECT_REF_NO.flarePersistent]: {
        refNo: EFFECT_REF_NO.flarePersistent,
        kind: EffectKind.Vision,
        anchor: EffectAnchor.AnyTile,
        range: 2,
        duration: 2,
        existsOnBoard: true,
    },
    [EFFECT_REF_NO.gainCommandPoint]: {
        refNo: EFFECT_REF_NO.gainCommandPoint,
        kind: EffectKind.CommandPoint,
        anchor: EffectAnchor.Flagship,
        commandPointAmount: 1,
        duration: 0,
        existsOnBoard: false,
    },
    [EFFECT_REF_NO.armorPiercingRounds]: {
        refNo: EFFECT_REF_NO.armorPiercingRounds,
        kind: EffectKind.AttackBuff,
        existsOnBoard: false,
    },
    [EFFECT_REF_NO.airstrike]: {
        refNo: EFFECT_REF_NO.airstrike,
        kind: EffectKind.Damage,
        // Targeting is gated to the player's visible tiles by AirstrikeCard;
        // range only needs to be > 0 so the FE mounts the target-picker flow.
        anchor: EffectAnchor.AnyTile,
        range: 1,
        damage: 1,
        // Survives the round it is played, detonates on the next resolve's
        // persistent-effects tick, then removes itself (fires exactly once).
        duration: 1,
        existsOnBoard: true,
        imgSrc: "warning-icon.png",
    },
};

export const SUPPORTS_CONFIG: Record<TSupportRefNo, TSupportConfig> = {
    [SUPPORT_REF_NO.flare]: {
        refNo: SUPPORT_REF_NO.flare,
        name: "Flare",
        description: "Illuminate a target area, revealing enemy ships within range for a couple of rounds.",
        commandPointCost: 1,
        effectTemplates: [{ refNo: EFFECT_REF_NO.flarePersistent }],
        imgSrc: "flare.png",
    },
    [SUPPORT_REF_NO.inspire]: {
        refNo: SUPPORT_REF_NO.inspire,
        name: "Inspire",
        description:
            "TUDF commanders go through the toughest leadership training to ensure they can lead under pressure.",
        commandPointCost: 0,
        effectTemplates: [{ refNo: EFFECT_REF_NO.gainCommandPoint, commandPointAmount: 1 }],
        imgSrc: "inspire.png",
    },
    [SUPPORT_REF_NO.airstrike]: {
        refNo: SUPPORT_REF_NO.airstrike,
        name: "Airstrike",
        description:
            "Paint a 3-tile line for orbital bombardment. The strike lands next turn, dealing 1 damage to any ship caught under the markers — friend or foe.",
        commandPointCost: 1,
        effectTemplates: [{ refNo: EFFECT_REF_NO.airstrike }],
        imgSrc: "airstrike.png",
    },
};

export const MAX_HAND_SIZE = 4;

export const FACTION_CONFIG: Record<TFaction, DeckTemplate> = {
    [Faction.THE_UNITED_DEFENSE_FLEET]: [
        // Ships
        { kind: CardKind.Ship, refNo: SHIP_REF_NO.tudf_flagship0, count: 1 },
        { kind: CardKind.Ship, refNo: SHIP_REF_NO.tudf_frigate0, count: 4 },
        { kind: CardKind.Ship, refNo: SHIP_REF_NO.tudf_destroyer0, count: 2 },
        // Supports
        { kind: CardKind.Support, refNo: SUPPORT_REF_NO.flare, count: 2 },
        { kind: CardKind.Support, refNo: SUPPORT_REF_NO.inspire, count: 1 },
        { kind: CardKind.Support, refNo: SUPPORT_REF_NO.airstrike, count: 1 },
    ],
};

export const BOARD_CONFIG: Record<TMapRefNo, IBoardConfig> = {
    [MAP_REF_NO.default]: {
        rows: BOARD_ROWS,
        columns: BOARD_COLUMNS,
        nodes: {
            [`2${CELL_SEPARATOR}2`]: {
                id: "id",
                refNo: CELL_NODE_REF_NO.island0,
                location: [2, 2],
            },
            [`${BOARD_COLUMNS - 3}${CELL_SEPARATOR}${BOARD_ROWS - 3}`]: {
                id: "id",
                refNo: CELL_NODE_REF_NO.island0,
                location: [BOARD_COLUMNS - 3, BOARD_ROWS - 3],
            },
        },
    },
};

export const CELL_CONFIG: Record<TCellNodeRefNo, ICellNodeConfig> = {
    [CELL_NODE_REF_NO.default]: {
        refNo: CELL_NODE_REF_NO.default,
    },
    [CELL_NODE_REF_NO.island0]: {
        refNo: CELL_NODE_REF_NO.island0,
        imgSrc: "assets/terrain/island0.png",
    },
};
