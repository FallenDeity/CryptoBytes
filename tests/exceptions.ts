import "mocha";

import * as assert from "assert";

import { InvalidBlockException, InvalidBodyException, InvalidChainException } from "../src/exceptions";

describe("exceptions", (): void => {
	it("should throw an InvalidBlockException", (): void => {
		assert.throws((): void => {
			throw new InvalidBlockException("Invalid block!");
		}, InvalidBlockException);
	});

	it("should throw an InvalidChainException", (): void => {
		assert.throws((): void => {
			throw new InvalidChainException("Invalid chain!");
		}, InvalidChainException);
	});

	it("should throw an InvalidBodyException", (): void => {
		assert.throws((): void => {
			throw new InvalidBodyException("Invalid body!");
		}, InvalidBodyException);
	});
});
