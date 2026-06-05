const fs = require('fs');
const path = require('path');

function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function compareKeys(baseKeys, compareKeys, fileName) {
  const missing = baseKeys.filter(key => !compareKeys.includes(key));
  const extra = compareKeys.filter(key => !baseKeys.includes(key));
  
  return {
    missing,
    extra,
    fileName
  };
}

const localesDir = path.join(__dirname, '../client/src/locales');
const files = ['pt.json', 'en.json', 'es.json', 'fr.json'];

const data = {};
files.forEach(file => {
  const filePath = path.join(localesDir, file);
  data[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
});

const ptKeys = getAllKeys(data['pt.json']).sort();
const enKeys = getAllKeys(data['en.json']).sort();
const esKeys = getAllKeys(data['es.json']).sort();
const frKeys = getAllKeys(data['fr.json']).sort();

console.log('\n=== COMPARAÇÃO DE CHAVES i18n ===\n');
console.log(`Português (base): ${ptKeys.length} chaves`);
console.log(`Inglês: ${enKeys.length} chaves`);
console.log(`Espanhol: ${esKeys.length} chaves`);
console.log(`Francês: ${frKeys.length} chaves\n`);

const enComparison = compareKeys(ptKeys, enKeys, 'en.json');
const esComparison = compareKeys(ptKeys, esKeys, 'es.json');
const frComparison = compareKeys(ptKeys, frKeys, 'fr.json');

[enComparison, esComparison, frComparison].forEach(comp => {
  if (comp.missing.length > 0 || comp.extra.length > 0) {
    console.log(`\n--- ${comp.fileName} ---`);
    if (comp.missing.length > 0) {
      console.log(`Faltando (${comp.missing.length}):`);
      comp.missing.forEach(key => console.log(`  - ${key}`));
    }
    if (comp.extra.length > 0) {
      console.log(`Extras (${comp.extra.length}):`);
      comp.extra.forEach(key => console.log(`  - ${key}`));
    }
  } else {
    console.log(`✓ ${comp.fileName} está completo`);
  }
});

console.log('\n=== FIM ===\n');
