import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import { createNewGameState, generateGameCode } from "../../shared/utils/helpers";
import { getGamesBucket, isLocal } from "../lib/env";
import { type LambdaResponse, corsHeaders, errorResponse } from "../lib/http";
import { withAuth } from "../lib/with-auth";
import type { CreateGameRequest } from "../../shared/types/domains";
import type { IPlainGameState } from "../../shared/types/types";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<LambdaResponse> => {
    try {
        const body = (event.body ? JSON.parse(event.body) : {}) as Partial<CreateGameRequest>;
        const playerName = body.playerName?.trim();

        // createNewGameState declares name as required, and a nameless player would
        // reach stored game state as undefined
        if (!playerName) {
            return errorResponse(400, "Bad request: missing player name");
        }

        const gameCode = generateGameCode();

        // the token subject is the id get-game and submit-action match a caller
        // against, so the player is the authenticated user rather than a fresh uuid
        const initialGameState: IPlainGameState = createNewGameState(gameCode, auth.userId, playerName);

        if (!isLocal()) {
            await new S3Client({ region: process.env.AWS_REGION }).send(
                new PutObjectCommand({
                    Bucket: getGamesBucket(),
                    Key: `games/${gameCode}.json`,
                    Body: JSON.stringify(initialGameState),
                    ContentType: "application/json",
                }),
            );
        }

        return {
            statusCode: 200,
            headers: corsHeaders(),
            body: JSON.stringify({ gameCode, playerId: auth.userId, gameState: initialGameState }),
        };
    } catch (err) {
        console.error("create-game failed", err);
        return errorResponse(500, "some error happened");
    }
});
