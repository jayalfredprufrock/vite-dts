import loadJSON from 'load-json-file';
import * as path from 'path';
import * as fs from 'fs';
export default function dts() {
    let dtsModule;
    let esModulePath;
    let cjsModulePath;
    return {
        name: 'vite:dts',
        apply: 'build',
        async configResolved(config) {
            const { logger } = config;
            const { outDir } = config.build;
            const { entry, formats = ['es'] } = config.build.lib || {};
            if (!entry) {
                return logger.warn(`[vite-dts] Expected "build.lib.entry" to exist in vite config`);
            }
            const pkg = await loadJSON(path.join(config.root, 'package.json'));
            if (!pkg.main && formats.includes('cjs')) {
                return logger.warn(`[vite-dts] Expected "main" to exist in package.json`);
            }
            if (!pkg.module && formats.includes('es')) {
                return logger.warn(`[vite-dts] Expected "module" to exist in package.json`);
            }
            const entryPath = path.resolve(config.root, entry);
            const entryImportPath = path.relative(path.resolve(config.root, outDir), entryPath.replace(/\.tsx?$/, ''));
            const posixEntryImportPath = entryImportPath.split(path.sep).join(path.posix.sep);
            const entryImpl = fs.readFileSync(entryPath, 'utf8');
            const hasDefaultExport = /^(export default |export \{[^}]+? as default\s*[,}])/m.test(entryImpl);
            dtsModule =
                `export * from "${posixEntryImportPath}"` +
                    (hasDefaultExport ? `\nexport {default} from "${posixEntryImportPath}"` : ``);
            cjsModulePath = path.relative(outDir, pkg.main);
            esModulePath = path.relative(outDir, pkg.module);
        },
        generateBundle({ entryFileNames }) {
            if (entryFileNames == cjsModulePath) {
                this.emitFile({
                    type: 'asset',
                    fileName: cjsModulePath.replace(/\.js$/, '.d.ts'),
                    source: dtsModule,
                });
            }
            else if (entryFileNames == esModulePath) {
                this.emitFile({
                    type: 'asset',
                    fileName: esModulePath.replace(/\.js$/, '.d.ts'),
                    source: dtsModule,
                });
            }
        }
    };
}
//# sourceMappingURL=plugin.js.map