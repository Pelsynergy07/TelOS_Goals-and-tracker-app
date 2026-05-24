@echo off
title Life OS Progress Tracker
echo Starting Life OS server...
start chrome "http://localhost:8000"
python -m http.server 8000
echo Server stopped.
pause
