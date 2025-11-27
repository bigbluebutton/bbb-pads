#!/bin/sh
set -e

TARGET=/app/config/settings.json

cat config/settings.json.template | \
  sed "s/ETHERPAD_API_KEY/\"$ETHERPAD_API_KEY\"/g" | \
  jq '.etherpad.host = "etherpad"' | \
  jq '.express.host = "0.0.0.0"' | \
  jq '.redis.host = "redis"' >> $TARGET


cd /app
export NODE_ENV=production
npm start
