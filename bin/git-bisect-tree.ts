#!/usr/bin/env npx tsx
import { exec } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

type BisectStatus = "good" | "bad";

async function readBisectLog(): Promise<Record<string, BisectStatus>> {
  const bisectLogPath = path.join(".git", "BISECT_LOG");
  const bisectMap: Record<string, BisectStatus> = {};
  const content = await fs.readFile(bisectLogPath, "utf8");
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines that start with "git bisect good" or "git bisect bad"
    const goodMatch = trimmed.match(/^git bisect good ([0-9a-f]+)/);
    if (goodMatch) {
      bisectMap[goodMatch[1]] = "good";
      continue;
    }
    const badMatch = trimmed.match(/^git bisect bad ([0-9a-f]+)/);
    if (badMatch) {
      bisectMap[badMatch[1]] = "bad";
      continue;
    }
    // You could add additional handling for "skip" if needed.
  }
  return bisectMap;
}

async function runGitLog(lastCommit?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cmd = `git log --color=always --decorate --graph --date-order --pretty='%C(auto)%h%d %C(auto)%s %C(#808080)by %C(italic)%aN %C(noitalic #808080)(%ar)' ${
      lastCommit ?? ""
    }`;
    exec(cmd, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * A simple function to remove ANSI escape codes from a string.
 * This regex covers many common escape sequences.
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

async function main(): Promise<void> {
  const lastCommit: string | undefined = process.argv[2];
  const bisectMap = await readBisectLog();
  const logOutput = await runGitLog(lastCommit);

  const lines = logOutput.split("\n").slice(0, 50); // Only process the first 50 lines

  for (let line of lines) {
    // Remove ANSI codes for regex matching.
    const plainLine = stripAnsi(line);
    // Extract an abbreviated commit hash (7 to 40 hex digits).
    const match = plainLine.match(/\b([0-9a-f]{7,40})\b/);
    if (match) {
      const abbrev = match[0];
      // Find if any full hash in bisectMap starts with the abbreviated hash.
      const statusEntry = Object.entries(bisectMap).find(([fullHash]) =>
        fullHash.startsWith(abbrev),
      );
      if (statusEntry) {
        const status = `(${statusEntry[1]}) `.padStart(7);
        line = status + line;
      } else {
        line = "".padStart(7) + line;
      }
    } else {
      line = "".padStart(7) + line;
    }
    console.log(line);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
