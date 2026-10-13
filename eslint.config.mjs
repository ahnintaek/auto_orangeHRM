import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

export default defineConfig([
  // 검사하지 않을 폴더 (설치 폴더, 실행 산출물, 로그인 상태 파일)
  globalIgnores([
    "node_modules/",
    "playwright-report/",
    "test-results/",
    "blob-report/",
    "playwright/.auth/",
  ]),

  js.configs.recommended,
  tseslint.configs.recommended,

  // 타입 정보를 사용하는 규칙.
  // Playwright에서 가장 흔하고 위험한 실수인 "await 누락"을 잡는다.
  // (await을 빼면 검증이 실행되지 않거나 기다리지 않아도 에러 없이 통과해버린다)
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },

  // Playwright 전용 규칙: await 누락, 고정 대기(waitForTimeout), test.only 방치, networkidle 사용 등
  {
    ...playwright.configs['flat/recommended'],
    files: ['project/**/*.ts', 'global-setup.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': [
        'warn',
        { assertFunctionPatterns: ['^expect[A-Z]', '^assert[A-Z]'] },
      ],
    },
  },
  // 서식 규칙은 Prettier가 담당한다. 충돌하는 ESLint 규칙을 끄는 설정이므로 반드시 마지막에 둔다.
  prettier,
]);
