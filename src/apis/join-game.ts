import { appConfig } from "../config/app-config";
import { FP_AUTH_TOKEN, FP_GAME_STATE } from "../constants";
import { GameState } from "../types";

export const joinGame = async (joinCodeInput: string) => {
    const code = joinCodeInput.trim();
    if (!code) {
        console.log("Please enter a code");
        return;
    }
    try {
        const path = `join`;
        const url = appConfig.deployEnv === "local" ? `/api/${path}` : `${appConfig.apiBaseUrl}/${path}`;
        const config: RequestInit = {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        };

        const reqBody: { code: string; gameState?: GameState } = { code };

        if (appConfig.deployEnv === "local") {
            const localState = sessionStorage.getItem(FP_GAME_STATE);
            reqBody.gameState = localState ? (JSON.parse(localState) as GameState) : null;
        } else {
            // NOTE: append headers result in preflight OPTIONS getting called and blocked
            config["headers"] = {
                ...config["headers"],
                [FP_AUTH_TOKEN]: "test",
            }; // FIXME: replace with actual signed token later
        }

        const res = await fetch(url, {
            ...config,
            body: JSON.stringify(reqBody),
            // for non-local, it should also set-cookie
        });
        const data = await res.json();

        return data;
    } catch (err) {
        console.error(err);
    }
};
