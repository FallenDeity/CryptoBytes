import "mocha";

import * as assert from "assert";

import { Logger } from "../src/logging";

describe("logging", (): void => {
	it("should say 'Hello, world!'", (): void => {
		const logger = new Logger("Logger");
		logger.logger.info("Hello, world!");
		assert.ok(true);
	});
});
