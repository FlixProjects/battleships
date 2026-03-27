import { FP_GAME_CODE, FP_GAME_STATE } from "@shared/constants";
import { GetGameResponse, IGameState } from "@shared/types";
import { appConfig, isLocal } from "../config/app-config";
import { deleteAuthCookie } from "../utils/cookie-helper";

export const getGame = async (gameCodeInput: string) => {
    const gameCode = gameCodeInput.trim();

    if (!gameCode) {
        console.log("Please enter a code");
        return;
    }
    try {
        const url = isLocal ? `/api?code=${gameCode}` : `${appConfig.apiBaseUrl}?code=${gameCode}`;

        const config: RequestInit = {
            method: isLocal ? "POST" : "GET",
            credentials: "include",
        };

        if (isLocal) {
            const localState = sessionStorage.getItem(FP_GAME_STATE);
            config.body = JSON.stringify({ gameState: JSON.parse(localState) as IGameState });
        }

        const res = await fetch(url, config);

        const data: GetGameResponse = await res.json();

        return data;
    } catch (err) {
        const errorCode: number = err.statusCode || err.code;
        if (errorCode === 403) {
            sessionStorage.removeItem(FP_GAME_CODE);
            deleteAuthCookie();
        }
        console.error(err);
    }
};
