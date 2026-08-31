#!/usr/bin/env -S npx tsx

import chalk from "chalk";
import { execSync } from "node:child_process";

interface PR {
  number: number;
  title: string;
  headRefName: string;
  baseRefName: string;
  url: string;
  reviewDecision: string;
  commits: { oid: string }[];
}

function hyperlink(text: string, url: string): string {
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

const defaultBranch = execSync(
  `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`,
  { encoding: "utf-8" },
).trim();

const raw = execSync(
  `gh pr list --author @me --state open --json number,title,headRefName,baseRefName,url,reviewDecision,commits`,
  { encoding: "utf-8" },
);
const prs: PR[] = JSON.parse(raw);

function printTree(base: string, indent = ""): void {
  const children = prs.filter((pr) => pr.baseRefName === base);
  for (const pr of children) {
    const approved = pr.reviewDecision === "APPROVED" ? chalk.green(" ✓") : "";
    console.log(
      `${indent}└─ ${hyperlink(chalk.yellow(`${pr.number}`), pr.url)}${approved} ${chalk.cyan(pr.headRefName)} ${chalk.yellow(`(${pr.commits.length} commits)`)} ${chalk.white(pr.title)}`,
    );
    printTree(pr.headRefName, `  ${indent}`);
  }
}

if (prs.length === 0) {
  console.log(chalk.dim("No open PRs."));
} else {
  printTree(defaultBranch);
}
