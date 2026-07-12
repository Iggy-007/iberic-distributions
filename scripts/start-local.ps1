# Arranque diario en local (sin Docker) — Iberic Distributions
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".env")) {
  @"
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="local-dev-7fK9mP2vQ8nR4wL6tY1zA0bC3dE5fG7"
NEXTAUTH_URL="http://localhost:3000"
"@ | Set-Content -Encoding utf8 ".env"
}

$schemaPath = "prisma\schema.prisma"
$schema = Get-Content $schemaPath -Raw
$needsSqlite = $schema -match 'provider = "postgresql"'

if ($needsSqlite) {
  Write-Host "Configurando SQLite para desarrollo local..." -ForegroundColor Yellow
  $schema = $schema -replace 'provider = "postgresql"', 'provider = "sqlite"'
  Set-Content -Path $schemaPath -Value $schema -NoNewline
  npx prisma generate | Out-Null
  npx prisma db push | Out-Null
  if (-not (Test-Path "prisma\dev.db")) {
    npm run db:seed
  }
}

Write-Host "Arrancando http://localhost:3000 ..." -ForegroundColor Green
npm run dev
