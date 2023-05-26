import "mocha";

import * as assert from "assert";

import { InvalidChainException } from "../src/exceptions";
import { Block, Blockchain } from "../src/models";

describe("models", (): void => {
	it("should say 'Hello, World!'", (): void => {
		const block = Block.genesisBlock();
		const nextBlock = block.generateNextBlock("Hello, World!");
		console.log(nextBlock.data);
		assert.ok(true);
	});

	it("should validate the chain, return ok", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!");
		blockchain.addBlock(nextBlock);
		assert.ok(blockchain.isValidChain());
	});

	it("should validate the chain, return false", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!");
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
		const nextBlock = latestBlock.generateNextBlock("Test block!!");
		blockchain.addBlock(nextBlock);
		const newBlockchain = Blockchain.create();
		newBlockchain.replaceChain(blockchain);
		assert.ok(newBlockchain.isValidChain());
	});

	it("should not replace the chain with shorter chain", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!");
		blockchain.addBlock(nextBlock);
		const newBlockchain = Blockchain.create();
		assert.throws((): void => {
			blockchain.replaceChain(newBlockchain);
		}, InvalidChainException);
	});
});
