import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/node_modules/"]), {
    extends: compat.extends("loopback"),

    rules: {
        "max-len": ["error", 120, 4, {
            ignoreComments: true,
            ignoreUrls: true,
            ignorePattern: "^\\s*var\\s.=\\s*(require\\s*\\()|(/)",
        }],

        camelcase: 0,
        "one-var": "off",
        "no-unused-expressions": "off",
    },
}]);