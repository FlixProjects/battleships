import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import type { GetGamesResponse } from "../../shared/types/domains";
import { GAMES_TABLE, getDocClient } from "../lib/dynamo";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";
import { withAuth } from "../lib/with-auth";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<PlainApiResponse> => {
    try {
        const userId = auth.userId;
        const { Items } = await getDocClient().send(
            new QueryCommand({
                TableName: GAMES_TABLE,
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: { ":userId": userId },
            }),
        );
        const responseBody: GetGamesResponse = {
            // FIXME: add proper typing
            games: (Items as { gameCode: string }[])?.map((i) => i.gameCode),
        };

        return new ApiResponse().setBody(responseBody).build();
    } catch (err) {
        console.error("get-games failed", err);
        return new InternalServerErrorApiResponse().build();
    }
});
