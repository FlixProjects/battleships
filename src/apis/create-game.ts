import { appConfig } from "../config/app-config";
import { FP_AUTH_TOKEN } from "../constants";
import { CreateGameRequest, CreateGameResponse } from "../types";
import { CryptoHelper } from "../utils/crypto-helper";

export const createGame = async (playerName: string) => {
    const url = appConfig.deployEnv === "local" ? `/api/create` : `${appConfig.apiBaseUrl}/create`;

    const reqBody: CreateGameRequest = { playerName };

    const config: RequestInit = {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "x-Amz-Content-Sha256": new CryptoHelper().hash(JSON.stringify(reqBody)),
        },
    };

    if (appConfig.deployEnv !== "local") {
        // NOTE: append headers result in preflight OPTIONS getting called and blocked
        config["headers"] = { [FP_AUTH_TOKEN]: "test" }; // FIXME: replace with actual signed token later
    }

    try {
        const res = await fetch(url, { ...config, body: JSON.stringify(reqBody) });
        const data: CreateGameResponse = await res.json();

        return data;
    } catch (err) {
        console.error(err);
    }
};
