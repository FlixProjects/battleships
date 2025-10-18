import { appConfig } from "../config/app-config";
import { FP_AUTH_TOKEN } from "../constants";

export const createGame = async () => {
    try {
        const res = await fetch(`${appConfig.apiBaseUrl}/create`, {
            method: "GET",
            headers: { [FP_AUTH_TOKEN]: "test" }, // FIXME: replace with actual signed token later
        });
        const data = await res.json();

        const { code, playerId } = data;

        return { code, playerId };
    } catch (err) {
        console.error(err);
    }
};
