@echo off
echo ========================================================
echo           Test du build de production T-Cardio AI
echo ========================================================
echo.

if not exist ".\out" (
  echo Le dossier 'out' n'existe pas. Veuillez exécuter build-production.bat d'abord.
  exit /b 1
)

echo Installation de serve (si nécessaire)...
call npm install -g serve

echo.
echo Démarrage du serveur de test...
echo Application disponible sur http://localhost:5000
echo Pour arrêter le serveur, appuyez sur Ctrl+C
echo.

serve -s out
