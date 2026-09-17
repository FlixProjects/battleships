import type { AuthRequest } from "../types";
import { JwtHelper } from "./jwt-helper";
import { ResultType } from "../types/result-types";

export const MIN_USERNAME_LENGTH = 3;
export const MIN_PASSWORD_LENGTH = 8;

type IAuthRequestValidationResult =
    | { type: typeof ResultType.SUCCESS; body: AuthRequest }
    | { type: typeof ResultType.ERROR; message: string };

export const validateAuthRequest = async (body: Partial<AuthRequest>): Promise<IAuthRequestValidationResult> => {
    let result = { type: ResultType.ERROR };
    if (typeof body.username !== "string" || body.username.trim().length < MIN_USERNAME_LENGTH) {
        return { ...result, message: `username must be at least ${MIN_USERNAME_LENGTH} characters` };
    }

    if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD_LENGTH) {
        return { ...result, message: `password must be at least ${MIN_PASSWORD_LENGTH} characters` };
    }

    if (!body.publicJwk) {
        return { ...result, message: "publicJwk is missing" };
    }

    if (typeof body.publicJwk.d === "string") {
        return { ...result, message: "publicJwk must not contain private key material" };
    }

    const jwtHelper = new JwtHelper();
    try {
        await jwtHelper.importKey(body.publicJwk);
    } catch (err) {
        console.error("Failed to import publicJwk:", err);
        return { ...result, message: "publicJwk is malformed" };
    }

    return { type: ResultType.SUCCESS, body: body as AuthRequest };
};
