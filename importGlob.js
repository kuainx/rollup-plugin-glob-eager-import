import path from 'path';
import glob from 'fast-glob';

function lexGlobPattern(code, pos) {
  let state = 0;
  let pattern = '';
  let i = code.indexOf(`(`, pos) + 1;
  outer: for (; i < code.length; i++) {
    const char = code.charAt(i);
    switch (state) {
      case 0:
        if (char === `'`) {
          state = 1;
        } else if (char === `"`) {
          state = 2;
        } else if (char === '`') {
          state = 4;
        } else if (/\s/.test(char)) {
          continue;
        } else {
          error(i);
        }
        break;
      case 1:
        if (char === `'`) {
          break outer;
        } else {
          pattern += char;
        }
        break;
      case 2:
        if (char === `"`) {
          break outer;
        } else {
          pattern += char;
        }
        break;
      case 4:
        if (char === '`') {
          break outer;
        } else {
          pattern += char;
        }
        break;
      default:
        throw new Error('unknown import.meta.glob lexer state');
    }
  }
  return [pattern, code.indexOf(`)`, i) + 1];
}

export async function transformImportGlob(source, pos, importer, importIndex) {
  const err = msg => {
    const e = new Error(`Invalid glob import syntax: ${msg}`);
    e.pos = pos;
    return e;
  };

  const importerBasename = path.basename(importer);

  let [pattern, endIndex] = lexGlobPattern(source, pos);
  if (!pattern.startsWith('.')) {
    throw err(`pattern must start with "." (relative to project root)`);
  }
  let base;
  let parentDepth = 0;
  base = path.dirname(importer);
  while (pattern.startsWith('../')) {
    pattern = pattern.slice(3);
    base = path.resolve(base, '../');
    parentDepth++;
  }
  if (pattern.startsWith('./')) {
    pattern = pattern.slice(2);
  }

  const files = glob.sync(pattern, {
    cwd: base,
    ignore: ['**/node_modules/**'],
  });
  const imports = [];
  let importsString = ``;
  let entries = ``;
  for (let i = 0; i < files.length; i++) {
    // skip importer itself
    if (files[i] === importerBasename) continue;
    const file = parentDepth ? `${'../'.repeat(parentDepth)}${files[i]}` : `./${files[i]}`;
    let importee = file;
    imports.push(importee);
    const identifier = `__glob_${importIndex}_${i}`;
    importsString += `import * as ${identifier} from ${JSON.stringify(importee)};`;
    entries += ` ${JSON.stringify(file)}: ${identifier},`;
  }

  return {
    imports,
    importsString,
    exp: `{${entries}}`,
    endIndex,
    pattern,
    base,
  };
}
