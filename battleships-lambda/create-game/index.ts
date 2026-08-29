import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import { ERROR_MESSAGES } from "../../shared/constants";
import type { CreateGameRequest } from "../../shared/types/domains";
import { ErrorCode } from "../../shared/types/response-types";
import type { IPlainGameState } from "../../shared/types/types";
import { createNewGameState, generateGameCode } from "../../shared/utils/helpers";
import { getGamesBucket, isLocal } from "../lib/env";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";
import { withAuth } from "../lib/with-auth";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<PlainApiResponse> => {
    try {
        const body = (event.body ? JSON.parse(event.body) : {}) as Partial<CreateGameRequest>;
        const playerName = body.playerName?.trim();

        // createNewGameState declares name as required, and a nameless player would
        // reach stored game state as undefined
        if (!playerName) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_PLAYER_NAME).build();
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

        return new ApiResponse().setBody({ gameCode, playerId: auth.userId, gameState: initialGameState }).build();
    } catch (err) {
        console.error("create-game failed", err);
        return new InternalServerErrorApiResponse().build();
    }
});
