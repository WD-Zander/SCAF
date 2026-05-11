@echo off
echo.
echo  SCAF Landing Page - http://localhost:8080
echo  Presiona Ctrl+C para detener
echo.
start "" http://localhost:8080
node -e "require('http').createServer((q,r)=>{r.setHeader('Content-Type','text/html;charset=utf-8');require('fs').createReadStream('index.html').pipe(r)}).listen(8080)"
