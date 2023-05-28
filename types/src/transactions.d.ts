/// <reference types="node" />
import * as crypto from "crypto";
import { Data } from "dataclass";
import winston from "winston";
export declare class TxOut extends Data {
    amount: number;
    address: string;
}
export declare class TxIn extends Data {
    txOutId: string;
    txOutIndex: number;
    signature: string;
}
export declare class UnspentTxOut extends Data {
    txOutId: string;
    txOutIndex: number;
    address: string;
    amount: number;
}
export declare class Transaction extends Data {
    private logging;
    id: string;
    txIns: TxIn[];
    txOuts: TxOut[];
    static hasDuplicates(txIns: TxIn[]): boolean;
    static getCoinbaseTransaction(address: string, blockIndex: number): Transaction;
    getTxInAmount(txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): number;
    validateTxIn(txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): boolean;
    getTransactionId(): string;
    validateTransaction(aUnspentTxOuts: UnspentTxOut[]): boolean;
    validateCoinbaseTx(blockIndex: number): boolean;
    signTxIn(txInIndex: number, privateKey: crypto.KeyObject, aUnspentTxOuts: UnspentTxOut[]): string;
    get logger(): winston.Logger;
}
export declare class Transactions extends Data {
    private logging;
    aTransactions: Transaction[];
    addTransaction(tx: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean;
    updateTransactionPool(aUnspentTxOuts: UnspentTxOut[]): void;
    isValidTxForPool(tx: Transaction): boolean;
    validateBlockTransactions(aUnspentTxOuts: UnspentTxOut[], blockIndex: number): boolean;
    updateUnspentTxOuts(aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut[];
    processTransactions(unspentTxOuts: UnspentTxOut[], blockIndex: number): UnspentTxOut[];
    get poolTxIns(): TxIn[];
    get logger(): winston.Logger;
}
