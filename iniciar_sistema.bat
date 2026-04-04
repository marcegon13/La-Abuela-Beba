@echo off
echo Iniciando Sistema La Beba...

REM 1. Iniciar Base de Datos (PostgreSQL) - Verifica si el servicio corre
echo Verificando servicio de PostgreSQL...
net start postgresql-x64-16
REM Si falla, podria ser porque ya corre o el nombre del servicio difiere, pero no detiene el script.

REM 2. Iniciar Backend (Go API) en una nueva ventana
echo Iniciando Backend...
start "La Beba API (Backend)" cmd /k "cd /d C:\La Beba\backend && go run cmd/main.go"

REM 3. Iniciar Frontend (React) en una nueva ventana
echo Iniciando Frontend...
start "La Beba Web (Frontend)" cmd /k "cd /d C:\La Beba\frontend && npm run dev"

REM 4. Abrir navegador cuando este listo (espera 5s)
timeout /t 5
start http://localhost:5173

echo Sistema iniciandose. No cierres las ventanas negras de fondo.
pause
