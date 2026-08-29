import { FP_GAME_STATE } from "@shared/constants";
import { IPlainGameState, JoinGameRequest, JoinGameResponse } from "@shared/types";
import { isLocal } from "../config/app-config";
import { useApi } from "./use-api";

export const joinGame = async (joinCodeInput: string, playerName: string) => {
    const gameCode = joinCodeInput.trim();

    if (!gameCode) {
        console.log("Please enter a code");
        return;
    }

    const reqBody: JoinGameRequest = { gameCode, playerName };

    if (isLocal) {
        const localState = sessionStorage.getItem(FP_GAME_STATE);
        reqBody.gameState = localState ? (JSON.parse(localState) as IPlainGameState) : null;
    }

    const result = await useApi<JoinGameRequest, JoinGameResponse>({
        path: "/join",
        method: "POST",
        body: reqBody,
        onError: (err) => console.error(err),
    });

    return result?.data;
};
