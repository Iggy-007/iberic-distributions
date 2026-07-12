# Iberic Distributions — local dev setup (Windows)
# Requires Docker Desktop: https://www.docker.com/products/docker-desktop/

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "=== Iberic Distributions — setup local ===" -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host ""
  Write-Host "Docker no esta instalado." -ForegroundColor Red
  Write-Host "1. Instala Docker Desktop: https://www.docker.com/products/docker-desktop/"
  Write-Host "2. Abre Docker Desktop y espera a que este en marcha"
  Write-Host "3. Vuelve a ejecutar: npm run setup:local"
  exit 1
}

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Creado .env desde .env.example" -ForegroundColor Yellow
}

Write-Host "Iniciando PostgreSQL (Docker)..." -ForegroundColor Green
docker compose up -d

Write-Host "Aplicando esquema de base de datos..." -ForegroundColor Green
npx prisma db push

Write-Host "Cargando datos de demo..." -ForegroundColor Green
npm run db:seed

Write-Host ""
Write-Host "Listo. Arranca la app con: npm run dev" -ForegroundColor Green
Write-Host "URL: http://localhost:3000" -ForegroundColor Green
