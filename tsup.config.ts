import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"], // 진입 파일
	format: ["cjs", "esm"], // commonjs + esm 둘 다 지원
	dts: true, // 타입 선언 파일(.d.ts) 생성
	clean: true, // 빌드 전에 dist 폴더 비우기
	outDir: "dist", // 출력 디렉토리
	target: "es2020",
	minify: false, // 코드 압축 여부
	splitting: false, // 코드 분할 비활성화
	sourcemap: true, // 소스맵 생성
	outExtension({ format }) {
		return {
			js: format === "cjs" ? ".js" : ".mjs",
		};
	},
});
