import { DEFAULT_APP_STATE, FP_AUTH_TOKEN } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IAppState, TGameStateManagerCtor } from "@shared/types";
import { gameManager } from "..";
import { getGame } from "../apis/get-game";
import { updateComponents } from "../components/component-helper";
import { loadStyles } from "../css-anim-styles";
import { getCookie } from "../utils/cookie-helper";
import { getGameCode, isWaitingForOtherPlayer } from "../utils/game-helper";
import { setAppScreen } from "../utils/screen-helper";
import { transformPlainAppStateToFEDomain } from "../utils/transformers";
import { FEGameStateManager } from "./FEGameStateManager";

export class App {
    private _state: IAppState = transformPlainAppStateToFEDomain(DEFAULT_APP_STATE);
    private GSM: TGameStateManagerCtor = FEGameStateManager;
    public async start() {
        loadStyles();
        const gameCode = getGameCode();
        const authToken = getCookie(FP_AUTH_TOKEN);

        if (gameCode && authToken) {
            setAppScreen(GameConfig.AppScreen.Game);
            return await this.fetchExistingSession();
        }

        const hasExistingStaleSession = gameCode && !authToken;
        const isLoggedInButNoData = !gameCode && authToken;

        if (hasExistingStaleSession) {
            this.clearStaleSession();
        } else if (isLoggedInButNoData) {
            setAppScreen(GameConfig.AppScreen.Games);
        } else if (!authToken) {
            setAppScreen(GameConfig.AppScreen.Login);
        }

        return updateComponents(this._state);
    }

    private clearStaleSession() {
        sessionStorage.clear();
        setAppScreen(GameConfig.AppScreen.Login);
    }

    private async fetchExistingSession() {
        updateComponents({ status: GameConfig.AppStatus.Initialising, loading: true });
        const gameCode = getGameCode();
        if (!gameCode) {
            return;
        }

        await getGame(gameCode, { resolveLocalActions: true, saveWithMerge: false });
    }

    private getGameStatus(isOver: boolean) {
        return isOver
            ? GameConfig.AppStatus.GameOver
            : isWaitingForOtherPlayer(gameManager.state.gameState)
              ? GameConfig.AppStatus.WaitingForOtherPlayer
              : GameConfig.AppStatus.ReadyToSubmit;
    }
}
