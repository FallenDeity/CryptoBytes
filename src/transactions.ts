import * as crypto from "crypto";
import { Data } from "dataclass";
import winston from "winston";

import { InvalidPrivateKeyException, InvalidTransactionException, UnreferencedTxOutException } from "./exceptions";
import { Logger } from "./logging";

const COINBASE_AMOUNT = Number(process.env.COINBASE_AMOUNT ?? 50);

export class TxOut extends Data {
	public amount = 0;
	public address = "";
}

export class TxIn extends Data {
	public txOutId = "";
	public txOutIndex = 0;
	public signature = "";
}

export class UnspentTxOut extends Data {
	public txOutId = "";
	public txOutIndex = 0;
	public address = "";
	public amount = 0;
}

export class Transaction extends Data {
	private logging: Logger = new Logger("Transaction");
	public id = "";
	public txIns: TxIn[] = [];
	public txOuts: TxOut[] = [];

	static hasDuplicates(txIns: TxIn[]): boolean {
		const groups = txIns.map((txIn) => txIn.txOutId + String(txIn.txOutIndex));
		return new Set(groups).size !== groups.length;
	}

	static getCoinbaseTransaction(address: string, blockIndex: number): Transaction {
		const txIn = TxIn.create({ txOutIndex: blockIndex });
		const txOut = TxOut.create({ address: address, amount: COINBASE_AMOUNT });
		const tx = Transaction.create({ txIns: [txIn], txOuts: [txOut] });
		return tx.copy({ id: tx.getTransactionId() });
	}

	public getTxInAmount(txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): number {
		return aUnspentTxOuts
			.filter((uTxO: UnspentTxOut) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex)
			.map((uTxO: UnspentTxOut) => uTxO.amount)
			.reduce((a: number, b: number) => a + b, 0);
	}

	public validateTxIn(txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): boolean {
		const referencedUTxOut: UnspentTxOut | undefined = aUnspentTxOuts.find(
			(uTxO: UnspentTxOut) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
		);
		if (referencedUTxOut === undefined) {
			this.logger.error(`referenced txOut not found: ${JSON.stringify(txIn)}`);
			return false;
		}
		const address: string = referencedUTxOut.address;
		const key: crypto.KeyObject = crypto.createPublicKey(Buffer.from(address, "hex"));
		const valid: boolean = crypto.verify(
			"sha256",
			Buffer.from(this.id, "hex"),
			key,
			Buffer.from(txIn.signature, "hex")
		);
		if (!valid) {
			this.logger.error(`invalid txIn signature: ${txIn.signature}`);
			return false;
		}
		return true;
	}

	public getTransactionId(): string {
		const txInContent: string = this.txIns
			.map((txIn: TxIn) => txIn.txOutId + String(txIn.txOutIndex))
			.reduce((a: string, b: string) => a + b, "");
		const txOutContent: string = this.txOuts
			.map((txOut: TxOut) => txOut.address + String(txOut.amount))
			.reduce((a: string, b: string) => a + b, "");
		return crypto
			.createHash("sha256")
			.update(txInContent + txOutContent)
			.digest("hex");
	}

	public validateTransaction(aUnspentTxOuts: UnspentTxOut[]): boolean {
		if (this.getTransactionId() !== this.id) {
			this.logger.error(`invalid tx id: ${this.id}`);
			return false;
		}
		const hasValidTxIns: boolean = this.txIns
			.map((txIn: TxIn) => this.validateTxIn(txIn, aUnspentTxOuts))
			.reduce((a: boolean, b: boolean) => a && b, true);
		if (!hasValidTxIns) {
			this.logger.error(`some of the txIns are invalid in tx: ${this.id}`);
			return false;
		}
		const totalTxInValues: number = this.txIns
			.map((txIn: TxIn) => this.getTxInAmount(txIn, aUnspentTxOuts))
			.reduce((a: number, b: number) => a + b, 0);
		const totalTxOutValues: number = this.txOuts
			.map((txOut: TxOut) => txOut.amount)
			.reduce((a: number, b: number) => a + b, 0);
		return totalTxOutValues === totalTxInValues;
	}

	public validateCoinbaseTx(blockIndex: number): boolean {
		if (this.id !== this.getTransactionId()) {
			this.logger.error(`invalid coinbase tx id: ${this.id}`);
			return false;
		}
		if (this.txIns.length !== 1) {
			this.logger.error("one txIn must be specified in the coinbase transaction");
			return false;
		}
		if (this.txIns[0].txOutIndex !== blockIndex) {
			this.logger.error("the txIn signature in coinbase tx must be the block height");
			return false;
		}
		if (this.txOuts.length !== 1) {
			this.logger.error("invalid number of txOuts in coinbase transaction");
			return false;
		}
		if (this.txOuts[0].amount !== COINBASE_AMOUNT) {
			this.logger.error("invalid coinbase amount in coinbase transaction");
			return false;
		}
		return true;
	}

	public signTxIn(txInIndex: number, privateKey: crypto.KeyObject, aUnspentTxOuts: UnspentTxOut[]): string {
		const txIn: TxIn = this.txIns[txInIndex];
		const dataToSign: string = this.id;
		const referencedUnspentTxOut: UnspentTxOut | undefined = aUnspentTxOuts.find(
			(uTxO: UnspentTxOut) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
		);
		if (referencedUnspentTxOut === undefined) {
			this.logger.error("could not find referenced txOut");
			throw new UnreferencedTxOutException("could not find referenced txOut");
		}
		const referencedAddress: string = referencedUnspentTxOut.address;
		const key = crypto.createPublicKey(privateKey);
		if (Buffer.from(key.export({ type: "spki", format: "pem" })).toString("hex") !== referencedAddress) {
			this.logger.error(
				"trying to sign an input with private key that does not match the address that is referenced in txIn"
			);
			throw new InvalidPrivateKeyException(
				"trying to sign an input with private key that does not match the address that is referenced in txIn"
			);
		}
		return crypto.sign("sha256", Buffer.from(dataToSign, "hex"), privateKey).toString("hex");
	}
	get logger(): winston.Logger {
		return this.logging.logger;
	}
}

export class Transactions extends Data {
	private logging: Logger = new Logger("Transactions");
	public aTransactions: Transaction[] = [];

	public addTransaction(tx: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean {
		if (!tx.validateTransaction(aUnspentTxOuts)) {
			this.logger.error("trying to add invalid tx to pool");
			throw new InvalidTransactionException("trying to add invalid tx to pool");
		}
		if (!this.isValidTxForPool(tx)) {
			this.logger.error("trying to add invalid tx to pool");
			throw new InvalidTransactionException("trying to add invalid tx to pool");
		}
		this.logger.info(`added transaction to pool: ${tx.id}`);
		this.aTransactions.push(tx);
		return true;
	}

	public updateTransactionPool(aUnspentTxOuts: UnspentTxOut[]): void {
		const invalidTxs: number[] = [];
		const validateTxIn = (txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): boolean => {
			const foundTxIn: UnspentTxOut | undefined = aUnspentTxOuts.find(
				(uTxO: UnspentTxOut) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
			);
			return foundTxIn !== undefined;
		};
		for (const [n, tx] of this.aTransactions.entries()) {
			for (const txIn of tx.txIns) {
				if (!validateTxIn(txIn, aUnspentTxOuts)) {
					invalidTxs.push(n);
					break;
				}
			}
		}
		for (const n of invalidTxs) {
			this.aTransactions.splice(n, 1);
		}
	}

	public isValidTxForPool(tx: Transaction): boolean {
		const txPoolIns: TxIn[] = this.poolTxIns;
		const txIns: TxIn[] = tx.txIns;
		return !txPoolIns.some((txPoolIn: TxIn) => txIns.some((txIn: TxIn) => txIn.txOutId === txPoolIn.txOutId));
	}

	public validateBlockTransactions(aUnspentTxOuts: UnspentTxOut[], blockIndex: number): boolean {
		const blockTransactions: Transaction[] = this.aTransactions;
		const coinbaseTx: Transaction = blockTransactions[0];
		if (!coinbaseTx.validateCoinbaseTx(blockIndex)) {
			return false;
		}
		const txIns: TxIn[] = blockTransactions.map((tx: Transaction) => tx.txIns).flat();
		if (Transaction.hasDuplicates(txIns)) {
			return false;
		}
		const normalTransactions: Transaction[] = blockTransactions.slice(1);
		return normalTransactions.every((tx: Transaction) => tx.validateTransaction(aUnspentTxOuts));
	}

	public updateUnspentTxOuts(aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut[] {
		const newUnspentTxOuts: UnspentTxOut[] = this.aTransactions
			.map((t: Transaction) =>
				t.txOuts.map((txOut: TxOut, index: number) =>
					UnspentTxOut.create({
						txOutId: t.id,
						txOutIndex: index,
						address: txOut.address,
						amount: txOut.amount,
					})
				)
			)
			.flat();
		const consumedTxOuts: UnspentTxOut[] = this.aTransactions
			.map((t: Transaction) => t.txIns)
			.flat()
			.map((txIn: TxIn) =>
				UnspentTxOut.create({ txOutId: txIn.txOutId, txOutIndex: txIn.txOutIndex, address: "", amount: 0 })
			);
		return aUnspentTxOuts
			.filter((uTxO: UnspentTxOut) => !consumedTxOuts.find((cTxO: UnspentTxOut) => cTxO.txOutId === uTxO.txOutId))
			.concat(newUnspentTxOuts);
	}

	public processTransactions(unspentTxOuts: UnspentTxOut[], blockIndex: number): UnspentTxOut[] {
		if (!this.validateBlockTransactions(unspentTxOuts, blockIndex)) {
			this.logger.error("invalid block transactions");
			return [];
		}
		return this.updateUnspentTxOuts(unspentTxOuts);
	}

	public get poolTxIns(): TxIn[] {
		return this.aTransactions
			.map((tx: Transaction) => tx.txIns)
			.flat()
			.filter((txIn: TxIn) => txIn.txOutIndex !== 0);
	}

	public get logger(): winston.Logger {
		return this.logging.logger;
	}
}
