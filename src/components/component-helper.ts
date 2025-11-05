import { AppStatus, GameState, IAppState } from "../types";

const INITIAL_GAME_STATE: GameState = {
    code: "",
    players: [],
};

const _state: IAppState = {
    status: AppStatus.Initialising,
    loading: true,
    gameState: INITIAL_GAME_STATE,
};

export const getComponents = () => {
    const button = { ...getStaticComponents().button };
    const span = { ...getStaticComponents().span };
    const input = { ...getStaticComponents().input };

    return { button, span, input };
};

const getStaticComponents = () => {
    // Buttons
    const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
    const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;

    // Spans
    const gameCodeEl = document.getElementById("gameCode") as HTMLSpanElement;

    // Inputs
    const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;
    const playerNameInput = document.getElementById("playerName") as HTMLInputElement;

    return {
        button: {
            joinGame: joinGameBtn,
            createGame: createGameBtn,
        },
        span: {
            gameCode: gameCodeEl,
        },
        input: {
            joinCode: joinCodeInput,
            playerName: playerNameInput,
        },
    };
};
