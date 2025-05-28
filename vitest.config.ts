import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			reportsDirectory: "./coverage",
			include: ["src/**/*.ts"], // 커버리지 측정 대상 파일
			exclude: [
				"src/**/*.spec.ts", // 테스트 파일 제외
				"src/**/types.ts", // 타입 정의 파일 제외
				"src/**/index.ts", // 인덱스 파일 제외
				"src/**/*.interface.ts", // 인터페이스 파일 제외 추가
				"src/**/*.type.ts", // 타입 파일 제외 추가
				"*.eta", // 템플릿 파일 제외
			],
		},
	},
	resolve: {
		alias: [
			{
				find: "@",
				replacement: path.resolve(__dirname, "src"),
			},
		],
	},
});
