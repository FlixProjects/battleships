import { GameState } from "../../shared";
import { isLocal } from "../config/app-config";
import { AppStatus, IAppState, IDynamicComponents } from "../types";
import { CreateGameButton } from "./CreateGameButton";
import { GameBoard } from "./board/GameBoard";
import { GameCodeText } from "./GameCodeText";
import { JoinGameButton } from "./JoinGameButton";
import { JoinGameInput } from "./JoinGameInput";
import { PlayerCards } from "./player-cards/PlayerCards";
import { PlayerNameInput } from "./PlayerNameInput";
import { RefreshButton } from "./RefreshButton";
import { StatusText } from "./StatusText";
import { SwitchPlayerButton } from "./SwitchPlayerButton";
import { ActionPanel } from "./action-panel/ActionPanel";

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

const _components = {
    statusText: new StatusText(),
    gameCodeText: new GameCodeText(),

    playerNameInput: new PlayerNameInput(),
    joinCodeInput: new JoinGameInput(),

    refreshBtn: new RefreshButton(),
    joinGameBtn: new JoinGameButton(),
    createGameBtn: new CreateGameButton(),

    playerCardsContainer: new PlayerCards(),
    gameBoard: new GameBoard(),
    // shipSelector: new ShipSelector(),
};

// TODO: components should be also accessible via array?
export const getComponents = () => {
    const button = { ...getStaticComponents().button, ...getDynamicComponents().button };
    const span = { ...getStaticComponents().span, ...getDynamicComponents().span };
    const input = { ...getStaticComponents().input, ...getDynamicComponents().input };
    const div = { ...getStaticComponents().div, ...getDynamicComponents().div };

    return { button, span, input, div };
};

const getStaticComponents = () => {
    return {
        button: {
            joinGame: _components.joinGameBtn,
            createGame: _components.createGameBtn,
            refresh: _components.refreshBtn,
        },
        span: {
            gameCode: _components.gameCodeText,
            status: _components.statusText,
        },
        input: {
            joinCode: _components.joinCodeInput,
            playerName: _components.playerNameInput,
        },
        div: {
            playerCards: _components.playerCardsContainer,
            gameBoard: _components.gameBoard,
        },
    };
};

const getDynamicComponents = () => {
    const dynamicComponents: IDynamicComponents = {
        button: {},
        span: {},
        input: {},
        div: {
            actionPanel: new ActionPanel(),
        },
    };

    if (isLocal) {
        dynamicComponents.button["switchPlayerBtn"] = new SwitchPlayerButton();
    }

    return dynamicComponents;
};

// TODO: We should be automating updateComponent calls instead of manually calling updateComponents()
export const updateComponents = (incomingState: Partial<IAppState>) => {
    _state = { ..._state, ...incomingState };

    Object.values(getComponents()).forEach((typeOfComponent) => {
        Object.values(typeOfComponent).forEach((component) => {
            if (component.updateState) {
                component.updateState(_state);
            }
        });
    });
};
