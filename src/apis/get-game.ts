import { FP_GAME_STATE } from "@shared/constants";
import { GameConfig, TAppStatus } from "@shared/index";
import { GetGameResponse, IGameState } from "@shared/types";
import { gameManager } from "..";
import { updateComponents } from "../components/component-helper";
import { isLocal } from "../config/app-config";
import { FEGameStateManager } from "../models/FEGameStateManager";
import { playbackRunner } from "../models/PlaybackRunner";
import { setGameCode } from "../utils/game-helper";
import { useApi } from "./use-api";

interface GetGameLocalRequest {
    gameState: IGameState;
}

/** Local sam has no S3 behind it, so the client posts the state it already holds. */
const getLocalBody = (): GetGameLocalRequest | undefined => {
    if (!isLocal) {
        return undefined;
    }

    return { gameState: JSON.parse(sessionStorage.getItem(FP_GAME_STATE) ?? "{}") as IGameState };
};

const _getGame = async (gameCode: string) => {
    const result = await useApi<GetGameLocalRequest, GetGameResponse>({
        method: isLocal ? "POST" : "GET",
        query: { code: gameCode },
        body: getLocalBody(),
    });

    return result?.data;
};
interface GetGameConfig {
    saveWithMerge?: boolean;
    status?: TAppStatus;
    resolveLocalActions?: boolean;
}
export const getGame = async (_gameCode: string, config?: GetGameConfig) => {
    const { saveWithMerge, status, resolveLocalActions } = config || {};
    try {
        const gameCode = _gameCode.trim();

        if (!gameCode) {
            console.log("Please enter a code");
            return;
        }

        const responseData = await _getGame(gameCode);

        if (!responseData?.gameState) {
            throw new Error("Get-game returned no game state");
        }

        const currentPlayerId = gameManager.getCurrentPlayerId();

        setGameCode(responseData.gameState.code);

        let newGameState = responseData.gameState;
        gameManager.trackRoundSnapshots(currentPlayerId, newGameState);

        if (resolveLocalActions) {
            const gsm = new FEGameStateManager(newGameState);
            gsm.resolveLocalActionsForPlayer(currentPlayerId);
            newGameState = gsm.gameState.toPlain();
        }
        const appState = {
            status: status ?? gameManager.state.status,
            loading: false,
            gameState: newGameState,
        };

        gameManager.saveAppState(appState, { saveWithMerge });
        await playbackRunner.playIfUnseen();
        updateComponents();
    } catch (err) {
        updateComponents({ status: GameConfig.AppStatus.NewGame, loading: false });
    }
};
