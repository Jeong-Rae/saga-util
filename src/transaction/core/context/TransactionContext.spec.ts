import { beforeEach, describe, expect, it, vi } from "vitest";
import { RollbackFailedError } from "../../error/RollbackFailedError";
import { TransactionContext } from "./TransactionContext";

describe("TransactionContext", () => {
	let context: TransactionContext;

	beforeEach(() => {
		context = new TransactionContext();
	});

	describe("constructor", () => {
		it("should create instance with unique ID", () => {
			const context1 = new TransactionContext();
			const context2 = new TransactionContext();

			expect(context1.getId()).toBeDefined();
			expect(context2.getId()).toBeDefined();
			expect(context1.getId()).not.toBe(context2.getId());
		});

		it("should initialize with correct default state", () => {
			expect(context.isExecuted()).toBe(false);
			expect(context.isSuccess()).toBe(false);
		});
	});

	describe("addRollback", () => {
		it("should add sync function to rollback stack", () => {
			const rollbackFunc = vi.fn();

			expect(() => context.addRollback(rollbackFunc)).not.toThrow();
		});

		it("should add async function to rollback stack", () => {
			const rollbackFunc = vi.fn().mockResolvedValue(undefined);

			expect(() => context.addRollback(rollbackFunc)).not.toThrow();
		});

		it("should add multiple functions to rollback stack", () => {
			const rollbackFunc1 = vi.fn();
			const rollbackFunc2 = vi.fn();
			const rollbackFunc3 = vi.fn();

			expect(() => {
				context.addRollback(rollbackFunc1);
				context.addRollback(rollbackFunc2);
				context.addRollback(rollbackFunc3);
			}).not.toThrow();
		});

		it("should throw error when trying to add rollback after execution", async () => {
			const rollbackFunc = vi.fn();
			context.addRollback(rollbackFunc);

			await context.rollbackAll();

			expect(() => context.addRollback(vi.fn())).toThrow(RollbackFailedError);
			expect(() => context.addRollback(vi.fn())).toThrow(
				"rollback already executed",
			);
		});
	});

	describe("rollbackAll", () => {
		it("should execute rollback functions in LIFO order", async () => {
			const executionOrder: number[] = [];
			const rollbackFunc1 = vi.fn(() => executionOrder.push(1));
			const rollbackFunc2 = vi.fn(() => executionOrder.push(2));
			const rollbackFunc3 = vi.fn(() => executionOrder.push(3));

			context.addRollback(rollbackFunc1);
			context.addRollback(rollbackFunc2);
			context.addRollback(rollbackFunc3);

			await context.rollbackAll();

			expect(executionOrder).toEqual([3, 2, 1]);
			expect(rollbackFunc1).toHaveBeenCalledOnce();
			expect(rollbackFunc2).toHaveBeenCalledOnce();
			expect(rollbackFunc3).toHaveBeenCalledOnce();
		});

		it("should handle async rollback functions", async () => {
			const executionOrder: number[] = [];
			const rollbackFunc1 = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				executionOrder.push(1);
			});
			const rollbackFunc2 = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 5));
				executionOrder.push(2);
			});

			context.addRollback(rollbackFunc1);
			context.addRollback(rollbackFunc2);

			await context.rollbackAll();

			expect(executionOrder).toEqual([2, 1]);
			expect(context.isExecuted()).toBe(true);
			expect(context.isSuccess()).toBe(true);
		});

		it("should handle mixed sync and async rollback functions", async () => {
			const executionOrder: number[] = [];
			const syncFunc = vi.fn(() => executionOrder.push(1));
			const asyncFunc = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 5));
				executionOrder.push(2);
			});

			context.addRollback(syncFunc);
			context.addRollback(asyncFunc);

			await context.rollbackAll();

			expect(executionOrder).toEqual([2, 1]);
			expect(context.isExecuted()).toBe(true);
			expect(context.isSuccess()).toBe(true);
		});

		it("should set success to true when all rollbacks succeed", async () => {
			const rollbackFunc1 = vi.fn();
			const rollbackFunc2 = vi.fn();

			context.addRollback(rollbackFunc1);
			context.addRollback(rollbackFunc2);

			await context.rollbackAll();

			expect(context.isExecuted()).toBe(true);
			expect(context.isSuccess()).toBe(true);
		});

		it("should throw RollbackFailedError when rollback function fails", async () => {
			const successFunc = vi.fn();
			const failingFunc = vi.fn(() => {
				throw new Error("rollback failed");
			});

			context.addRollback(successFunc);
			context.addRollback(failingFunc);

			await expect(context.rollbackAll()).rejects.toThrow(RollbackFailedError);
			await expect(context.rollbackAll()).resolves.not.toThrow();

			expect(context.isExecuted()).toBe(true);
			expect(context.isSuccess()).toBe(false);
		});

		it("should throw RollbackFailedError when async rollback function rejects", async () => {
			const successFunc = vi.fn();
			const failingFunc = vi
				.fn()
				.mockRejectedValue(new Error("async rollback failed"));

			context.addRollback(successFunc);
			context.addRollback(failingFunc);

			await expect(context.rollbackAll()).rejects.toThrow(RollbackFailedError);

			expect(context.isExecuted()).toBe(true);
			expect(context.isSuccess()).toBe(false);
		});

		it("should not execute rollbacks if already executed", async () => {
			const rollbackFunc = vi.fn();
			context.addRollback(rollbackFunc);

			await context.rollbackAll();
			await context.rollbackAll(); // second call

			expect(rollbackFunc).toHaveBeenCalledOnce();
			expect(context.isExecuted()).toBe(true);
		});

		it("should handle empty rollback stack", async () => {
			await expect(context.rollbackAll()).resolves.not.toThrow();

			expect(context.isExecuted()).toBe(true);
			expect(context.isSuccess()).toBe(true);
		});

		it("should wait for each rollback to complete before executing next", async () => {
			const delays = [30, 20, 10];
			const executionTimes: number[] = [];
			const startTime = Date.now();

			for (let i = 0; i < delays.length; i++) {
				const delay = delays[i];
				context.addRollback(async () => {
					await new Promise((resolve) => setTimeout(resolve, delay));
					executionTimes.push(Date.now() - startTime);
				});
			}

			await context.rollbackAll();

			// 순차적으로 실행되므로 각 실행 시간이 누적되어야 함
			expect(executionTimes).toHaveLength(3);
			expect(executionTimes[0]).toBeGreaterThanOrEqual(10); // 첫 번째 (마지막에 추가된 것)
			expect(executionTimes[1]).toBeGreaterThanOrEqual(30); // 두 번째
			expect(executionTimes[2]).toBeGreaterThanOrEqual(60); // 세 번째
		});
	});

	describe("getters", () => {
		it("should return valid UUID for getId", () => {
			const id = context.getId();
			expect(id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);
		});

		it("should return correct execution state", async () => {
			expect(context.isExecuted()).toBe(false);

			context.addRollback(vi.fn());
			await context.rollbackAll();

			expect(context.isExecuted()).toBe(true);
		});

		it("should return correct success state", async () => {
			expect(context.isSuccess()).toBe(false);

			context.addRollback(vi.fn());
			await context.rollbackAll();

			expect(context.isSuccess()).toBe(true);
		});

		it("should return false for success when rollback fails", async () => {
			context.addRollback(() => {
				throw new Error("failed");
			});

			try {
				await context.rollbackAll();
			} catch {
				// ignore error
			}

			expect(context.isSuccess()).toBe(false);
		});
	});
});
