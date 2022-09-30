# NamespaceTypes
Patches dbi types for you to have auto complate while using locale.

## Example
```js
const { createDBI } = require("@mostfeatured/dbi");
const { setNamespaceDataTypes } =require("@mostfeatured/namespace-types");

const dbi = createDBI("dbi_namespace", {
  discord: {
    token: "Your Token Here",
    options: {
      intents: ["Guilds"]
    }
  }
});


dbi.register(({ Locale, ChatInput }) => {

  Locale({
    name: "tr",
    data: {
      erdem: {
        isim: "Erdem",
      },
      türk: "Türk",
    }
  });

  ChatInput({
    name: "test",
    description: "locale test",
    onExecute({ locale }) {
      locale.user.data.erdem.isim();
    }
  })
  
});

(async () => {

  await dbi.load();

  setNamespaceDataTypes(dbi);
  console.log("done")
})();
```
