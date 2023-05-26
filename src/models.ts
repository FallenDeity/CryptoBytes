import * as crypto from "crypto";
import { Data } from "dataclass";
import winston from "winston";

import { InvalidBlockException, InvalidChainException } from "./exceptions";
import { Logger } from "./logging";

export class Block extends Data {
	public index = 0;
	public hash = "";
	public previousHash = "0";
	public timestamp = new Date().getTime() / 1000;
	public data = "Hello, World!";

	static calculateHash(block: Block): string {
		return crypto
			.createHash("sha256")
			.update(String(block.index) + block.previousHash + String(block.timestamp) + block.data)
			.digest("hex");
	}

	public generateNextBlock(blockData: string): Block {
		const nextIndex = this.index + 1;
		const nextTimestamp = Date.now();
		const block: Block = Block.create({
			index: nextIndex,
			previousHash: this.hash,
			timestamp: nextTimestamp,
			data: blockData,
		});
		return block.copy({ hash: Block.calculateHash(block) });
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
		} else {
			const check = Block.calculateHash(newBlock) === newBlock.hash;
			check || this.logger.error(`Invalid hash: ${newBlock.hash}`);
			return check;
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
		if (this.isValidChain(newBlocks) && newBlocks.blocks.length > this.blocks.length) {
			this.logger.info(`Received blockchain is valid. Replacing current blockchain with received blockchain`);
			const newBlocksToAppend = newBlocks.blocks.slice(this.blocks.length);
			for (const block of newBlocksToAppend) {
				this.blocks.push(block);
			}
		} else {
			throw new InvalidChainException("Received blockchain invalid");
		}
	}

	private get logger(): winston.Logger {
		return this.logging.logger;
	}
}
