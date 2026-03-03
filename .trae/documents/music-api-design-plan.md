# Music API 设计计划

## 一、项目概述

设计一个功能完整且带宽优化的 Music API，核心目标是：
- 提供完整的音乐管理功能
- 最小化网络带宽占用
- 智能处理封面图片（优先独立封面，支持嵌入式封面提取）

## 二、技术栈选择

### 后端框架
- **Node.js + Express** 或 **Python + FastAPI**
- 轻量级、高性能、易于部署

### 数据存储
- **SQLite** - 轻量级数据库，存储音乐元数据
- 文件系统存储音乐文件

### 音频处理
- **music-metadata** (Node.js) 或 **mutagen** (Python)
- 用于提取 MP3 嵌入式封面和元数据

## 三、API 端点设计

### 3.1 歌曲列表接口（轻量级）

```
GET /api/songs
```

**响应示例：**
```json
{
  "songs": [
    { "id": "abc123", "title": "歌曲名称" },
    { "id": "def456", "title": "另一首歌" }
  ],
  "total": 100,
  "page": 1
}
```

**带宽优化策略：**
- 只返回 `id` 和 `title`，最小化数据传输
- 支持分页，避免一次性传输大量数据

### 3.2 歌曲详情接口

```
GET /api/songs/{id}
```

**响应示例：**
```json
{
  "id": "abc123",
  "title": "歌曲名称",
  "artist": "艺术家",
  "album": "专辑名",
  "duration": 240,
  "urls": {
    "audio": "/api/songs/abc123/audio",
    "cover": "/api/songs/abc123/cover",
    "lyrics": "/api/songs/abc123/lyrics"
  },
  "hasEmbeddedCover": true
}
```

**带宽优化策略：**
- URL 按需请求，不直接返回二进制数据
- 客户端可选择性请求所需资源

### 3.3 音频流接口

```
GET /api/songs/{id}/audio
```

**特性：**
- 支持 HTTP Range 请求（部分内容传输）
- 支持 206 Partial Content 响应
- 支持流式传输，无需等待完整下载

### 3.4 封面图片接口

```
GET /api/songs/{id}/cover
```

**封面处理逻辑：**
1. 检查是否存在独立封面文件（如 `cover.jpg`, `folder.jpg`）
2. 若存在独立封面，返回独立封面
3. 若不存在，从 MP3 文件中提取嵌入式封面
4. 支持图片压缩和格式转换（WebP）
5. 支持缓存减少重复处理

**响应头：**
```
Content-Type: image/jpeg 或 image/webp
Cache-Control: public, max-age=31536000
```

### 3.5 歌词接口

```
GET /api/songs/{id}/lyrics
```

**响应示例：**
```json
{
  "lyrics": "[00:00.00]歌词内容...",
  "format": "lrc"
}
```

### 3.6 搜索接口

```
GET /api/search?q=关键词&type=song|album|artist
```

## 四、带宽优化策略详解

### 4.1 分层响应设计

| 层级 | 接口 | 返回数据 | 用途 |
|------|------|----------|------|
| L1 | `/songs` | id, title | 列表展示 |
| L2 | `/songs/{id}` | 完整元数据 + URL | 详情页 |
| L3 | `/songs/{id}/audio` | 音频流 | 播放 |
| L3 | `/songs/{id}/cover` | 图片 | 封面展示 |
| L3 | `/songs/{id}/lyrics` | 歌词文本 | 歌词显示 |

### 4.2 按需加载

- 客户端只在需要时请求具体资源
- 避免一次性返回所有数据

### 4.3 流式传输

- 音频使用 HTTP Range 请求
- 支持拖动进度条无需重新下载

### 4.4 缓存策略

- 静态资源设置长期缓存
- 元数据设置短期缓存
- 支持 ETag 和 Last-Modified

### 4.5 图片优化

- 自动转换为 WebP 格式（更小体积）
- 提供多种尺寸（thumbnail, normal, large）
- 按需生成，避免存储浪费

## 五、数据模型设计

### 5.1 歌曲表 (songs)

```sql
CREATE TABLE songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    duration INTEGER,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    has_embedded_cover BOOLEAN DEFAULT FALSE,
    cover_format TEXT,
    independent_cover_path TEXT,
    lyrics_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 专辑表 (albums)

```sql
CREATE TABLE albums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    artist TEXT,
    cover_path TEXT,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 歌词缓存表 (lyrics_cache)

```sql
CREATE TABLE lyrics_cache (
    song_id TEXT PRIMARY KEY,
    lyrics TEXT,
    format TEXT DEFAULT 'lrc',
    FOREIGN KEY (song_id) REFERENCES songs(id)
);
```

## 六、封面处理流程

```
┌─────────────────────────────────────────────────────┐
│                   封面请求流程                        │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ 检查独立封面文件是否存在 │
            │ (cover.jpg/folder.jpg) │
            └───────────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
         存在独立封面         不存在独立封面
              │                   │
              ▼                   ▼
         返回独立封面      检查MP3嵌入式封面
                                      │
                            ┌─────────┴─────────┐
                            │                   │
                            ▼                   ▼
                       存在嵌入式封面       不存在封面
                            │                   │
                            ▼                   ▼
                      提取并返回           返回默认封面
```

## 七、项目结构

```
MusicAPI/
├── src/
│   ├── index.js              # 入口文件
│   ├── routes/
│   │   ├── songs.js          # 歌曲路由
│   │   ├── search.js         # 搜索路由
│   │   └── albums.js         # 专辑路由
│   ├── services/
│   │   ├── musicService.js   # 音乐服务
│   │   ├── coverService.js   # 封面处理服务
│   │   └── metadataService.js # 元数据服务
│   ├── middleware/
│   │   ├── cache.js          # 缓存中间件
│   │   └── range.js          # Range请求处理
│   ├── utils/
│   │   ├── fileScanner.js    # 文件扫描工具
│   │   └── idGenerator.js    # ID生成器
│   └── config/
│       └── index.js          # 配置文件
├── data/
│   ├── music.db              # SQLite数据库
│   └── cache/                # 缓存目录
├── music/                    # 音乐文件目录
├── package.json
└── README.md
```

## 八、实现步骤

### 阶段一：基础框架搭建
1. 初始化项目，安装依赖
2. 创建基础 Express 服务器
3. 配置数据库连接
4. 实现文件扫描功能

### 阶段二：核心 API 实现
5. 实现歌曲列表接口（GET /api/songs）
6. 实现歌曲详情接口（GET /api/songs/{id}）
7. 实现音频流接口（GET /api/songs/{id}/audio）
8. 实现封面接口（GET /api/songs/{id}/cover）
9. 实现歌词接口（GET /api/songs/{id}/lyrics）

### 阶段三：高级功能
10. 实现搜索功能
11. 添加缓存机制
12. 实现封面优化（WebP转换、多尺寸）
13. 添加错误处理和日志

### 阶段四：优化与测试
14. 性能优化
15. 编写测试用例
16. 文档完善

## 九、依赖包

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "music-metadata": "^8.1.4",
    "uuid": "^9.0.0",
    "sharp": "^0.33.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

## 十、预期效果

- 列表请求：~1KB/100首歌曲
- 详情请求：~500字节/首歌曲
- 封面请求：支持缓存，首次请求后本地缓存
- 音频播放：支持流式传输，按需加载

总带宽节省预估：相比传统API设计，可节省 **60-80%** 的带宽占用。
