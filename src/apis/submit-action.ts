import { FP_GAME_STATE } from "@shared/constants";
import { IAction, IPlainGameState, SubmitActionRequest, SubmitActionResponse } from "@shared/types";
import { appConfig, isLocal } from "../config/app-config";
import { CryptoHelper } from "../utils/crypto-helper";
import { getGameCode } from "../utils/game-helper";

export const submitAction = async (actions: IAction[]) => {
    const gameCode = getGameCode();

    if (!gameCode) {
        console.log("No code found!");
        return;
    }
    try {
        const path = `submit`;
        const url = isLocal ? `/api/${path}` : `${appConfig.apiBaseUrl}/${path}`;

        const reqBody: SubmitActionRequest = { gameCode, actions };

        const config: RequestInit = {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "x-Amz-Content-Sha256": new CryptoHelper().hash(JSON.stringify(reqBody)),
            },
        };

        if (isLocal) {
            const localState = sessionStorage.getItem(FP_GAME_STATE);
            reqBody.gameState = localState ? (JSON.parse(localState) as IPlainGameState) : null;
        }

        const res = await fetch(url, {
            ...config,
            body: JSON.stringify(reqBody),
        });
        const data: SubmitActionResponse = await res.json();

        return data;
    } catch (err) {
        console.error(err);
    }
};
