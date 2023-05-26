import "mocha";

import * as assert from "assert";

import { InvalidBlockException, InvalidChainException } from "../src/exceptions";
import { Block, Blockchain } from "../src/models";

describe("models", (): void => {
	it("should say 'Hello, World!'", (): void => {
		const blockchain = Blockchain.create();
		const block = Block.genesisBlock();
		const nextBlock = block.generateNextBlock("Hello, World!", blockchain);
		console.log(nextBlock.data);
		assert.ok(true);
	});

	it("should validate the chain, return ok", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
		blockchain.addBlock(nextBlock);
		assert.ok(blockchain.isValidChain());
	});

	it("should validate the chain, return false", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
		blockchain.addBlock(nextBlock);
		blockchain.blocks[1] = nextBlock.copy({ hash: "invalid hash" });
		assert.ok(!blockchain.isValidChain());
	});

	it("should validate the chain, return false", (): void => {
		const blockchain = Blockchain.create();
		blockchain.blocks[0] = blockchain.blocks[0].copy({ hash: "invalid hash" });
		assert.ok(!blockchain.isValidChain());
	});

	it("should replace the chain with longer chain", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
		blockchain.addBlock(nextBlock);
		const newBlockchain = Blockchain.create();
		newBlockchain.replaceChain(blockchain);
		assert.ok(newBlockchain.isValidChain());
	});

	it("should not replace the chain with shorter chain", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
		blockchain.addBlock(nextBlock);
		const newBlockchain = Blockchain.create();
		assert.throws((): void => {
			blockchain.replaceChain(newBlockchain);
		}, InvalidChainException);
	});

	it("Using difficulty and nonce", (): void => {
		const blockchain = Blockchain.create();
		for (let i = 0; i < 100; i++) {
			const latestBlock = blockchain.latestBlock;
			const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
			blockchain.addBlock(nextBlock);
		}
		assert.ok(blockchain.isValidChain());
	});

	it("Testing timestamp adjustment", (): void => {
		const blockchain = Blockchain.create();
		for (let i = 0; i < 100; i++) {
			const latestBlock = blockchain.latestBlock;
			const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
			blockchain.addBlock(nextBlock);
		}
		blockchain.blocks[blockchain.blocks.length - 1] = blockchain.latestBlock.copy({
			timestamp: blockchain.latestBlock.timestamp + 1000,
		});
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
		assert.throws((): void => {
			blockchain.addBlock(nextBlock);
		}, InvalidBlockException);
	});

	it("Testing timestamp adjustment", (): void => {
		const blockchain = Blockchain.create();
		for (let i = 0; i < 100; i++) {
			const latestBlock = blockchain.latestBlock;
			const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
			blockchain.addBlock(nextBlock);
		}
		blockchain.blocks[blockchain.blocks.length - 1] = blockchain.latestBlock.copy({
			timestamp: blockchain.latestBlock.timestamp + 100,
		});
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!", blockchain);
		assert.throws((): void => {
			blockchain.addBlock(nextBlock);
		}, InvalidBlockException);
	});
});
