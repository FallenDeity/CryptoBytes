import { Data } from "dataclass";
export declare class Block extends Data {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    data: string;
    static calculateHash(block: Block): string;
    generateNextBlock(blockData: string): Block;
    static genesisBlock(): Block;
}
export declare class Blockchain extends Data {
    private logging;
    blocks: Block[];
    get latestBlock(): Block;
    addBlock(newBlock: Block): void;
    isValidNewBlock(newBlock: Block, previousBlock: Block): boolean;
    isValidChain(blockchainToValidate?: Blockchain): boolean;
    replaceChain(newBlocks: Blockchain): void;
    private get logger();
}
