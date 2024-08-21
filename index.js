const path = require("path")
const fs = require("fs");
const { generatedPath } = require("@mostfeatured/dbi");
const namespaceDataLocation = path.resolve(generatedPath, "./namespaceData.d.ts");

function buildKeyString(key) {
  if (key.includes(" ")) return JSON.stringify(key);
  return key;
}

function buildSpaceString(space) {
  return Array(space).fill(" ").join("")
}

const LOCALE_ARG_REGEX = /\{(\d+)(;[^}]+)?\}/g;
const PUNCTUATION_REGEX = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;

const imports = [
  {
    import: ["DBILangObject", "TDBILocaleString"],
    from: "../src/types/other/Locale"
  },
  {
    import: ["TDBIInteractions"],
    from: "../src/types/Interaction"
  },
  {
    import: ["DBIEvent"],
    from: "../src/types/Event"
  },
  {
    import: ["DBIChatInput"],
    from: "../src/types/ChatInput/ChatInput"
  },
  {
    import: ["DBIUserContextMenu"],
    from: "../src/types/other/UserContextMenu"
  },
  {
    import: ["DBIMessageContextMenu"],
    from: "../src/types/other/MessageContextMenu"
  },
  {
    import: ["DBIButton"],
    from: "../src/types/Components/Button"
  },
  {
    import: ["DBIChannelSelectMenu"],
    from: "../src/types/Components/ChannelSelectMenu"
  },
  {
    import: ["DBIRoleSelectMenu"],
    from: "../src/types/Components/RoleSelectMenu"
  },
  {
    import: ["DBIStringSelectMenu"],
    from: "../src/types/Components/StringSelectMenu"
  },
  {
    import: ["DBIModal"],
    from: "../src/types/Components/Modal"
  },
  {
    import: ["DBICustomEvent"],
    from: "../src/types/other/CustomEvent"
  }
]

/**
 * @param  {import("@mostfeatured/dbi/dist/DBI").DBI[]} dbis
 * @param  {{ outPath: string }} arg1
 */
function generateTypes(dbis, { outPath } = {}) {

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
    const exampleLocale = dbi.data.locales.get(dbi.config.defaults.locale) || dbi.data.locales.first();

    let contentLocale = "DBILangObject";

    if (exampleLocale) {
      function buildString(data, depth = 0) {
        let entries = Object.entries(data);
        let outStr = "{\n";
        entries.forEach(([key, value]) => {
          if (typeof value !== "string" && typeof value !== "function") {
            outStr += `${buildSpaceString(depth + 2)}${buildKeyString(key)}: ${buildString(value, depth + 1)};\n`;
            return;
          }

          let valueStr = typeof value == "function" ? value() : value;
          let matches = [...(valueStr.matchAll(LOCALE_ARG_REGEX) || [])].map(i => [Number(i[1]), i?.[2]?.slice?.(1)]);
          let argLength = Math.max(...matches.map(i => i[0]));
          argLength = argLength == -Infinity ? 0 : argLength + 1;

          let argNames = Array(argLength || 0).fill("").map((_, i) => matches.find(j => j[0] === i && j[1])?.[1] || `arg${i}`);
          let spacing = buildSpaceString(depth + 2);
          outStr += [
            `/**\n`,
            `  ${valueStr.replace(LOCALE_ARG_REGEX, (_, idx, name) => `{${(name ? name.slice(1) : "") || idx}}`).replace(PUNCTUATION_REGEX, (v) => `\\${v}`).split("\n").join("\n\n")}\n`,
            `*/\n`,
            `${buildKeyString(key)}: (${argNames.map(i => `${i}: any`).join(", ")}) => string\n`,
          ].map(i => spacing + i).join("");
        });
        outStr += `${buildSpaceString(depth)}}`;
        return outStr;
      }

      contentLocale = buildString(exampleLocale._data || exampleLocale, 2);
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



  const result = `${imports.filter(i => i.import.some(j => interfaceStr.includes(j))).map(i => `import { ${i.import.join(", ")} } from "${i.from}";`).join("\n")}

${interfaceStr}

export type NamespaceEnums = keyof NamespaceData;
`.replace(/\n(\s)?\n+/g, "\n\n");
  fs.writeFileSync(outPath || namespaceDataLocation, result);
}

module.exports = {
  generateTypes
};