import * as crypto from "crypto";
import { Data } from "dataclass";
import * as fs from "fs";
import winston from "winston";

import { InsufficientFundsException } from "./exceptions";
import { Logger } from "./logging";
import { Transaction, TxIn, TxOut, UnspentTxOut } from "./transactions";

export class Wallet extends Data {
	private logging: Logger = new Logger("Wallet");
	public wallet_dir = "wallet";
	public public_key = "";
	public private_key = "";

	public createTransaction(amount: number, toAddress: string, aUnspentTxOuts: UnspentTxOut[]): Transaction {
		const myAddress = this.publicKey;
		const myUnspentTxOuts = aUnspentTxOuts.filter((uTxO: UnspentTxOut) => uTxO.address === myAddress);
		const { includedUnspentTxOuts, leftOverAmount } = this.findTxOutsForAmount(amount, myUnspentTxOuts);
		const toUnsignedTxIn = (unspentTxOut: UnspentTxOut): TxIn => {
			return TxIn.create({
				txOutId: unspentTxOut.txOutId,
				txOutIndex: unspentTxOut.txOutIndex,
			});
		};
		const unsignedTxIns = includedUnspentTxOuts.map(toUnsignedTxIn);
		let tx = Transaction.create({
			txIns: unsignedTxIns,
			txOuts: Wallet.toTxOut(toAddress, myAddress, amount, leftOverAmount),
		});
		tx = tx.copy({ id: tx.getTransactionId() });
		const signedTxIns: TxIn[] = tx.txIns.map((txIn: TxIn, index: number) => {
			return txIn.copy({
				signature: tx.signTxIn(index, crypto.createPrivateKey(this.private_key), aUnspentTxOuts),
			});
		});
		return tx.copy({ txIns: signedTxIns });
	}

	public deleteWallet(): void {
		if (fs.existsSync(this.wallet_dir)) {
			fs.rmdirSync(this.wallet_dir, { recursive: true });
		} else {
			this.logger.error("Wallet does not exist");
		}
	}

	public readKeyPair(wallet: Wallet): Wallet {
		if (!fs.existsSync(this.wallet_dir)) {
			fs.mkdirSync(this.wallet_dir);
			this.writeKeyPair();
		}
		if (!fs.existsSync(`${this.wallet_dir}/private.pem`) || !fs.existsSync(`${this.wallet_dir}/public.pem`)) {
			this.writeKeyPair();
		}
		const private_key = fs.readFileSync(`${this.wallet_dir}/private.pem`, "utf8");
		const public_key = fs.readFileSync(`${this.wallet_dir}/public.pem`, "utf8");
		this.logger.info("Key pair read");
		return wallet.copy({ private_key: private_key, public_key: public_key });
	}

	public writeKeyPair(): void {
		const keyPair = this.keyPair;
		fs.writeFileSync(`${this.wallet_dir}/private.pem`, keyPair.privateKey);
		fs.writeFileSync(`${this.wallet_dir}/public.pem`, keyPair.publicKey);
		this.logger.info("New key pair generated");
	}

	public getBalance(aUnspentTxOuts: UnspentTxOut[]): number {
		return aUnspentTxOuts
			.filter((uTxO: UnspentTxOut) => uTxO.address === this.publicKey)
			.map((uTxO: UnspentTxOut) => uTxO.amount)
			.reduce((a, b) => a + b, 0);
	}

	public findTxOutsForAmount(
		amount: number,
		aUnspentTxOuts: UnspentTxOut[]
	): { includedUnspentTxOuts: UnspentTxOut[]; leftOverAmount: number } {
		let currentAmount = 0;
		const includedUnspentTxOuts: UnspentTxOut[] = [];
		for (const uTxO of aUnspentTxOuts) {
			includedUnspentTxOuts.push(uTxO);
			currentAmount = currentAmount + uTxO.amount;
			if (currentAmount >= amount) {
				const leftOverAmount: number = currentAmount - amount;
				return { includedUnspentTxOuts, leftOverAmount };
			}
		}
		const eMsg = `Cannot create transaction from the available unspent transaction outputs. Required amount: ${amount}. Available unspentTxOuts: ${JSON.stringify(
			aUnspentTxOuts
		)}`;
		this.logger.error(eMsg);
		throw new InsufficientFundsException(eMsg);
	}

	static toTxOut(receiverAddress: string, myAddress: string, amount: number, leftOverAmount: number): TxOut[] {
		const receiverTxOut: TxOut = TxOut.create({
			address: receiverAddress,
			amount,
		});
		if (leftOverAmount === 0) {
			return [receiverTxOut];
		} else {
			const leftOverTxOut: TxOut = TxOut.create({
				address: myAddress,
				amount: leftOverAmount,
			});
			return [receiverTxOut, leftOverTxOut];
		}
	}

	get keyPair(): crypto.KeyPairSyncResult<string, string> {
		return crypto.generateKeyPairSync("rsa", {
			modulusLength: 2048,
			publicKeyEncoding: {
				type: "spki",
				format: "pem",
			},
			privateKeyEncoding: {
				type: "pkcs8",
				format: "pem",
			},
		});
	}

	get publicKey(): string {
		return Buffer.from(this.public_key, "utf8").toString("hex");
	}

	get logger(): winston.Logger {
		return this.logging.logger;
	}
}
