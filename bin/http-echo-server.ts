#!/usr/bin/env npx tsx
import bodyParser from "body-parser";
import chalk from "chalk";
import express, { type RequestHandler } from "express";
import http from "http";
import rawBodyParser from "raw-body";
import { inspect } from "util";

type Args = {
  port: number;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let port = 3000; // default port
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-p" || args[i] === "--port") {
      port = parseInt(args[i + 1], 10);
      i++; // Skip next argument (the port number)
    }
  }
  return { port };
}

const { port } = parseArgs();

const app = express();

const MAX_BODY_SIZE = "1gb";

// --- 1. Middleware to parse known content types ---
app.use(bodyParser.json({ limit: MAX_BODY_SIZE })); // application/json
app.use(bodyParser.urlencoded({ extended: true, limit: MAX_BODY_SIZE })); // form data
app.use(bodyParser.text({ limit: MAX_BODY_SIZE })); // text/plain

// --- 2. Fallback middleware to parse raw body for unknown types ---
app.use(async (req, res, next) => {
  if (req.body !== undefined) {
    next();
    return;
  } // already parsed

  try {
    const raw = await rawBodyParser(req, { limit: MAX_BODY_SIZE });
    req.body = raw.toString(); // you can keep it as Buffer if needed
    next();
  } catch (err) {
    next(err);
  }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = http.createServer(app);

server.on("connection", (socket) => {
  console.log(chalk.gray("New connection established"));
  socket.on("close", () => {
    console.log(chalk.gray("Connection closed"));
  });
  socket.on("timeout", () => {
    console.log(chalk.gray("Connection timed out"));
  });
});

// For any request, simply pipe the request stream to the response.
app.all("*", ((req, res) => {
  const timestamp = new Date().toISOString();
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ??
    req.socket.remoteAddress;
  const message = [
    chalk.cyan(`[${timestamp}] ${req.method} ${req.url}`),
    chalk.yellow(`Your IP: ${ip}`),
    chalk.gray(inspect(req.headers)),
    inspect(req.body, {
      depth: null,
      maxArrayLength: Infinity,
      maxStringLength: Infinity,
      breakLength: Infinity,
    }),
  ].join("\n");
  console.log(message);
  res.setHeader("Content-Type", req.headers["content-type"] ?? "text/plain");
  res.send(message + "\n");
}) satisfies RequestHandler);

server.listen(port, () => {
  console.log(`HTTP echo server is listening on http://localhost:${port}`);
});
