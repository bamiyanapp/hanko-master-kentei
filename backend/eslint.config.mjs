import js from "@eslint/js";
import globals from "globals";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  js.configs.recommended,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      complexity: ["error", 10],
    },
  },
  {
    // テストコードの複雑さはセットアップ・アサーションの意図的な繰り返しであることが
    // 多く、プロダクトコードとは性質が異なるため対象外とする（jscpd重複検知の
    // テストファイル除外と同じ方針）
    files: ["**/*.test.js", "**/*.spec.js"],
    rules: {
      complexity: "off",
      ...Object.fromEntries(
        Object.keys(sonarjs.configs.recommended.rules).map((rule) => [rule, "off"]),
      ),
    },
  },
];
