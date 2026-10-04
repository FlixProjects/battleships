import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { Faction } from "../../shared/config/constants";
import { ERROR_MESSAGES } from "../../shared/constants";
import type { CreateGameRequest } from "../../shared/types/domains";
import { ErrorCode } from "../../shared/types/response-types";
import type { IPlainGameState } from "../../shared/types/types";
import { GameStateBuilder } from "../../shared/utils/builder/GameStateBuilder";
import { generateGameCode } from "../../shared/utils/helpers";
import { GAMES_TABLE, getDocClient } from "../lib/dynamo";
import { getGamesBucket, isLocal } from "../lib/env";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";
import { withAuth } from "../lib/with-auth";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<PlainApiResponse> => {
    try {
        const body = (event.body ? JSON.parse(event.body) : {}) as Partial<CreateGameRequest>;
        const userId = auth.userId;
        const playerName = body.playerName?.trim();

        // loadEmptyNewPlayer declares name as required, and a nameless player would
        // reach stored game state as undefined
        if (!playerName) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_PLAYER_NAME).build();
        }

        const gameCode = generateGameCode();

        // the token subject is the id get-game and submit-action match a caller
        // against, so the player is the authenticated user rather than a fresh uuid
        const builder = new GameStateBuilder();
        if (isLocal() && body.overrideConfig) {
            builder.overrideConfig(body.overrideConfig);
        }
        builder.loadCode(gameCode).loadMap();
        builder
            .loadEmptyNewPlayer({ id: auth.userId, name: playerName, order: 0 })
            .loadFaction(Faction.THE_UNITED_DEFENSE_FLEET)
            .loadDeck()
            .loadCards()
            .loadShips()
            .loadHand(Math.random);
        const initialGameState: IPlainGameState = builder.build({ initiative: auth.userId });
        const now = new Date().toISOString();
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
        await getDocClient().send(
            new PutCommand({
                TableName: GAMES_TABLE,
                Item: { id: randomUUID(), userId, gameCode, createdAt: now, updatedAt: now },
            }),
        );

        return new ApiResponse().setBody({ gameCode, playerId: auth.userId, gameState: initialGameState }).build();
    } catch (err) {
        console.error("create-game failed", err);
        return new InternalServerErrorApiResponse().build();
    }
});
