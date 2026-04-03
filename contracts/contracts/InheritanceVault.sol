// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InheritanceVault is ReentrancyGuard {

    enum Status { Active, RecoveryMode, Claimed, Cancelled }

    address public owner;
    address public beneficiary;
    address public guardian; // trusted party who can pause recovery
    uint256 public lastHeartbeat;
    uint256 public heartbeatInterval; // seconds (default 90 days)
    uint256 public recoveryDelay; // seconds after recovery mode before claim is possible (default 30 days)
    uint256 public recoveryActivatedAt; // timestamp when recovery mode was triggered
    Status public status;
    bytes32 public worldIdNullifier; // heir's World ID proof hash
    bytes32 public activityProofHash; // ZKP: hash of owner's activity proof (verifiable without revealing key)
    string public ownerENS;
    string public beneficiaryENS;

    event HeartbeatReceived(address indexed owner, uint256 timestamp);
    event RecoveryModeActivated(address indexed owner, address indexed beneficiary, uint256 timestamp);
    event RecoveryPaused(address indexed guardian, uint256 timestamp);
    event RecoveryResumed(uint256 timestamp);
    event HeartbeatExtended(address indexed owner, uint256 newInterval, uint256 timestamp);
    event InheritanceClaimed(address indexed beneficiary, uint256 amount, uint256 timestamp);
    event VaultCancelled(address indexed owner, uint256 amountReturned, uint256 timestamp);
    event BeneficiaryUpdated(address indexed oldBeneficiary, address indexed newBeneficiary);
    event HeartbeatIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event GuardianUpdated(address indexed oldGuardian, address indexed newGuardian);
    event FundsDeposited(address indexed from, uint256 amount);
    event ActivityProofSubmitted(bytes32 proofHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not vault owner");
        _;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardian && guardian != address(0), "Not guardian");
        _;
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "Not beneficiary");
        _;
    }

    constructor(
        address _beneficiary,
        uint256 _heartbeatInterval,
        bytes32 _worldIdNullifier,
        string memory _ownerENS,
        string memory _beneficiaryENS
    ) payable {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_beneficiary != msg.sender, "Beneficiary cannot be owner");
        require(_heartbeatInterval >= 30 days, "Interval too short (min 30 days)");
        require(_heartbeatInterval <= 365 days, "Interval too long (max 365 days)");

        owner = msg.sender;
        beneficiary = _beneficiary;
        heartbeatInterval = _heartbeatInterval;
        recoveryDelay = 30 days; // 30-day buffer after recovery before claim is possible
        worldIdNullifier = _worldIdNullifier;
        ownerENS = _ownerENS;
        beneficiaryENS = _beneficiaryENS;
        lastHeartbeat = block.timestamp;
        status = Status.Active;

        if (msg.value > 0) {
            emit FundsDeposited(msg.sender, msg.value);
        }
    }

    /// @notice Accept ETH deposits when vault is active
    receive() external payable {
        require(status == Status.Active, "Vault not active");
        emit FundsDeposited(msg.sender, msg.value);
    }

    /// @notice Owner proves they're alive - resets the timer
    function heartbeat() external onlyOwner {
        require(status == Status.Active, "Vault not active");
        lastHeartbeat = block.timestamp;
        emit HeartbeatReceived(owner, block.timestamp);
    }

    /// @notice Chainlink Automation: check if heartbeat expired
    function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (status == Status.Active && block.timestamp > lastHeartbeat + heartbeatInterval);
        return (upkeepNeeded, "");
    }

    /// @notice Chainlink Automation: trigger recovery mode
    function performUpkeep(bytes calldata) external {
        require(status == Status.Active, "Vault not active");
        require(block.timestamp > lastHeartbeat + heartbeatInterval, "Heartbeat not expired");

        status = Status.RecoveryMode;
        recoveryActivatedAt = block.timestamp;
        emit RecoveryModeActivated(owner, beneficiary, block.timestamp);
    }

    /// @notice Beneficiary claims the inheritance (with World ID proof)
    /// @dev Must wait recoveryDelay (30 days) after recovery mode before claiming
    function claim(bytes32 _worldIdNullifier) external onlyBeneficiary nonReentrant {
        require(status == Status.RecoveryMode, "Vault not in recovery mode");
        require(block.timestamp >= recoveryActivatedAt + recoveryDelay, "Recovery delay not elapsed - owner may still cancel");
        require(_worldIdNullifier == worldIdNullifier, "Invalid World ID proof");

        status = Status.Claimed;
        uint256 amount = address(this).balance;

        (bool success, ) = beneficiary.call{value: amount}("");
        require(success, "Transfer failed");

        emit InheritanceClaimed(beneficiary, amount, block.timestamp);
    }

    /// @notice Owner cancels the vault and withdraws all funds
    function cancel() external onlyOwner nonReentrant {
        require(status == Status.Active, "Can only cancel active vault");

        status = Status.Cancelled;
        uint256 amount = address(this).balance;

        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");

        emit VaultCancelled(owner, amount, block.timestamp);
    }

    /// @notice Owner updates beneficiary
    function updateBeneficiary(
        address _newBeneficiary,
        bytes32 _newWorldIdNullifier,
        string memory _newENS
    ) external onlyOwner {
        require(status == Status.Active, "Vault not active");
        require(_newBeneficiary != address(0), "Invalid beneficiary");
        require(_newBeneficiary != owner, "Beneficiary cannot be owner");

        address old = beneficiary;
        beneficiary = _newBeneficiary;
        worldIdNullifier = _newWorldIdNullifier;
        beneficiaryENS = _newENS;
        emit BeneficiaryUpdated(old, _newBeneficiary);
    }

    /// @notice Owner updates heartbeat interval
    function updateInterval(uint256 _newInterval) external onlyOwner {
        require(status == Status.Active, "Vault not active");
        require(_newInterval >= 30 days, "Min 30 days");
        require(_newInterval <= 365 days, "Max 365 days");

        uint256 old = heartbeatInterval;
        heartbeatInterval = _newInterval;
        emit HeartbeatIntervalUpdated(old, _newInterval);
    }

    // ─── NEW: Guardian, Extend, Pause, ZKP ───

    /// @notice Owner sets a trusted guardian who can pause recovery
    function setGuardian(address _guardian) external onlyOwner {
        require(status == Status.Active, "Vault not active");
        require(_guardian != owner, "Guardian cannot be owner");
        address old = guardian;
        guardian = _guardian;
        emit GuardianUpdated(old, _guardian);
    }

    /// @notice Guardian pauses recovery mode - gives owner time to respond
    function pauseRecovery() external onlyGuardian {
        require(status == Status.RecoveryMode, "Not in recovery mode");
        status = Status.Active;
        lastHeartbeat = block.timestamp; // reset timer
        emit RecoveryPaused(guardian, block.timestamp);
    }

    /// @notice Owner can resume from recovery mode (e.g., woke from coma)
    function resumeFromRecovery() external onlyOwner {
        require(status == Status.RecoveryMode, "Not in recovery mode");
        status = Status.Active;
        lastHeartbeat = block.timestamp;
        emit RecoveryResumed(block.timestamp);
    }

    /// @notice Owner extends heartbeat deadline (delays recovery activation)
    function extendHeartbeat(uint256 _additionalSeconds) external onlyOwner {
        require(status == Status.Active, "Vault not active");
        require(_additionalSeconds <= 180 days, "Max extension 180 days");
        lastHeartbeat = block.timestamp + _additionalSeconds;
        emit HeartbeatExtended(owner, heartbeatInterval + _additionalSeconds, block.timestamp);
    }

    /// @notice Submit ZK activity proof - verifies owner's activity without revealing private key
    /// @dev In production, this would verify a ZK-SNARK proof on-chain
    /// For hackathon: stores the proof hash as evidence of activity
    function submitActivityProof(bytes32 _proofHash) external onlyOwner {
        require(status == Status.Active || status == Status.RecoveryMode, "Vault not active");
        activityProofHash = _proofHash;
        lastHeartbeat = block.timestamp; // proof counts as heartbeat
        if (status == Status.RecoveryMode) {
            status = Status.Active; // ZKP can cancel recovery
        }
        emit ActivityProofSubmitted(_proofHash, block.timestamp);
    }

    /// @notice Returns seconds until heartbeat expires
    function getTimeRemaining() external view returns (uint256) {
        if (status != Status.Active) return 0;
        uint256 deadline = lastHeartbeat + heartbeatInterval;
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    /// @notice Returns all vault info in one call
    function getVaultInfo() external view returns (
        address _owner,
        address _beneficiary,
        uint256 _balance,
        uint256 _lastHeartbeat,
        uint256 _heartbeatInterval,
        Status _status,
        uint256 _timeRemaining,
        string memory _ownerENS,
        string memory _beneficiaryENS
    ) {
        uint256 remaining = 0;
        if (status == Status.Active) {
            uint256 deadline = lastHeartbeat + heartbeatInterval;
            remaining = block.timestamp >= deadline ? 0 : deadline - block.timestamp;
        }
        return (
            owner,
            beneficiary,
            address(this).balance,
            lastHeartbeat,
            heartbeatInterval,
            status,
            remaining,
            ownerENS,
            beneficiaryENS
        );
    }
}
