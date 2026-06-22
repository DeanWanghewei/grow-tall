# 🦒 成长日记 · Grow Tall

> 手机优先的卡通化儿童(0–18 岁)成长记录工具:随手记录身高 / 体重,自动生成成长曲线,多孩子、多主题,带时光相册与成长幻灯片。自托管 Docker PWA。

给孩子量完身高,掏出手机记一笔,长颈鹿会跟着一起长高 🦒

---

## ✨ 功能特性

- **📱 手机优先 + 卡通化**:首页「成长墙」、底部凸起「记一笔」按钮、拟物卡片 + 趣味动效;PWA 可「添加到主屏幕」像 App 一样用。
- **📏 身高 / 体重分开录**:同一天多次录入自动合并,不同天各成一个点。
- **📈 成长曲线**:身高 / 体重 / BMI 轨迹,可叠加 WHO 百分位对比带(P3~P97);附预测成年身高(靶身高)、BMI、发育阶段提示。
- **🎨 多主题实时换肤**:暖阳长颈鹿 / 清新薄荷 / 彩虹活力,每个孩子独立主题,按年龄推荐、随时切换。
- **🖼 时光相册 + 成长幻灯片**:照片按年龄归档;一键播放幻灯片,展示「从出生到现在」的成长对比,给孩子看。
- **👶 多孩子 · 多设备同步**:单一访问密码登录,爸妈各自的手机看到同一份数据。
- **☁️ 图片 S3 直传**(可选):兼容阿里云 OSS / 腾讯云 COS / MinIO / Cloudflare R2 / AWS;不配置也能用,只是不存图。
- **🐳 自托管**:单 Docker 镜像,SQLite 单文件数据库,一条命令起。

> 设计稿(HTML 真机 mockup)见 [`docs/design/`](docs/design/),设计规格见 [`docs/superpowers/specs/`](docs/superpowers/specs/)。

---

## 📸 截图

> _首页「成长墙」、成长曲线、主题切换、时光相册_ —— 可在 `npm run dev` 后用手机视口查看,或参考 [`docs/design/`](docs/design/) 下的草图。

---

## 🚀 快速开始(本地开发)

```bash
# 1. 安装依赖
npm install

# 2. 准备本地环境变量
cp .env.example .env
#   生成一个会话密钥写入 .env 的 SESSION_SECRET:
#   openssl rand -hex 32

# 3. 初始化数据库 + 种子数据
npm run db:migrate     # 创建 SQLite 表
npm run db:seed        # 写入示例孩子「豆豆」与若干记录

# 4. 启动
npm run dev            # 打开 http://localhost:3000 → 首次设密码 → 进入
```

常用脚本:
```bash
npm test               # 单元测试(Vitest)
npm run lint           # 代码检查
npm run db:studio      # 可视化查看数据库
```

---

## 🐳 部署(Docker 自托管)

```bash
export SESSION_SECRET="$(openssl rand -hex 32)"   # 必改:会话密钥
docker compose up -d --build                       # http://<服务器IP>:3000
```

- 数据持久化:`./data/dev.db`(compose 已挂载,备份此目录即可)。
- 配置图片存储 / WHO 百分位数据 / PWA & 安全区说明,详见 **[deploy.md](deploy.md)**。

---

## 🧰 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 15(App Router)+ React 19 + TypeScript |
| 样式 | Tailwind CSS v4 + CSS 变量(主题切换) |
| 图表 | ECharts |
| 数据 | Prisma + SQLite(可切 MySQL) |
| 图片 | AWS S3 SDK(预签名直传) |
| 鉴权 | bcrypt + JWT(httpOnly cookie)|
| 动效 | Framer Motion |
| 部署 | 单 Docker 镜像(standalone) |

---

## 📂 项目结构

```
src/
├─ app/
│  ├─ (app)/            # 鉴权区:home / curves / album / settings
│  ├─ slideshow/        # 全屏成长幻灯片
│  ├─ login/            # 登录 / 首次设密
│  └─ api/              # auth / children / records / growth / photos / storage
├─ components/          # AppShell / GrowthWall / RecordSheet / Mascot / ...
├─ lib/                 # db / themes / growth(LMS) / records / storage / auth / s3
└─ middleware.ts        # 访问密码网关
prisma/                 # schema + 迁移 + seed
data/who/               # WHO LMS 百分位数据(自行放入,见 deploy.md)
docs/                   # 设计规格 + UI 草稿
```

---

## 📝 数据与隐私说明

- 身高 / 体重 / 照片等数据仅存在你自己的服务器上(SQLite + 你的 S3),不上传任何第三方。
- 成长曲线的百分位对比**仅供参考,非医学诊断**;预测成年身高为靶身高估算。
- WHO 百分位带需自行放入 `data/who/*.json`(转换脚本 `scripts/who-to-json.ts` 已备,见 deploy.md);未放入时仅显示孩子自己的轨迹。

## 🔐 安全

单一访问密码保护(bcrypt 哈希)。生产部署请务必:
- 设置足够长的 `SESSION_SECRET`;
- 通过 HTTPS 访问(cookie 的 `secure` 在生产环境自动启用);
- 不要把 `.env` / `dev.db` 提交到代码仓库(已在 `.gitignore` 排除)。

---

## License

[Apache License 2.0](LICENSE)
