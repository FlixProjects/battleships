import * as esbuild from "esbuild";
import { execSync } from "child_process";

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

    entryPoints.forEach((zipTarget) => {
        const input = `dist/` + zipTarget.replace(/\.ts$/, ".js");
        const output = `dist/${zipTarget}`.replace(/\.ts$/, ".zip");
        execSync(`zip ${output} ${input}`);
    });

    console.log(`✅ Built and zipped Lambda`);
}

buildLambda().catch((err) => {
    console.error(err);
    process.exit(1);
});
