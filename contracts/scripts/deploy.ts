import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Test parameters
  const beneficiary = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat account #1
  const heartbeatInterval = 90 * 24 * 60 * 60; // 90 days
  const worldIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("test-world-id-nullifier"));
  const ownerENS = "";
  const beneficiaryENS = "";
  const depositAmount = ethers.parseEther("0.01");

  console.log("\nDeploying InheritanceVault...");
  const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
  const vault = await InheritanceVault.deploy(
    beneficiary,
    heartbeatInterval,
    worldIdNullifier,
    ownerENS,
    beneficiaryENS,
    { value: depositAmount }
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log("\n--- Deployment Complete ---");
  console.log("InheritanceVault:", vaultAddress);
  console.log("Owner:", deployer.address);
  console.log("Beneficiary:", beneficiary);
  console.log("Heartbeat interval:", heartbeatInterval, "seconds (90 days)");
  console.log("Initial deposit:", ethers.formatEther(depositAmount), "ETH");
  console.log("World ID nullifier:", worldIdNullifier);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
