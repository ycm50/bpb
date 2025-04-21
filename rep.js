const fs = require('fs');
const path = require('path');

const inputDir = path.resolve(__dirname, 'src');
const outputDir = path.resolve(__dirname, 'aaa');

// 遍历目录获取所有 .js 文件
function getAllJsFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getAllJsFiles(fullPath, files);
        } else if (entry.isFile() && fullPath.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    return files;
}

// 创建输出目录
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

// 替换内容并保存文件
function replaceAndSave(inputFile, outputFile) {
    ensureDirectoryExistence(outputFile);
    const content = fs.readFileSync(inputFile, 'utf-8');
    const modifiedContent = content.replace(/\.bpb\./g, '.bn1.');
    fs.writeFileSync(outputFile, modifiedContent, 'utf-8');
}

// 主函数
function main() {
    const jsFiles = getAllJsFiles(inputDir);
    jsFiles.forEach(file => {
        const relativePath = path.relative(inputDir, file);
        const outputFilePath = path.join(outputDir, relativePath);
        replaceAndSave(file, outputFilePath);
    });
    console.log(`替换完成，文件已存储到 ${outputDir}`);
}

main();
