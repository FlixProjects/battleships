import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import * as GameConfig from "../../shared/config/constants";
import { applyStartingStateToPlayer, buildPlayerStartingState, initialiseNewPlayer } from "../../shared/utils/helpers";
import { getGamesBucket } from "../lib/env";
import { withAuth } from "../lib/with-auth";
import type { JoinGameRequest } from "../../shared/types/domains";
import type { IPlainGameState } from "../../shared/types/types";

interface JoinGameResponse {
    statusCode: number;
    headers: {
        "Access-Control-Allow-Headers": string;
        "Access-Control-Allow-Credentials": string;
        "Access-Control-Allow-Origin": string;
    };
    body: string;
    multiValueHeaders?: Record<string, Array<string>>;
}

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth) => {
    try {
        const env = process.env.DEPLOY_ENV;
        const LOCAL_ENV = "local";
        const isLocal = env === LOCAL_ENV;

        const body = (typeof event.body === "string" ? JSON.parse(event.body) : event.body) as JoinGameRequest;

        const playerName = body.playerName;
        const gameCode = body.gameCode;
        let gameState: IPlainGameState | undefined = body.gameState;

        console.log("Request Body:", body);

        if (!gameCode) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Bad request: missing game code",
                    body,
                }),
            };
        }

        const s3 = new S3Client({ region: process.env.AWS_REGION }); // AWS_REGION is a reserved keyword for AWS, for now its okay to leave as is
        const BUCKET_NAME = getGamesBucket();

        if (!isLocal) {
            const { Body } = await s3.send(
                new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: `games/${gameCode}.json`,
                }),
            );

            const bodyStr = await Body?.transformToString("utf-8");

            gameState = bodyStr ? JSON.parse(bodyStr) : undefined;

            console.log("Fetched Game State", gameState);
        }

        if (!gameState || gameState.code !== gameCode) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: "Game not found",
                }),
            };
        }

        const playerId = auth.userId;
        const newPlayer = initialiseNewPlayer({ id: playerId, name: playerName, order: gameState.players.length });
        const starting = buildPlayerStartingState(playerId, GameConfig.Faction.THE_UNITED_DEFENSE_FLEET);
        applyStartingStateToPlayer(newPlayer, starting);

        gameState.ships.push(...starting.ships);
        gameState.cards.push(...starting.cards);
        gameState.effects.push(...starting.effects);
        gameState.decks.push(starting.deck);
        gameState.players.push(newPlayer);
        gameState.currentRound++;

        if (!isLocal) {
            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: `games/${gameCode}.json`,
                    Body: JSON.stringify(gameState),
                    ContentType: "application/json",
                }),
            );
        }

        const response: JoinGameResponse = {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // FIXME: restrict origins
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify({
                playerId,
                gameCode,
                gameState,
            }),
        };

        if (env === LOCAL_ENV) {
            response.headers["Access-Control-Allow-Origin"] = "*";
        } else {
            response.headers["Access-Control-Allow-Origin"] = process.env.BASE_URL ?? "*";
        }

        return response;
    } catch (err: any) {
        /**
         * error shape
         * {
         *  code: string;
         *  message: string;
         *  name: string;
         *  $fault: "client" | "server";
         * }
         */
        return {
            statusCode: err.code ?? 500,
            message: err.message,
            name: err.name,
            fault: err.$fault,
        };
    }
});
