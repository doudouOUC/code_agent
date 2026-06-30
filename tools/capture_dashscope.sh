#!/bin/bash
# 抓包 dashscope.aliyuncs.com 的 HTTPS 流量
# 使用方法:
#   1. 运行此脚本启动代理: ./tools/capture_dashscope.sh
#   2. 在另一个终端设置代理环境变量后运行你的程序:
#      export HTTPS_PROXY=http://127.0.0.1:8080
#      export HTTP_PROXY=http://127.0.0.1:8080
#      python your_script.py
#
# 抓到的流量会保存到 tools/dashscope_capture.flow 文件

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CAPTURE_FILE="${SCRIPT_DIR}/dashscope_capture.flow"

echo "================================================"
echo " mitmproxy 抓包 - dashscope.aliyuncs.com"
echo "================================================"
echo ""
echo "代理地址: http://127.0.0.1:8080"
echo "抓包保存: ${CAPTURE_FILE}"
echo ""
echo "在你的程序终端执行:"
echo "  export HTTPS_PROXY=http://127.0.0.1:8080"
echo "  export HTTP_PROXY=http://127.0.0.1:8080"
echo ""
echo "按 Ctrl+C 停止抓包"
echo "================================================"
echo ""

mitmdump \
  --listen-port 8080 \
  --set flow_detail=3 \
  --flow-filter "~d dashscope.aliyuncs.com" \
  -w "${CAPTURE_FILE}"
