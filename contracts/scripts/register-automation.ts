/**
 * Chainlink Automation Registration Script for DeadSwitch
 *
 * Registers the InheritanceVault contract as a Chainlink Automation upkeep on Sepolia.
 *
 * Prerequisites:
 * 1. Contract must be deployed (0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7)
 * 2. Contract must implement checkUpkeep() and performUpkeep()
 * 3. Need LINK tokens on Sepolia (get from https://faucets.chain.link/)
 * 4. DEPLOYER_PRIVATE_KEY must be set in .env
 *
 * Chainlink Automation Sepolia addresses:
 * - Registry:  0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad
 * - Registrar: 0xb0E49c5D0d05cbc241d68c05BC5BA1d1B7B72976
 * - LINK:      0x779877A7B0D9E8603169DdbD7836e478b4624789
 *
 * MANUAL REGISTRATION (recommended for hackathon):
 * 1. Go to https://automation.chain.link/ and connect wallet
 * 2. Switch to Sepolia testnet
 * 3. Click "Register new Upkeep"
 * 4. Select "Custom logic" trigger
 * 5. Enter contract address: 0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7
 * 6. Name: "DeadSwitch Heartbeat Monitor"
 * 7. Gas limit: 500000
 * 8. Starting balance: 5 LINK (get from faucet)
 * 9. Admin address: your deployer wallet
 * 10. Confirm transaction
 *
 * Usage: npx hardhat run scripts/register-automation.ts --network sepolia
 */

import { ethers } from "hardhat";

// Chainlink Automation Sepolia addresses
const LINK_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
const REGISTRAR = "0xb0E49c5D0d05cbc241d68c05BC5BA1d1B7B72976";
const REGISTRY = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";

// Our contract
const VAULT_CONTRACT = "0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7";

// LINK token ERC-677 ABI (transferAndCall)
const LINK_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferAndCall(address to, uint256 value, bytes calldata data) returns (bool)",
];

// Automation Registrar ABI (v2.1)
const REGISTRAR_ABI = [
  "function registerUpkeep(tuple(string name, bytes encryptedEmail, address upkeepContract, uint32 gasLimit, address adminAddress, uint8 triggerType, bytes checkData, bytes triggerConfig, bytes offchainConfig, uint96 amount) requestParams) returns (uint256)",
];

// Registry ABI for checking upkeep
const REGISTRY_ABI = [
  "function getUpkeep(uint256 id) view returns (tuple(address target, uint32 performGas, bytes checkData, uint96 balance, address admin, uint64 maxValidBlocknumber, uint32 lastPerformedBlockNumber, uint96 amountSpent, bool paused, bytes offchainConfig))",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=== DeadSwitch Chainlink Automation Registration ===");
  console.log("Deployer:", deployer.address);
  console.log("Network: Sepolia");
  console.log("Vault contract:", VAULT_CONTRACT);
  console.log("");

  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(deployer.address);
  console.log("ETH balance:", ethers.formatEther(ethBalance), "ETH");

  // Check LINK balance
  const linkContract = new ethers.Contract(LINK_TOKEN, LINK_ABI, deployer);
  const linkBalance = await linkContract.balanceOf(deployer.address);
  console.log("LINK balance:", ethers.formatEther(linkBalance), "LINK");

  if (linkBalance === 0n) {
    console.log("\n!!! No LINK tokens found !!!");
    console.log("Get LINK from the Chainlink faucet: https://faucets.chain.link/sepolia");
    console.log("\nAlternatively, register manually:");
    console.log("1. Go to https://automation.chain.link/sepolia");
    console.log("2. Click 'Register new Upkeep'");
    console.log("3. Select 'Custom logic'");
    console.log(`4. Contract: ${VAULT_CONTRACT}`);
    console.log("5. Name: DeadSwitch Heartbeat Monitor");
    console.log("6. Gas limit: 500000");
    console.log("7. Fund with LINK from faucet");
    return;
  }

  const fundAmount = ethers.parseEther("5"); // 5 LINK for the upkeep

  if (linkBalance < fundAmount) {
    console.log(`\nInsufficient LINK. Need 5 LINK, have ${ethers.formatEther(linkBalance)}`);
    console.log("Get more from: https://faucets.chain.link/sepolia");
    return;
  }

  console.log("\nRegistering upkeep with Chainlink Automation...");

  // Encode registration parameters
  const registrar = new ethers.Contract(REGISTRAR, REGISTRAR_ABI, deployer);

  const registrationParams = {
    name: "DeadSwitch Heartbeat Monitor",
    encryptedEmail: "0x",
    upkeepContract: VAULT_CONTRACT,
    gasLimit: 500000,
    adminAddress: deployer.address,
    triggerType: 0, // 0 = condition-based (checkUpkeep/performUpkeep)
    checkData: "0x",
    triggerConfig: "0x",
    offchainConfig: "0x",
    amount: fundAmount,
  };

  // Approve LINK spending
  console.log("Approving LINK transfer...");
  const approveTx = await linkContract.approve(REGISTRAR, fundAmount);
  await approveTx.wait();
  console.log("LINK approved.");

  // Register
  console.log("Calling registerUpkeep...");
  try {
    const tx = await registrar.registerUpkeep(registrationParams);
    const receipt = await tx.wait();
    console.log("Transaction hash:", receipt.hash);

    // Try to extract upkeep ID from events
    console.log("\n=== Registration Successful! ===");
    console.log("Transaction:", receipt.hash);
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("\nCheck your upkeep at: https://automation.chain.link/sepolia");
    console.log("The contract will now be automatically monitored by Chainlink keepers.");
    console.log("When checkUpkeep() returns true (heartbeat expired), performUpkeep() will be called.");
  } catch (err: any) {
    console.error("\nRegistration failed:", err.message);
    console.log("\n=== Manual Registration Steps ===");
    console.log("1. Go to https://automation.chain.link/sepolia");
    console.log("2. Connect your wallet");
    console.log("3. Click 'Register new Upkeep'");
    console.log("4. Select 'Custom logic' as the trigger");
    console.log(`5. Enter contract: ${VAULT_CONTRACT}`);
    console.log("6. Name: DeadSwitch Heartbeat Monitor");
    console.log("7. Gas limit: 500000");
    console.log("8. Fund with 5+ LINK");
    console.log("9. Confirm the transaction");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
