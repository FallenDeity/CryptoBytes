import { Data } from "dataclass";
import winston from "winston";
export declare class Block extends Data {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    data: string;
    difficulty: number;
    nonce: number;
    static calculateHash(block: Block): string;
    static matchHashDifficulty(block: Block): boolean;
    static hexToBinary(s: string): string;
    static findBlock(block: Block): Block;
    static genesisBlock(): Block;
    static isValidTimestamp(newBlock: Block, previousBlock: Block): boolean;
    static validHash(block: Block): boolean;
    generateNextBlock(blockData: string, chain: Blockchain): Block;
}
export declare class Blockchain extends Data {
    private logging;
    blocks: Block[];
    get latestBlock(): Block;
    addBlock(newBlock: Block): void;
    isValidNewBlock(newBlock: Block, previousBlock: Block): boolean;
    isValidChain(blockchainToValidate?: Blockchain): boolean;
    replaceChain(newBlocks: Blockchain): void;
    getAdjustedDifficulty(): number;
    getDifficulty(): number;
    get accumulatedDifficulty(): number;
    get logger(): winston.Logger;
}
