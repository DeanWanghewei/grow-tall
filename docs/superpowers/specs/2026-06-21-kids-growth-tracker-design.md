# 小朋友身高体重记录工具 · 设计规格

- **日期**:2026-06-21
- **状态**:已设计,待评审
- **项目代号**:grow-tall

---

## 1. 概述

一个**手机优先**的卡通化成长记录工具,面向 0–18 岁小朋友家庭。家长随手记录身高/体重(两者可分开录),系统自动生成成长曲线并对比 WHO/中国儿童生长发育百分位标准;支持多个孩子、多设备同步、成长照片时光相册与幻灯片、可切换的多主题。可自托管(Docker),图片走 S3 兼容存储(可选,部署时配置)。

### 1.1 核心需求

| # | 需求 | 落地方式 |
|---|------|---------|
| 1 | 美观简约 + 卡通化(可给小朋友看) | 卡通拟物风 + 吉祥物(长颈鹿贯穿)+ 趣味动效 |
| 2 | 主动生成成长曲线 | 身高/体重/BMI 曲线 + WHO 百分位带状图 |
| 3 | 主要入口在手机 | 移动优先 + PWA(可加主屏幕)+ 安全区适配 |
| 4 | 身高体重可不同时录入 | `Record` 两字段皆可空,同日自动合并 |
| 5 | 年龄 0–18 岁 | WHO 0–5 标准 + 5–19 参考,覆盖全段 |
| 6 | 上传图片,S3 协议存储,非必要配置 | 部署时环境变量配置,启动检测;未配置则关闭并提示 |
| 7 | 多设备同步 | 后端 + 数据库,单一访问密码 |
| 8 | 多孩子 | 每个孩子独立资料/曲线/主题,顶部切换 |
| 9 | 多主题,按性别/年龄适配 | 三套主题,可切换,按年龄推荐不锁定 |

### 1.2 非目标(明确不做)

- 多账号登录体系(只用单一共享访问密码)
- 医学诊断(百分位/预测身高仅供参考,不做健康判定)
- 对外社交分享
- 复杂权限/角色管理

---

## 2. 技术栈 & 架构

### 2.1 技术选型

| 层 | 选型 | 理由 |
|---|------|------|
| 框架 | Next.js(App Router)+ TypeScript | 全栈一体:页面、API、PWA 都能做 |
| 样式 | Tailwind CSS + CSS 变量 | 多主题靠改一组 CSS 变量即时换肤 |
| 图表 | ECharts | 百分位带状图渲染强、主题化好、移动端流畅 |
| ORM | Prisma | 同一套 schema 支持 SQLite 和 MySQL(满足「可适配 MySQL」) |
| 数据库 | SQLite(默认)→ 可切 MySQL | 家庭量级 SQLite 足够,单文件好备份 |
| 图片 | S3 SDK + 预签名 URL | 浏览器直传,兼容任何 S3 协议存储 |
| 部署 | 单 Docker 镜像(standalone)+ compose | 自托管/NAS/VPS 一条命令起 |

### 2.2 架构图

```
手机浏览器 / PWA
     │  (httpOnly cookie 会话)
     ▼
Next.js (页面 + API Routes)
     │
     ├── Prisma ──► SQLite (数据)  ──换 datasource 即切 MySQL
     └── S3 SDK ──► S3 兼容存储 (阿里云OSS / 腾讯云COS / MinIO / R2 / AWS)
            ▲
   浏览器拿预签名 URL 直传图片(不经服务器中转)
```

单体全栈应用:一个 Next.js 服务同时提供 API 与页面,SQLite 单文件数据库,图片直传 S3 兼容存储。整体是 **PWA**(可「添加到主屏幕」,全屏、有图标、离线外壳)。

---

## 3. 数据模型(Prisma)

```prisma
enum Gender { MALE FEMALE OTHER }

model Child {
  id            String   @id @default(cuid())
  name          String
  gender        Gender
  birthDate     DateTime
  themeId       String   @default("warm")   // 绑定主题
  avatarKey     String?                       // 头像 S3 key(可选)
  fatherHeight  Float?                        // 父亲身高 cm(预测成年身高用)
  motherHeight  Float?                        // 母亲身高 cm
  createdAt     DateTime @default(now())
  records       Record[]
  photos        Photo[]
}

model Record {
  id        String   @id @default(cuid())
  childId   String
  child     Child    @relation(fields: [childId], references: [id], onDelete: Cascade)
  date      DateTime                         // 测量日期(精确到日)
  height    Float?                           // cm,可空
  weight    Float?                           // kg,可空
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([childId, date])                   // 同一孩子同一天只合并成一条
}

model Photo {
  id        String   @id @default(cuid())
  childId   String
  child     Child    @relation(fields: [childId], references: [id], onDelete: Cascade)
  recordId  String?                            // 可选:挂到某条记录(附件)
  s3Key     String                             // 存储路径
  takenAt   DateTime                           // 照片代表的时间(时光轴排序)
  createdAt DateTime @default(now())
}

model Setting {
  id           String   @id @default("singleton")
  passwordHash String?                          // 访问密码哈希(bcrypt)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 3.1 关键设计:身高/体重可分开录入

每次录入是一个 `Record`,`height`、`weight` 均可空——只填身高就只存身高。靠 `@@unique([childId, date])`,**同一孩子同一天的多次录入自动合并到同一条记录**(后写的字段补进已有记录,不覆盖已填字段);不同天则是不同点。这样既灵活,曲线又干净(一天一个点,不堆叠)。

### 3.2 S3 不进数据库

S3 配置完全由环境变量驱动(见 §7),`Setting` 表只存 `passwordHash` 等非敏感项。密钥只存在于部署环境,不进库、不碰浏览器。

---

## 4. 页面设计(UI)

视觉风格:卡通拟物 + 暖色 + 长颈鹿吉祥物贯穿;卡片有「厚度阴影」+ 微旋转 + 虚线手绘边;动效让页面「活着」。设计稿(HTML mockup)见 `.superpowers/brainstorm/` 下各阶段文件(设计产物,不入库)。

### 4.1 导航

底部 **4 标签 + 正中凸起按钮**:
- 标签:🏠 首页 / 📈 曲线 / 🖼 相册 / ⚙ 我的
- 凸起按钮:长颈鹿圆形钮「记一笔」,卡在标签栏中间空位**上方**(不与标签栏/Home 条重叠),大拇指正下方,任何页可达。

### 4.2 首页(成长墙)

- 顶部:孩子切换(头像+姓名+年龄)+ 今日
- **成长墙**(C 位):天空背景 + 太阳/云朵;长颈鹿站在身高尺旁,**会随身高往上长**;当前身高用小旗标在尺上;长颈鹿对话气泡「我又长高啦 115.2cm」
- 贴纸卡 ×2:体重、BMI 百分位(微旋转、有厚度)
- 成长彩带:本月长高 X cm + 连续记录贴纸奖励 🏅
- 成长瞬间:拍立得照片横滑条
- 底部导航

### 4.3 记一笔(底部弹层)

- 从底部弹簧式弹起,不跳页
- 日期(默认今天)
- 身高大滑块(可拖,小长颈鹿作把手)+ 数值
- 体重滑块 + 数值
- 拍照按钮(可选,直接进时光相册)
- 「填一个就能存」
- 保存 → 撒花动效 + 贴纸解锁提示

### 4.4 成长曲线(旗舰)

- 顶部:孩子切换
- 分段:身高 / 体重 / BMI
- 主图(ECharts):浅色带 = P3~P97 正常范围、虚线 = P50 中位、粗线 = 自己孩子(数据点带白边);当前点带数值气泡(P68)
- 派生指标卡:📏 预测成年身高 / 🌱 发育阶段 / 📊 BMI 百分位
- 长颈鹿一句话解读(「偏上 P68,长得很好」)

### 4.5 时光相册

- 顶部大按钮:▶ 播放成长幻灯片
- 成长里程碑标记
- 按年龄归档的「胶片」:5岁/4岁/0-3岁,拍立得缩略图(微旋转)

### 4.6 成长幻灯片(方向 A · 成长墙时间轴)

- 把照片「贴」到身高墙的对应高度上(和首页成长墙一脉相承)
- **上下滑动穿越时光**,像翻立体相册
- 当前年龄照片放大 + 发光 + 长颈鹿对话气泡
- 底部播放按钮
- 给孩子看的核心体验

### 4.7 我的(设置)

- 品牌头:长颈鹿 logo + 「XX的成长日记」+ 记录数/照片数
- 孩子管理:头像化(多孩子一眼看到,点头像切换,+ 添加)
- 我的主题(入口 → 主题选择器)
- 图片存储(可用/不可用 标签)
- 访问密码(修改)
- 导出数据
- 关于

### 4.8 主题选择器(底部弹层)

- 三套主题迷你实时预览(配色+吉祥物一起变)
- 按年龄智能推荐(不锁定)
- 「应用到 XX」按钮

### 4.9 图片存储(极简)

- 只显示:✅ 可用 / ☁️ 不可用
- 点进去:大图标 + 状态 + 一句说明 +「配置方法见 deploy.md」
- 没配时点上传:一句话提示,指向部署文档
- **App 内不出现任何密钥/endpoint/配置代码**

---

## 5. 主题系统

### 5.1 概念

主题 = 一组 CSS 变量(配色)+ 吉祥物 + 插画密度。起步三套:

| 主题 ID | 名称 | 配色 | 吉祥物 | 适配年龄 |
|--------|------|------|--------|---------|
| `warm` | 暖阳长颈鹿 | 奶油暖橘 | 🦒 | 0–6(推荐) |
| `mint` | 清新薄荷 | 薄荷绿 | 🐤 | 7–12 |
| `rainbow` | 彩虹活力 | 多彩渐变 | 🦄 | 全年龄 |

### 5.2 规则

- **每个孩子绑定一个主题**,存于 `Child.themeId`;切换孩子自动切到 TA 的主题
- **按年龄推荐但不锁定**:新建孩子时按年龄默认推荐一套,用户随时可改
- **性别不强制绑定颜色**(避免「女孩只能粉」的刻板),给足配色由用户和孩子自选
- 切换是即时的(改 `data-theme` 属性,CSS 变量整体替换)

### 5.3 主题令牌(CSS 变量)

每套主题定义:`--bg`(背景)、`--card`(卡片)、`--ink`(主文字)、`--muted`(次要文字)、`--primary`(主色/按钮)、`--accent`(强调)、`--mascot`(吉祥物)、`--band`(百分位带色)等。

---

## 6. 成长曲线 & 标准百分位

### 6.1 标准数据

- **WHO Child Growth Standards**(0–5 岁)+ **WHO Reference 2007**(5–19 岁):身长/身高-年龄、体重-年龄(0–10 岁)、BMI-年龄
- **中国儿童生长发育标准**(2005 九市/首都儿研所)作为可选替代——若能取得 LMS 数据则作为可切换标准
- 数据以 LMS(Box-Cox)表形式内置

### 6.2 百分位 / Z 分计算

用 LMS 公式由 L、M、S 值算精确百分位:
```
z = ((value/M)^L − 1) / (L·S)        // L≠0
percentile = Φ(z)                     // 标准正态 CDF
```
孩子在曲线上每点都标出所处百分位(如 P68)。

### 6.3 图表

- 身高/年龄、体重/年龄、BMI/年龄 三张
- 百分位带:P3 / P15 / P50 / P85 / P97(浅色填充 P3–P97 区间作「正常范围」,P50 虚线作中位)
- 自己孩子的粗线 + 数据点,当前点数值气泡

### 6.4 派生指标

- **BMI** = weight / (height/100)²;查 BMI-年龄百分位
- **预测成年身高** = 父母中位身高靶身高(男孩 (父+母+13)/2,女孩 (父+母−13)/2,±5cm 范围);需在 `Child` 选填父母身高;无则不显示
- **发育阶段提示** = 按年龄/性别的青春期窗口信息(女 8–13、男 9–14 生长加速等),纯科普提示,不做 Tanner 分期
- 长颈鹿一句话解读:根据当前百分位生成鼓励性文案

> 所有医学相关数值仅供参考,UI 明确标注「仅供参考,非医学诊断」。

---

## 7. 图片 & S3 存储

### 7.1 部署时检测

凭证作为**环境变量**在部署时配置:

```
S3_ENDPOINT      # 如 https://oss-cn-hangzhou.aliyuncs.com
S3_REGION        # 如 cn-hangzhou
S3_BUCKET        # 如 grow-tall-photos
S3_ACCESS_KEY
S3_SECRET_KEY
S3_PUBLIC_BASE   # 可选,公开访问基址
```

应用启动时**按环境变量是否存在来检测**(不做真实连接测试,避免启动延迟与误判):
- 必需变量(`S3_ENDPOINT`/`S3_REGION`/`S3_BUCKET`/`S3_ACCESS_KEY`/`S3_SECRET_KEY`)齐全 → **图片功能开启**
- 否则 → **图片功能关闭**,上传入口禁用,UI 显示「不可用」
- 实际连接性在**首次上传**或点击「测试连接」时验证;若失败则回退到「不可用」并提示

### 7.2 上传流程

1. 客户端选图 → `POST /api/photos/presign` 拿预签名 PUT URL
2. 客户端直传到 S3(不经服务器)
3. `POST /api/photos` 创建 `Photo` 记录(s3Key、takenAt、可选 recordId)
4. 读取时按需生成签名 URL

### 7.3 照片用途

- **时光相册**:独立照片,按 `takenAt` 排成时间轴
- **记录附件**:照片可挂到某条 `Record`(如体检单)
- **成长幻灯片**:从相册一键播放

### 7.4 兼容性

阿里云 OSS / 腾讯云 COS / MinIO / Cloudflare R2 / AWS S3(均为 S3 协议)。

### 7.5 UI(极简)

只露「可用/不可用」。详细配置(环境变量清单、docker-compose 示例、各家存储配置)全部在部署文档 `deploy.md`。

---

## 8. 访问控制

- **单一访问密码**(bcrypt 哈希),存 `Setting.passwordHash`
- 首次打开若无密码 → 引导设置一个
- 之后访问 → 输密码 → 下发 **httpOnly cookie** 会话(长期有效,免反复登录)
- 所有数据接口需会话
- 「我的」里可修改密码 / 登出
- 密码也可由环境变量 `APP_PASSWORD` 预置(部署时),否则首次运行设置

---

## 9. 安全区适配(iOS & HarmonyOS 6)

- `viewport-fit=cover`:页面铺到屏幕边缘(含刘海/圆角)
- 上下内边距用 `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`,系统自动给真实值
- iOS Safari 与 HarmonyOS 6(ArkWeb,Chromium 内核)**都支持**同一套 CSS,无需分平台代码
- 正中凸起按钮定位也加底部 inset,保证不被 Home 条/手势条压住
- 状态栏背景跟随主题色;大字号/长辈模式下重排不溢出
- PWA 全屏模式下也验证 inset
- 真机回归:iPhone(有刘海)+ 华为鸿蒙 6 各一台

---

## 10. 部署

- 单 Docker 镜像(Next.js `output: standalone`)
- `docker-compose.yml`:app 服务 + SQLite 数据卷(+ 可选 MinIO)
- 环境变量:`DATABASE_URL`、`SESSION_SECRET`、`APP_PASSWORD`(可选)、`S3_*`(可选)
- PWA:`manifest.webmanifest` + 最小 service worker(离线外壳)
- **`deploy.md`**:完整部署说明 + S3 各家配置示例 + 安全区/平台说明

---

## 11. 交互 & 动效

- **常驻动效**:云端飘、长颈鹿呼吸、凸起按钮轻摇、星星闪烁、保存撒花
- **微交互**:点吉祥物会回应;数值计数动画
- **贴纸成就系统**:连续记录(N 个月)解锁贴纸,把「记录」变游戏,孩子会主动催记

---

## 12. 测试策略

- **单元**:`LMS` 百分位计算、BMI、预测身高、Record 同日合并逻辑、S3 配置检测
- **组件**:主题切换即时生效、ECharts 曲线渲染、安全区布局
- **E2E**:记一笔流程、上传(有/无 S3 两种)、多孩子切换、幻灯片播放
- **视觉回归**:iOS(刘海)+ HarmonyOS 6 真机安全区

---

## 13. 范围外 / 未来

- 多账号/家庭共享细粒度权限
- 接入儿研所/医院体检数据导入
- 成长对比生成可分享海报
- 预测身高的曲线外推可视化
- 更多主题 + 自定义主题

---

## 14. 风险 & 备注

- **WHO/中国标准 LMS 数据**:需确认数据来源与许可(WHO 公开;中国标准需确认可用性),作为内置资源
- **S3 预签名直传**:跨域(CORS)需在存储侧正确配置,写入 `deploy.md`
- **HarmonyOS 6 真机**:Web 表现依赖 ArkWeb 版本,需实测 `env(safe-area-inset-*)` 与 PWA 安装行为
- **SQLite 并发**:家庭量级无压力;若多人同时写,Prisma + WAL 模式足够;切 MySQL 可解更大并发
