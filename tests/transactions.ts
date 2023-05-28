import "mocha";

import * as assert from "assert";
import * as crypto from "crypto";
import * as fs from "fs";

import {
	InsufficientFundsException,
	InvalidPrivateKeyException,
	InvalidTransactionException,
	UnreferencedTxOutException,
} from "../src/exceptions";
import { Transaction, Transactions, UnspentTxOut } from "../src/transactions";
import { Wallet } from "../src/wallet";

describe("Transactions", () => {
	it("should create a transaction", () => {
		let wallet = Wallet.create();
		wallet = wallet.readKeyPair(wallet);
		const transaction = Transaction.getCoinbaseTransaction(wallet.publicKey, 0);
		const pool = Transactions.create({ aTransactions: [transaction] });
		const unspentTxOuts: UnspentTxOut[] = pool.processTransactions([], 0);
		console.log(`Amount: ${wallet.getBalance(unspentTxOuts)}`);
		assert.ok(transaction);
	});

	it("should add to transaction pool", () => {
		let wallet = Wallet.create();
		wallet.deleteWallet();
		wallet.deleteWallet();
		wallet = wallet.readKeyPair(wallet);
		fs.unlinkSync(`${wallet.wallet_dir}/private.pem`);
		wallet = wallet.readKeyPair(wallet);
		const transaction = Transaction.getCoinbaseTransaction(wallet.publicKey, 0);
		const pool = Transactions.create({ aTransactions: [transaction] });
		const unspentTxOuts: UnspentTxOut[] = pool.processTransactions([], 0);
		const transfer = wallet.createTransaction(10, wallet.publicKey, unspentTxOuts);
		assert.throws(() => {
			transfer.signTxIn(0, crypto.createPublicKey(Buffer.from(wallet.publicKey, "hex")), []);
		}, UnreferencedTxOutException); // UnreferencedTxOutException
		// generate a new private key
		assert.throws(() => {
			transfer.signTxIn(0, crypto.createPrivateKey(wallet.keyPair.privateKey), unspentTxOuts);
		}, InvalidPrivateKeyException); // InvalidTransactionException
		transfer.validateTxIn(transfer.txIns[0], []); // undefined
		pool.addTransaction(transfer, unspentTxOuts);
		pool.addTransaction(transfer, unspentTxOuts);
		assert.throws(() => {
			pool.addTransaction(transfer.copy({ id: "Invalid" }), unspentTxOuts);
		}, InvalidTransactionException); // InvalidTransactionException
		pool.processTransactions(unspentTxOuts, 0); // [] since invalid duplicate
		pool.updateTransactionPool(unspentTxOuts);
		pool.processTransactions(unspentTxOuts, 1); // [] since invalid wrong index
		assert.ok(transaction);
	});

	it("Raise validation errors", () => {
		let wallet = Wallet.create();
		wallet = wallet.readKeyPair(wallet);
		console.log(Transaction.create().copy({ id: Transaction.create().getTransactionId() }).validateCoinbaseTx(0)); // false
		const transaction = Transaction.getCoinbaseTransaction(wallet.publicKey, 0);
		const testCopy = transaction.copy({ txOuts: [transaction.txOuts[0].copy({ amount: 0 })] });
		console.log(testCopy.copy({ id: testCopy.getTransactionId() }).validateCoinbaseTx(0)); // false
		const pool = Transactions.create({ aTransactions: [transaction] });
		const unspentTxOuts: UnspentTxOut[] = pool.processTransactions([], 0);
		console.log(wallet.copy().createTransaction(50, wallet.publicKey, unspentTxOuts));
		let transfer = wallet.createTransaction(10, wallet.publicKey, unspentTxOuts);
		console.log(transfer.validateCoinbaseTx(0)); // false
		const id_ = transfer.id;
		transfer = transfer.copy({ id: "invalid id" });
		console.log(transfer.validateTransaction(unspentTxOuts)); // false
		console.log(transfer.validateCoinbaseTx(0)); // false
		transfer = transfer.copy({ id: id_ });
		transfer = transfer.copy({ txIns: [transfer.txIns[0].copy({ signature: "Invalid" })] });
		console.log(transfer.validateTransaction(unspentTxOuts)); // false
		assert.ok(transaction);
	});

	it("should throw transaction errors", () => {
		let wallet = Wallet.create();
		wallet = wallet.readKeyPair(wallet);
		const transaction = Transaction.getCoinbaseTransaction(wallet.publicKey, 0);
		const pool = Transactions.create({ aTransactions: [transaction] });
		const unspentTxOuts: UnspentTxOut[] = pool.processTransactions([], 0);
		assert.throws(() => {
			wallet.createTransaction(100, wallet.publicKey, unspentTxOuts);
		}, InsufficientFundsException);
		unspentTxOuts.push(unspentTxOuts[0].copy({ txOutIndex: 1 }));
		unspentTxOuts.reverse();
		const transfer = wallet.createTransaction(10, wallet.publicKey, unspentTxOuts);
		assert.throws(() => {
			pool.copy({
				aTransactions: [transfer.copy({ txIns: [transfer.txIns[0].copy({ txOutIndex: 1 })] })],
			}).addTransaction(transfer, unspentTxOuts);
		}, InvalidTransactionException);
		pool.addTransaction(transfer, unspentTxOuts);
		pool.processTransactions(unspentTxOuts, 0);
		unspentTxOuts[0] = unspentTxOuts[0].copy({ txOutId: "Invalid" });
		console.log(pool.validateBlockTransactions(unspentTxOuts, 0));
		assert.ok(transaction);
	});
});
