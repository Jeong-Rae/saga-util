import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResolvedTransactionOptions } from "../../options";
import { LIB_DEFAULT_OPTIONS } from "../../options/defaults";
import { TransactionContext } from "../context/TransactionContext";
import type { AnyFn } from "../types";
import { executeWithContext } from "./executeWithContext";

describe("executeWithContext", () => {
	let context: TransactionContext;
	let defaultOptions: ResolvedTransactionOptions;
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		context = new TransactionContext();
		defaultOptions = { ...LIB_DEFAULT_OPTIONS };
		consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	describe("successful execution", () => {
		it("should execute sync function and return result", async () => {
			const func = vi.fn((x: number, y: number) => x + y) as AnyFn;
			const thisArg = {};
			const parameters = [2, 3];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toBe(5);
			expect(func).toHaveBeenCalledWith(2, 3);
			expect(func).toHaveBeenCalledOnce();
		});

		it("should execute async function and return result", async () => {
			const func = vi.fn(async (x: number) => x * 2) as AnyFn;
			const thisArg = {};
			const parameters = [5];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toBe(10);
			expect(func).toHaveBeenCalledWith(5);
			expect(func).toHaveBeenCalledOnce();
		});

		it("should preserve thisArg context", async () => {
			const thisArg = { multiplier: 3 };
			const func = vi.fn(function (this: typeof thisArg, x: number) {
				return x * this.multiplier;
			}) as AnyFn;
			const parameters = [4];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toBe(12);
			expect(func).toHaveBeenCalledOnce();
		});

		it("should handle function with no parameters", async () => {
			const func = vi.fn(() => "success");
			const thisArg = {};
			const parameters: unknown[] = [];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toBe("success");
			expect(func).toHaveBeenCalledWith();
		});

		it("should handle function returning complex objects", async () => {
			const returnValue = { id: 1, name: "test", data: [1, 2, 3] };
			const func = vi.fn(() => returnValue) as AnyFn;
			const thisArg = {};
			const parameters: unknown[] = [];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toBe(returnValue);
			expect(func).toHaveBeenCalledOnce();
		});
	});

	describe("error handling with catchUnhandledError=true", () => {
		it("should catch error and trigger rollback when catchUnhandledError is true", async () => {
			const rollbackSpy = vi.spyOn(context, "rollbackAll").mockResolvedValue();
			const error = new Error("test error");
			const func = vi.fn(() => {
				throw error;
			});
			const options = { ...defaultOptions, catchUnhandledError: true };

			await expect(
				executeWithContext(context, func, {}, [], options),
			).rejects.toThrow("test error");

			expect(rollbackSpy).toHaveBeenCalledOnce();
		});

		it("should catch async error and trigger rollback", async () => {
			const rollbackSpy = vi.spyOn(context, "rollbackAll").mockResolvedValue();
			const error = new Error("async error");
			const func = vi.fn(async () => {
				throw error;
			});
			const options = { ...defaultOptions, catchUnhandledError: true };

			await expect(
				executeWithContext(context, func, {}, [], options),
			).rejects.toThrow("async error");

			expect(rollbackSpy).toHaveBeenCalledOnce();
		});

		it("should log error when verbose is true", async () => {
			const rollbackSpy = vi.spyOn(context, "rollbackAll").mockResolvedValue();
			const error = new Error("verbose error");
			const func = vi.fn(() => {
				throw error;
			});
			const options = {
				...defaultOptions,
				catchUnhandledError: true,
				verbose: true,
			};

			await expect(
				executeWithContext(context, func, {}, [], options),
			).rejects.toThrow("verbose error");

			expect(consoleSpy).toHaveBeenCalledWith(
				"[transaction] unhandled error",
				error,
			);
			expect(rollbackSpy).toHaveBeenCalledOnce();
		});

		it("should not log error when verbose is false", async () => {
			const rollbackSpy = vi.spyOn(context, "rollbackAll").mockResolvedValue();
			const error = new Error("silent error");
			const func = vi.fn(() => {
				throw error;
			});
			const options = {
				...defaultOptions,
				catchUnhandledError: true,
				verbose: false,
			};

			await expect(
				executeWithContext(context, func, {}, [], options),
			).rejects.toThrow("silent error");

			expect(consoleSpy).not.toHaveBeenCalled();
			expect(rollbackSpy).toHaveBeenCalledOnce();
		});

		it("should handle rollback failure but still throw original error", async () => {
			const rollbackError = new Error("rollback failed");
			const rollbackSpy = vi
				.spyOn(context, "rollbackAll")
				.mockRejectedValue(rollbackError);
			const originalError = new Error("original error");
			const func = vi.fn(() => {
				throw originalError;
			});
			const options = { ...defaultOptions, catchUnhandledError: true };

			await expect(
				executeWithContext(context, func, {}, [], options),
			).rejects.toThrow("original error");

			expect(rollbackSpy).toHaveBeenCalledOnce();
		});
	});

	describe("error handling with catchUnhandledError=false", () => {
		it("should not trigger rollback when catchUnhandledError is false", async () => {
			const rollbackSpy = vi.spyOn(context, "rollbackAll").mockResolvedValue();
			const error = new Error("uncaught error");
			const func = vi.fn(() => {
				throw error;
			});
			const options = { ...defaultOptions, catchUnhandledError: false };

			await expect(
				executeWithContext(context, func, {}, [], options),
			).rejects.toThrow("uncaught error");

			expect(rollbackSpy).not.toHaveBeenCalled();
			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it("should not log error even when verbose is true", async () => {
			const rollbackSpy = vi.spyOn(context, "rollbackAll").mockResolvedValue();
			const error = new Error("uncaught verbose error");
			const func = vi.fn(() => {
				throw error;
			});
			const options = {
				...defaultOptions,
				catchUnhandledError: false,
				verbose: true,
			};

			await expect(
				executeWithContext(context, func, {}, [], options),
			).rejects.toThrow("uncaught verbose error");

			expect(rollbackSpy).not.toHaveBeenCalled();
			expect(consoleSpy).not.toHaveBeenCalled();
		});
	});

	describe("edge cases", () => {
		it("should handle function that returns undefined", async () => {
			const func = vi.fn(() => undefined);
			const thisArg = {};
			// @ts-expect-error test
			const parameters = [];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toBeUndefined();
			expect(func).toHaveBeenCalledOnce();
		});

		it("should handle function that returns null", async () => {
			const func = vi.fn(() => null);
			const thisArg = {};
			// @ts-expect-error test
			const parameters = [];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toBeNull();
			expect(func).toHaveBeenCalledOnce();
		});

		it("should handle function that returns Promise<void>", async () => {
			const func = vi.fn(async () => {
				await Promise.resolve();
			});
			const thisArg = {};
			// @ts-expect-error test
			const parameters = [];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toBeUndefined();
			expect(func).toHaveBeenCalledOnce();
		});

		it("should handle many parameters", async () => {
			const func = vi.fn(
				(a: number, b: string, c: boolean, d: object, e: number[]) => ({
					a,
					b,
					c,
					d,
					e,
				}),
			) as AnyFn;
			const thisArg = {};
			const obj = { test: true };
			const arr = [1, 2, 3];
			const parameters = [42, "test", true, obj, arr];

			const result = await executeWithContext(
				context,
				func,
				thisArg,
				parameters,
				defaultOptions,
			);

			expect(result).toEqual({ a: 42, b: "test", c: true, d: obj, e: arr });
			expect(func).toHaveBeenCalledWith(42, "test", true, obj, arr);
		});
	});
});
