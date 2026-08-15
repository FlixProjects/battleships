import { JwtHelper } from "./jwt-helper";

const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET ?? "test-secret";

export const generateAuthToken = async (userId: string) => {
    const jwtHelper = new JwtHelper();

    const currentTime = Math.floor(Date.now() / 1000);
    const payload = {
        sub: userId,
        iat: currentTime,
        exp: currentTime + 60 * 15, // 15 min
    };

    return await jwtHelper.sign(payload, AUTH_TOKEN_SECRET, "HS256");
};
