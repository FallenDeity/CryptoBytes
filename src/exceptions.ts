export class InvalidBlockException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidBlock";
		Object.setPrototypeOf(this, InvalidBlockException.prototype);
	}
}

export class InvalidChainException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidChain";
		Object.setPrototypeOf(this, InvalidChainException.prototype);
	}
}

export class InvalidBodyException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidBody";
		Object.setPrototypeOf(this, InvalidBodyException.prototype);
	}
}
