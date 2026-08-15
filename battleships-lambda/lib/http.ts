import { isLocal } from "./env";

export interface LambdaResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    multiValueHeaders?: Record<string, Array<string>>;
}

const allowedOrigin = (): string => {
    if (isLocal()) {
        return "*";
    }
    return process.env.BASE_URL ?? "*";
};

export const corsHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": allowedOrigin(),
});

export const jsonResponse = (
    statusCode: number,
    body: Record<string, string>,
    headers: Record<string, string> = {},
): LambdaResponse => ({
    statusCode,
    headers: { ...corsHeaders(), ...headers },
    body: JSON.stringify(body),
});

export const errorResponse = (statusCode: number, message: string): LambdaResponse =>
    jsonResponse(statusCode, { message });
