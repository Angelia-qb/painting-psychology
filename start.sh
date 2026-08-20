#!/bin/bash
# 启动 painting-psychology
# 配置全部来自同目录的 .env（数据目录、模型、API Key）
cd /home/angelia_58/.openclaw/workspace/apps/painting-psychology
exec node server.js
