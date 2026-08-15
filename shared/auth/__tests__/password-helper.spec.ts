import { hashPassword, verifyPassword } from "../password-helper";

describe("password-helper", () => {
    const password = "correct-horse-battery-staple";

    describe("hashPassword", () => {
        it("should return the salt and derived key as hex", async () => {
            const [saltHex, keyHex] = (await hashPassword(password)).split(":");

            expect(saltHex).toMatch(/^[a-f0-9]{32}$/); // 16 bytes
            expect(keyHex).toMatch(/^[a-f0-9]{128}$/); // 64 bytes
        });

        it("should salt each hash, so the same password never hashes alike", async () => {
            expect(await hashPassword(password)).not.toBe(await hashPassword(password));
        });
    });

    describe("verifyPassword", () => {
        it("should accept the password it was derived from", async () => {
            expect(await verifyPassword(password, await hashPassword(password))).toBe(true);
        });

        it("should reject a wrong password", async () => {
            expect(await verifyPassword("not-the-password", await hashPassword(password))).toBe(false);
        });

        it("should fail closed on a malformed stored hash", async () => {
            expect(await verifyPassword(password, "no-separator")).toBe(false);
            expect(await verifyPassword(password, ":")).toBe(false);
            expect(await verifyPassword(password, "")).toBe(false);
        });
    });
});
