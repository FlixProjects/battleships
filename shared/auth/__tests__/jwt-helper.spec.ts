import { JwtHelper } from "../jwt-helper";
describe("JwtHelper", () => {
    let jwtHelper: JwtHelper;

    beforeEach(() => {
        jwtHelper = new JwtHelper();
    });

    describe("generateKeyPair", () => {
        it("should generate a key pair and store the private key", async () => {
            const keyPair = await jwtHelper.generateKeyPair();

            expect(keyPair).toHaveProperty("publicKey");
            expect(keyPair).toHaveProperty("privateKey");
        });
    });
});
