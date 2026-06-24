# 部署指南

成长记录工具是单体 Next.js 应用,打包成单 Docker 镜像自托管。SQLite 单文件数据库,图片走可选的 S3 兼容存储。

## 一、最快启动(Docker)

```bash
# 1) 设置一个会话密钥(必改)
export SESSION_SECRET="$(openssl rand -hex 32)"

# 2) 构建并启动
docker compose up -d --build
```

打开 `http://<服务器IP>:3000`,首次访问会引导你设置一个访问密码,然后就能用了。

> ⚠️ **用 HTTP 访问(无 HTTPS/反代)时**,会话 cookie 的 `Secure` 标志必须为关,否则浏览器在 HTTP 下会丢弃 cookie,导致「设密码后无法进入」。`docker-compose.yml` 已默认 `SESSION_COOKIE_SECURE=false`,所以 compose 直接起就能用。若放在 HTTPS 反代后面,设 `SESSION_COOKIE_SECURE=true` 更安全。

- 数据持久化:SQLite 文件在 `./data/dev.db`(compose 已挂载),备份就是备份这个目录。
- 停止:`docker compose down`

## 二、环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `SESSION_SECRET` | ✅ | 会话签名密钥,长随机串(`openssl rand -hex 32`) |
| `APP_PASSWORD` | ❌ | 预设访问密码;不设则首次打开 App 引导设置 |
| `SESSION_COOKIE_SECURE` | ⚠️ | 会话 cookie 是否仅 HTTPS。**纯 HTTP 访问必须设 `false`,否则「设密码/登录后无法进入」**;HTTPS 下建议 `true`(默认)。docker-compose 默认 `false`。 |
| `DATABASE_URL` | — | 运行时固定 `file:/app/data/dev.db`,无需改 |
| `S3_*` | ❌ | 见下;全不配则图片功能关闭(UI 显示「不可用」),身高体重照常记录 |

## 三、图片存储(S3 兼容,可选)

配齐以下 5 个变量即开启图片功能。**上传与查看都经本服务代理**(前端把图传给本服务、本服务写入 S3;查看时本服务从 S3 读出转发),**前端不直连 S3**——因此:

- ✅ 适合 **内网 S3**(只要本服务能访问到 S3 即可,前端不必能访问)。
- ✅ **无需在 S3 侧配置 CORS**(没有浏览器直传)。
- ✅ 照片默认不公开,只能通过本服务(访问密码)访问,隐私更好。

```
S3_ENDPOINT      服务端地址(本服务能访问到即可,可以是内网地址)
S3_REGION        区域
S3_BUCKET        存储桶名
S3_ACCESS_KEY    访问密钥
S3_SECRET_KEY    秘密密钥
```

### 各家示例

**阿里云 OSS**
```
S3_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
S3_REGION=oss-cn-hangzhou
S3_BUCKET=your-bucket
S3_ACCESS_KEY=LTAI...
S3_SECRET_KEY=...
```

**腾讯云 COS**
```
S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
S3_REGION=ap-guangzhou
S3_BUCKET=your-bucket-1250000000
```

**MinIO(本地自托管,配合 compose 里注释的 minio 服务)**
```
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=grow-tall
S3_ACCESS_KEY=growtall
S3_SECRET_KEY=growtall12345
```

**Cloudflare R2**
```
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=grow-tall
```

**AWS S3**
```
S3_ENDPOINT=https://s3.ap-east-1.amazonaws.com
S3_REGION=ap-east-1
S3_BUCKET=grow-tall
```

## 四、成长百分位数据(WHO)

百分位对比带(P3/P50/P97)需要 WHO LMS 数据。应用启动时检测 `data/who/*.json` 是否存在:

- `lhfa-boys.json` / `lhfa-girls.json` — 身高/年龄(0-60 月 + 5-19 岁)
- `wfa-*.json` — 体重/年龄;`bmi-*.json` — BMI/年龄

格式:`[{ "age": 0, "L": 1, "M": 49.5, "S": 0.038 }, ...]`(`age` 单位=月)。

从 WHO 下载 zscore 文本(每行 `age L M S`)后用转换脚本:
```bash
tsx scripts/who-to-json.ts < lhfa-boys-zscore.txt > data/who/lhfa-boys.json
```
放进 `data/who/` 后重启应用,百分位带即出现。

> 来源:WHO Child Growth Standards(0-5 岁)与 WHO Reference 2007(5-19 岁)。所有数值仅用于「对比正常范围」的科普展示,UI 标注「仅供参考,非医学诊断」。

## 五、PWA / 安全区

- 已启用 PWA(manifest),手机浏览器可「添加到主屏幕」像 App 一样使用。
- 已适配 iOS(灵动岛)与 HarmonyOS 6(挖孔/手势条)的安全区:`viewport-fit=cover` + `env(safe-area-inset-*)`,顶部/底部内容不被遮挡。
- 真机回归建议:iPhone(刘海)+ 华为鸿蒙 6 各一台实测。
