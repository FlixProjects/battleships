import { GetGamesResponse } from "@shared/types/domains";
import { useApi } from "./use-api";

export const getGames = async (): Promise<GetGamesResponse> => {
    const result = await useApi<undefined, GetGamesResponse>({ path: "/games", method: "GET" });
    if (!result) {        
        return { games: [] };
    }
    return result.data;
};
