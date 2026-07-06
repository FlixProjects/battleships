import { _components, gameManager } from "..";
import { IAppState } from "@shared/types";
import { ActionPanel } from "./action-panel/ActionPanel";
import { GameBoard } from "./board/GameBoard";
import { DetailsPanel } from "./details-panel/DetailsPanel";
import { CreateGameButton } from "./CreateGameButton";
import { GameCodeText } from "./GameCodeText";
import { GameOverToast } from "./GameOverToast";
import { JoinGameButton } from "./JoinGameButton";
import { JoinGameInput } from "./JoinGameInput";
import { PlayerCards } from "./player-cards/PlayerCards";
import { PlayerNameInput } from "./PlayerNameInput";
import { RefreshButton } from "./RefreshButton";
import { ResetLocalGameButton } from "./ResetLocalGameButton";
import { StatusText } from "./StatusText";
import { SwitchPlayerButton } from "./SwitchPlayerButton";
import { HeroSection } from "./HeroSection";

export const loadComponents = () => {
    return {
        heroSection: new HeroSection(),
        statusText: new StatusText(),
        gameCodeText: new GameCodeText(),

        playerNameInput: new PlayerNameInput(),
        joinCodeInput: new JoinGameInput(),

        refreshBtn: new RefreshButton(),
        joinGameBtn: new JoinGameButton(),
        createGameBtn: new CreateGameButton(),
        switchPlayerBtn: new SwitchPlayerButton(),
        resetLocalGameBtn: new ResetLocalGameButton(),

        playerCardsContainer: new PlayerCards(),
        gameBoard: new GameBoard(),
        actionPanel: new ActionPanel(),
        detailsPanel: new DetailsPanel(),
        toast: new GameOverToast(),
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
            heroSection: _components.heroSection,
            playerCards: _components.playerCardsContainer,
            gameBoard: _components.gameBoard,
            actionPanel: _components.actionPanel,
            detailsPanel: _components.detailsPanel,
            toast: _components.toast,
        },
    };
};
