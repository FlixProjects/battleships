import * as esbuild from "esbuild";

async function buildLambda() {
    const entryPoints = [
        "create-game/index.ts",
        "join-game/index.ts",
        "get-game/index.ts",
        "submit-action/index.ts",
        "sign-up/index.ts",
        "login/index.ts",
        // "edge-auth-viewer-response/index.ts",
    ];

    await esbuild.build({
        entryPoints,
        bundle: true,
        minify: true,
        platform: "node",
        target: "node22",
        outdir: "dist",
        outbase: ".",
        tsconfig: "../tsconfig.json",
    });
}

buildLambda().catch((err) => {
    console.error(err);
    process.exit(1);
});
