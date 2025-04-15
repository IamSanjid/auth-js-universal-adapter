// @ts-check

/**
 * @type {import('typedoc').TypeDocOptions & import('typedoc-plugin-markdown').MarkdownTheme}
 */
module.exports = {
  entryPoints: ["src/index.ts", "src/client.ts", "src/schema.ts"],
  entryPointStrategy: "expand",
  tsconfig: "./tsconfig.json",
  entryModule: "universal-adapter",
  entryFileName: "universal-adapter.mdx",
  includeVersion: true,
  readme: 'none',
}
