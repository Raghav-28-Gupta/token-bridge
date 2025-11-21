// Types
export * from './types/bridge.js';

// Constanjs
export * from './constants/chains.js';
export * from './constants/tokens.js';

// Utils
export * from './utils/validation.js';
export * from './utils/formatting.js';

// ABIs
import BridgeABI from './abis/Bridge.json' with { type: 'json' };
import BridgeTokenABI from './abis/BridgeToken.json' with { type: 'json' };

export const ABIS = {
  Bridge: BridgeABI,
  BridgeToken: BridgeTokenABI,
};

export { BridgeABI, BridgeTokenABI };