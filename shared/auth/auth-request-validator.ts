import type { AuthRequest } from "../types";
import { JwtHelper } from "./jwt-helper";

export const MIN_USERNAME_LENGTH = 3;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Shape-checks the body of a sign-up / sign-in request. Both extend
 * `AuthRequest`, so the same rules apply to either route.
 *
 * Returns a validation message, or `undefined` when the payload is usable.
 */
export const validateAuthRequest = async (body: Partial<AuthRequest>): Promise<string | undefined> => {
    if (typeof body.username !== "string" || body.username.trim().length < MIN_USERNAME_LENGTH) {
        return `username must be at least ${MIN_USERNAME_LENGTH} characters`;
    }

    if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD_LENGTH) {
        return `password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }

    if (!body.publicJwk) {
        return "publicJwk is missing";
    }

    if (typeof body.publicJwk.d === "string") {
        return "publicJwk must not contain private key material";
    }

    const jwtHelper = new JwtHelper();
    try {
        await jwtHelper.importKey(body.publicJwk);
    } catch (err) {
        console.error("Failed to import publicJwk:", err);
        return "publicJwk is malformed";
    }

    return undefined;
};
