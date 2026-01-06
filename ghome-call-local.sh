#!/bin/bash
cd "$(dirname "$0")"

# Use system chromedriver when running locally
export CHROMEDRIVER_PATH=/usr/bin/chromedriver

node main.js