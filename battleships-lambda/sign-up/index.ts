import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { validateAuthRequest } from "../../shared/auth/auth-request-validator";
import { hashPassword } from "../../shared/auth/password-helper";
import type { SignUpRequest } from "../../shared";
import { USERS_TABLE, getDocClient } from "../lib/dynamo";
import { isLocal } from "../lib/env";
import { LambdaResponse, corsHeaders, errorResponse } from "../lib/http";

const FP_AUTH_TOKEN = "fp-auth-token";

export const handler = async (event: APIGatewayProxyEvent): Promise<LambdaResponse> => {
    try {
        if (!event.body) {
            return errorResponse(400, "request body is required");
        }

        const body = JSON.parse(event.body) as Partial<SignUpRequest>;

        const validationMessage = validateAuthRequest(body);
        if (validationMessage) {
            return errorResponse(400, validationMessage);
        }

        const username = String(body.username).trim().toLowerCase();
        const userId = randomUUID();

        await getDocClient().send(
            new PutCommand({
                TableName: USERS_TABLE,
                Item: {
                    username,
                    userId,
                    passwordHash: await hashPassword(String(body.password)),
                    publicJwk: body.publicJwk,
                    createdAt: new Date().toISOString(),
                },
                // the table is keyed on username, so this is what enforces uniqueness
                ConditionExpression: "attribute_not_exists(username)",
            }),
        );

        const response: LambdaResponse = {
            statusCode: 201,
            headers: { ...corsHeaders(), [FP_AUTH_TOKEN]: userId },
            body: JSON.stringify({ message: "Sign-up successful", userId, username }),
        };

        if (isLocal()) {
            // locally there is no Lambda@Edge to translate the header into a cookie
            response.multiValueHeaders = {
                "Set-Cookie": [`${FP_AUTH_TOKEN}=${userId}; Path=/; SameSite=Lax`],
            };
        }

        return response;
    } catch (err) {
        if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
            return errorResponse(409, "username is already taken");
        }

        console.log(err);
        return errorResponse(500, "some error happened");
    }
};
