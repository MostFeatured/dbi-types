const path = require("path")
const fs = require("fs");
const NamespaceDataLocation = path.resolve(process.cwd(), "./node_modules/@mostfeatured/dbi/generated/namespaceData.d.ts");

module.exports.setNamespaceDataTypes = async function setNamespaceDataTypes(...dbis) {
  if (dbis.length) {

  }
  const locale = ";";
  let dataAsString = JSON.stringify(locale.data || locale, (key, value) => typeof value === "string" || typeof value === "function" ? "(...replacers) => string" : value, 2)
    .replace(/"([a-zA-ZğüşiöçĞÜŞİÖÇıİ_][a-zA-Z0-9ğüşiöçĞÜŞİÖÇıİ_]*)"((: {)|(: "([^"]|\\")*[^\\]"))/g, "$1$2")
    .replace(/\"\(\.\.\.replacers\) \=\> string\"/g, "(...replacers: string[]) => string");
}

