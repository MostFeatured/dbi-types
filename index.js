const path = require("path")
const fs = require("fs");
const LocaleFilePath = path.resolve(process.cwd(), "./node_modules/@mostfeatured/dbi/dist/types/Locale.d.ts");

/**
 * @param {import("@mostfeatured/dbi/dist/types/Locale").DBILocale} locale 
 * @returns {Promise<Boolean>}
 */
module.exports.overwriteLocaleTypes = async function overwriteLocaleTypes(locale) {
  let dataAsString = JSON.stringify(locale.data || locale, (key, value) => typeof value === "string" || typeof value === "function" ? "(...replacers) => string" : value, 2)
    .replace(/"([a-zA-ZğüşiöçĞÜŞİÖÇıİ_][a-zA-Z0-9ğüşiöçĞÜŞİÖÇıİ_]*)"((: {)|(: "([^"]|\\")*[^\\]"))/g, "$1$2")
    .replace(/\"\(\.\.\.replacers\) \=\> string\"/g, "(...replacers: string[]) => string");
  const localeFileContent = await fs.promises.readFile(LocaleFilePath, "utf-8");
  const replacedContent = localeFileContent.replace(
    /export interface LangObject \{.*\}\nexport interface LangConstructorObject \{/s,
    `export interface LangObject ${dataAsString}\nexport interface LangConstructorObject \{`
  )
  await fs.promises.writeFile(LocaleFilePath, replacedContent);
  return true
}