@echo off
set DATABASE_PORT=7100
start "Cloud SQL Proxy" bin\cloud_sql_proxy_x64.exe -instances=#####=tcp:%DATABASE_PORT%
