# LocaleTypeGen
Patches dbi types for you to have auto complate while using locale.

## Example
```js
const { createDBI } = require("@mostfeatured/dbi");
const { setLocaleTypes } = require("@mostfeatured/locale-types");

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

  await setLocaleTypes(dbi.data.locales.get("tr"));

})();```