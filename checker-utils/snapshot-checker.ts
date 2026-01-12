import fs from "fs";
import path from "path";
import { AddressUtils, ApiService } from "@multiversx/sdk-nestjs";
import { BigNumber } from "bignumber.js";
import { MerkleTreeUtils } from "./merkle-tree.utils";
import axios from "axios";

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

async function getRootHashForProposal(voteScAddress: string, proposalId: string): Promise<string> {
  const baseUrl = `https://api.multiversx.com`;
  const {data: txData} = await axios.get(`${baseUrl}/transactions?receiver=${voteScAddress}&function=set_root_hash&status=success&size=1000`);
  for(const tx of txData) {
    const decodedData = Buffer.from(tx.data, 'base64').toString('utf-8');
    const [_functionName, rootHash, proposalIdFromTxRaw] = decodedData.split('@');
    const proposalIdFromTx = BigNumber(proposalIdFromTxRaw, 16).toString(10);
    if(proposalIdFromTx === proposalId) {
      return rootHash;
    }
  }
  return '';
}

async function isValidSnapshotRootHash(data: SnapshotData): Promise<boolean> {
  const merkleTreeUtils = new MerkleTreeUtils(data.content);
  const computedRootHash = merkleTreeUtils.getRootHash();

  console.log(`Computed root hash: ${computedRootHash}`);
  const networkRootHash = await getRootHashForProposal(data.voteScAddress, data.proposalId);
  if(networkRootHash === '') {
    console.error(`No root hash found on chain for proposal ID ${data.proposalId}`);
    return false;
  }
  console.log(`Network root hash: ${networkRootHash}`);

  if(computedRootHash !== networkRootHash) {
    console.error(`Root hash mismatch!`);
    return false;
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

  const isValid = isValidSnapshotData(data);
  if (!isValid) {
    console.error("Snapshot data validation failed.");
    process.exit(1);
  }

  const isRootHashValid = await isValidSnapshotRootHash(data);
  if (!isRootHashValid) {
    console.error("Snapshot root hash validation failed.");
    process.exit(1);
  }
  
  console.log("\n✓ Snapshot data is valid.");
}

main();
