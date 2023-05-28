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

export class UnreferencedTxOutException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UnreferencedTxOut";
		Object.setPrototypeOf(this, UnreferencedTxOutException.prototype);
	}
}

export class InvalidPrivateKeyException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidPrivateKey";
		Object.setPrototypeOf(this, InvalidPrivateKeyException.prototype);
	}
}

export class InsufficientFundsException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InsufficientFunds";
		Object.setPrototypeOf(this, InsufficientFundsException.prototype);
	}
}

export class InvalidTransactionException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidTransaction";
		Object.setPrototypeOf(this, InvalidTransactionException.prototype);
	}
}
