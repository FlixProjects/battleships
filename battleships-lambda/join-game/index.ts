import { randomUUID } from "crypto";
import { getNewBoard } from "./common/constants";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { GameState } from "./common/types";

export const handler = async (event: any) => {
    const FP_AUTH_TOKEN = "fp-auth-token";
    const FP_USER_ID = "fp-user-id";
    try {
        const env = process.env.DEPLOY_ENV;
        const LOCAL_ENV = "local";
        const isLocal = env === LOCAL_ENV;

        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        const playerName = body.playerName;
        const gameCode = body.code;
        let gameState: GameState = body.gameState;

        console.log("Request Body:", body);

        const s3 = new S3Client({ region: process.env.AWS_REGION }); // AWS_REGION is a reserved keyword for AWS, for now its okay to leave as is
        const BUCKET_NAME = process.env.GAMES_BUCKET!; // set in lambda, TODO: we should inject this value

        const playerId = randomUUID();
        const newPlayer = { id: playerId, name: playerName, ready: false, board: getNewBoard() };

        if (!isLocal) {
            const { Body } = await s3.send(
                new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: `games/${gameCode}.json`,
                }),
            );

            const bodyStr = await Body?.transformToString("utf-8");

            gameState = bodyStr ? JSON.parse(bodyStr) : null;

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

        gameState.players.push(newPlayer);

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

        const cookieConfig = LOCAL_ENV ? "Path=/; SameSite=Lax" : "Path=/; Secure; SameSite=None";

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // FIXME: restrict origins
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true",
            },
            multiValueHeaders: {
                "Set-Cookie": [
                    `${FP_AUTH_TOKEN}=${playerId}; ${cookieConfig}`,
                    `${FP_USER_ID}=${playerId}; ${cookieConfig}`,
                ],
            },
            body: JSON.stringify({
                playerId,
                gameCode,
                gameState,
            }),
        };
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
};
