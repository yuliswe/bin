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

// --- 1. Middleware to parse known content types ---
app.use(bodyParser.json()); // application/json
app.use(bodyParser.urlencoded({ extended: true })); // form data
app.use(bodyParser.text()); // text/plain

// --- 2. Fallback middleware to parse raw body for unknown types ---
app.use(async (req, res, next) => {
  if (req.body !== undefined) {
    next();
    return;
  } // already parsed

  try {
    const raw = await rawBodyParser(req);
    req.body = raw.toString(); // you can keep it as Buffer if needed
    next();
  } catch (err) {
    next(err);
  }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = http.createServer(app);
// server.headersTimeout = 0;
// server.keepAliveTimeout = 0;
// server.timeout = 0;
// server.requestTimeout = 0;

// Log when a new connection is made
// server.on("connection", (socket) => {
//   console.log("🟢 New connection established");
//   socket.setTimeout(0);

//   socket.resume();

//   socket.on("close", () => {
//     console.log("🔴 Connection closed");
//   });

//   socket.on("timeout", () => {
//     console.log("⏰ Connection timed out");
//   });
// });

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
    inspect(req.body, { depth: null }),
  ].join("\n");
  console.log(message);
  res.setHeader("Content-Type", req.headers["content-type"] ?? "text/plain");
  res.send(message);
}) satisfies RequestHandler);

server.listen(port, () => {
  console.log(`HTTP echo server is listening on http://localhost:${port}`);
});
