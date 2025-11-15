import { _components, gameManager } from "..";
import { IAppState } from "../types";
import { ActionPanel } from "./action-panel/ActionPanel";
import { GameBoard } from "./board/GameBoard";
import { CreateGameButton } from "./CreateGameButton";
import { GameCodeText } from "./GameCodeText";
import { JoinGameButton } from "./JoinGameButton";
import { JoinGameInput } from "./JoinGameInput";
import { PlayerCards } from "./player-cards/PlayerCards";
import { PlayerNameInput } from "./PlayerNameInput";
import { RefreshButton } from "./RefreshButton";
import { StatusText } from "./StatusText";
import { SwitchPlayerButton } from "./SwitchPlayerButton";

export const loadComponents = () => {
    return {
        statusText: new StatusText(),
        gameCodeText: new GameCodeText(),

        playerNameInput: new PlayerNameInput(),
        joinCodeInput: new JoinGameInput(),

        refreshBtn: new RefreshButton(),
        joinGameBtn: new JoinGameButton(),
        createGameBtn: new CreateGameButton(),
        switchPlayerBtn: new SwitchPlayerButton(),

        playerCardsContainer: new PlayerCards(),
        gameBoard: new GameBoard(),
        actionPanel: new ActionPanel(),
    };
};

// TODO: components should be also accessible via array?
export const getComponents = () => {
    const button = { ...getStaticComponents().button };
    const span = { ...getStaticComponents().span };
    const input = { ...getStaticComponents().input };
    const div = { ...getStaticComponents().div };

    return { button, span, input, div };
};

// TODO: We should be automating updateComponent calls instead of manually calling updateComponents()
export const updateComponents = (incomingState: Partial<IAppState> = {}) => {
    const _state = { ...gameManager.state, ...incomingState };

    Object.values(getComponents()).forEach((typeOfComponent) => {
        Object.values(typeOfComponent).forEach((component) => {
            if (component.updateState) {
                component.updateState(_state);
            }
        });
    });
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
            actionPanel: _components.actionPanel,
        },
    };
};