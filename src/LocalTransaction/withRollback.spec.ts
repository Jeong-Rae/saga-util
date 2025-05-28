import { LocalTransactionContext } from "./LocalTransactionContext";
import { localTransactionContextStorage } from "./LocalTransactionContextStorage";
import { withRollback } from "./withRollback";

describe("withRollback", () => {
	let mockContext: LocalTransactionContext;

	beforeEach(() => {
		mockContext = new LocalTransactionContext();
		jest
			.spyOn(localTransactionContextStorage, "getStore")
			.mockReturnValue(mockContext);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe("fn이 정상적으로 실행", () => {
		it("동기 fn 실행", async () => {
			const syncFn = jest.fn(() => 1);

			const result = await withRollback(Promise.resolve(syncFn()));

			expect(syncFn).toHaveBeenCalled();
			expect(result).toBe(1);
		});

		it("비동기 fn 실행", async () => {
			const delay = (ms: number) =>
				new Promise((resolve) => setTimeout(resolve, ms));
			const asyncFn = jest.fn(async () => {
				await delay(10);
				return 2;
			});

			const result = await withRollback(await asyncFn());

			expect(asyncFn).toHaveBeenCalled();
			expect(result).toBe(2);
		});
	});

	describe("rollbackFn이 정상적으로 등록됨", () => {
		it("동기 rollbackFn 등록", async () => {
			const syncRollbackFn = jest.fn(() => 1);

			const usage = await withRollback(Promise.resolve("fn")).rollback(
				syncRollbackFn,
			);

			// biome-ignore lint/complexity/useLiteralKeys: test code
			expect(mockContext["rollbackStack"].length).toBe(1);
		});

		it("비동기 rollbackFn 등록", async () => {
			const delay = (ms: number) =>
				new Promise((resolve) => setTimeout(resolve, ms));
			const asyncRollbackFn = jest.fn(async () => {
				await delay(10);
			});

			await withRollback(Promise.resolve("fn")).rollback(asyncRollbackFn);

			// biome-ignore lint/complexity/useLiteralKeys: test code
			expect(mockContext["rollbackStack"].length).toBe(1);
		});
	});

	describe("withRollback이 비동기로 등록", () => {
		it("withRollback은 Promise 반환", async () => {
			const promiseResult = withRollback(Promise.resolve("fn"));

			expect(promiseResult).toBeInstanceOf(Promise);

			const resolvedValue = await promiseResult;
			expect(resolvedValue).toBe("fn");
		});
	});
});
