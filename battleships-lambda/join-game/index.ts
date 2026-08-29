import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import * as GameConfig from "../../shared/config/constants";
import { ERROR_MESSAGES } from "../../shared/constants";
import type { JoinGameRequest } from "../../shared/types/domains";
import { ErrorCode } from "../../shared/types/response-types";
import type { IPlainGameState } from "../../shared/types/types";
import { applyStartingStateToPlayer, buildPlayerStartingState, initialiseNewPlayer } from "../../shared/utils/helpers";
import { getGamesBucket, isLocal } from "../lib/env";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";
import { withAuth } from "../lib/with-auth";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<PlainApiResponse> => {
    try {
        const body = (event.body ? JSON.parse(event.body) : {}) as Partial<JoinGameRequest>;
        const { gameCode } = body;
        const playerName = body.playerName?.trim();

        if (!gameCode) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_GAME_CODE).build();
        }

        // initialiseNewPlayer declares name as required, see create-game
        if (!playerName) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_PLAYER_NAME).build();
        }

        const s3 = new S3Client({ region: process.env.AWS_REGION });
        let gameState: IPlainGameState | undefined = body.gameState;

        if (!isLocal()) {
            const { Body } = await s3.send(
                new GetObjectCommand({ Bucket: getGamesBucket(), Key: `games/${gameCode}.json` }),
            );

            const bodyStr = await Body?.transformToString("utf-8");
            gameState = bodyStr ? JSON.parse(bodyStr) : undefined;
        }

        if (!gameState || gameState.code !== gameCode) {
            return new ErrorApiResponse(ErrorCode.NOT_FOUND).setMessage(ERROR_MESSAGES.GAME_NOT_FOUND).build();
        }

        // player ids are the caller's token subject rather than a fresh uuid, so a
        // second join would collide with the slot this user already owns
        if (gameState.players.some((player) => player.id === auth.userId)) {
            return new ErrorApiResponse(ErrorCode.CONFLICT).setMessage(ERROR_MESSAGES.ALREADY_JOINED_GAME).build();
        }

        const newPlayer = initialiseNewPlayer({
            id: auth.userId,
            name: playerName,
            order: gameState.players.length,
        });
        const starting = buildPlayerStartingState(auth.userId, GameConfig.Faction.THE_UNITED_DEFENSE_FLEET);
        applyStartingStateToPlayer(newPlayer, starting);

        gameState.ships.push(...starting.ships);
        gameState.cards.push(...starting.cards);
        gameState.effects.push(...starting.effects);
        gameState.decks.push(starting.deck);
        gameState.players.push(newPlayer);
        gameState.currentRound++;

        if (!isLocal()) {
            await s3.send(
                new PutObjectCommand({
                    Bucket: getGamesBucket(),
                    Key: `games/${gameCode}.json`,
                    Body: JSON.stringify(gameState),
                    ContentType: "application/json",
                }),
            );
        }

        return new ApiResponse().setBody({ playerId: auth.userId, gameCode, gameState }).build();
    } catch (err) {
        console.error("join-game failed", err);
        return new InternalServerErrorApiResponse().build();
    }
});
