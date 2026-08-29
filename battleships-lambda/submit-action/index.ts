import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { LambdaFunctionURLEvent } from "aws-lambda";
import { ERROR_MESSAGES } from "../../shared/constants";
import { Action } from "../../shared/models/actions/Action";
import { transformGameStateToPlain, transformPlainGameStateToDomain } from "../../shared/transformers";
import type { IPlayerAction } from "../../shared/types/action-types";
import type { SubmitActionResponse as ISubmitActionResponse, SubmitActionRequest } from "../../shared/types/domains";
import { ErrorCode } from "../../shared/types/response-types";
import type { IPlainGameState } from "../../shared/types/types";
import { handleActions } from "../../shared/utils/action-handler";
import { getGamesBucket, isLocal } from "../lib/env";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";
import { withAuth } from "../lib/with-auth";

export const handler = withAuth(async (event: LambdaFunctionURLEvent, auth): Promise<PlainApiResponse> => {
    try {
        const body = (event.body ? JSON.parse(event.body) : {}) as Partial<SubmitActionRequest>;
        const gameCode = body.gameCode;
        // TODO: SubmitActionRequest still types these as IAction; drop the cast with it
        const actions = (body.actions ?? []) as IPlayerAction[];

        if (!gameCode) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_GAME_CODE).build();
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
            return new ErrorApiResponse(ErrorCode.NOT_FOUND).setMessage(ERROR_MESSAGES.GAME_NOT_FOUND).build();
        }

        // the caller is authenticated, but that says nothing about this game
        if (!gameState.players?.some((player) => player.id === auth.userId)) {
            return new ErrorApiResponse(ErrorCode.AUTHORIZATION_FAILED)
                .setMessage(ERROR_MESSAGES.NOT_A_PLAYER_IN_GAME)
                .build();
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

        return new ApiResponse().setBody(responseBody).build();
    } catch (err) {
        console.error("submit-action failed", err);
        return new InternalServerErrorApiResponse().build();
    }
});
