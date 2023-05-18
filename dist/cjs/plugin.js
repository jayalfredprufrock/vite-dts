"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dts = void 0;
const load_json_file_1 = __importDefault(require("load-json-file"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dts = () => {
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
            const pkg = await (0, load_json_file_1.default)(path.join(config.root, 'package.json'));
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
exports.dts = dts;
exports.default = exports.dts;
//# sourceMappingURL=plugin.js.map