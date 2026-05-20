# Unbot — AI Text Humanizer

> 让 AI 文本更像真人聊天

自动去除 AI 生成的「值得注意的是」、「综上所述」、「从技术角度来看」等套话，让文本更自然。支持中英文。

**在线体验：[wechat.limw.top](https://wechat.limw.top)**

## 功能

- **Web 编辑器** — 粘贴文本，实时预览 Before/After
- **Chrome 扩展** — 选中网页文本 → 右键 → 一键优化
- **CLI 工具** — 15KB 单文件，可嵌入其他项目
- **10 类规则引擎** — 中文 6 类 + 英文 5 类，支持单独开关
- **短句重排** — 控制每段字数和行数
- **纯浏览器端处理** — 文本不上传服务器

## 快速开始

### Web

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### CLI

```bash
# 安装
npm install -g @unbot/cli

# 使用
echo "值得注意的是，今日市场表现强劲。" | unbot

# JSON 模式
echo "It is worth noting that..." | unbot --json

# 文件输入
unbot -f input.txt -o output.txt

# 自定义配置
unbot -f input.txt -c config.json
```

### Chrome 扩展

1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 加载已解压的扩展 → 选择 `chrome-extension/` 目录

### 构建独立 CLI

```bash
npm run build:cli
# 输出 cli/dist/unbot.js (15KB, 零依赖)
```

## 架构

```
输入文本 → Parser → Humanizer Pipeline → Renderer → 输出

Parser       — 按空行分割段落区块
Humanizer    — 10 类正则规则引擎，支持分类开关
  ├── 免责套话 (值得注意的是, It is worth noting that)
  ├── 冗余总结 (基于以上分析, In conclusion)
  ├── 过渡套话 (首先, First of all)
  ├── 视角套话 (从技术角度来看, From a perspective)
  ├── 填充套话 (在一定程度上, Generally speaking)
  └── Shortener (断句 + 缩句 + 去重)
Renderer     — 微信友好格式（段落间距、缩进、对齐）
```

## npm Packages

| Package | Description |
|---------|-------------|
| `@unbot/core` | AI 文本润色核心库 |
| `@unbot/cli` | 命令行工具（命令: `unbot`） |

## Tech Stack

- **框架**: Next.js 15 / React 19 / TypeScript
- **样式**: TailwindCSS 4 / shadcn/ui
- **扩展**: Chrome Extension MV3
- **CLI**: esbuild (15KB standalone CJS)
- **测试**: Vitest (70+ E2E tests)

## License

MIT
