@echo off
setlocal EnableExtensions

REM ============================================================================
REM ZIP everything in the current directory EXCEPT existing .zip files.
REM Create a timestamped file: backup_YYYY-MM-DD_HH-mm-ss.zip
REM 100% compatible with old/new Windows PowerShell.
REM ============================================================================

REM Build timestamp using PowerShell (locale-agnostic)
for /f %%i in ('powershell -NoProfile -Command "(Get-Date).ToString(\"yyyy-MM-dd_HH-mm-ss\")"') do set TS=%%i
set "ZIPNAME=backup_%TS%.zip"

echo.
echo Target ZIP: %ZIPNAME%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "Add-Type -AssemblyName System.IO.Compression.FileSystem;" ^
  "$root = Get-Location;" ^
  "$zipPath = Join-Path $root '%ZIPNAME%';" ^
  "$temp = Join-Path $env:TEMP ('zip_' + [IO.Path]::GetRandomFileName());" ^
  "New-Item -ItemType Directory -Path $temp | Out-Null;" ^
  "Write-Host 'Staging directory:' $temp;" ^
  "$files = Get-ChildItem -Path $root -File -Recurse | Where-Object { $_.Extension -ne '.zip' -and $_.Name -ne '%ZIPNAME%' };" ^
  "Write-Host ('Found: ' + $files.Count + ' files.');" ^
  "foreach ($f in $files) {" ^
  "  $relative = $f.FullName.Substring($root.Path.Length).TrimStart('\','/');" ^
  "  $dest = Join-Path $temp $relative;" ^
  "  $dir = Split-Path $dest -Parent;" ^
  "  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null };" ^
  "  Copy-Item -LiteralPath $f.FullName -Destination $dest -Force;" ^
  "}" ^
  "Write-Host 'Creating ZIP archive...';" ^
  "[IO.Compression.ZipFile]::CreateFromDirectory($temp, $zipPath);" ^
  "Write-Host 'Cleaning up...';" ^
  "Remove-Item -Recurse -Force $temp;" ^
  "Write-Host '✅ ZIP created successfully: ' $zipPath;"

echo.
echo ✅ Done! Created %ZIPNAME%
echo.
pause
