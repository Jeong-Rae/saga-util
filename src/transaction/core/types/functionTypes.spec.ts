import { describe, expect, it, vi } from "vitest";
import { toPromise } from "./functionTypes";

describe("functionTypes", () => {
	describe("toPromise", () => {
		it("should convert sync function to async", async () => {
			const syncFunc = (x: number, y: number) => x + y;
			const asyncFunc = toPromise(syncFunc);

			const result = await asyncFunc(2, 3);
			expect(result).toBe(5);
		});

		it("should handle sync function with no parameters", async () => {
			const syncFunc = () => "hello";
			const asyncFunc = toPromise(syncFunc);

			const result = await asyncFunc();
			expect(result).toBe("hello");
		});

		it("should handle sync function that returns object", async () => {
			const obj = { name: "test", value: 42 };
			const syncFunc = () => obj;
			const asyncFunc = toPromise(syncFunc);

			const result = await asyncFunc();
			expect(result).toBe(obj);
		});

		it("should handle sync function that throws error", async () => {
			const syncFunc = () => {
				throw new Error("sync error");
			};
			const asyncFunc = toPromise(syncFunc);

			await expect(asyncFunc()).rejects.toThrow("sync error");
		});

		it("should handle async function and return it as-is", async () => {
			const asyncFunc = async (x: number) => x * 2;
			const wrappedFunc = toPromise(asyncFunc);

			const result = await wrappedFunc(5);
			expect(result).toBe(10);
		});

		it("should handle async function that rejects", async () => {
			const asyncFunc = async () => {
				throw new Error("async error");
			};
			const wrappedFunc = toPromise(asyncFunc);

			await expect(wrappedFunc()).rejects.toThrow("async error");
		});

		it("should preserve function parameters and return types", async () => {
			const func = (name: string, age: number, active: boolean) => ({
				name,
				age,
				active,
				id: Math.random(),
			});
			const asyncFunc = toPromise(func);

			const result = await asyncFunc("Alice", 30, true);
			expect(result).toEqual({
				name: "Alice",
				age: 30,
				active: true,
				id: expect.any(Number),
			});
		});

		it("should handle function with complex return types", async () => {
			const func = () => [1, 2, 3, { nested: "value" }];
			const asyncFunc = toPromise(func);

			const result = await asyncFunc();
			expect(result).toEqual([1, 2, 3, { nested: "value" }]);
		});

		it("should call original function with correct context", async () => {
			const mockThis = { multiplier: 3 };
			function func(this: typeof mockThis, x: number) {
				return x * this.multiplier;
			}
			const asyncFunc = toPromise(func);

			const result = await asyncFunc.call(mockThis, 4);
			expect(result).toBe(12);
		});
	});
});
