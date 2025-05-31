import { afterEach, describe, expect, it } from "vitest";
import {
	contextStore,
	getCurrentContext,
	getOrCreateContext,
} from "./ContextStorage";
import { TransactionContext } from "./TransactionContext";

describe("ContextStorage", () => {
	// 각 테스트 후 컨텍스트 정리
	afterEach(() => {
		// AsyncLocalStorage에는 exit() 메서드가 없으므로 다른 방법으로 정리
		try {
			// 현재 컨텍스트가 있다면 정리
			const currentContext = getCurrentContext();
			if (currentContext) {
				// 새로운 빈 컨텍스트로 리셋
				// biome-ignore lint/suspicious/noExplicitAny: test utility
				contextStore.enterWith(undefined as any);
			}
		} catch {
			// 에러 무시
		}
	});

	describe("getCurrentContext", () => {
		it("should return undefined when no context is set", () => {
			const result = getCurrentContext();
			expect(result).toBeUndefined();
		});

		it("should return current context when context is set", () => {
			const context = new TransactionContext();
			contextStore.enterWith(context);

			const result = getCurrentContext();
			expect(result).toBe(context);
		});

		it("should return undefined after context is cleared", () => {
			const context = new TransactionContext();
			contextStore.enterWith(context);

			expect(getCurrentContext()).toBe(context);

			// biome-ignore lint/suspicious/noExplicitAny: test utility
			contextStore.enterWith(undefined as any);
			expect(getCurrentContext()).toBeUndefined();
		});
	});

	describe("getOrCreateContext", () => {
		it("should create new context when none exists", () => {
			const result = getOrCreateContext();

			expect(result).toBeInstanceOf(TransactionContext);
			expect(getCurrentContext()).toBe(result);
		});

		it("should return existing context when one exists", () => {
			const existingContext = new TransactionContext();
			contextStore.enterWith(existingContext);

			const result = getOrCreateContext();

			expect(result).toBe(existingContext);
			expect(getCurrentContext()).toBe(existingContext);
		});

		it("should create different contexts when called multiple times without existing context", () => {
			// biome-ignore lint/suspicious/noExplicitAny: test utility
			contextStore.enterWith(undefined as any); // 컨텍스트 정리

			const context1 = getOrCreateContext();
			// biome-ignore lint/suspicious/noExplicitAny: test utility
			contextStore.enterWith(undefined as any); // 컨텍스트 정리

			const context2 = getOrCreateContext();

			expect(context1).toBeInstanceOf(TransactionContext);
			expect(context2).toBeInstanceOf(TransactionContext);
			expect(context1).not.toBe(context2);
			expect(context1.getId()).not.toBe(context2.getId());
		});

		it("should work correctly with nested async operations", () => {
			const outerContext = getOrCreateContext();

			const nestedResult = contextStore.run(new TransactionContext(), () => {
				const innerContext = getOrCreateContext();
				expect(innerContext).not.toBe(outerContext);
				return innerContext;
			});

			expect(nestedResult).toBeInstanceOf(TransactionContext);
			expect(nestedResult).not.toBe(outerContext);

			// 중첩 실행 후 원래 컨텍스트가 복원되어야 함
			expect(getCurrentContext()).toBe(outerContext);
		});
	});

	describe("contextStore", () => {
		it("should isolate contexts between different async operations", async () => {
			const context1 = new TransactionContext();
			const context2 = new TransactionContext();

			const results = await Promise.all([
				contextStore.run(context1, async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return getCurrentContext();
				}),
				contextStore.run(context2, async () => {
					await new Promise((resolve) => setTimeout(resolve, 15));
					return getCurrentContext();
				}),
			]);

			expect(results[0]).toBe(context1);
			expect(results[1]).toBe(context2);
		});

		it("should maintain context through promise chains", async () => {
			const context = new TransactionContext();

			const result = await contextStore.run(context, () => {
				return Promise.resolve()
					.then(() => getCurrentContext())
					.then((ctx) => {
						expect(ctx).toBe(context);
						return Promise.resolve(ctx);
					})
					.then((ctx) => {
						expect(ctx).toBe(context);
						return getCurrentContext();
					});
			});

			expect(result).toBe(context);
		});

		it("should handle nested context.run calls", async () => {
			const outerContext = new TransactionContext();
			const innerContext = new TransactionContext();

			const result = await contextStore.run(outerContext, async () => {
				expect(getCurrentContext()).toBe(outerContext);

				const nestedResult = await contextStore.run(innerContext, async () => {
					expect(getCurrentContext()).toBe(innerContext);
					return getCurrentContext();
				});

				expect(nestedResult).toBe(innerContext);
				expect(getCurrentContext()).toBe(outerContext);

				return getCurrentContext();
			});

			expect(result).toBe(outerContext);
		});

		it("should work with getOrCreateContext in nested scenarios", async () => {
			const outerContext = getOrCreateContext();

			await contextStore.run(new TransactionContext(), async () => {
				const middleContext = getCurrentContext();

				await contextStore.run(new TransactionContext(), async () => {
					const innerContext = getOrCreateContext();
					expect(innerContext).not.toBe(outerContext);
					expect(innerContext).not.toBe(middleContext);
				});

				expect(getCurrentContext()).toBe(middleContext);
			});

			expect(getCurrentContext()).toBe(outerContext);
		});

		it("should handle errors in async context", async () => {
			// 기본 컨텍스트가 있는 상태에서 시작
			const baseContext = getOrCreateContext();

			await expect(
				contextStore.run(new TransactionContext(), async () => {
					expect(getCurrentContext()).not.toBe(baseContext);
					throw new Error("test error");
				}),
			).rejects.toThrow("test error");

			// 에러 발생 후 기본 컨텍스트로 복원되어야 함
			expect(getCurrentContext()).toBe(baseContext);
		});
	});
});
