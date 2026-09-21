import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const nativeRequire = createRequire(import.meta.url);

/** Run real route/domain code; substitute only explicit infrastructure boundaries. */
export function loadRoute(entry, stubs) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} }; cache.set(file, loadedModule);
    const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(source, {
      module: loadedModule, exports: loadedModule.exports, Buffer, Blob, Request, Response, URL, console, process,
      require(name) {
        if (name in stubs) return stubs[name];
        if (name === 'server-only') return {};
        if (name.startsWith('@/') || name.startsWith('.')) {
          let path = name.startsWith('@/') ? resolve(name.slice(2)) : resolve(dirname(file), name);
          if (!existsSync(path)) path += '.ts';
          return load(path);
        }
        return nativeRequire(name);
      },
    }, { filename: file });
    return loadedModule.exports;
  }
  return load(resolve(entry));
}
