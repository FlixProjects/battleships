import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import * as GameConfig from "../../shared/config/constants";
import { applyStartingStateToPlayer, buildPlayerStartingState, initialiseNewPlayer } from "../../shared/utils/helpers";
import { getGamesBucket, isLocal } from "../lib/env";
import { type LambdaResponse, corsHeaders, errorResponse } from "../lib/http";
import { withAuth } from "../lib/with-auth";
import type { JoinGameRequest } from "../../shared/types/domains";
import type { IPlainGameState } from "../../shared/types/types";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<LambdaResponse> => {
    try {
        const body = (event.body ? JSON.parse(event.body) : {}) as Partial<JoinGameRequest>;
        const { gameCode } = body;
        const playerName = body.playerName?.trim();

        if (!gameCode) {
            return errorResponse(400, "Bad request: missing game code");
        }

        // initialiseNewPlayer declares name as required, see create-game
        if (!playerName) {
            return errorResponse(400, "Bad request: missing player name");
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
            return errorResponse(404, "Game not found");
        }

        // player ids are the caller's token subject rather than a fresh uuid, so a
        // second join would collide with the slot this user already owns
        if (gameState.players.some((player) => player.id === auth.userId)) {
            return errorResponse(409, "You have already joined this game");
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

        return {
            statusCode: 200,
            headers: corsHeaders(),
            body: JSON.stringify({ playerId: auth.userId, gameCode, gameState }),
        };
    } catch (err) {
        console.error("join-game failed", err);
        return errorResponse(500, "some error happened");
    }
});
