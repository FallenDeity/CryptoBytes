import dotenv from "dotenv";
import express from "express";
import winston from "winston";

import { InvalidBodyException } from "./exceptions";
import { Logger } from "./logging";
import { Blockchain } from "./models";

dotenv.config();

interface BlockRequest extends express.Request {
	body: {
		data?: string;
	};
}

class Client {
	private logging: Logger = new Logger("Client");
	public blockchain: Blockchain = Blockchain.create();
	public app: express.Application;

	constructor() {
		this.app = express();
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(this.middleware.bind(this));
		this.add_routes();
		this.logger.info("Client created!");
	}

	private middleware(req: express.Request, _res: express.Response, next: express.NextFunction): void {
		this.logger.info(`Request from: ${req.ip} to ${req.path} Method: ${req.method}`);
		next();
	}

	private blocks(_req: express.Request, res: express.Response): void {
		res.send(JSON.stringify(this.blockchain.blocks));
	}

	private mintBlock(req: BlockRequest, res: express.Response): void {
		this.logger.info(`Request body: ${JSON.stringify(req.body)}`);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (req.body?.data === undefined) {
			this.logger.error(`Invalid block data: ${JSON.stringify(req.body)}`);
			throw new InvalidBodyException(`Invalid block data: ${JSON.stringify(req.body)} missing 'data' field`);
		}
		this.logger.info(`Minting block with data: ${String(req.body.data)}`);
		const latestBlock = this.blockchain.latestBlock;
		const newBlock = latestBlock.generateNextBlock(String(req.body.data));
		this.blockchain.addBlock(newBlock);
		res.send(JSON.stringify(this.blockchain.latestBlock));
	}

	private block(req: express.Request, res: express.Response): void {
		const block = this.blockchain.blocks[Number(req.params.index) || this.blockchain.blocks.length - 1];
		res.send(JSON.stringify(block));
	}

	private add_routes(): void {
		this.app.get("/blocks", this.blocks.bind(this));
		this.app.post("/blocks/mint", this.mintBlock.bind(this));
		this.app.get("/blocks/block/:index", this.block.bind(this));
	}

	public start(): void {
		this.app.listen(process.env.HTTP_PORT ?? 3001, (): void => {
			this.logger.info(`Listening on port ${process.env.HTTP_PORT ?? 3001}`);
		});
	}

	private get logger(): winston.Logger {
		return this.logging.logger;
	}
}

const client = new Client();
client.start();
