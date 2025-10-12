import * as esbuild from "esbuild";

async function buildLambda() {
    const entryPoints = ["create-game/index.ts"];

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
