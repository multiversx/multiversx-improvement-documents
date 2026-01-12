import fs from "fs";
import path from "path";
import { AddressUtils } from "@multiversx/sdk-nestjs";
import { BigNumber } from "bignumber.js";

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

function isValidSnapshotData(data: SnapshotData): boolean  {
  const {voteScAddress, proposalId, content}  = data;

  // check vote sc address validity
  if(!AddressUtils.isSmartContractAddress(voteScAddress)) {
    console.error(`Invalid vote SC address: ${voteScAddress}`);
    return false;
  }
  
  // check proposal id validity
  if(Number.isNaN(Number(proposalId))) {
    console.error(`Invalid proposal ID: ${proposalId}`);
    return false;
  
  }
  // check content entries validity
  for(const entry of content) {
    if(!AddressUtils.isAddressValid(entry.address)) {
      console.error(`Invalid address in snapshot content: ${entry.address}`);
      return false;
    }

    const balance = new BigNumber(entry.balance);
    if(balance.isNaN() || balance.isLessThan(new BigNumber(0))) {
      console.error(`Invalid balance for address ${entry.address}: ${entry.balance}`);
      return false;
    }
  }

  return true;
}

async function main(): Promise<void> {
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
