#!/usr/bin/env tsx

import { spawn, type SpawnOptions } from "node:child_process";
import * as process from "node:process";

// Define the type for a window object
type WindowInfo = {
  "app-name": string;
  "window-id": number;
  "window-title": string;
};

const AEROSPACE = `${process.env.HOME}/lab/AeroSpace/.debug/aerospace`;
// const AEROSPACE = `echo`;

function execAsync(
  cmd: string,
  args: string[],
  options: SpawnOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, options);
    child.stdout?.on("data", (data: Buffer) => {
      const str = data.toString();
      console.log(str);
      resolve(str);
    });
    child.stderr?.on("data", (data: Buffer) => {
      const str = data.toString();
      console.error(str);
      reject(new Error(str));
    });
  });
}

async function aerospace(args: string[]): Promise<string> {
  console.log(`Executing: ${AEROSPACE} ${args.join(" ")}`);

  const result = await execAsync(AEROSPACE, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "inherit"],
  });

  return result;
}

// Function to execute the aerospace command and get focused windows
async function getWindowsInFocusedWorkspace() {
  try {
    const output = await aerospace([
      "list-windows",
      "--json",
      "--workspace",
      "focused",
    ]);
    const windows = JSON.parse(output) as WindowInfo[];

    if (!Array.isArray(windows)) {
      throw new Error("Expected array output from aerospace command");
    }

    return windows;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(
        "Failed to parse JSON output from aerospace command:",
        error.message,
      );
    } else if (error instanceof Error) {
      console.error("Error executing aerospace command:", error.message);
    } else {
      console.error("Unknown error occurred:", error);
    }
    return [];
  }
}

// Function to display the focused windows
async function main(): Promise<void> {
  const windows = await getWindowsInFocusedWorkspace();

  for (const window of windows) {
    void aerospace([
      "layout",
      "--window-id",
      window["window-id"].toString(),
      "tiling",
    ]);
  }

  process.exit(0);
}

void main();
