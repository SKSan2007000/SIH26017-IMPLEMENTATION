$workdir = "c:\Users\B SANTHOSH KUMAR\Downloads\SIH_PS-1-Implemetation-main\SIH_PS-1-Implemetation-main"

Start-Process -FilePath "$workdir\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000" `
  -WorkingDirectory $workdir `
  -RedirectStandardOutput "$workdir\backend.log" `
  -RedirectStandardError "$workdir\backend_err.log"

Start-Sleep -Seconds 3

Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c npm run dev" `
  -WorkingDirectory $workdir `
  -RedirectStandardOutput "$workdir\frontend.log" `
  -RedirectStandardError "$workdir\frontend_err.log"

Start-Sleep -Seconds 5

Start-Process -FilePath "$workdir\cloudflared-win.exe" `
  -ArgumentList "tunnel --url http://127.0.0.1:3000 --http-host-header localhost:3000 --protocol http2 --no-autoupdate" `
  -WorkingDirectory $workdir `
  -RedirectStandardOutput "$workdir\tunnel.log" `
  -RedirectStandardError "$workdir\tunnel_err.log"

Start-Sleep -Seconds 6
