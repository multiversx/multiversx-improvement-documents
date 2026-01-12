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

function main(): void {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log("No new snapshot files added.");
    return;
  }

  const data = files
    .map(readSnapshot)
    .find((snapshot): snapshot is SnapshotData => snapshot !== null);

  if (!data) {
    return;
  }

  const { proposalId, voteScAddress, content } = data;

  // Log extracted data in a formatted way
  console.log("\n✓ Snapshot loaded successfully");
  console.log(`  Proposal ID:    ${proposalId}`);
  console.log(`  Vote SC:        ${voteScAddress}`);
  console.log(`  Entries:        ${content.length}`);
  console.log("\nSnapshot Content:");
  console.log(JSON.stringify(content, null, 2));
}

main();
