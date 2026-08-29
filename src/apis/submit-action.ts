import { FP_GAME_STATE } from "@shared/constants";
import { Action } from "@shared/models";
import { IAction, IPlainGameState, SubmitActionRequest, SubmitActionResponse } from "@shared/types";
import { isLocal } from "../config/app-config";
import { getGameCode } from "../utils/game-helper";
import { useApi } from "./use-api";

export const submitAction = async (actions: IAction[]) => {
    const gameCode = getGameCode();

    if (!gameCode) {
        console.log("No code found!");
        return;
    }

    const plainActions = actions.map((a) => (a instanceof Action ? a.toPlain() : a));

    const reqBody: SubmitActionRequest = { gameCode, actions: plainActions };

    if (isLocal) {
        const localState = sessionStorage.getItem(FP_GAME_STATE);
        reqBody.gameState = localState ? (JSON.parse(localState) as IPlainGameState) : undefined;
    }

    const result = await useApi<SubmitActionRequest, SubmitActionResponse>({
        path: "/submit",
        method: "POST",
        body: reqBody,
        onError: (err) => console.error(err),
    });

    return result?.data;
};
