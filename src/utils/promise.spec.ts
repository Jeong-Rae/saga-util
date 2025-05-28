import { describe, expect, it } from "vitest";
import { toPromise } from "./promise";

describe("toPromise", () => {
	it("동기 함수를 Promise로 변환", async () => {
		const syncFn = (x: number, y: number) => x + y;
		const promiseFn = toPromise(syncFn);

		const result = await promiseFn(2, 3);
		expect(result).toBe(5);
	});

	it("비동기 함수를 Promise로 변환", async () => {
		const asyncFn = async (x: number, y: number) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			return x * y;
		};
		const promiseFn = toPromise(asyncFn);

		const result = await promiseFn(3, 4);
		expect(result).toBe(12);
	});

	it("에러를 던지는 동기 함수 처리", async () => {
		const errorFn = () => {
			throw new Error("Test error");
		};
		const promiseFn = toPromise(errorFn);

		await expect(promiseFn()).rejects.toThrow("Test error");
	});

	it("에러를 던지는 비동기 함수 처리", async () => {
		const asyncErrorFn = async () => {
			throw new Error("Async test error");
		};
		const promiseFn = toPromise(asyncErrorFn);

		await expect(promiseFn()).rejects.toThrow("Async test error");
	});

	it("매개변수가 없는 함수 처리", async () => {
		const noArgsFn = () => "hello world";
		const promiseFn = toPromise(noArgsFn);

		const result = await promiseFn();
		expect(result).toBe("hello world");
	});

	it("복잡한 반환 타입 처리", async () => {
		const complexFn = (name: string, age: number) => ({
			name,
			age,
			isAdult: age >= 18,
		});
		const promiseFn = toPromise(complexFn);

		const result = await promiseFn("John", 25);
		expect(result).toEqual({
			name: "John",
			age: 25,
			isAdult: true,
		});
	});
});
