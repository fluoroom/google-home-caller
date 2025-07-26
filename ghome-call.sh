#!/bin/bash
cd "$(dirname "$0")"

xvfb-run --auto-servernum --server-args='-screen 0 1024x768x16' node main.js
