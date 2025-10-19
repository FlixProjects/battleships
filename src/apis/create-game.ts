import { appConfig } from "../config/app-config";
import { FP_AUTH_TOKEN } from "../constants";

export const createGame = async (token?: string) => {

    const url = appConfig.deployEnv === "local" ? `/api/create` : `${appConfig.apiBaseUrl}/create`;
    const config: RequestInit = {
        method: "GET",
        credentials: "include",
    };

    if (appConfig.deployEnv !== "local") {
        // NOTE: append headers result in preflight OPTIONS getting called and blocked
        config["headers"] = { [FP_AUTH_TOKEN]: "test" }; // FIXME: replace with actual signed token later
    }

    try {
        const res = await fetch(url, config);
        const data = await res.json();

        const { code, playerId } = data;

        return { code, playerId };
    } catch (err) {
        console.error(err);
    }
};
