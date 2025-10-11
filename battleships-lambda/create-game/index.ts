import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "crypto";
import { getNewBoard } from "./common/constants";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const s3 = new S3Client({ region: process.env.AWS_REGION }); // AWS_REGION is a reserved keyword for AWS, for now its okay to leave as is
        const BUCKET_NAME = process.env.GAMES_BUCKET!; // set in lambda, TODO: we should inject this value
        const gameCode = generateGameCode();
        const playerId = randomUUID();

        const initialGameState = {
            gameCode,
            players: [{ id: playerId, ready: false, board: getNewBoard() }],
            createdAt: new Date().toISOString(),
        };

        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `games/${gameCode}.json`,
                Body: JSON.stringify(initialGameState),
                ContentType: "application/json",
            }),
        );

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // FIXME: restrict origins
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: JSON.stringify({
                code: gameCode,
                playerId,
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
