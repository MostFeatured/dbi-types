const path = require("path")
const fs = require("fs");
const { generatedPath } = require("@mostfeatured/dbi");
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
          let argLength = Math.max(...temp1.map(i=>i[0]));
          argLength = argLength == -Infinity ? 0 : argLength+1;
          
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

const result = `import { DBILangObject, TDBILocaleString } from "../src/types/Locale";
${[
  interfaceStr.includes("TDBIInteractions") ? 'import { TDBIInteractions } from "../src/types/Interaction";' : "",
  interfaceStr.includes("DBIEvent") ? 'import { DBIEvent } from "../src/types/Event";' : "",
  interfaceStr.includes("DBIChatInput") ? 'import { DBIChatInput } from "../src/types/ChatInput/ChatInput";' : "",
  interfaceStr.includes("DBIUserContextMenu") ? 'import { DBIUserContextMenu } from "../src/types/UserContextMenu";' : "",
  interfaceStr.includes("DBIMessageContextMenu") ? 'import { DBIMessageContextMenu } from "../src/types/MessageContextMenu";' : "",
  interfaceStr.includes("DBIButton") ? 'import { DBIButton } from "../src/types/Button";' : "",
  interfaceStr.includes("DBISelectMenu") ? 'import { DBISelectMenu } from "../src/types/SelectMenu";' : "",
  interfaceStr.includes("DBIModal") ? 'import { DBIModal } from "../src/types/Modal";' : "",
  interfaceStr.includes("DBICustomEvent") ? 'import { DBICustomEvent } from "../src/types/CustomEvent";' : ""
].filter(i=>i).join("\n").replace(/\n(\s?\n\s?)*/g, "\n")}

${interfaceStr}


export type NamespaceEnums = keyof NamespaceData;
`.replace(/\n(\s)?\n+/g, "\n\n");
  fs.writeFileSync(namespaceDataLocation, result);
}

