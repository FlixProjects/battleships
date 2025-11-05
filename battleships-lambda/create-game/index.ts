import { randomUUID } from "crypto";
import { getNewBoard } from "./common/constants";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const handler = async (event: any) => {
    const FP_AUTH_TOKEN = "fp-auth-token";
    const FP_USER_ID = "fp-user-id";
    try {
        const env = process.env.DEPLOY_ENV;
        const LOCAL_ENV = "local";

        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        const playerName = body.playerName;

        const s3 = new S3Client({ region: process.env.AWS_REGION }); // AWS_REGION is a reserved keyword for AWS, for now its okay to leave as is
        const BUCKET_NAME = process.env.GAMES_BUCKET!; // set in lambda, TODO: we should inject this value
        const gameCode = generateGameCode();
        const playerId = randomUUID();

        const initialGameState = {
            code: gameCode,
            players: [{ id: playerId, name: playerName, ready: false, board: getNewBoard() }],
            createdAt: new Date().toISOString(),
        };

        if (env !== LOCAL_ENV) {
            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: `games/${gameCode}.json`,
                    Body: JSON.stringify(initialGameState),
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
                gameCode,
                playerId,
                gameState: initialGameState,
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "some error happened",
            }),
        };
    }
};

const generateGameCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 4 })
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
};
