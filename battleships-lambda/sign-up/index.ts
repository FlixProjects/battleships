import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { generateAuthToken } from "../../shared/auth/auth-helper";
import { validateAuthRequest } from "../../shared/auth/auth-request-validator";
import { hashPassword } from "../../shared/auth/password-helper";
import { ERROR_MESSAGES, FP_AUTH_TOKEN } from "../../shared/constants";
import type { SignUpRequest } from "../../shared/types/domains";
import { ErrorCode, SuccessCode } from "../../shared/types/response-types";
import { getAuthTokenSecret } from "../lib/auth-secret";
import { USERS_TABLE, getDocClient } from "../lib/dynamo";
import { isLocal } from "../lib/env";
import { ErrorApiResponse } from "../lib/response/error-response";
import { InternalServerErrorApiResponse } from "../lib/response/internal-server-error-response";
import { ApiResponse } from "../lib/response/response";
import { type PlainApiResponse } from "../lib/response/types";

export const handler = async (event: APIGatewayProxyEvent): Promise<PlainApiResponse> => {
    try {
        if (!event.body) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(ERROR_MESSAGES.MISSING_REQUEST_BODY).build();
        }

        const body = JSON.parse(event.body) as Partial<SignUpRequest>;

        const validationMessage = await validateAuthRequest(body);
        if (validationMessage) {
            return new ErrorApiResponse(ErrorCode.BAD_REQUEST).setMessage(validationMessage).build();
        }

        const username = String(body.username).trim().toLowerCase();
        const userId = randomUUID();

        await getDocClient().send(
            new PutCommand({
                TableName: USERS_TABLE,
                Item: {
                    id: userId,
                    username,
                    password: await hashPassword(String(body.password)),
                    publicJwk: body.publicJwk,
                    createdAt: new Date().toISOString(),
                },
                // the table is keyed on username, so this is what enforces uniqueness
                ConditionExpression: "attribute_not_exists(username)",
            }),
        );

        const authToken = await generateAuthToken(userId, await getAuthTokenSecret());
        const response = new ApiResponse({ statusCode: SuccessCode.CREATED })
            .setHeaders({ [FP_AUTH_TOKEN]: authToken })
            .setBody({ message: "Sign-up successful", userId, username });

        if (isLocal()) {
            // locally there is no Lambda@Edge to translate the header into a cookie
            response.setHeaders({ "Access-Control-Allow-Origin": "*" });
            response.setCookie(`${FP_AUTH_TOKEN}=${authToken}; Path=/; SameSite=Lax`);
        }

        return response.build();
    } catch (err) {
        if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
            return new ErrorApiResponse(ErrorCode.CONFLICT).setMessage(ERROR_MESSAGES.USERNAME_TAKEN).build();
        }

        console.error("sign-up failed", err);
        return new InternalServerErrorApiResponse().build();
    }
};
