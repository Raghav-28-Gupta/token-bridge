import { ethers } from "ethers";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { encodeWithdrawMessage } from "./utils.js";

export class BridgeSigner {
	private wallet: ethers.Wallet;

	constructor(privateKey: string) {
		this.wallet = new ethers.Wallet(privateKey);
		logger.info(
			{ address: this.wallet.address },
			"Bridge signer initialized"
		);
	}

	/**
	 * Get validator address
	 */
	getAddress(): string {
		return this.wallet.address;
	}

	/**
	 * Sign withdrawal message
	 */
	async signWithdrawal(params: {
		token: string;
		recipient: string;
		amount: bigint;
		nonce: number;
		sourceChainId: number;
		targetChainId: number;
	}): Promise<string> {
		try {
			// Create message hash
			const messageHash = encodeWithdrawMessage(
				params.token,
				params.recipient,
				params.amount,
				params.nonce,
				params.sourceChainId,
				params.targetChainId
			);

			// Sign the message (automatically adds Ethereum prefix)
			const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));

			logger.debug(
				{
					messageHash,
					signature,
					signer: this.wallet.address,
					nonce: params.nonce,
				},
				"Withdrawal message signed"
			);

			return signature;
		} catch (error) {
			logger.error(
				{ err: error, params },
				"Failed to sign withdrawal message"
			);
			throw error;
		}
	}

	/**
	 * Verify signature
	 */
	verifySignature(
		messageHash: string,
		signature: string,
		expectedSigner: string
	): boolean {
		try {
			const recoveredAddress = ethers.verifyMessage(
				ethers.getBytes(messageHash),
				signature
			);

			const isValid = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();

			if (!isValid) {
				logger.warn(
					{ recovered: recoveredAddress, expected: expectedSigner },
					"Signature verification failed"
				);
			}

			return isValid;
		} catch (error) {
			logger.error(
				{ err: error, messageHash, signature },
				"Error verifying signature"
			);
			return false;
		}
	}

	/**
	 * Create connected signer for transactions
	 */
	connect(provider: ethers.Provider): ethers.Wallet {
		return this.wallet.connect(provider);
	}
}

// Singleton instance
let signerInstance: BridgeSigner | null = null;

export function initializeSigner(): BridgeSigner {
	if (!signerInstance) {
		signerInstance = new BridgeSigner(config.validator.privateKey);
	}
	return signerInstance;
}

export function getSigner(): BridgeSigner {
	if (!signerInstance) {
		throw new Error("Signer not initialized. Call initializeSigner() first.");
	}
	return signerInstance;
}
