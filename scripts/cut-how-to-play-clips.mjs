// Cuts the How to Play clips out of the video recorded by e2e/how-to-play.record.spec.ts.
// Needs ffmpeg-static: npm install --no-save ffmpeg-static
// Cuts every clip by default; --only 06-details,13-game-end cuts just those.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const RECORDING_DIR = path.resolve(".recordings/how-to-play");
const OUT_DIR = path.resolve("public/assets/how-to-play");
const WIDTH = 960;
const LEAD_IN = 0.2;
const TAIL = 0.3;

// Output file → the recorded segments it is cut from, in order
const CLIPS = {
    "01-create-join.mp4": ["create-join"],
    "02-wait-refresh.mp4": ["wait-refresh"],
    "03-deploy-flagship.mp4": ["deploy-flagship"],
    "04-command-points.mp4": ["command-points"],
    "05-hand.mp4": ["hand"],
    "06-details.mp4": ["details"],
    "07-play-cards.mp4": ["command-points", "play-flare"],
    "08-move.mp4": ["move"],
    "09-attack.mp4": ["attack"],
    "10-submit.mp4": ["submit"],
    "11-fog-of-war.mp4": ["fog-of-war"],
    "12-playback.mp4": ["playback"],
    "13-game-end.mp4": ["game-end"],
};

const loadFfmpeg = async () => {
    try {
        const { default: ffmpegPath } = await import("ffmpeg-static");
        return ffmpegPath;
    } catch {
        console.error("ffmpeg-static is not installed. Run: npm install --no-save ffmpeg-static");
        process.exit(1);
    }
};

const loadMarkers = () => {
    const file = path.join(RECORDING_DIR, "markers.json");
    if (!existsSync(file)) {
        console.error(
            `No ${file}. Record first: RECORD_HOW_TO_PLAY=1 npx playwright test e2e/how-to-play.record.spec.ts`,
        );
        process.exit(1);
    }
    return JSON.parse(readFileSync(file, "utf-8"));
};

const sizeOf = (file) => `${(statSync(file).size / 1024).toFixed(0)} KB`;

const cutClip = (ffmpeg, video, segments, outFile) => {
    const trims = segments.map(
        ({ start, end }, i) =>
            `[0:v]trim=start=${Math.max(0, start - LEAD_IN).toFixed(2)}:end=${(end + TAIL).toFixed(2)},setpts=PTS-STARTPTS[v${i}]`,
    );
    const joined = segments.map((_, i) => `[v${i}]`).join("");
    const filter = `${trims.join(";")};${joined}concat=n=${segments.length}:v=1:a=0,fps=30,scale=${WIDTH}:-2[out]`;

    execFileSync(
        ffmpeg,
        [
            "-y",
            "-loglevel",
            "error",
            "-i",
            video,
            "-filter_complex",
            filter,
            "-map",
            "[out]",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "28",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-an",
            outFile,
        ],
        { stdio: "inherit" },
    );
};

// --only 06-details,00-rules limits the run to those outputs (matched by name without extension)
const parseOnly = () => {
    const index = process.argv.indexOf("--only");
    if (index < 0) return null;
    const names = (process.argv[index + 1] ?? "").split(",").filter(Boolean);
    if (names.length === 0) {
        console.error("--only needs a comma-separated list, e.g. --only 06-details,00-rules");
        process.exit(1);
    }
    return new Set(names);
};

const only = parseOnly();
const isWanted = (file) => !only || only.has(path.parse(file).name);

if (only) {
    const known = new Set([...Object.keys(CLIPS), "00-rules.png"].map((file) => path.parse(file).name));
    const unknown = [...only].filter((name) => !known.has(name));
    if (unknown.length > 0) {
        console.error(`Unknown output(s): ${unknown.join(", ")}. Known: ${[...known].join(", ")}`);
        process.exit(1);
    }
}

const ffmpeg = await loadFfmpeg();
const { video, segments } = loadMarkers();
mkdirSync(OUT_DIR, { recursive: true });

for (const [file, names] of Object.entries(CLIPS).filter(([file]) => isWanted(file))) {
    const clipSegments = names.flatMap((name) => segments[name] ?? []);
    if (clipSegments.length === 0) {
        console.warn(`skip ${file}: no segments recorded for ${names.join(", ")}`);
        continue;
    }
    const outFile = path.join(OUT_DIR, file);
    cutClip(ffmpeg, video, clipSegments, outFile);
    console.log(`${file}  ${sizeOf(outFile)}`);
}

if (isWanted("00-rules.png")) {
    const still = path.join(OUT_DIR, "00-rules.png");
    execFileSync(
        ffmpeg,
        ["-y", "-loglevel", "error", "-i", path.join(RECORDING_DIR, "00-rules.png"), "-vf", `scale=${WIDTH}:-2`, still],
        { stdio: "inherit" },
    );
    console.log(`00-rules.png  ${sizeOf(still)}`);
}
