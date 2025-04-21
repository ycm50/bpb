import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname as pathDirname } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { sync } from 'glob';
import { minify as htmlMinify } from 'html-minifier';
import { minify as jsMinify } from 'terser'; // 恢复这行导入
import JSZip from "jszip"; // 添加这行导入

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

const ASSET_PATH = join(__dirname, '../src/assets');
const DIST_PATH = join(__dirname, '../dist/');

async function processHtmlPages() {
    const indexFiles = sync('**/index.html', { cwd: ASSET_PATH });
    const result = {};

    for (const relativeIndexPath of indexFiles) {
        const dir = pathDirname(relativeIndexPath);
        const base = (file) => join(ASSET_PATH, dir, file);

        const indexHtml = readFileSync(base('index.html'), 'utf8');
        const styleCode = readFileSync(base('style.css'), 'utf8');
        const scriptCode = readFileSync(base('script.js'), 'utf8');

        // 保留必要的JS压缩（原逻辑需要）
        const finalScriptCode = await jsMinify(scriptCode);
        const finalHtml = indexHtml
            .replace(/__STYLE__/g, `<style>${styleCode}</style>`)
            .replace(/__SCRIPT__/g, finalScriptCode.code);

        const minifiedHtml = htmlMinify(finalHtml, {
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            minifyCSS: true
        });

        result[dir] = JSON.stringify(minifiedHtml);
    }

    console.log('✅ Assets bundled successfully!');
    return result;
}

async function createDistribution() {
    const htmls = await processHtmlPages();
    const faviconBuffer = readFileSync(join(__dirname, '../src/assets/favicon.ico'));
    const faviconBase64 = faviconBuffer.toString('base64');

    // 仅保留esbuild打包逻辑
    const code = await build({
        entryPoints: [join(__dirname, '../src/worker.js')],
        bundle: true,
        format: 'esm',
        write: false,
        external: ['cloudflare:sockets'],
        platform: 'node',
        define: {
            __PANEL_HTML_CONTENT__: htmls['panel'] ?? '""',
            __LOGIN_HTML_CONTENT__: htmls['login'] ?? '""',
            __ERROR_HTML_CONTENT__: htmls['error'] ?? '""',
            __SECRETS_HTML_CONTENT__: htmls['secrets'] ?? '""',
            __ICON__: JSON.stringify(faviconBase64)
        }
    });

    console.log('✅ Worker built successfully!');

    // 删除压缩和混淆相关代码
    mkdirSync(DIST_PATH, { recursive: true });
    
    // 直接写入未混淆的代码
    writeFileSync(join(DIST_PATH, 'worker.js'), code.outputFiles[0].text, 'utf8');

    // 可选保留ZIP打包（不含混淆）
    const zip = new JSZip(); // 确保此处已正确引用
    zip.file('_worker.js', code.outputFiles[0].text);
    zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    }).then(nodebuffer => writeFileSync(join(DIST_PATH, 'worker.zip'), nodebuffer));

    console.log('✅ Clean build files published!');
}

createDistribution().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});