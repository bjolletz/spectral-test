import nspell from 'https://cdn.skypack.dev/pin/nspell@v2.1.5-DeoPrrm6QtcGrVjDyngP/mode=imports,min/optimized/nspell.js';
import { fetch } from '@stoplight/spectral-runtime';
import { createRulesetFunction } from '@stoplight/spectral-core';

function fetchAsset(lang, ext) {
  return fetch(`https://unpkg.com/dictionary-${lang}/index.${ext}`).then(r => r.text());
}

const instances = new Map();

async function createSpellChecker(lang) {
  const instance = instances.get(lang);

  if (instance !== void 0) return instance;

  const [aff, dic] = await Promise.all([fetchAsset(lang, 'aff'), fetchAsset(lang, 'dic')]);

  const spell = nspell({ aff, dic });
  instances.set(lang, spell);
  return spell;
}

function printSuggested(suggested) {
  return suggested.map(JSON.stringify).join(' or ');
}

export default createRulesetFunction(
  {
    input: {
      type: "string"
    },
    options: {
      type: "object",
      additionalProperties: false,

      properties: {
        lang: {
          type: "string",

          enum: [
            "bg",
            "br",
            "ca",
            "ca-valencia",
            "cs",
            "cy",
            "da",
            "de",
            "de-at",
            "de-ch",
            "el",
            "el-polyton",
            "en",
            "en-au",
            "en-ca",
            "en-gb",
            "en-za",
            "eo",
            "es",
            "es-ar",
            "es-bo",
            "es-cl",
            "es-co",
            "es-cr",
            "es-cu",
            "es-do",
            "es-ec",
            "es-gt",
            "es-hn",
            "es-mx",
            "es-ni",
            "es-pa",
            "es-pe",
            "es-ph",
            "es-pr",
            "es-py",
            "es-sv",
            "es-us",
            "es-uy",
            "es-ve",
            "et",
            "eu",
            "fa",
            "fo",
            "fr",
            "fur",
            "fy",
            "ga",
            "gd",
            "gl",
            "he",
            "hr",
            "hu",
            "hy",
            "hyw",
            "ia",
            "ie",
            "is",
            "it",
            "ka",
            "ko",
            "la",
            "lb",
            "lt",
            "ltg",
            "lv",
            "mk",
            "mn",
            "nb",
            "nds",
            "ne",
            "nl",
            "nn",
            "oc",
            "pl",
            "pt",
            "pt-pt",
            "ro",
            "ru",
            "rw",
            "sk",
            "sl",
            "sr",
            "sr-latn",
            "sv",
            "sv-fi",
            "tk",
            "tlh",
            "tlh-latn",
            "tr",
            "uk",
            "vi"
          ]
        },

        ignoreWords: {
          type: "array",

          items: {
            type: "string",
            minLength: 1
          }
        }
      },

      required: ["lang"]
    },
  },
  async function spell_check(input, opts, ctx) {
    try {
      const checker = await createSpellChecker(opts.lang);
      const results = [];

      if(typeof opts.ignoreWords != 'undefined'){
        opts.ignoreWords.forEach(item => checker.add(item));       
      }
      
      for (const word of input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g," ").replace(/[0-9]/g," ").split(/\s+/)) {
        if(word.length > 1) {
          if (!checker.correct(word)) {
            const suggested = checker.suggest(word);
            results.push({
              message: (suggested.length > 0) ? `"${word}" is misspelled. Did you mean ${printSuggested(suggested)}?` :`"${word}" is misspelled.` ,
              path: ctx.path
            });
          }
        }
      }

      return results;
    } catch (ex) {
      return [
        {
          message: ex instanceof Error ? ex.message : String(ex)
        },
      ];
    }
  },
);