import { FP_GAME_CODE, FP_GAME_STATE } from "@shared/constants";
import { GetGameResponse, IGameState } from "@shared/types";
import { isLocal } from "../config/app-config";
import { deleteAuthCookie } from "../utils/cookie-helper";
import { ApiError, useApi } from "./use-api";

interface GetGameLocalRequest {
    gameState: IGameState;
}

/** Local sam has no S3 behind it, so the client posts the state it already holds. */
const getLocalBody = (): GetGameLocalRequest | undefined => {
    if (!isLocal) {
        return undefined;
    }

    return { gameState: JSON.parse(sessionStorage.getItem(FP_GAME_STATE)) as IGameState };
};

export const getGame = async (gameCodeInput: string) => {
    const gameCode = gameCodeInput.trim();

    if (!gameCode) {
        console.log("Please enter a code");
        return;
    }

    const result = await useApi<GetGameLocalRequest, GetGameResponse>({
        method: isLocal ? "POST" : "GET",
        query: { code: gameCode },
        body: getLocalBody(),
        onError: (err) => {
            // the session is for a game this player is no longer part of
            if (err instanceof ApiError && err.status === 403) {
                sessionStorage.removeItem(FP_GAME_CODE);
                deleteAuthCookie();
            }
            console.error(err);
        },
    });

    return result?.data;
};
