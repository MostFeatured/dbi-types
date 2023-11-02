#!/usr/bin/env node

const path = require("path")
const fs = require("fs");
const { generatedPath, Utils: { recursiveImport } } = require("@mostfeatured/dbi");
const namespaceDataLocation = path.resolve(generatedPath, "./namespaceData.d.ts");

/**
 * @param  {...import("@mostfeatured/dbi/dist/DBI").DBI} dbis 
 */
module.exports.setNamespaceDataTypes = function setNamespaceDataTypes(...dbis) {

  if (!fs.existsSync(namespaceDataLocation)) throw Error("Please install @mostfeatured/dbi 0.0.44 or higher!");

  const namespaceDatas = [
    `  [k: string]: {
    contentLocale: DBILangObject;
    interactionMapping: { [k: string]: TDBIInteractions<NamespaceEnums> };
    eventNames: string;
    localeNames: TDBILocaleString;
    customEvents: { };
  }`
  ];

  dbis.forEach((dbi, i) => {
    if (i == 0) namespaceDatas.shift();
    const exampleLocale = dbi.data.locales.get(dbi.config.defaults.locale);

    let contentLocale = "DBILangObject";

    if (exampleLocale) {
      let dataAsString = JSON.stringify(
        exampleLocale.data || exampleLocale,
        (key, value) => {
          if (!["string", "function"].includes(typeof value)) return value;

          let str = typeof value == "function" ? value() : value;
          let temp1 = [...(str.matchAll(/\{(\d+)(;[^}]+)?\}/g) || [])].map(i => [Number(i[1]), i?.[2]?.slice?.(1)]);
          let argLength = Math.max(...temp1.map(i => i[0]));
          argLength = argLength == -Infinity ? 0 : argLength + 1;

          return `'(${Array(argLength || 0).fill("").map((_, i) => `${temp1.find(j => j[0] === i && j[1])?.[1] || `arg${i}`}: any`).join(", ")}) => string'`;
        }, 2)
        .replace(/"([a-zA-ZğüşiöçĞÜŞİÖÇıİ_][a-zA-Z0-9ğüşiöçĞÜŞİÖÇıİ_]*)"((: {)|(: "([^"]|\\")*[^\\]"))/g, "$1$2")
        .replace(/\"'([^"]+)'\"/g, "$1")
        .replace(/\n/g, "\n    ")

      contentLocale = dataAsString;
    };

    let interactionMapping = `{ [k: string]: TDBIInteractions<"${dbi.namespace}"> }`;
    if (dbi.data.interactions.size) {
      let interactionsStringed = dbi.data.interactions.map(inter => `"${inter.name}": ${inter.constructor.name}<"${dbi.namespace}">`);
      interactionMapping = `{\n      ${interactionsStringed.join(",\n      ")}\n    }`;
    };

    let eventNames = "string";
    if (dbi.data.events.size) {
      eventNames = `'${dbi.data.events.map(x => x.id ?? x.name).join("' | '")}'`
    };

    let localeNames = "string";
    if (dbi.data.locales.size) {
      localeNames = `'${dbi.data.locales.map(x => x.name).join("' | '")}'`
    }

    let clientNamespaces = "string";
    if (dbi.data?.clients?.length) {
      clientNamespaces = `'${dbi.data.clients.map(x => x.namespace).join("' | '")}'`
    }

    let customEvents = `{ }`;
    if (dbi.data.customEventNames.size) {
      const customEventsObject = {};
      dbi.data.customEventNames.forEach((value) => {
        customEventsObject[value] = dbi.data.eventMap[value];
      });

      customEvents = JSON.stringify(
        customEventsObject,
        (key, value) => {
          if (!["string"].includes(typeof value)) return value;
          return `'${value}'`;
        }, 2)
        .replace(/"([a-zA-ZğüşiöçĞÜŞİÖÇıİ_][a-zA-Z0-9ğüşiöçĞÜŞİÖÇıİ_]*)"((: {)|(: "([^"]|\\")*[^\\]"))/g, "$1$2")
        .replace(/\"'([^"]+)'\"/g, "$1")
        .replace(/\n/g, "\n    ")
    }

    const result =
      `  "${dbi.namespace}": {
    contentLocale: ${contentLocale};
    interactionMapping: ${interactionMapping};
    eventNames: ${eventNames};
    localeNames: ${localeNames};
    customEvents: ${customEvents};
    clientNamespaces: ${clientNamespaces};
  }`;
    namespaceDatas.push(result);
  });

  const interfaceStr = `export interface NamespaceData {
${namespaceDatas.join("\n\n")}
}`;

  const result = `import { DBILangObject, TDBILocaleString } from "@mostfeatured/dbi/src/types/other/Locale";
${[
      interfaceStr.includes("TDBIInteractions") ? 'import { TDBIInteractions } from "@mostfeatured/dbi/src/types/Interaction";' : "",
      interfaceStr.includes("DBIEvent") ? 'import { DBIEvent } from "@mostfeatured/dbi/src/types/Event";' : "",
      interfaceStr.includes("DBIChatInput") ? 'import { DBIChatInput } from "@mostfeatured/dbi/src/types/ChatInput/ChatInput";' : "",
      interfaceStr.includes("DBIUserContextMenu") ? 'import { DBIUserContextMenu } from "@mostfeatured/dbi/src/types/other/UserContextMenu";' : "",
      interfaceStr.includes("DBIMessageContextMenu") ? 'import { DBIMessageContextMenu } from "@mostfeatured/dbi/src/types/other/MessageContextMenu";' : "",
      interfaceStr.includes("DBIButton") ? 'import { DBIButton } from "@mostfeatured/dbi/src/types/Components/Button";' : "",
      interfaceStr.includes("DBIStringSelectMenu") ? 'import { DBIStringSelectMenu } from "@mostfeatured/dbi/src/types/Components/StringSelectMenu";' : "",
      interfaceStr.includes("DBIUserSelectMenu") ? 'import { DBIUserSelectMenu } from "@mostfeatured/dbi/src/types/Components/UserSelectMenu";' : "",
      interfaceStr.includes("DBIRoleSelectMenu") ? 'import { DBIRoleSelectMenu } from "@mostfeatured/dbi/src/types/Components/RoleSelectMenu";' : "",
      interfaceStr.includes("DBIChannelSelectMenu") ? 'import { DBIChannelSelectMenu } from "@mostfeatured/dbi/src/types/Components/StringChannelSelectMenu";' : "",
      interfaceStr.includes("DBIMentionableSelectMenu") ? 'import { DBIMentionableSelectMenu } from "@mostfeatured/dbi/src/types/Components/StringMentionableSelectMenu";' : "",
      interfaceStr.includes("DBIModal") ? 'import { DBIModal } from "@mostfeatured/dbi/src/types/Components/Modal";' : "",
      interfaceStr.includes("DBICustomEvent") ? 'import { DBICustomEvent } from "@mostfeatured/dbi/src/types/other/CustomEvent";' : ""
    ].filter(i => i).join("\n").replace(/\n(\s?\n\s?)*/g, "\n")}

${interfaceStr}


export type NamespaceEnums = keyof NamespaceData;
`.replace(/\n(\s)?\n+/g, "\n\n");

  fs.writeFileSync(namespaceDataLocation, "export * from '.dbi/namespaceData'");
  fs.mkdirSync(path.resolve(getNodeModulesPath(), "./.dbi"), { recursive: true });
  fs.writeFileSync(path.resolve(
    getNodeModulesPath(),
    "./.dbi/namespaceData.d.ts"
  ), result);

}

// get node_modules path from cwd
function getNodeModulesPath(depth = 0) {
  if (depth > 10) throw Error("node_modules not found!");
  const nodeModulesPath = path.resolve(process.cwd(), `./${Array(depth).fill("../").join("")}node_modules`);
  if (!fs.existsSync(nodeModulesPath)) return getNodeModulesPath(depth + 1);
  return nodeModulesPath;
}

function getPackageJson(depth = 0) {
  if (depth > 10) throw Error("package.json not found!");
  const packageJsonPath = path.resolve(process.cwd(), `./${Array(depth).fill("../").join("")}package.json`);
  if (!fs.existsSync(packageJsonPath)) return getPackageJson(depth + 1);
  return {
    path: packageJsonPath,
    data: JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
  };
}

if (module === require.main) {
  const { path: packageJsonPath, data: packageJson } = getPackageJson();
  if (!packageJson?.namespaceTypes?.sources || !packageJson?.namespaceTypes?.dbis) {
    console.log("Please configure namespaceTypes to your package.json!");
    packageJson.namespaceTypes = {
      sources: [],
      dbis: []
    }
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    process.exit(1);
  }

  const sources = packageJson.namespaceTypes.sources.map(i => path.resolve(path.dirname(packageJsonPath), i));
  const dbis = packageJson.namespaceTypes.dbis.map(i => path.resolve(path.dirname(packageJsonPath), i));

  [...sources, ...dbis].forEach(i => {
    if (!fs.existsSync(i)) throw Error(`Dbi or Source not found: ${i}`);
  });
  (async () => {

    for (const source of sources) {
      await recursiveImport(source, [".ts", ".ts"], [".d.ts"]);
    }

    const dbiInstances = dbis.map(i => require(i)?.dbi || require(i)?.default || require(i));

    dbiInstances.forEach(i => {
      if (!i?.namespace) throw Error(`Dbi instance has no namespace: ${i}`);
    });

    module.exports.setNamespaceDataTypes(...dbiInstances);
  })().catch((e) => {
    throw e;
  })
}