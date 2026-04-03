import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("InheritanceVault", function () {
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  const NINETY_DAYS = 90 * 24 * 60 * 60;
  const WORLD_ID_NULLIFIER = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier"));
  const WRONG_NULLIFIER = ethers.keccak256(ethers.toUtf8Bytes("wrong-nullifier"));
  const DEPOSIT = ethers.parseEther("1.0");

  async function deployVaultFixture() {
    const [owner, beneficiary, stranger] = await ethers.getSigners();

    const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
    const vault = await InheritanceVault.deploy(
      beneficiary.address,
      NINETY_DAYS,
      WORLD_ID_NULLIFIER,
      "owner.eth",
      "beneficiary.eth",
      { value: DEPOSIT }
    );

    return { vault, owner, beneficiary, stranger };
  }

  describe("Deployment", function () {
    it("should set correct owner, beneficiary, and parameters", async function () {
      const { vault, owner, beneficiary } = await loadFixture(deployVaultFixture);

      expect(await vault.owner()).to.equal(owner.address);
      expect(await vault.beneficiary()).to.equal(beneficiary.address);
      expect(await vault.heartbeatInterval()).to.equal(NINETY_DAYS);
      expect(await vault.worldIdNullifier()).to.equal(WORLD_ID_NULLIFIER);
      expect(await vault.ownerENS()).to.equal("owner.eth");
      expect(await vault.beneficiaryENS()).to.equal("beneficiary.eth");
      expect(await vault.status()).to.equal(0); // Active
    });

    it("should reject zero address beneficiary", async function () {
      const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
      await expect(
        InheritanceVault.deploy(ethers.ZeroAddress, NINETY_DAYS, WORLD_ID_NULLIFIER, "", "")
      ).to.be.revertedWith("Invalid beneficiary");
    });

    it("should reject owner as beneficiary", async function () {
      const [owner] = await ethers.getSigners();
      const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
      await expect(
        InheritanceVault.deploy(owner.address, NINETY_DAYS, WORLD_ID_NULLIFIER, "", "")
      ).to.be.revertedWith("Beneficiary cannot be owner");
    });

    it("should reject interval below 30 days", async function () {
      const [, beneficiary] = await ethers.getSigners();
      const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
      await expect(
        InheritanceVault.deploy(beneficiary.address, 86400, WORLD_ID_NULLIFIER, "", "")
      ).to.be.revertedWith("Interval too short (min 30 days)");
    });

    it("should reject interval above 365 days", async function () {
      const [, beneficiary] = await ethers.getSigners();
      const InheritanceVault = await ethers.getContractFactory("InheritanceVault");
      await expect(
        InheritanceVault.deploy(beneficiary.address, 366 * 86400, WORLD_ID_NULLIFIER, "", "")
      ).to.be.revertedWith("Interval too long (max 365 days)");
    });
  });

  describe("Heartbeat", function () {
    it("should reset the timer", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      await time.increase(THIRTY_DAYS);
      const tx = await vault.heartbeat();
      await tx.wait();

      const remaining = await vault.getTimeRemaining();
      // Should be close to full interval again
      expect(remaining).to.be.closeTo(BigInt(NINETY_DAYS), BigInt(5));
    });

    it("should emit HeartbeatReceived event", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      await expect(vault.heartbeat()).to.emit(vault, "HeartbeatReceived");
    });

    it("should reject heartbeat from non-owner", async function () {
      const { vault, beneficiary } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(beneficiary).heartbeat()).to.be.revertedWith("Not vault owner");
    });
  });

  describe("Chainlink Automation (checkUpkeep / performUpkeep)", function () {
    it("checkUpkeep returns false before interval expires", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const [upkeepNeeded] = await vault.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("checkUpkeep returns true after interval expires", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await time.increase(NINETY_DAYS + 1);
      const [upkeepNeeded] = await vault.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;
    });

    it("performUpkeep switches to RecoveryMode", async function () {
      const { vault, owner, beneficiary } = await loadFixture(deployVaultFixture);
      await time.increase(NINETY_DAYS + 1);

      await expect(vault.performUpkeep("0x"))
        .to.emit(vault, "RecoveryModeActivated")
        .withArgs(owner.address, beneficiary.address, await time.latest() + 1);

      expect(await vault.status()).to.equal(1); // RecoveryMode
    });

    it("performUpkeep fails if heartbeat not expired", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await expect(vault.performUpkeep("0x")).to.be.revertedWith("Heartbeat not expired");
    });
  });

  describe("Claim", function () {
    it("should allow beneficiary to claim in RecoveryMode with correct World ID", async function () {
      const { vault, beneficiary } = await loadFixture(deployVaultFixture);

      await time.increase(NINETY_DAYS + 1);
      await vault.performUpkeep("0x");

      const balanceBefore = await ethers.provider.getBalance(beneficiary.address);

      const tx = await vault.connect(beneficiary).claim(WORLD_ID_NULLIFIER);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(beneficiary.address);
      expect(balanceAfter - balanceBefore + gasUsed).to.equal(DEPOSIT);
      expect(await vault.status()).to.equal(2); // Claimed
    });

    it("should emit InheritanceClaimed event", async function () {
      const { vault, beneficiary } = await loadFixture(deployVaultFixture);
      await time.increase(NINETY_DAYS + 1);
      await vault.performUpkeep("0x");

      await expect(vault.connect(beneficiary).claim(WORLD_ID_NULLIFIER))
        .to.emit(vault, "InheritanceClaimed");
    });

    it("should fail with wrong World ID", async function () {
      const { vault, beneficiary } = await loadFixture(deployVaultFixture);
      await time.increase(NINETY_DAYS + 1);
      await vault.performUpkeep("0x");

      await expect(
        vault.connect(beneficiary).claim(WRONG_NULLIFIER)
      ).to.be.revertedWith("Invalid World ID proof");
    });

    it("should fail when not in RecoveryMode", async function () {
      const { vault, beneficiary } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(beneficiary).claim(WORLD_ID_NULLIFIER)
      ).to.be.revertedWith("Vault not in recovery mode");
    });

    it("should fail when called by non-beneficiary", async function () {
      const { vault, stranger } = await loadFixture(deployVaultFixture);
      await time.increase(NINETY_DAYS + 1);
      await vault.performUpkeep("0x");

      await expect(
        vault.connect(stranger).claim(WORLD_ID_NULLIFIER)
      ).to.be.revertedWith("Not beneficiary");
    });
  });

  describe("Cancel", function () {
    it("should return funds to owner", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await vault.cancel();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter - balanceBefore + gasUsed).to.equal(DEPOSIT);
      expect(await vault.status()).to.equal(3); // Cancelled
    });

    it("should emit VaultCancelled event", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await expect(vault.cancel()).to.emit(vault, "VaultCancelled");
    });

    it("should fail in RecoveryMode", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await time.increase(NINETY_DAYS + 1);
      await vault.performUpkeep("0x");

      await expect(vault.cancel()).to.be.revertedWith("Can only cancel active vault");
    });

    it("should fail when called by non-owner", async function () {
      const { vault, beneficiary } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(beneficiary).cancel()).to.be.revertedWith("Not vault owner");
    });
  });

  describe("Receive ETH", function () {
    it("should accept ETH deposits when active", async function () {
      const { vault, stranger } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseEther("0.5");

      await expect(
        stranger.sendTransaction({ to: await vault.getAddress(), value: amount })
      ).to.emit(vault, "FundsDeposited").withArgs(stranger.address, amount);

      expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(DEPOSIT + amount);
    });

    it("should reject deposits when cancelled", async function () {
      const { vault, owner, stranger } = await loadFixture(deployVaultFixture);
      await vault.cancel();

      await expect(
        stranger.sendTransaction({ to: await vault.getAddress(), value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Vault not active");
    });
  });

  describe("getTimeRemaining", function () {
    it("should decrease over time", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      const remaining1 = await vault.getTimeRemaining();
      await time.increase(THIRTY_DAYS);
      const remaining2 = await vault.getTimeRemaining();

      expect(remaining2).to.be.lt(remaining1);
      expect(remaining1 - remaining2).to.be.closeTo(BigInt(THIRTY_DAYS), BigInt(5));
    });

    it("should return 0 after expiry", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await time.increase(NINETY_DAYS + 1);
      expect(await vault.getTimeRemaining()).to.equal(0);
    });

    it("should return 0 when not active", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await vault.cancel();
      expect(await vault.getTimeRemaining()).to.equal(0);
    });
  });

  describe("updateBeneficiary", function () {
    it("should update beneficiary address and nullifier", async function () {
      const { vault, owner, stranger } = await loadFixture(deployVaultFixture);
      const newNullifier = ethers.keccak256(ethers.toUtf8Bytes("new-nullifier"));

      await expect(vault.updateBeneficiary(stranger.address, newNullifier, "new.eth"))
        .to.emit(vault, "BeneficiaryUpdated");

      expect(await vault.beneficiary()).to.equal(stranger.address);
      expect(await vault.worldIdNullifier()).to.equal(newNullifier);
      expect(await vault.beneficiaryENS()).to.equal("new.eth");
    });

    it("should reject zero address", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await expect(
        vault.updateBeneficiary(ethers.ZeroAddress, WORLD_ID_NULLIFIER, "")
      ).to.be.revertedWith("Invalid beneficiary");
    });

    it("should reject owner as new beneficiary", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      await expect(
        vault.updateBeneficiary(owner.address, WORLD_ID_NULLIFIER, "")
      ).to.be.revertedWith("Beneficiary cannot be owner");
    });

    it("should fail when not active", async function () {
      const { vault, stranger } = await loadFixture(deployVaultFixture);
      await vault.cancel();
      await expect(
        vault.updateBeneficiary(stranger.address, WORLD_ID_NULLIFIER, "")
      ).to.be.revertedWith("Vault not active");
    });
  });

  describe("updateInterval", function () {
    it("should update the heartbeat interval", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const newInterval = 60 * 24 * 60 * 60; // 60 days

      await expect(vault.updateInterval(newInterval))
        .to.emit(vault, "HeartbeatIntervalUpdated")
        .withArgs(NINETY_DAYS, newInterval);

      expect(await vault.heartbeatInterval()).to.equal(newInterval);
    });

    it("should reject interval below 30 days", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await expect(vault.updateInterval(86400)).to.be.revertedWith("Min 30 days");
    });

    it("should reject interval above 365 days", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await expect(vault.updateInterval(366 * 86400)).to.be.revertedWith("Max 365 days");
    });

    it("should fail when not active", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      await vault.cancel();
      await expect(vault.updateInterval(NINETY_DAYS)).to.be.revertedWith("Vault not active");
    });
  });

  describe("getVaultInfo", function () {
    it("should return all vault details", async function () {
      const { vault, owner, beneficiary } = await loadFixture(deployVaultFixture);
      const info = await vault.getVaultInfo();

      expect(info._owner).to.equal(owner.address);
      expect(info._beneficiary).to.equal(beneficiary.address);
      expect(info._balance).to.equal(DEPOSIT);
      expect(info._heartbeatInterval).to.equal(NINETY_DAYS);
      expect(info._status).to.equal(0); // Active
      expect(info._timeRemaining).to.be.gt(0);
      expect(info._ownerENS).to.equal("owner.eth");
      expect(info._beneficiaryENS).to.equal("beneficiary.eth");
    });
  });
});
