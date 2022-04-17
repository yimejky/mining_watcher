#!/bin/sh
cd "$(dirname "${BASH_SOURCE[0]}")"

[ ! -d "./node_modules" ] && npm install
npm start