# Music API

一个功能完整且带宽优化的音乐 API 服务。

## 特性

- **分层响应设计** - 最小化带宽占用
- **智能封面处理** - 优先独立封面，支持嵌入式封面提取
- **流式音频传输** - 支持 HTTP Range 请求
- **自动索引** - 启动时自动扫描，文件变动自动更新索引
- **CORS 支持** - 支持跨域访问
- **自动缓存** - 封面图片自动转换为 WebP 并缓存
- **轻量级数据库** - SQLite 零配置

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
npm start
```

服务器启动时会自动扫描 `music` 目录并构建索引。

默认运行在 `http://localhost:3000`

### 添加音乐

直接将音乐文件放入 `music` 目录，系统会自动检测并更新索引：

```
music/
├── 专辑名称/
│   ├── 歌曲A.mp3
│   ├── 歌曲B.mp3
│   ├── 歌曲A.lrc          # 歌词文件（可选）
│   └── cover.jpg          # 独立封面（可选）
└── 其他歌曲.mp3
```

支持的封面文件名：`cover.jpg`, `cover.png`, `folder.jpg`, `folder.png`, `album.jpg`, `album.png`

### 手动扫描

```bash
npm run scan
```

### 开发模式

```bash
npm run dev
```

## API 接口

### 获取 API 信息

```
GET /
```

响应示例：

```json
{
  "name": "Music API",
  "version": "1.0.0",
  "endpoints": {
    "songs": "/api/songs",
    "search": "/api/search?q=keyword"
  }
}
```

### 获取歌曲列表

```
GET /api/songs?page=1&limit=50
```

响应示例：

```json
{
  "songs": [
    { "id": "abc123", "title": "歌曲名称", "artist": "艺术家" },
    { "id": "def456", "title": "另一首歌", "artist": "另一位艺术家" }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 2
}
```

### 获取歌曲详情

```
GET /api/songs/{id}
```

响应示例：

```json
{
  "id": "abc123",
  "title": "歌曲名称",
  "artist": "艺术家",
  "album": "专辑名",
  "duration": 240,
  "hasEmbeddedCover": true,
  "urls": {
    "audio": "/api/songs/abc123/audio",
    "cover": "/api/songs/abc123/cover",
    "lyrics": "/api/songs/abc123/lyrics"
  }
}
```

### 获取音频流

```
GET /api/songs/{id}/audio
```

- 支持 HTTP Range 请求
- 支持拖动进度条无需重新下载

### 获取封面图片

```
GET /api/songs/{id}/cover?size=normal
```

参数：

- `size`: 封面尺寸 (`thumbnail`=150px, `normal`=300px, `large`=600px)

封面处理逻辑：

1. 优先使用独立封面文件
2. 若无独立封面，从音频文件提取嵌入式封面
3. 自动转换为 WebP 格式并缓存

### 获取歌词

```
GET /api/songs/{id}/lyrics
```

响应示例：

```json
{
  "lyrics": "[00:00.00]歌词内容...",
  "format": "lrc"
}
```

歌词文件支持：`.lrc`, `.txt`（与音频文件同名同目录）

### 搜索

```
GET /api/search?q=关键词&type=song
```

参数：

- `q`: 搜索关键词
- `type`: 搜索类型 (`song`, `album`, `artist`)

## 目录结构

```
MusicAPI/
├── src/
│   ├── index.js              # 入口文件
│   ├── cli/
│   │   └── scan.js           # 扫描命令行工具
│   ├── config/
│   │   └── index.js          # 配置文件
│   ├── db/
│   │   └── database.js       # SQLite 数据库
│   ├── routes/
│   │   ├── songs.js          # 歌曲路由
│   │   └── search.js         # 搜索路由
│   ├── services/
│   │   ├── musicService.js   # 音乐服务
│   │   ├── coverService.js   # 封面处理服务
│   │   ├── metadataService.js # 元数据服务
│   │   └── watcherService.js # 文件监视服务
│   └── utils/
│       ├── fileScanner.js    # 文件扫描工具
│       └── idGenerator.js    # ID生成器
├── data/
│   ├── music.db              # SQLite 数据库
│   └── cache/                # 封面缓存目录
├── music/                    # 音乐文件目录
├── package.json
└── README.md
```

## 支持的音频格式

- MP3 (`.mp3`)
- FLAC (`.flac`)
- M4A (`.m4a`)
- OGG (`.ogg`)
- WAV (`.wav`)

## 环境变量

| 变量        | 说明         | 默认值            |
| ----------- | ------------ | ----------------- |
| `PORT`      | 服务器端口   | `3000`            |
| `MUSIC_DIR` | 音乐文件目录 | `./music`         |
| `DATA_DIR`  | 数据目录     | `./data`          |
| `CACHE_DIR` | 缓存目录     | `./data/cache`    |
| `DB_PATH`   | 数据库路径   | `./data/music.db` |

## 带宽优化策略

1. **分层响应** - 列表只返回 id 和 title，详情返回元数据和 URL
2. **按需加载** - 音频、封面、歌词分别请求
3. **流式传输** - 音频支持 Range 请求
4. **图片优化** - 封面自动转换为 WebP，支持多尺寸
5. **长期缓存** - 静态资源设置 1 年缓存

## CORS 配置

API 已配置 CORS 支持，允许跨域访问：

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, Range`
- `Access-Control-Expose-Headers: Content-Range, Accept-Ranges, Content-Length`

## License

MIT
