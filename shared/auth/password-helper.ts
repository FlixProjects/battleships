import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const SALT_BYTES = 16;
const SCRYPT_KEY_LENGTH = 64;

// the explicit type args pick the right overload of the overloaded `scrypt`
const scryptAsync = promisify<string, Buffer, number, Buffer>(scrypt);

/**
 * Node-only: this module reaches for `node:crypto`, so it is deliberately kept
 * out of the `shared/index.ts` barrel — importing it from the frontend would
 * pull a crypto polyfill into the bundle.
 */

/** scrypt with a per-user random salt, stored as `salt:derivedKey` in hex. */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = randomBytes(SALT_BYTES);
    const derivedKey = await scryptAsync(password, salt, SCRYPT_KEY_LENGTH);
    return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
};

/**
 * Re-derives the key using the salt embedded in `storedHash` and compares in
 * constant time, so the comparison leaks nothing about how much of the hash
 * matched. A malformed stored hash fails closed.
 */
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
    const [saltHex, keyHex] = storedHash.split(":");

    if (!saltHex || !keyHex) {
        return false;
    }

    const expectedKey = Buffer.from(keyHex, "hex");
    const derivedKey = await scryptAsync(password, Buffer.from(saltHex, "hex"), expectedKey.length);

    // timingSafeEqual throws on a length mismatch, so the guard is load-bearing
    if (derivedKey.length !== expectedKey.length) {
        return false;
    }

    return timingSafeEqual(derivedKey, expectedKey);
};
