import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import { Action } from "../../shared/models/actions/Action";
import { transformGameStateToPlain, transformPlainGameStateToDomain } from "../../shared/transformers";
import { handleActions } from "../../shared/utils/action-handler";
import { getGamesBucket, isLocal } from "../lib/env";
import { type LambdaResponse, corsHeaders, errorResponse } from "../lib/http";
import { withAuth } from "../lib/with-auth";
import type { IPlayerAction } from "../../shared/types/action-types";
import type { SubmitActionRequest, SubmitActionResponse as ISubmitActionResponse } from "../../shared/types/domains";
import type { IPlainGameState } from "../../shared/types/types";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<LambdaResponse> => {
    try {
        const body = (event.body ? JSON.parse(event.body) : {}) as Partial<SubmitActionRequest>;
        const gameCode = body.gameCode;
        // TODO: SubmitActionRequest still types these as IAction; drop the cast with it
        const actions = (body.actions ?? []) as IPlayerAction[];

        if (!gameCode) {
            return errorResponse(400, "Bad request: missing game code");
        }

        const s3 = new S3Client({ region: process.env.AWS_REGION });
        let gameState: IPlainGameState | undefined = body.gameState; // will only be present for local

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

        // the caller is authenticated, but that says nothing about this game
        if (!gameState.players?.some((player) => player.id === auth.userId)) {
            return errorResponse(403, "You are not a player in this game");
        }

        const { results, newGameState, obscuredGameState } = handleActions(
            auth.userId,
            transformPlainGameStateToDomain(gameState),
            actions.map((action) => Action.toDomain(action)),
        );

        const plainNewGameState = transformGameStateToPlain(newGameState);

        if (!isLocal()) {
            await s3.send(
                new PutObjectCommand({
                    Bucket: getGamesBucket(),
                    Key: `games/${gameCode}.json`,
                    Body: JSON.stringify(plainNewGameState),
                    ContentType: "application/json",
                }),
            );
        }

        const responseBody: ISubmitActionResponse = {
            gameState: obscuredGameState ? transformGameStateToPlain(obscuredGameState) : plainNewGameState,
            results,
        };

        if (isLocal()) {
            responseBody.gameStateForLocal = plainNewGameState;
        }

        return {
            statusCode: 200,
            headers: corsHeaders(),
            body: JSON.stringify(responseBody),
        };
    } catch (err) {
        // without a body the function URL emits a bare 500 and cloudfront logs an
        // opaque OriginError, so always serialise the failure into one
        console.error("submit-action failed", err);
        return errorResponse(500, "some error happened");
    }
});
