#!/bin/bash
# 启动 painting-psychology（数据持久化到工作区）
cd /home/angelia_58/.openclaw/workspace/apps/painting-psychology
export OPENAI_API_KEY="$GEMINI_API_KEY"
exec node server.js
