import { GameState } from "../../shared";
import { appConfig } from "../config/app-config";
import { FP_GAME_CODE, FP_GAME_STATE } from "../constants";
import { AppStatus, IAppState } from "../types";
import { addPlayer } from "./add-player";
import { enableGameCodeCopy } from "./enable-game-code-copy";
import { PlayerNameInput } from "./PlayerNameInput";
import { RefreshButton } from "./RefreshButton";
import { StatusText } from "./StatusText";

const INITIAL_GAME_STATE: GameState = {
    code: "",
    players: [],
};

const DEFAULT_APP_STATE: IAppState = {
    status: AppStatus.Initialising,
    loading: true,
    gameState: INITIAL_GAME_STATE,
};

let _state: IAppState = DEFAULT_APP_STATE;

const isLocal = appConfig.deployEnv === "local";

const _components = {
    refreshBtn: new RefreshButton(),
    statusEl: new StatusText(),
    playerNameInput: new PlayerNameInput(),
};

export const getComponents = () => {
    const button = { ...getStaticComponents().button };
    const span = { ...getStaticComponents().span };
    const input = { ...getStaticComponents().input };

    return { button, span, input };
};

const getStaticComponents = () => {
    // TODO: eventually convert to class components (am I just building React from scratch?)
    // Buttons
    const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
    const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;
    // Spans
    const gameCodeEl = document.getElementById("gameCode") as HTMLSpanElement;

    // Inputs
    const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;

    return {
        button: {
            joinGame: joinGameBtn,
            createGame: createGameBtn,
            refresh: _components.refreshBtn,
        },
        span: {
            gameCode: gameCodeEl,
            status: _components.statusEl,
        },
        input: {
            joinCode: joinCodeInput,
            playerName: _components.playerNameInput,
        },
    };
};

// TODO: We should be automating updateComponent calls instead of manually calling them
export const updateComponents = (incomingState: Partial<IAppState>) => {
    _state = { ..._state, ...incomingState };

    updateJoinButton();
    updateCreateButton();
    updateGameCodeSpan();
    updatePlayers();

    Object.values(getComponents()).forEach((typeOfComponent) => {
        Object.values(typeOfComponent).forEach((component) => {
            if (component.updateState) {
                component.updateState(_state);
            }
        });
    });
};

const updatePlayers = () => {
    const playerComponents = document.getElementsByClassName("player-container"); // TODO: make this a constant

    Array.from(playerComponents).forEach((el) => el.remove());

    _state.gameState?.players.forEach((player) => {
        addPlayer(player.id, player.name);
    });
};

const updateJoinButton = () => {
    const element = getComponents().button.joinGame;
    const { status, loading, gameState } = _state;

    if (status === AppStatus.Initialised) {
        const gameCode = gameState.code;

        if (isLocal) {
            sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameState));
        }
        sessionStorage.setItem(FP_GAME_CODE, gameCode);

        element.disabled = true;
    }

    if (status === AppStatus.NewGame) {
        element.disabled = false;
    }
};

const updateCreateButton = () => {
    const element = getComponents().button.createGame;
    const { status, loading, gameState } = _state;

    if (status === AppStatus.Initialised) {
        const gameCode = gameState.code;

        if (isLocal) {
            sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameState));
        }
        sessionStorage.setItem(FP_GAME_CODE, gameCode);

        if (gameCode) {
            enableGameCodeCopy();
        }
        element.disabled = true;
    }

    if (status === AppStatus.NewGame) {
        element.disabled = false;
    }
};

const updateGameCodeSpan = () => {
    const element = getComponents().span.gameCode;
    const { status, loading, gameState } = _state;

    if (status === AppStatus.Initialised) {
        element.innerText = gameState.code;
    }

    if (status === AppStatus.Error) {
        element.innerHTML = "error";
    }
};
