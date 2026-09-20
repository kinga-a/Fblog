

基于 **EdgeOne Pages + KV 存储 + Blob 存储** 的动态博客系统。

## 特性

- ✅ 文章 CRUD（创建、读取、更新、删除）
- ✅ 草稿/发布状态管理
- ✅ Markdown 编辑器（实时预览）
- ✅ 图片上传（Blob 存储）
- ✅ 标签系统（自动索引）
- ✅ 分类系统
- ✅ 浏览统计
- ✅ 响应式设计（移动端适配）
- ✅ 管理后台（登录认证）

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | 原生 HTML/CSS/JS |
| 后端 | EdgeOne Functions |
| 数据库 | EdgeOne KV |
| 文件存储 | EdgeOne Blob |
| 部署 | EdgeOne Pages |

## 项目结构

```
hexo-edgeone-kv/
├── functions/                    # EdgeOne Functions
│   ├── api/                      # API 接口
│   │   ├── auth/                 # 认证相关
│   │   │   ├── login.js          # 登录
│   │   │   ├── logout.js         # 登出
│   │   │   └── me.js             # 获取当前用户
│   │   ├── posts/                # 文章 CRUD
│   │   │   ├── index.js          # 列表/创建
│   │   │   └── [id].js           # 详情/更新/删除
│   │   ├── upload.js             # 图片上传
│   │   ├── stats.js              # 统计信息
│   │   └── tags.js               # 标签列表
│   └── [[default]].js            # 前台页面渲染
├── admin/                        # 管理后台
│   └── index.html                # 管理后台页面
├── lib/                          # 工具库
│   ├── kv.js                     # KV 操作封装
│   ├── blob.js                   # Blob 操作封装
│   ├── auth.js                   # 认证中间件
│   └── markdown.js               # Markdown 渲染
├── scripts/
│   └── init.js                   # 初始化管理员账号
├── package.json
└── edgeone.json                  # EdgeOne 配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装 EdgeOne CLI

```bash
npm install -g @edgeone/cli
```

### 3. 登录 EdgeOne

```bash
edgeone login
```

### 4. 创建 KV 命名空间

```bash
edgeone kv create BLOG_KV
```

### 5. 创建 Blob 存储桶

```bash
edgeone blob create BLOG_BUCKET
```

### 6. 初始化管理员账号

```bash
node scripts/init.js
```

按照提示在 EdgeOne 控制台添加管理员账号。

### 7. 配置 edgeone.json

将 `your-kv-namespace-id` 和 `your-blob-bucket-name` 替换为实际的 ID。

### 8. 部署

```bash
npm run deploy
```

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 获取当前用户 |

### 文章

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/posts` | 获取文章列表 |
| POST | `/api/posts` | 创建文章 |
| GET | `/api/posts/:id` | 获取单篇文章 |
| PUT | `/api/posts/:id` | 更新文章 |
| DELETE | `/api/posts/:id` | 删除文章 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传图片 |
| GET | `/api/stats` | 统计信息 |
| GET | `/api/tags` | 标签列表 |

## 页面路由

| 路径 | 说明 |
|------|------|
| `/` | 首页（文章列表） |
| `/page/:n` | 分页 |
| `/post/:id` | 文章详情 |
| `/tag/:tag` | 标签页 |
| `/category/:cat` | 分类页 |
| `/about` | 关于页面 |
| `/admin` | 管理后台 |

## 环境变量

| 变量 | 说明 |
|------|------|
| `BLOG_KV` | KV 存储绑定 |
| `BLOG_BUCKET` | Blob 存储绑定 |

## 使用说明

### 写文章

1. 登录管理后台 `/admin`
2. 点击「写文章」
3. 输入标题、内容（Markdown 格式）
4. 添加标签、分类（可选）
5. 点击「发布」或「存草稿」

### 上传图片

1. 进入「图片上传」页面
2. 点击或拖拽图片到上传区域
3. 上传成功后复制图片 URL
4. 在文章中使用 `![描述](图片URL)`

### Markdown 语法

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体** *斜体* ~~删除线~~

`行内代码`

```代码块
console.log("Hello");
```

[链接文字](https://example.com)
![图片描述](图片URL)

> 引用内容

- 列表项 1
- 列表项 2

1. 有序列表 1
2. 有序列表 2

---
```

## 注意事项

1. **管理员账号**：首次使用需要通过 `scripts/init.js` 初始化
2. **图片大小**：单张图片最大 5MB
3. **图片格式**：支持 JPG、PNG、GIF、WebP、SVG
4. **会话有效期**：登录状态保持 7 天

## License

MIT
'''
