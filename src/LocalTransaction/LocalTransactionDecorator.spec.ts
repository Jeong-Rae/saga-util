import type { LocalTransactionContext } from "./LocalTransactionContext";
import { localTransactionContextStorage } from "./LocalTransactionContextStorage";
import { LocalTransaction } from "./LocalTransactionDecorator";
import { withRollback } from "./withRollback";

class TestService {
	public rollbackCalls: string[] = [];
	public parentContext: LocalTransactionContext | null = null;
	public childContext: LocalTransactionContext | null = null;

	@LocalTransaction()
	async successMethod(): Promise<string> {
		const result = await withRollback(Promise.resolve("fn")).rollback(() => {
			this.rollbackCalls.push("rollback1");
		});
		return result;
	}

	@LocalTransaction()
	async errorMethod(): Promise<void> {
		await withRollback(Promise.resolve("fn1")).rollback(() =>
			this.rollbackCalls.push("rollbackFn1"),
		);
		await withRollback(Promise.resolve("fn2")).rollback(() =>
			this.rollbackCalls.push("rollbackFn2"),
		);
		throw new Error("Test error");
	}

	@LocalTransaction()
	async nestedMethod(): Promise<void> {
		await withRollback(Promise.resolve("outerFn")).rollback(() =>
			this.rollbackCalls.push("outerRollbackFn"),
		);
		await this.innerMethod();
	}

	@LocalTransaction()
	async innerMethod(): Promise<void> {
		await withRollback(Promise.resolve("innerFn")).rollback(() =>
			this.rollbackCalls.push("innerRollbackFn"),
		);
		throw new Error("Inner error");
	}

	@LocalTransaction()
	async nestedMethodNewContext(): Promise<void> {
		this.parentContext = localTransactionContextStorage.getStore() || null;
		await withRollback(Promise.resolve("outerFn")).rollback(() =>
			this.rollbackCalls.push("outerRollbackFn"),
		);
		await this.innerMethodNewContext();
	}

	@LocalTransaction({ propagation: "new" })
	async innerMethodNewContext(): Promise<void> {
		this.childContext = localTransactionContextStorage.getStore() || null;
		await withRollback(Promise.resolve("innerFn")).rollback(() =>
			this.rollbackCalls.push("innerRollbackFn"),
		);
		throw new Error("Inner error");
	}
}

describe("LocalTransactionDecorator", () => {
	let service: TestService;

	beforeEach(() => {
		service = new TestService();
	});

	it("메서드가 성공할 경우, 롤백 안 함", async () => {
		const result = await service.successMethod();

		expect(result).toBe("fn");
		expect(service.rollbackCalls).toEqual([]);
	});

	it("메서드가 실패할 경우, 롤백 수행", async () => {
		await expect(service.errorMethod()).rejects.toThrow("Test error");

		expect(service.rollbackCalls).toEqual(["rollbackFn2", "rollbackFn1"]);
	});

	it("컨텍스가 중첩 될 경우에도 롤백 컨텍스트 보장", async () => {
		await expect(service.nestedMethod()).rejects.toThrow("Inner error");

		expect(service.rollbackCalls).toEqual([
			"innerRollbackFn",
			"outerRollbackFn",
		]);
	});

	describe("propagation", () => {
		it("propagation: new", async () => {
			await expect(service.nestedMethodNewContext()).rejects.toThrow(
				"Inner error",
			);

			expect(service.parentContext).toBeDefined();
			expect(service.childContext).toBeDefined();

			expect(service.childContext?.getContextId()).not.toBe(
				service.parentContext?.getContextId(),
			);

			expect(service.rollbackCalls).toEqual(["outerRollbackFn"]);
		});
	});
});
