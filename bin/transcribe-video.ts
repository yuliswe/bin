#!/usr/bin/env tsx

import { Command } from "commander";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

function run(cmd: string, args: string[]): void {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${cmd} exited with status ${result.status}`);
  }
}

const program = new Command();

program
  .name("transcribe-video")
  .description(
    "Transcribe a video: extract audio, run mlx_whisper for SRT subtitles, " +
      "and burn the subtitles into a new MP4.",
  )
  .version("1.0.0")
  .argument("<video>", "Path to the input video file")
  .action((video: string) => {
    const outDir = join(dirname(video), "out");
    const name = basename(video, extname(video));
    const mp3 = join(outDir, `${name}.mp3`);
    const srt = join(outDir, `${name}.srt`);
    const mp4 = join(outDir, `${name}.mp4`);

    mkdirSync(outDir, { recursive: true });

    run("ffmpeg", ["-y", "-i", video, "-vn", "-acodec", "libmp3lame", mp3]);

    run("mlx_whisper", [
      mp3,
      "--model",
      "mlx-community/whisper-large-v3-mlx",
      "--condition-on-previous-text",
      "False",
      "--no-speech-threshold",
      "0.8",
      "--compression-ratio-threshold",
      "2.0",
      "--task",
      "translate",
      "--output-format",
      "srt",
      "--output-dir",
      outDir,
    ]);

    run("ffmpeg", [
      "-y",
      "-i",
      video,
      "-vf",
      `subtitles=${srt}`,
      "-c:a",
      "copy",
      mp4,
    ]);

    console.log(`\n✓ Done`);
    console.log(`  Audio:    ${mp3}`);
    console.log(`  Subtitle: ${srt}`);
    console.log(`  Video:    ${mp4}`);
  });

program.parse(process.argv);
