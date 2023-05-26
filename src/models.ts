import * as crypto from "crypto";
import { Data } from "dataclass";
import winston from "winston";

import { InvalidBlockException, InvalidChainException } from "./exceptions";
import { Logger } from "./logging";

const BLOCK_GENERATION_INTERVAL = Number(process.env.BLOCK_GENERATION_INTERVAL ?? 10);
const DIFFICULTY_ADJUSTMENT_INTERVAL = Number(process.env.DIFFICULTY_ADJUSTMENT_INTERVAL ?? 10);

export class Block extends Data {
	public index = 0;
	public hash = "";
	public previousHash = "0";
	public timestamp = Math.round(new Date().getTime() / 1000);
	public data = "Hello, World!";
	public difficulty = 0;
	public nonce = 0;

	static calculateHash(block: Block): string {
		const args: (string | number)[] = [
			block.index,
			block.previousHash,
			block.timestamp,
			block.data,
			block.difficulty,
			block.nonce,
		];
		return crypto.createHash("sha256").update(args.join()).digest("hex");
	}

	static matchHashDifficulty(block: Block): boolean {
		const hashInBinary: string = Block.hexToBinary(block.hash);
		const requiredPrefix: string = "0".repeat(block.difficulty);
		return hashInBinary.startsWith(requiredPrefix);
	}

	static hexToBinary(s: string): string {
		let result = "";
		for (const i of s) {
			const hex = parseInt(i, 16);
			result += hex.toString(2).padStart(4, "0");
		}
		return result;
	}
	static findBlock(block: Block): Block {
		let nonce = 0;
		// eslint-disable-next-line no-constant-condition,@typescript-eslint/no-unnecessary-condition
		while (true) {
			const hash = Block.calculateHash(block.copy({ nonce: nonce }));
			if (Block.matchHashDifficulty(block.copy({ hash: hash }))) {
				return block.copy({ hash: hash, nonce: nonce });
			}
			nonce++;
		}
	}

	static genesisBlock(): Block {
		const index = 0;
		const previousHash = "0";
		const timestamp = Number(process.env.GENESIS_TIMESTAMP ?? 1465154705);
		const data = process.env.GENESIS_DATA ?? "my genesis block!!";
		const block: Block = Block.create({
			index: index,
			previousHash: previousHash,
			timestamp: timestamp,
			data: data,
		});
		return block.copy({ hash: Block.calculateHash(block) });
	}

	static isValidTimestamp(newBlock: Block, previousBlock: Block): boolean {
		return (
			previousBlock.timestamp - 60 < newBlock.timestamp &&
			newBlock.timestamp - 60 < Math.round(new Date().getTime() / 1000)
		);
	}

	static validHash(block: Block): boolean {
		return Block.calculateHash(block) === block.hash && Block.matchHashDifficulty(block);
	}

	public generateNextBlock(blockData: string, chain: Blockchain): Block {
		const nextIndex = this.index + 1;
		const difficulty = chain.getDifficulty();
		let block: Block = Block.create({
			index: nextIndex,
			previousHash: this.hash,
			timestamp: Math.round(new Date().getTime() / 1000),
			data: blockData,
			difficulty: difficulty,
		});
		block = Block.findBlock(block);
		return block;
	}
}

export class Blockchain extends Data {
	private logging: Logger = new Logger("Blockchain");
	public blocks: Block[] = [Block.genesisBlock()];

	public get latestBlock(): Block {
		return this.blocks[this.blocks.length - 1];
	}

	public addBlock(newBlock: Block): void {
		if (this.isValidNewBlock(newBlock, this.latestBlock)) {
			this.blocks.push(newBlock);
			this.logger.info(`Block added: ${JSON.stringify(newBlock)}`);
		} else {
			throw new InvalidBlockException("Invalid block");
		}
	}

	public isValidNewBlock(newBlock: Block, previousBlock: Block): boolean {
		if (previousBlock.index + 1 !== newBlock.index) {
			this.logger.error(`Invalid index: ${newBlock.index}`);
			return false;
		} else if (previousBlock.hash !== newBlock.previousHash) {
			this.logger.error(`Invalid previoushash: ${newBlock.previousHash}`);
			return false;
		} else if (!Block.isValidTimestamp(newBlock, previousBlock)) {
			this.logger.error(`Invalid timestamp: ${newBlock.timestamp}`);
			return false;
		} else if (!Block.validHash(newBlock)) {
			this.logger.error(`Invalid hash: ${newBlock.hash}`);
			return false;
		} else {
			return true;
		}
	}

	public isValidChain(blockchainToValidate: Blockchain = this): boolean {
		const genesis = JSON.stringify(Block.genesisBlock());
		if (genesis !== JSON.stringify(blockchainToValidate.blocks[0])) {
			this.logger.error(`Invalid genesis block: ${JSON.stringify(blockchainToValidate.blocks[0])}`);
			return false;
		}
		for (const [i, block] of blockchainToValidate.blocks.entries()) {
			if (i && !this.isValidNewBlock(block, blockchainToValidate.blocks[i - 1])) {
				this.logger.error(`Invalid block: ${JSON.stringify(block)}`);
				return false;
			}
		}
		return true;
	}

	public replaceChain(newBlocks: Blockchain): void {
		if (this.isValidChain(newBlocks) && newBlocks.accumulatedDifficulty > this.accumulatedDifficulty) {
			this.logger.info(`Received blockchain is valid. Replacing current blockchain with received blockchain`);
			const newBlocksToAppend = newBlocks.blocks.slice(this.blocks.length);
			for (const block of newBlocksToAppend) {
				this.blocks.push(block);
			}
		} else {
			throw new InvalidChainException("Received blockchain invalid");
		}
	}

	public getAdjustedDifficulty(): number {
		const latestBlock = this.latestBlock;
		const prevAdjustmentBlock = this.blocks[this.blocks.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
		const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
		const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
		this.logger.info(`Time expected: ${timeExpected} seconds, time taken: ${timeTaken} seconds`);
		if (timeTaken < timeExpected / 2) {
			return prevAdjustmentBlock.difficulty + 1;
		} else if (timeTaken > timeExpected * 2) {
			return prevAdjustmentBlock.difficulty - 1;
		} else {
			return prevAdjustmentBlock.difficulty;
		}
	}

	public getDifficulty(): number {
		const latestBlock = this.latestBlock;
		if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
			return this.getAdjustedDifficulty();
		} else {
			return latestBlock.difficulty;
		}
	}

	public get accumulatedDifficulty(): number {
		return this.blocks.map((block) => Math.pow(2, block.difficulty)).reduce((a, b) => a + b);
	}

	public get logger(): winston.Logger {
		return this.logging.logger;
	}
}
