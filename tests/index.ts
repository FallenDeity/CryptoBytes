import "mocha";

import * as assert from "assert";

import { InvalidBlockException } from "../src/exceptions";
import { Blockchain } from "../src/models";

describe("index", (): void => {
	it("should add a block to the block chain", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		const nextBlock = latestBlock.generateNextBlock("Test block!!");
		blockchain.addBlock(nextBlock);
		assert.ok(true);
	});

	it("should throw an error when adding an invalid block to the block chain", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		assert.throws((): void => {
			blockchain.addBlock(latestBlock);
		}, InvalidBlockException);
	});

	it("should throw an error when adding an invalid hash to the block chain", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		let nextBlock = latestBlock.generateNextBlock("Test block!!");
		nextBlock = nextBlock.copy({ hash: "invalid hash" });
		assert.throws((): void => {
			blockchain.addBlock(nextBlock);
		}, InvalidBlockException);
	});

	it("should throw an error when adding an invalid previous hash to the block chain", (): void => {
		const blockchain = Blockchain.create();
		const latestBlock = blockchain.latestBlock;
		let nextBlock = latestBlock.generateNextBlock("Test block!!");
		nextBlock = nextBlock.copy({ previousHash: "invalid hash" });
		assert.throws((): void => {
			blockchain.addBlock(nextBlock);
		}, InvalidBlockException);
	});
});
