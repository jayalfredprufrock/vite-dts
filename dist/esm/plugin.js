import loadJSON from 'load-json-file';
import * as path from 'path';
import * as fs from 'fs';
export const dts = () => {
    const plugin = {
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
            const cjsModulePath = path.relative(outDir, pkg.main);
            const esModulePath = path.relative(outDir, pkg.module);
            const entryPaths = typeof entry === 'object'
                ? Array.isArray(entry)
                    ? entry
                    : Object.values(entry)
                : [entry];
            const dtsModule = [];
            for (const entryPath of entryPaths) {
                const resolvedEntryPath = path.resolve(config.root, entryPath);
                const entryImportPath = path.relative(path.resolve(config.root, outDir), resolvedEntryPath.replace(/\.tsx?$/, ''));
                const posixEntryImportPath = entryImportPath
                    .split(path.sep)
                    .join(path.posix.sep);
                const entryImpl = fs.readFileSync(resolvedEntryPath, 'utf8');
                const hasDefaultExport = /^(export default |export \{[^}]+? as default\s*[,}])/m.test(entryImpl);
                dtsModule.push(`export * from "${posixEntryImportPath}"`);
                if (hasDefaultExport) {
                    dtsModule.push(`export {default} from "${posixEntryImportPath}"`);
                }
            }
            const source = dtsModule.join('\n');
            plugin.generateBundle = function (_, assets) {
                const assetValues = Object.values(assets);
                assetValues.map(({ fileName }) => {
                    if (fileName === cjsModulePath) {
                        const { name } = path.parse(cjsModulePath);
                        this.emitFile({
                            type: 'asset',
                            fileName: `${name}.d.ts`,
                            source,
                        });
                    }
                    else if (fileName === esModulePath) {
                        const { name } = path.parse(esModulePath);
                        this.emitFile({
                            type: 'asset',
                            fileName: `${name}.d.ts`,
                            source,
                        });
                    }
                });
            };
        },
    };
    return plugin;
};
export default dts;
//# sourceMappingURL=plugin.js.map