import MagicString from 'magic-string';
import { init, parse as parseImports } from 'es-module-lexer';
import { transformImportGlob } from './importGlob.js';

export const dynamicImport = () => {
  return {
    name: 'plugin-dynamic-import',

    async transform(source, importer) {
      if (!source.includes('import.meta.globEager')) {
        return;
      }

      await init;
      let imports = [];
      try {
        imports = parseImports(source)[0];
      } catch (e) {
        this.error(e, e.idx);
      }
      if (!imports.length) {
        return null;
      }

      let s;
      const str = () => s || (s = new MagicString(source));

      for (let index = 0; index < imports.length; index++) {
        const { s: start, e: end, ss: expStart } = imports[index];
        const isGlob = source.slice(start, end) === 'import.meta' && source.slice(end, end + 10) === '.globEager';
        if (isGlob) {
          const { importsString, exp, endIndex } = await transformImportGlob(source, start, importer, index);
          str().prepend(importsString);
          str().overwrite(expStart, endIndex, exp);
          continue;
        }
      }

      if (s) {
        return { code: s.toString() };
      }
    },
  };
};
