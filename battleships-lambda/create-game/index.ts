import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { IGameState, getNewBoard, initialiseNewPlayer } from "../../shared";

interface CreateGameResponse {
    statusCode: number;
    headers: {
        "fp-auth-token": `${string}-${string}-${string}-${string}-${string}`;
        "Access-Control-Allow-Headers": string;
        "Access-Control-Allow-Credentials": string;
        "Access-Control-Allow-Origin": string;
    };
    body: string;
    multiValueHeaders?: Record<string, Array<string>>;
}

export const handler = async (event: any) => {
    const FP_AUTH_TOKEN = "fp-auth-token";

    try {
        // Note: event.Records?.[0].cf?.request is undefined (becos this is not Lambda Edge)

        const env = process.env.DEPLOY_ENV;
        const LOCAL_ENV = "local";

        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        const playerName = body.playerName;

        const s3 = new S3Client({ region: process.env.AWS_REGION }); // AWS_REGION is a reserved keyword for AWS, for now its okay to leave as is
        const BUCKET_NAME = process.env.GAMES_BUCKET!; // set in lambda, TODO: we should inject this value in pipeline
        const gameCode = generateGameCode();
        const playerId = randomUUID();
        const newPlayer = initialiseNewPlayer(playerId, playerName);
        const initialGameState: IGameState = {
            code: gameCode,
            players: [newPlayer],
            board: getNewBoard(),
            initiative: playerId,
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

        const response: CreateGameResponse = {
            statusCode: 200,
            headers: {
                [FP_AUTH_TOKEN]: playerId,
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                gameCode,
                playerId,
                gameState: initialGameState,
            }),
        };

        if (env === LOCAL_ENV) {
            // we set cookie for local since prd is set thru LambdaEdge
            const cookieConfig = "Path=/; SameSite=Lax";
            response.headers["Access-Control-Allow-Origin"] = "*";
            response.multiValueHeaders = {
                "Set-Cookie": [`${FP_AUTH_TOKEN}=${playerId}; ${cookieConfig}`],
            };
        } else {
            /**
            // following code is just for reference due to above
            const domainTld = process.env.BASE_URL?.replace("https://", "").split(/\./).slice(-3).join(".");
            // The value of domain has to be <CF-HASH>.cloudfront.net TODO: Test this
            const domainCookieConfig = "Domain=" + domainTld;
            const cookieConfig = `Path=/; Secure; SameSite=None; ${domainTld ? domainCookieConfig : ""}`;
             */

            response.headers["Access-Control-Allow-Origin"] = process.env.BASE_URL ?? "*";
        }

        return response;
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
