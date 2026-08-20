#!/bin/bash
# 以 systemd 用户服务方式常驻运行 painting-psychology + cloudflared
# 这样不依赖任何交互会话，崩溃自动重启，机器重启后也能自启

set -euo pipefail

APP_DIR=/home/angelia_58/.openclaw/workspace/apps/painting-psychology
UNIT_DIR=/home/angelia_58/.config/systemd/user

mkdir -p "$UNIT_DIR"

cat > "$UNIT_DIR/mindart.service" <<EOF
[Unit]
Description=MindArt Studio (painting-psychology)
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/env node server.js
Restart=always
RestartSec=5
StandardOutput=append:$APP_DIR/server.log
StandardError=append:$APP_DIR/server.log

[Install]
WantedBy=default.target
EOF

cat > "$UNIT_DIR/mindart-tunnel.service" <<EOF
[Unit]
Description=MindArt Cloudflare Tunnel
After=network.target mindart.service
Requires=mindart.service

[Service]
Type=simple
ExecStart=$APP_DIR/cloudflared tunnel --url http://localhost:8080 --no-autoupdate
Restart=always
RestartSec=10
StandardOutput=append:$APP_DIR/tunnel.log
StandardError=append:$APP_DIR/tunnel.log

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable mindart.service mindart-tunnel.service
systemctl --user restart mindart.service
sleep 3
systemctl --user restart mindart-tunnel.service

echo "已安装并启动。状态："
systemctl --user is-active mindart.service mindart-tunnel.service
