import { rollup } from 'rollup';
import { dynamicImport } from '../index.js';
const build = async () => {
  const bundle = await rollup({
    input: './test/source/index.js',
    plugins: [dynamicImport()],
  });
  const { output } = await bundle.generate({ format: 'es' });
  console.log(output[0].code);
};
build().catch(e => {
  console.log(e);
});
