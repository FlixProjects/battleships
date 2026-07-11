import { DEFAULT_APP_STATE, FP_AUTH_TOKEN, FP_GAME_CODE } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IAppState, TGameStateManagerCtor } from "@shared/types";
import { gameManager } from "..";
import { getGame } from "../apis/get-game";
import { updateComponents } from "../components/component-helper";
import { loadStyles } from "../css-anim-styles";
import { deleteAuthCookie, getCookie } from "../utils/cookie-helper";
import { getGameCode, isWaitingForOtherPlayer, removeGameCode } from "../utils/game-helper";
import { getAppScreen, setAppScreen } from "../utils/screen-helper";
import { transformPlainAppStateToFEDomain } from "../utils/transformers";
import { FEGameStateManager } from "./FEGameStateManager";
import { playbackRunner } from "./PlaybackRunner";

export class App {
    private _state: IAppState = transformPlainAppStateToFEDomain(DEFAULT_APP_STATE);
    private GSM: TGameStateManagerCtor = FEGameStateManager;
    public async start() {
        loadStyles();

        if (!this.hasExistingSession()) {
            this.clearExistingSession();
            return updateComponents(this._state);
        }

        updateComponents(this._state);
        await this.fetchExistingSession();
    }

    private hasExistingSession() {
        const gameCode = getGameCode();
        const authToken = getCookie(FP_AUTH_TOKEN);

        const hasExistingSession = !!(gameCode && authToken);

        return hasExistingSession;
    }

    private clearExistingSession() {
        removeGameCode();
        deleteAuthCookie();

        // A stored InGame screen without a live session is stale — the player
        // has clearly been past login, so drop them back to the lobby.
        if (getAppScreen() === GameConfig.AppScreen.InGame) {
            setAppScreen(GameConfig.AppScreen.Lobby);
        }
    }

    private async fetchExistingSession() {
        updateComponents({ status: GameConfig.AppStatus.Initialising, loading: true });

        try {
            const response = await getGame(getGameCode());
            console.log("Existing game found:", response);

            if (!response?.gameState) {
                throw new Error("Get-game returned no game state");
            }

            const currentPlayerId = getCookie(FP_AUTH_TOKEN);
            gameManager.trackRoundSnapshots(currentPlayerId, response.gameState);
            const gsm = new this.GSM(response.gameState);
            // Server speaks plain. Run local re-resolution (only fires if player has already submitted)
            gsm.resolveLocalActionsForPlayer(currentPlayerId);

            gameManager.saveAppState(
                {
                    status: response.gameState.isOver
                        ? GameConfig.AppStatus.GameOver
                        : isWaitingForOtherPlayer(gameManager.state.gameState)
                          ? GameConfig.AppStatus.WaitingForOtherPlayer
                          : GameConfig.AppStatus.ReadyToSubmit,
                    loading: false,
                    gameState: gsm.gameState.toPlain(),
                },
                { saveWithMerge: false },
            );
            gameManager.setCurrentPlayer(currentPlayerId);
            setAppScreen(GameConfig.AppScreen.InGame);

            // Watermark-guarded catch-up: a resolve that landed while this
            // client was away plays back once on boot.
            await playbackRunner.playIfUnseen();
            updateComponents();
        } catch (error) {
            if (error.code === 404) {
                console.log("Game not found or expired.");
                sessionStorage.removeItem(FP_GAME_CODE);
            }

            if (error.code === 403) {
                console.log("Game is full.");
                sessionStorage.removeItem(FP_GAME_CODE);
            }

            // Session was unusable (expired/full game) — back to the lobby.
            setAppScreen(GameConfig.AppScreen.Lobby);
            updateComponents({ status: GameConfig.AppStatus.NewGame, loading: false });
        }
    }
}
