# NewConceptEnglish 新概念英语学习网站

一个纯静态的新概念英语（New Concept English）学习网站：按课浏览英文原文、中文翻译和生词表，支持课文搜索。
无需框架、无需依赖，`lessons/*.md` 是唯一内容源，构建后生成按册划分的数据文件供网页读取。

- **仓库**：https://github.com/Aasukammr/mywebsite
- **部署**：Vercel（关联 GitHub 仓库，推送 `main` 即自动发布）
- **线上内容**：第二册 96 课、第三册 60 课

---

## 给 AI / 新人的 5 条关键信息

1. **内容都在 `lessons/` 下的 Markdown**，文件名即课程 ID（如 `3-001.md`），前缀数字代表册号。
2. **改完 Markdown 必须运行 `npm run build`**，它会重新生成 `data/nce2.js`、`data/nce3.js` 等，网页只读这些 JS。
3. **`data/*.js` 是生成产物，但要提交到 Git**（Vercel 直接当静态文件托管，不做构建）。
4. 网页用 `window.NCE_BOOK` 决定读哪一册的数据（`window.__NCE2`、`window.__NCE3` …），逻辑统一在 `main.js`。
5. 只有两个 npm script：`npm run build`；项目没有任何第三方依赖，不要随意引入。

---

## 目录结构

```
mywebsite/
├── index.html          # 首页：栏目介绍 + 各册入口
├── nce-2.html          # 第二册页面（window.NCE_BOOK = 2）
├── nce-3.html          # 第三册页面（window.NCE_BOOK = 3）
├── main.js             # 所有册共用的渲染逻辑（目录、搜索、课文渲染、hash 路由）
├── style.css           # 全站样式（含移动端适配）
├── favicon.svg
├── vercel.json         # {"outputDirectory": "."}，纯静态托管
├── package.json        # 只有 build 脚本
├── scripts/
│   └── build.js        # Markdown → data/nceN.js 构建脚本（Node，无依赖）
├── lessons/            # 课程内容（唯一内容源）
│   ├── 2-001.md ... 2-096.md   # 第二册
│   └── 3-001.md ... 3-060.md   # 第三册
└── data/               # 构建产物（提交进仓库）
    ├── nce2.js         # window.__NCE2 = [ ... ]
    └── nce3.js         # window.__NCE3 = [ ... ]
```

---

## 数据流

```
lessons/3-001.md
        │  npm run build  (scripts/build.js)
        ▼
data/nce3.js   →   <script src="data/nce3.js">  →  window.__NCE3
                                                        │
nce-3.html（window.NCE_BOOK = 3） + main.js  ──────────┘
        │
        ▼
渲染侧边目录、下拉选择、课文（英文/中文/单词）
```

---

## 课程 Markdown 格式

每个文件由「front matter + 三个二级标题区块」组成，示例：

```markdown
---
title: A puma at large
titleCn: 逃遁的美洲狮
---

## English

Pumas are large, cat-like animals which are found in America. ...

The hunt for the puma began in a small village ...（段落之间空一行）

## 中文

美洲狮是一种体形似猫的大动物，产于美洲。...

## 单词

| 英文 | 中文 |
|------|------|
| puma | n. 美洲狮 |
| spot | v. 看出，发现 |
```

规则（由 `scripts/build.js` 解析）：

- **front matter** 必须有 `title`（英文标题）和 `titleCn`（中文标题）。
- 区块标题大小写/别名：
  - `## English` → 英文原文（只识别 `english`）
  - `## 中文` 或 `## Chinese` → 中文翻译
  - `## 单词` 或 `## Words` / `## Vocabulary` → 生词表
- **英文/中文段落**：用空行分段，网页按 `\n\n` 拆成 `<p>`；段内可用 `**加粗**`、`*斜体*`。
- **生词表**：Markdown 表格，两列；`| 英文 | 中文 |` 为表头（会被跳过），分隔行含 `---` 的行也会被跳过。中文列建议带词性，如 `n. 电梯`、`adj. 微小的`。
- 文件编码 UTF-8，行尾统一 **LF**（脚本会兼容 CRLF，但请勿引入）。

### 课程 ID 与册号

- ID = 文件名去掉 `.md`，格式 `册号-三位课号`，例如 `3-042`。
- 册号前缀（`1-` `2-` `3-` `4-`）对应 `build.js` 里的 `books = ['1','2','3','4']`。
- 页面上显示的课号会去掉前导零：`3-001` → `Lesson 1`。

---

## 前端约定（main.js）

- 页面在加载数据前设置册号：
  ```html
  <script>window.NCE_BOOK = 3;</script>
  <script src="data/nce3.js"></script>
  <script src="main.js"></script>
  ```
- `main.js` 读取 `window['__NCE' + book]`，所有册共用同一套逻辑；找不到数据时显示空状态提示。
- 交互：
  - 侧边栏点击课文 → `loadLesson(id)`，URL 变为 `#3-001`（`history.replaceState`）。
  - 顶部输入框实时过滤：匹配英文标题、中文标题、生词（英文/中文均大小写不敏感的部分匹配）；有结果时自动跳到第一条。
  - 移动端（<767px）隐藏侧边栏列表，显示 `<select>` 下拉。
- 渲染结构：`.lesson-article > .lesson-header(h2 + .lesson-subtitle) + .lesson-english + .lesson-chinese + .lesson-words`。
- 相关 CSS 类：`.page-layout`、`.sidebar`、`.lesson-link`、`.lesson-num`、`.word-card`、`.empty-state` 等（见 `style.css`）。

---

## 常用操作

### 本地预览

```bash
# 方式一：直接双击 index.html（脚本用 <script> 加载，file:// 也能跑）
# 方式二：起一个静态服务器
python -m http.server 8000     # 打开 http://localhost:8000
npx serve .                    # 或任意静态服务器
```

### 新增一节课文

1. 新建 `lessons/3-061.md`，按上面的格式写内容。
2. `npm run build`（会显示 `Book 3: 61 lessons → data/nce3.js`）。
3. 本地预览确认，然后把 `.md` 和更新后的 `data/nce3.js` 一起提交。

### 新增一册（例如第一册）

1. 课程文件命名为 `lessons/1-001.md` …（课号补零到 3 位）。
2. `npm run build` 会自动生成 `data/nce1.js`（`books` 数组已包含 1~4）。
3. 复制 `nce-3.html` 为 `nce-1.html`，把 `window.NCE_BOOK` 改成 `1`、数据源改成 `data/nce1.js`、导航 `nav-1` 加 `active`。
4. 更新各页面导航与 `index.html` 的栏目列表，并提交。

### 构建与部署

```bash
npm run build          # 重新生成 data/nceN.js
git add -A
git commit -m "..."    # 例如 feat: xxx
git push origin main   # 推送到 GitHub，Vercel 自动部署
```

> 国内网络直连 GitHub 可能超时；如本机有代理，可临时：
> `git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main`
> （端口按自己的代理实际配置改，不要写进仓库配置。）

---

## 内容排版约定（保持一致）

- 英文正文：使用直引号 `'` `"`，不用弯引号；对话单独分段；破折号写作 ` — `（前后空格）。
- 中文：全角标点 `，。？！：；`，外国人名用间隔号 `·`（如 `比尔·威尔金斯`），数字中的逗号用半角（`1,084`）。
- 生词表按课文中出现顺序排列，中文释义带词性，如 `predecessor | n. 前任，前辈`。
- 标题中的 `title` 不带 `Lesson N` 前缀，`titleCn` 用教材通用译名。

## 当前状态

| 册 | 状态 | 文件 | 课数 |
|----|------|------|------|
| 第一册 | 规划中 | — | — |
| 第二册 | ✅ 已上线 | `lessons/2-001.md` ~ `2-096.md` | 96 |
| 第三册 | ✅ 已上线 | `lessons/3-001.md` ~ `3-060.md` | 60 |
| 第四册 | 规划中 | — | — |

导航里的 `nav-1`、`nav-4`、`nav-search`、`nav-words` 目前是占位链接（`href="#"`）。
