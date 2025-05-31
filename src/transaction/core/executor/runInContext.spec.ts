import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Propagation } from "../../options";
import { contextStore, getCurrentContext } from "../context/ContextStorage";
import { TransactionContext } from "../context/TransactionContext";
import { runInContext } from "./runInContext";

describe("runInContext", () => {
	afterEach(() => {
		// 각 테스트 후 컨텍스트 정리
		try {
			// biome-ignore lint/suspicious/noExplicitAny: test utility
			contextStore.enterWith(undefined as any);
		} catch {
			// 에러 무시
		}
	});

	describe("Propagation.New", () => {
		it("should create new context when propagation is New", async () => {
			const existingContext = new TransactionContext();
			contextStore.enterWith(existingContext);

			let capturedContext: TransactionContext | undefined;
			const result = await runInContext(
				{ propagation: Propagation.New },
				async (context) => {
					capturedContext = context;
					expect(getCurrentContext()).toBe(context);
					expect(context).not.toBe(existingContext);
					return "new-result";
				},
			);

			expect(result).toBe("new-result");
			expect(capturedContext).toBeInstanceOf(TransactionContext);
			expect(capturedContext).not.toBe(existingContext);

			// 실행 후 원래 컨텍스트가 복원되어야 함
			expect(getCurrentContext()).toBe(existingContext);
		});

		it("should create new context when no existing context", async () => {
			// 컨텍스트 없는 상태에서 시작
			// biome-ignore lint/suspicious/noExplicitAny: test utility
			contextStore.enterWith(undefined as any);

			let capturedContext: TransactionContext | undefined;
			const result = await runInContext(
				{ propagation: Propagation.New },
				async (context) => {
					capturedContext = context;
					expect(getCurrentContext()).toBe(context);
					return 42;
				},
			);

			expect(result).toBe(42);
			expect(capturedContext).toBeInstanceOf(TransactionContext);

			// 실행 후 컨텍스트가 없어야 함 (원래 상태로 복원)
			expect(getCurrentContext()).toBeUndefined();
		});

		it("should isolate contexts in parallel executions", async () => {
			const results = await Promise.all([
				runInContext({ propagation: Propagation.New }, async (context1) => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { id: context1.getId(), name: "first" };
				}),
				runInContext({ propagation: Propagation.New }, async (context2) => {
					await new Promise((resolve) => setTimeout(resolve, 15));
					return { id: context2.getId(), name: "second" };
				}),
			]);

			expect(results).toHaveLength(2);
			expect(results[0].name).toBe("first");
			expect(results[1].name).toBe("second");
			expect(results[0].id).not.toBe(results[1].id);
		});

		it("should handle errors and maintain context isolation", async () => {
			const existingContext = new TransactionContext();
			contextStore.enterWith(existingContext);

			await expect(
				runInContext({ propagation: Propagation.New }, async (context) => {
					expect(context).not.toBe(existingContext);
					throw new Error("test error");
				}),
			).rejects.toThrow("test error");

			// 에러 발생 후에도 원래 컨텍스트가 복원되어야 함
			expect(getCurrentContext()).toBe(existingContext);
		});
	});

	describe("Propagation.Inherit", () => {
		it("should inherit existing context when propagation is Inherit", async () => {
			const existingContext = new TransactionContext();
			contextStore.enterWith(existingContext);

			let capturedContext: TransactionContext | undefined;
			const result = await runInContext(
				{ propagation: Propagation.Inherit },
				async (context) => {
					capturedContext = context;
					expect(getCurrentContext()).toBe(context);
					expect(context).toBe(existingContext);
					return "inherited-result";
				},
			);

			expect(result).toBe("inherited-result");
			expect(capturedContext).toBe(existingContext);
			expect(getCurrentContext()).toBe(existingContext);
		});

		it("should create new context when no existing context to inherit", async () => {
			// 컨텍스트 없는 상태에서 시작
			// biome-ignore lint/suspicious/noExplicitAny: test utility
			contextStore.enterWith(undefined as any);

			let capturedContext: TransactionContext | undefined;
			const result = await runInContext(
				{ propagation: Propagation.Inherit },
				async (context) => {
					capturedContext = context;
					expect(getCurrentContext()).toBe(context);
					return "new-inherit-result";
				},
			);

			expect(result).toBe("new-inherit-result");
			expect(capturedContext).toBeInstanceOf(TransactionContext);

			// contextStore.run()이 끝나면 원래 상태(undefined)로 복원됨
			expect(getCurrentContext()).toBeUndefined();
		});

		it("should share context state when inheriting", async () => {
			const existingContext = new TransactionContext();
			const rollbackFunc = vi.fn();
			existingContext.addRollback(rollbackFunc);
			contextStore.enterWith(existingContext);

			await runInContext(
				{ propagation: Propagation.Inherit },
				async (context) => {
					expect(context).toBe(existingContext);

					// 같은 컨텍스트이므로 롤백 스택도 공유
					const newRollback = vi.fn();
					context.addRollback(newRollback);

					return "shared-state";
				},
			);

			// 롤백을 실행하면 둘 다 실행되어야 함
			await existingContext.rollbackAll();
			expect(rollbackFunc).toHaveBeenCalledOnce();
		});

		it("should handle nested inherit calls", async () => {
			const rootContext = new TransactionContext();
			contextStore.enterWith(rootContext);

			const result = await runInContext(
				{ propagation: Propagation.Inherit },
				async (context1) => {
					expect(context1).toBe(rootContext);

					return runInContext(
						{ propagation: Propagation.Inherit },
						async (context2) => {
							expect(context2).toBe(rootContext);
							expect(context2).toBe(context1);
							return "nested-inherit";
						},
					);
				},
			);

			expect(result).toBe("nested-inherit");
			expect(getCurrentContext()).toBe(rootContext);
		});
	});

	describe("mixed propagation scenarios", () => {
		it("should handle Inherit -> New nesting", async () => {
			const rootContext = new TransactionContext();
			contextStore.enterWith(rootContext);

			const result = await runInContext(
				{ propagation: Propagation.Inherit },
				async (inheritedContext) => {
					expect(inheritedContext).toBe(rootContext);

					return runInContext(
						{ propagation: Propagation.New },
						async (newContext) => {
							expect(newContext).not.toBe(rootContext);
							expect(getCurrentContext()).toBe(newContext);
							return "inherit-then-new";
						},
					);
				},
			);

			expect(result).toBe("inherit-then-new");
			expect(getCurrentContext()).toBe(rootContext);
		});

		it("should handle New -> Inherit nesting", async () => {
			const rootContext = new TransactionContext();
			contextStore.enterWith(rootContext);

			const result = await runInContext(
				{ propagation: Propagation.New },
				async (newContext) => {
					expect(newContext).not.toBe(rootContext);

					return runInContext(
						{ propagation: Propagation.Inherit },
						async (inheritedContext) => {
							expect(inheritedContext).toBe(newContext);
							expect(getCurrentContext()).toBe(newContext);
							return "new-then-inherit";
						},
					);
				},
			);

			expect(result).toBe("new-then-inherit");
			expect(getCurrentContext()).toBe(rootContext);
		});

		it("should handle complex nesting scenarios", async () => {
			const rootContext = new TransactionContext();
			contextStore.enterWith(rootContext);

			const results: string[] = [];

			await runInContext({ propagation: Propagation.Inherit }, async (ctx1) => {
				results.push(`inherit1:${ctx1.getId()}`);
				expect(ctx1).toBe(rootContext);

				await runInContext({ propagation: Propagation.New }, async (ctx2) => {
					results.push(`new:${ctx2.getId()}`);
					expect(ctx2).not.toBe(rootContext);

					await runInContext(
						{ propagation: Propagation.Inherit },
						async (ctx3) => {
							results.push(`inherit2:${ctx3.getId()}`);
							expect(ctx3).toBe(ctx2);

							await runInContext(
								{ propagation: Propagation.New },
								async (ctx4) => {
									results.push(`new2:${ctx4.getId()}`);
									expect(ctx4).not.toBe(ctx2);
									expect(ctx4).not.toBe(rootContext);
								},
							);

							expect(getCurrentContext()).toBe(ctx2);
						},
					);

					expect(getCurrentContext()).toBe(ctx2);
				});

				expect(getCurrentContext()).toBe(rootContext);
			});

			expect(getCurrentContext()).toBe(rootContext);
			expect(results).toHaveLength(4);
			expect(results[0]).toContain("inherit1");
			expect(results[1]).toContain("new");
			expect(results[2]).toContain("inherit2");
			expect(results[3]).toContain("new2");
		});
	});

	describe("async behavior", () => {
		it("should maintain context through promise chains", async () => {
			const result = await runInContext(
				{ propagation: Propagation.New },
				async (context) => {
					return Promise.resolve(context.getId())
						.then((id) => {
							expect(getCurrentContext()).toBe(context);
							return id;
						})
						.then(async (id) => {
							expect(getCurrentContext()).toBe(context);
							await Promise.resolve();
							return `processed-${id}`;
						});
				},
			);

			expect(result).toMatch(/^processed-[0-9a-f-]+$/);
		});

		it("should handle concurrent operations within same context", async () => {
			await runInContext({ propagation: Propagation.New }, async (context) => {
				const results = await Promise.all([
					Promise.resolve().then(() => {
						expect(getCurrentContext()).toBe(context);
						return "task1";
					}),
					Promise.resolve().then(() => {
						expect(getCurrentContext()).toBe(context);
						return "task2";
					}),
					Promise.resolve().then(() => {
						expect(getCurrentContext()).toBe(context);
						return "task3";
					}),
				]);

				expect(results).toEqual(["task1", "task2", "task3"]);
				expect(getCurrentContext()).toBe(context);
			});
		});

		it("should handle function that returns non-promise value", async () => {
			const result = await runInContext(
				{ propagation: Propagation.New },
				(context) => {
					// 비동기 함수가 아닌 동기 함수
					expect(getCurrentContext()).toBe(context);
					return "sync-result";
				},
			);

			expect(result).toBe("sync-result");
		});
	});

	describe("error handling", () => {
		it("should propagate errors from function", async () => {
			await expect(
				runInContext({ propagation: Propagation.New }, async () => {
					throw new Error("function error");
				}),
			).rejects.toThrow("function error");
		});

		it("should maintain context isolation even when errors occur", async () => {
			const rootContext = new TransactionContext();
			contextStore.enterWith(rootContext);

			await expect(
				runInContext({ propagation: Propagation.New }, async (newContext) => {
					expect(newContext).not.toBe(rootContext);
					throw new Error("nested error");
				}),
			).rejects.toThrow("nested error");

			expect(getCurrentContext()).toBe(rootContext);
		});
	});
});
