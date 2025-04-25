@echo off
echo ========================================================
echo           Construction de T-Cardio AI en production
echo ========================================================
echo.

echo 1. Installation des dépendances...
call npm install
if %errorlevel% neq 0 (
  echo Erreur lors de l'installation des dépendances.
  exit /b %errorlevel%
)
echo Installation terminée avec succès.
echo.

echo 2. Nettoyage des répertoires de build...
if exist ".\out" rd /s /q ".\out"
if exist ".\.next" rd /s /q ".\.next"
echo Nettoyage terminé.
echo.

echo 3. Définition des variables d'environnement de production...
set NODE_ENV=production
echo Variables d'environnement configurées pour la production.
echo.

echo 4. Construction et exportation de l'application...
call npm run build
if %errorlevel% neq 0 (
  echo Erreur lors de la construction de l'application.
  exit /b %errorlevel%
)
echo Construction et exportation terminées avec succès.
echo Application exportée dans le dossier 'out'.
echo.

echo ========================================================
echo             Construction en production terminée 
echo                 (résultat dans le dossier 'out')
echo ========================================================
echo.
echo Pour tester le build de production localement :
echo 1. Installez serve : npm install -g serve
echo 2. Lancez : serve out
echo.
