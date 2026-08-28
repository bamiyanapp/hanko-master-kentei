import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    ignores: [".next/**", "dist/**", "out/**", "node_modules/**"],
  },
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      complexity: ["error", 10],
    },
  },
  {
    // Service Worker（public/配下、ビルド時に加工されずそのままコピーされる）は
    // ブラウザのウィンドウコンテキストとはグローバルが異なる
    // （dev-standards共通sw.js・プロダクト固有sw-config.jsの両方が対象）
    files: ["public/sw.js", "public/sw-config.js"],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  {
    // テストコードの複雑さはセットアップ・アサーションの意図的な繰り返しであることが
    // 多く、プロダクトコードとは性質が異なるため対象外とする（jscpd重複検知の
    // テストファイル除外と同じ方針）
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}"],
    rules: {
      complexity: "off",
      ...Object.fromEntries(
        Object.keys(sonarjs.configs.recommended.rules).map((rule) => [rule, "off"]),
      ),
    },
  },
);
