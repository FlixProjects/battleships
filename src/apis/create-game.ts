import { CreateGameRequest, CreateGameResponse } from "@shared/types";
import { useApi } from "./use-api";

export const createGame = async (playerName: string) => {
    const result = await useApi<CreateGameRequest, CreateGameResponse>({
        path: "/create",
        method: "POST",
        body: { playerName },
        onError: (err) => console.error(err),
    });

    return result?.data;
};
