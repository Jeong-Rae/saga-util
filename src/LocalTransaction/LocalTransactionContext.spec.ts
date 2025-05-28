import { LocalTransactionContext } from "./LocalTransactionContext";
import { RollbackFailedError } from "./RollbackFailedError";

import { describe, expect, it } from "vitest";

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

	it("롤백 실행 후 addRollback 호출 시 에러", async () => {
		const context = new LocalTransactionContext();

		context.addRollback(() => {
			// 정상적인 롤백 함수
		});

		// 롤백 실행
		await context.rollbackAll();

		// 롤백 실행 후 addRollback 호출 시 에러 발생
		expect(() => {
			context.addRollback(() => {
				// 새로운 롤백 함수
			});
		}).toThrow(RollbackFailedError);
	});

	describe("서포트 함수 테스트", () => {
		it("getContextId: 고유한 컨텍스트 ID 반환", () => {
			const context1 = new LocalTransactionContext();
			const context2 = new LocalTransactionContext();

			expect(context1.getContextId()).toBeDefined();
			expect(context2.getContextId()).toBeDefined();
			expect(context1.getContextId()).not.toBe(context2.getContextId());
		});

		it("isExecuted: 롤백 실행 상태 확인", async () => {
			const context = new LocalTransactionContext();

			expect(context.isExecuted()).toBe(false);

			context.addRollback(() => {});

			expect(context.isExecuted()).toBe(false);

			await context.rollbackAll();
			expect(context.isExecuted()).toBe(true);
		});

		it("isSuccess: 롤백 성공 상태 확인", async () => {
			const context1 = new LocalTransactionContext();
			const context2 = new LocalTransactionContext();

			context1.addRollback(() => {});
			await context1.rollbackAll();
			expect(context1.isSuccess()).toBe(true);

			context2.addRollback(() => {
				throw new Error("rollback error");
			});

			try {
				await context2.rollbackAll();
			} catch {
				// 에러 무시
			}

			expect(context2.isSuccess()).toBe(false);
		});

		it("hasRollbacks: 롤백 함수 존재 여부 확인", () => {
			const context = new LocalTransactionContext();

			expect(context.hasRollbacks()).toBe(false);

			context.addRollback(() => {});
			expect(context.hasRollbacks()).toBe(true);

			context.addRollback(() => {});
			expect(context.hasRollbacks()).toBe(true);
		});
	});
});
