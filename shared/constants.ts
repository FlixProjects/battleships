import { AppStatus, IAppState, IGameState, IHullTemplate, IShipTemplate } from "./types";

export const FP_AUTH_TOKEN = "fp-auth-token";
export const FP_USER_ID = "fp-user-id";

export const FP_GAME_STATE = "fp-game-state";
export const FP_GAME_CODE = "fp-game-code";

export const FP_CURRENT_PLAYER = "fp-current-player";
export const FP_PLAYER_STATES = "fp-player-states";

export const LOCAL_TEMP_PLAYER_ID = "temp-id";

export const INITIAL_GAME_STATE: IGameState = {
    code: "",
    players: [],
    ships: [],
    hulls: [],
    board: { grid: [] },
    winners: [],
    isOver: false,
    currentRound: 0,
};

export const DEFAULT_APP_STATE: IAppState = {
    status: AppStatus.NewGame,
    loading: true,
    gameState: INITIAL_GAME_STATE,
};

export const BOARD_ROWS = 10;
export const BOARD_COLUMNS = 7;
export const CELL_SEPARATOR = "/";
export const TILE_SIZE_PX = 48;
export const TILE_GAP_PX = 2;

export const SHIP_REF_NO = {
    frigate0: "frigate0",
    flagship0: "flagship0",
} as const;

export type TShipRefNo = (typeof SHIP_REF_NO)[keyof typeof SHIP_REF_NO];

export const HULLS_CONFIG: Record<TShipRefNo, IHullTemplate[]> = {
    [SHIP_REF_NO.frigate0]: [
        {
            templateLocation: [0, 0],
            maxHealth: 1,
            armor: 0,
            visionRange: 2,
        },
    ],
    [SHIP_REF_NO.flagship0]: [
        {
            templateLocation: [0, 0],
            maxHealth: 1,
            armor: 0,
            visionRange: 2,
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

export const COLOR = {
    TEAL: "teal",
    ORANGE: "orange",
    PINK: "pink",
    RED: "red",
} as const;
export type TColor = (typeof COLOR)[keyof typeof COLOR];

export const COLOR_FILTER = {
    [COLOR.TEAL]:
        "brightness(0) saturate(100%) invert(83%) sepia(10%) saturate(1623%) hue-rotate(101deg) brightness(97%) contrast(91%)",
    [COLOR.ORANGE]:
        "brightness(0) saturate(100%) invert(91%) sepia(13%) saturate(4577%) hue-rotate(332deg) brightness(96%) contrast(100%)",
    [COLOR.PINK]:
        "brightness(0) saturate(100%) invert(55%) sepia(16%) saturate(4155%) hue-rotate(292deg) brightness(94%) contrast(84%)",
    [COLOR.RED]:
        "brightness(0) saturate(100%) invert(27%) sepia(98%) saturate(7426%) hue-rotate(358deg) brightness(98%) contrast(118%)",
};

export const COLOR_RGB_VALUE = {
    [COLOR.TEAL]: "110, 231, 183",
    [COLOR.ORANGE]: "245, 181, 44",
    [COLOR.PINK]: "221, 94, 170",
};

export const COLOR_RGBA = {
    [COLOR.TEAL]: `rgba(${COLOR_RGB_VALUE[COLOR.TEAL]}, 1)`,
    [COLOR.ORANGE]: `rgba(${COLOR_RGB_VALUE[COLOR.ORANGE]}, 1)`,
    [COLOR.PINK]: `rgba(${COLOR_RGB_VALUE[COLOR.PINK]}, 1)`,
};

export const SELECTABLE_ID = {
    ACTION_MENU: "action-menu",
};

export const ASSET_PATHS = {
    TARGET_ICON: "./assets/attack-icon.png",
    MOVE_ICON: "./assets/move-icon.svg",
};

export const ANIMATION_LAYER_ID = "gameBoardContainer";
export const GAME_BOARD_ID = "gameBoard";

export const ERROR_CODE = {
    SYS_NOT_FOUND: "SYS_NOT_FOUND",
    SYS_INVALID_PARAMS: "SYS_INVALID_PARAMS",
    MOVE_ERROR_LOCATION_OCCUPIED: "MOVE_ERROR_LOCATION_OCCUPIED",
    MOVE_ERROR_INSUFFICIENT_MOVEMENT: "MOVE_ERROR_INSUFFICIENT_MOVEMENT",
} as const;
export type TErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];