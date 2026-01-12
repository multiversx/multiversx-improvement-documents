import fs from "fs";
import path from "path";

interface SnapshotRow {
  address: string;
  proposalId: string;
  snapshot: unknown;
}

function readSnapshot(filePath: string): SnapshotRow | null {
  const address = path.basename(path.dirname(filePath));
  const proposalId = path.basename(filePath, path.extname(filePath));

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return { address, proposalId, snapshot: parsed };
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
    return null;
  }
}

function writeSummary(rows: SnapshotRow[], summaryPath?: string): void {
  if (!summaryPath) {
    return;
  }

  if (rows.length === 0) {
    fs.appendFileSync(summaryPath, "No new snapshot files added.\n", "utf-8");
    return;
  }

  const lines: string[] = ["## Added snapshots", ""];

  for (const row of rows) {
    lines.push(`- address: \`${row.address}\` • proposal_id: \`${row.proposalId}\``);
    lines.push("  ```json");
    lines.push(JSON.stringify(row.snapshot, null, 2));
    lines.push("  ```");
  }

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

  const rows = files
    .map(readSnapshot)
    .filter((row): row is SnapshotRow => row !== null);

  for (const row of rows) {
    console.log(JSON.stringify(row));
  }

  writeSummary(rows, summaryPath);
}

main();
