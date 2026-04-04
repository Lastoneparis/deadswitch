import { parseAbi } from 'viem';

export const VAULT_ADDRESS = '0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7' as const;

export const VAULT_ABI = parseAbi([
  'function heartbeat() external',
  'function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory)',
  'function performUpkeep(bytes calldata) external',
  'function claim(bytes32 _worldIdNullifier) external',
  'function cancel() external',
  'function getVaultInfo() external view returns (address _owner, address _beneficiary, uint256 _balance, uint256 _lastHeartbeat, uint256 _heartbeatInterval, uint8 _status, uint256 _timeRemaining, string memory _ownerENS, string memory _beneficiaryENS)',
  'function getTimeRemaining() external view returns (uint256)',
  'event HeartbeatReceived(address indexed owner, uint256 timestamp)',
  'event RecoveryModeActivated(address indexed owner, address indexed beneficiary, uint256 timestamp)',
  'event InheritanceClaimed(address indexed beneficiary, uint256 amount, uint256 timestamp)',
]);
