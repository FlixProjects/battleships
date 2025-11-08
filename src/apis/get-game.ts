import { appConfig } from "../config/app-config";
import { FP_GAME_CODE, FP_GAME_STATE } from "../constants";
import { GameState, GetGameResponse } from "../../shared";
import { deleteAuthCookie } from "../utils/cookie-helper";

export const getGame = async (gameCodeInput: string) => {
    const gameCode = gameCodeInput.trim();

    if (!gameCode) {
        console.log("Please enter a code");
        return;
    }
    try {
        const url =
            appConfig.deployEnv === "local" ? `/api?code=${gameCode}` : `${appConfig.apiBaseUrl}?code=${gameCode}`;

        const config: RequestInit = {
            method: "GET",
            credentials: "include",
        };

        const res = await fetch(url, config);

        const data: GetGameResponse = await res.json();

        if (appConfig.deployEnv === "local") {
            const localState = sessionStorage.getItem(FP_GAME_STATE);
            data.gameState = localState ? (JSON.parse(localState) as GameState) : null;
        }

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
