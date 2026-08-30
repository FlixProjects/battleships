import type { LambdaFunctionURLEvent } from "aws-lambda";
import type { GetGamesResponse } from "../../shared/types/domains";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";
import { withAuth } from "../lib/with-auth";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<PlainApiResponse> => {
    try {
        const userId = auth.userId;

        const responseBody: GetGamesResponse = {
            games: [],
        };

        return new ApiResponse().setBody(responseBody).build();
    } catch (err) {
        console.error("get-games failed", err);
        return new InternalServerErrorApiResponse().build();
    }
});