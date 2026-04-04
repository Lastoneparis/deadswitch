import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DEMO vault with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // For demo: we deploy the contract directly with low-level deploy
  // to bypass the 30-day minimum check
  // The trick: deploy with 30 days, then the owner can call performUpkeep manually
  // since performUpkeep is permissionless (anyone can call it when heartbeat expires)

  // Actually, for the demo we just need to:
  // 1. Deploy with minimum interval (30 days = 2592000 seconds)
  // 2. On the demo, call performUpkeep() manually — it checks if heartbeat expired
  // 3. We can manipulate by NOT sending heartbeat and waiting, OR
  // 4. Better: deploy a DemoVault with no minimum interval check

  // Let's deploy the real contract but use a workaround:
  // The "Simulate Death" button will call performUpkeep() directly
  // We set lastHeartbeat to a past time by deploying and NOT sending heartbeats

  const beneficiary = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // test address
  const interval = 30 * 24 * 60 * 60; // 30 days minimum
  const worldIdNullifier = ethers.keccak256(ethers.toUtf8Bytes("demo-world-id"));

  const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
  const vault = await InheritanceVault.deploy(
    beneficiary,
    interval,
    worldIdNullifier,
    "owner.eth",
    "heir.eth",
    { value: ethers.parseEther("0.01") }
  );
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log("\n--- DEMO Vault Deployed ---");
  console.log("Address:", address);
  console.log("Owner:", deployer.address);
  console.log("Beneficiary:", beneficiary);
  console.log("Interval:", interval, "seconds (30 days)");
  console.log("Deposit: 0.01 ETH");
  console.log("World ID:", worldIdNullifier);
  console.log("\nFor demo: call performUpkeep() to trigger recovery mode");
  console.log("Note: performUpkeep requires heartbeat to be expired");
  console.log("In demo, we skip this check via the backend simulate-death endpoint");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
