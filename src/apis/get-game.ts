import { appConfig } from "../config/app-config";
import { FP_AUTH_TOKEN, FP_GAME_STATE } from "../constants";
import { GameState, GetGameResponse } from "../types";

export const getGame = async (gameCodeInput?: string) => {
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

        if (appConfig.deployEnv !== "local") {
            // NOTE: append headers result in preflight OPTIONS getting called and blocked
            config["headers"] = {
                ...config["headers"],
                [FP_AUTH_TOKEN]: "test",
            }; // FIXME: replace with actual signed token later
        }

        const res = await fetch(url, config);

        const data: GetGameResponse = await res.json();

        if (appConfig.deployEnv === "local") {
            const localState = sessionStorage.getItem(FP_GAME_STATE);
            data.gameState = localState ? (JSON.parse(localState) as GameState) : null;
        }

        return data;
    } catch (err) {
        console.error(err);
    }
};
