const PARTICULAS_MINUSCULAS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

// "JOAO DA SILVA" -> "Joao da Silva"; "ana-maria" -> "Ana-Maria"
export function normalizePersonName(value: string): string {
  const compact = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!compact) return '';

  return compact
    .split(' ')
    .map((word, index) => {
      const lower = word.toLocaleLowerCase('pt-BR');
      if (index > 0 && PARTICULAS_MINUSCULAS.has(lower)) return lower;
      return lower.replace(
        /(^|[-'’])(\p{L})/gu,
        (_match, separator: string, letter: string) =>
          separator + letter.toLocaleUpperCase('pt-BR')
      );
    })
    .join(' ');
}
