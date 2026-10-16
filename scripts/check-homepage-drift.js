import { execSync } from 'node:child_process';

// Guarda de drift da homepage institucional: o deploy (Railway) só COPIA
// public/homepage; quem recompila a partir de homepage-src é o humano. Este
// check falha se existe commit tocando homepage-src DEPOIS do último commit que
// tocou public/homepage — ou seja, fonte mudou e o bundle commitado ficou velho.
// Âncora pelo grafo de commits: qualquer commit em <out>..HEAD tocando o fonte é
// por definição só-fonte (se tocasse public/homepage, moveria a âncora), então
// não há falso positivo.
const SRC_DIR = 'homepage-src';
const OUT_DIR = 'public/homepage';

const git = (args) => {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error(`Falha ao rodar "git ${args}": ${err.message}`);
    process.exit(2);
  }
};

// HEAD só existe se já houve commit; em repo vazio não há o que verificar.
if (!git('rev-parse --verify HEAD')) {
  console.log('homepage-drift: sem histórico de commits, nada a verificar.');
  process.exit(0);
}

const lastOut = git(`log -1 --format=%H -- ${OUT_DIR}`);
if (!lastOut) {
  console.log(`homepage-drift: nenhum commit toca ${OUT_DIR}; pulando.`);
  process.exit(0);
}

const offending = git(`log --format=%h%x09%cs%x09%s ${lastOut}..HEAD -- ${SRC_DIR}`);

if (!offending) {
  console.log(
    `homepage-drift: OK — ${OUT_DIR} está sincronizado com ${SRC_DIR} ` +
    `(âncora ${lastOut.slice(0, 7)}).`
  );
  process.exit(0);
}

const commits = offending.split('\n').filter(Boolean);
console.error('homepage-drift: DRIFT detectado.\n');
console.error(
  `Os commits abaixo mudaram ${SRC_DIR} após o último rebuild de ${OUT_DIR} ` +
  `(${lastOut.slice(0, 7)}), mas não atualizaram o bundle commitado:`
);
for (const line of commits) {
  const [hash, date, ...rest] = line.split('\t');
  console.error(`  ${hash}  ${date}  ${rest.join('\t')}`);
}
console.error('\nO deploy vai servir a homepage VELHA. Para corrigir:');
console.error(`  1. Refaça o build da home a partir de ${SRC_DIR} (build manual — ver README "Como editar a Homepage").`);
console.error(`  2. Commite a saída em ${OUT_DIR}.`);
console.error('  3. Push de novo.');
process.exit(1);
