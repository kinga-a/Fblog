# EdgeBlog —— 跑在 EdgeOne Pages 上的 Typecho 风格博客

Typecho 是 PHP 程序，无法在 EdgeOne Pages 的 JavaScript 边缘函数上直接运行。
本项目用 KV + 边缘函数重新实现了 Typecho 的完整数据模型与扩展机制，
并仿照 Typecho 的默认主题风格。主题 API 与插件钩子均对照 Typecho 设计，便于移植。

## 功能

- 文章（Markdown、草稿/发布、分类、标签、阅读数、上一篇/下一篇）
- 独立页面（支持 /page/slug 与 /slug 短路径）
- 评论（昵称+网址+内容，插件可拦截）
- 归档 / 分类 / 标签聚合页，RSS（/feed），分页
- 后台管理 /admin：文章、页面、评论、设置、插件
- 主题系统：functions/theme/，导出 layout/home/archive/post/page 五个方法
- 插件系统（Typecho 风格钩子）：
  - `header($, emit)` / `footer($, emit)` —— 向 head/页脚注入内容
  - `content(filter)` —— 过滤文章/页面正文 HTML
  - `comment_data(filter)` —— 评论入库前过滤，返回 null 即拦截
  - `comment_after($, post)` —— 评论提交后动作（如邮件通知）

## 部署到 EdgeOne Pages

1. 控制台 → EdgeOne Pages → 创建项目 → 导入本仓库（或本地上传），框架预设选「无」，构建命令留空。
2. 项目设置 → 绑定 KV 命名空间，**变量名必须为 `BLOG_KV`**。
3. 项目设置 → 环境变量，添加 `ADMIN_PASSWORD`（后台登录密码）。
4. 部署完成后访问 `/admin` 登录，即可开始写文章。

## 目录结构

```
functions/
  [[default]].js   # 路由（捕获所有路径）
  api.js           # 全部 API（登录/文章/页面/评论/设置/插件）
  admin-page.js    # 后台管理页
  lib/             # util / store(KV) / auth / markdown / hooks
  theme/default.js # 默认主题（仿 Typecho）
  plugins/         # seo / copyright 示例插件 + index.js 注册表
```

## 移植 Typecho 主题

复制 functions/theme/default.js 为新文件，保持导出结构不变即可：
`layout($, body)` 页面框架、`home($)` 首页列表、`archive($)` 归档、
`post($)` 文章页、`page($)` 独立页面。`$` 即 Typecho 中 `$this` 的角色：
`$.options`（站点设置）、`$.archive`（当前页标题）、`$.data`（文章/评论等数据）。
