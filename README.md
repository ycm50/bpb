# scripts 目录说明

`scripts` 文件夹包含本项目的构建和资源处理脚本，主要包括如下两个文件：

## 1. build.js

- **用途**：自动化前端资源打包、压缩和混淆，最终生成可部署的 worker 文件及其压缩包。
- **主要流程**：
  - 读取 `src/assets` 目录下的 `index.html`、`style.css` 和 `script.js`，用正则替换合成单文件页面内容。
  - 使用 `terser` 对 JS 进行压缩，`html-minifier` 对 HTML 进行压缩。
  - 将处理后的 HTML 资源以字符串形式内嵌到 worker 构建逻辑中。
  - 通过 `esbuild` 打包 `src/worker.js`，并将上述资源注入构建产物。
  - 对打包后的 worker 代码再进行混淆（`javascript-obfuscator`）。
  - 将混淆后的代码写入 `dist/worker.js`，并使用 `jszip` 生成 `dist/worker.zip`。
  - 构建过程中会输出详细的进度提示。

## 2. cmbine.js

- **用途**：类似于 build.js，但生成的是未经过混淆和压缩的纯净 worker 文件，便于调试和后续处理。
- **主要流程**：
  - 资源处理与 `build.js` 基本一致，包括 HTML/JS 组合与压缩处理。
  - 使用 `esbuild` 打包 worker 文件，但**不进行混淆和二次压缩**，保留原始结构。
  - 输出未混淆版本的 `dist/worker.js`，便于后续分析。
  - 也会生成 zip 压缩包，但内容为未混淆代码。

## 使用方式

1. 安装依赖（如未安装）：
   ```bash
   git clone https://github.com/ycm50/bpb.git
   cd bpb
   ```
2. 执行打包脚本：
   ```bash
   # 生产环境构建（压缩+混淆）
   node scripts/build.js

   # 开发或调试用纯净构建
   node scripts/cmbine.js
   ```
3. 生成的文件位于 `dist/` 目录。

## 目录结构示例

```
scripts/
├── build.js     # 生产环境用，混淆压缩并打包
├── cmbine.js    # 调试用，纯净打包
└── README.md    # 本说明文件
```

如需扩展构建流程或有疑问，请参考脚本源码顶部注释或提交 Issue。
