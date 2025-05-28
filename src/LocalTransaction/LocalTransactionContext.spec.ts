import { LocalTransactionContext } from "./LocalTransactionContext";
import { RollbackFailedError } from "./RollbackFailedError";

describe("LocalTransactionContext", () => {
	it("RollbackAll: sync function", async () => {
		const context = new LocalTransactionContext();
		const executionOrder: number[] = [];

		context.addRollback(() => executionOrder.push(1));
		context.addRollback(() => executionOrder.push(2));

		await context.rollbackAll();

		expect(executionOrder).toEqual([2, 1]);
	});

	it("RollbackAll: async function", async () => {
		const context = new LocalTransactionContext();
		const executionOrder: number[] = [];

		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));

		context.addRollback(async () => {
			await delay(100);
			executionOrder.push(1);
		});

		context.addRollback(async () => {
			await delay(50);
			executionOrder.push(2);
		});

		await context.rollbackAll();

		expect(executionOrder).toEqual([2, 1]);
	});

	it("롤백 실패", async () => {
		const context = new LocalTransactionContext();

		context.addRollback(() => {
			throw new Error();
		});

		await expect(context.rollbackAll()).rejects.toThrow(RollbackFailedError);
	});
});
