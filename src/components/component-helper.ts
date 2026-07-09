import { _components, gameManager } from "..";
import { IAppState } from "@shared/types";
import { ActionPanel } from "./action-panel/ActionPanel";
import { GameBoard } from "./board/GameBoard";
import { DetailsPanel } from "./details-panel/DetailsPanel";
import { getAppScreen } from "../utils/screen-helper";
import { CreateGameButton } from "./CreateGameButton";
import { GameActions } from "./GameActions";
import { GameCodeText } from "./GameCodeText";
import { GameView } from "./GameView";
import { LoginPage } from "./LoginPage";
import { GameOverToast } from "./GameOverToast";
import { JoinGameButton } from "./JoinGameButton";
import { JoinGameInput } from "./JoinGameInput";
import { PlayerCards } from "./player-cards/PlayerCards";
import { PlayerNameInput } from "./PlayerNameInput";
import { RefreshButton } from "./RefreshButton";
import { ResetLocalGameButton } from "./ResetLocalGameButton";
import { StatusText } from "./StatusText";
import { SwitchPlayerButton } from "./SwitchPlayerButton";
import { HamburgerMenu } from "./HamburgerMenu";
import { HeroSection } from "./HeroSection";

export const loadComponents = () => {
    return {
        heroSection: new HeroSection(),
        // Mounts into #hero-section, so it must stay right after heroSection.
        hamburgerMenu: new HamburgerMenu(),
        loginPage: new LoginPage(),
        gameView: new GameView(),
        gameActions: new GameActions(),
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
    // screen is UI routing state, kept outside the per-player app state (see
    // screen-helper) and injected here so every component sees it.
    const _state = { ...gameManager.state, screen: getAppScreen(), ...incomingState };

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
            hamburgerMenu: _components.hamburgerMenu,
            loginPage: _components.loginPage,
            gameView: _components.gameView,
            gameActions: _components.gameActions,
            playerCards: _components.playerCardsContainer,
            gameBoard: _components.gameBoard,
            actionPanel: _components.actionPanel,
            detailsPanel: _components.detailsPanel,
            toast: _components.toast,
        },
    };
};
