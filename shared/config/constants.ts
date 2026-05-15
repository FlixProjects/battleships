import { TShipRefNo, IHullTemplate, IShipTemplate, TEffectRefNo, IEffectConfig, EffectKind, EffectAnchor, TSupportRefNo, ISupportConfig, DeckTemplate, TFaction } from "@shared/types";

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
} as const;

export const CardKind = {
    Ship: "Ship",
    Support: "Support",
} as const;

export const EFFECT_REF_NO = {
    flare: "flare",
    flarePersistent: "flare_persistent",
} as const;

export const SUPPORT_REF_NO = {
    flare: "flare",
} as const;

export const Faction = {
    THE_UNITED_FLEET: "THE_UNITED_FLEET",
} as const;

export const HULLS_CONFIG: Record<TShipRefNo, IHullTemplate[]> = {
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
};

export const SHIPS_CONFIG: Record<TShipRefNo, IShipTemplate> = {
    [SHIP_REF_NO.frigate0]: {
        refNo: SHIP_REF_NO.frigate0,
        name: "Frigate",
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
    },
    [SHIP_REF_NO.flagship0]: {
        refNo: SHIP_REF_NO.flagship0,
        name: "Flagship",
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
    },
};

export const EFFECTS_CONFIG: Record<TEffectRefNo, IEffectConfig> = {
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
        // Duration of 2 means: granted on action resolve, plus persists
        // through the next round's tick (expiresAfterRound = createdOnRound + 1).
        duration: 2,
        existsOnBoard: true,
    },
};

export const SUPPORTS_CONFIG: Record<TSupportRefNo, ISupportConfig> = {
    [SUPPORT_REF_NO.flare]: {
        refNo: SUPPORT_REF_NO.flare,
        name: "Flare",
        commandPointCost: 1,
        effects: [EFFECT_REF_NO.flarePersistent],
    },
};

export const MAX_HAND_SIZE = 4;

export const FACTION_CONFIG: Record<TFaction, DeckTemplate> = {
    [Faction.THE_UNITED_FLEET]: [
        // Ships
        { kind: CardKind.Ship, refNo: "flagship0", count: 1 },
        { kind: CardKind.Ship, refNo: "frigate0", count: 4 },
        // Supports
        { kind: CardKind.Support, refNo: "flare", count: 2 },
    ],
};
