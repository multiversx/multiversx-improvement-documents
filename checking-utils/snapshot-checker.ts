import fs from "fs";
import path from "path";

interface SnapshotData {
  proposalId: string;
  voteScAddress: string;
  content: Array<{ address: string; balance: string }>;
}

function readSnapshot(filePath: string): SnapshotData | null {
  const voteScAddress = path.basename(path.dirname(filePath));
  const proposalId = path.basename(filePath, path.extname(filePath));

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const content = JSON.parse(raw);
    return { proposalId, voteScAddress, content };
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
    return null;
  }
}

function writeSummary(data: SnapshotData | null, summaryPath?: string): void {
  if (!summaryPath || !data) {
    return;
  }

  const lines: string[] = ["## Added snapshot", ""];
  lines.push(`- voteScAddress: \`${data.voteScAddress}\` • proposalId: \`${data.proposalId}\``);
  lines.push("  ```json");
  lines.push(JSON.stringify(data.content, null, 2));
  lines.push("  ```");

  fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`, "utf-8");
}

function main(): void {
  const files = process.argv.slice(2);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (files.length === 0) {
    if (summaryPath) {
      fs.appendFileSync(summaryPath, "No new snapshot files added.\n", "utf-8");
    }
    return;
  }

  const data = files
    .map(readSnapshot)
    .find((snapshot): snapshot is SnapshotData => snapshot !== null);

  if (!data) {
    return;
  }

  const { proposalId, voteScAddress, content } = data;

  // Log extracted data
  console.log(JSON.stringify({ proposalId, voteScAddress, content }));

  writeSummary(data, summaryPath);
}

main();
