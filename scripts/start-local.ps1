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

# Libera puertos de desarrollo previos (evita "conexión rechazada" o puerto alternativo)
$ports = 3000, 3001, 3002
foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

$schemaPath = "prisma\schema.prisma"
$originalSchema = Get-Content $schemaPath -Raw

try {
  if ($originalSchema -match 'provider = "postgresql"') {
    Write-Host "Configurando SQLite para desarrollo local..." -ForegroundColor Yellow
    $sqliteSchema = $originalSchema -replace 'provider = "postgresql"', 'provider = "sqlite"'
    Set-Content -Path $schemaPath -Value $sqliteSchema -NoNewline
    npx prisma generate | Out-Null
    if (Test-Path "prisma\migrate-document-types.sql") {
      npx prisma db execute --file prisma/migrate-document-types.sql 2>$null
    }
    npx prisma db push | Out-Null
    if (-not (Test-Path "prisma\dev.db")) {
      npm run db:seed
    }
  }

  Write-Host "Arrancando http://localhost:3000 ..." -ForegroundColor Green
  npm run dev
}
finally {
  if ($originalSchema -match 'provider = "postgresql"') {
    Set-Content -Path $schemaPath -Value $originalSchema -NoNewline
    Write-Host "Esquema Prisma restaurado a PostgreSQL (produccion)." -ForegroundColor DarkGray
  }
}
