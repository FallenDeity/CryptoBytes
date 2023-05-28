/// <reference types="node" />
import * as crypto from "crypto";
import { Data } from "dataclass";
import winston from "winston";
import { Transaction, TxOut, UnspentTxOut } from "./transactions";
export declare class Wallet extends Data {
    private logging;
    wallet_dir: string;
    public_key: string;
    private_key: string;
    createTransaction(amount: number, toAddress: string, aUnspentTxOuts: UnspentTxOut[]): Transaction;
    deleteWallet(): void;
    readKeyPair(wallet: Wallet): Wallet;
    writeKeyPair(): void;
    getBalance(aUnspentTxOuts: UnspentTxOut[]): number;
    findTxOutsForAmount(amount: number, aUnspentTxOuts: UnspentTxOut[]): {
        includedUnspentTxOuts: UnspentTxOut[];
        leftOverAmount: number;
    };
    static toTxOut(receiverAddress: string, myAddress: string, amount: number, leftOverAmount: number): TxOut[];
    get keyPair(): crypto.KeyPairSyncResult<string, string>;
    get publicKey(): string;
    get logger(): winston.Logger;
}
