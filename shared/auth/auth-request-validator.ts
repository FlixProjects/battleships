import type { AuthRequest } from "../types";

export const MIN_USERNAME_LENGTH = 3;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Shape-checks the body of a sign-up / sign-in request. Both extend
 * `AuthRequest`, so the same rules apply to either route.
 *
 * Returns a validation message, or `undefined` when the payload is usable.
 */
export const validateAuthRequest = (body: Partial<AuthRequest>): string | undefined => {
    if (typeof body.username !== "string" || body.username.trim().length < MIN_USERNAME_LENGTH) {
        return `username must be at least ${MIN_USERNAME_LENGTH} characters`;
    }

    if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD_LENGTH) {
        return `password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }

    if (!body.publicJwk || typeof body.publicJwk.kty !== "string") {
        return "publicJwk is missing or malformed";
    }

    // `d` is the private component. A client sending one is either broken or
    // hostile; either way it must never reach the datastore.
    if (typeof body.publicJwk.d === "string") {
        return "publicJwk must not contain private key material";
    }

    return undefined;
};
