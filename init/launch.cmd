@echo off
set PORT=7000
set DATABASE_USERNAME=#####
set DATABASE_PASSWORD=#####
set DATABASE_NAME=#####
set DATABASE_HOST=#####
set DATABASE_PORT=7100
set CORS_ALLOWED_ORIGINS=http://localhost:7000
set AMPLITUDE_KEY=#####
start "Cloud SQL Proxy" bin\cloud_sql_proxy_x64.exe -instances=#####=tcp:%DATABASE_PORT%
.\node_modules\.bin\tsc-watch --noClear --onSuccess "node --inspect=7777 .\js\Main.js"
