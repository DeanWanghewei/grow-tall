#!/bin/sh
set -e

# 首次/升级启动:应用 Prisma 迁移(创建/更新 SQLite 表)
node ./node_modules/prisma/build/index.js migrate deploy

exec node server.js
