<#
  KaalOS — build, uninstall the previous install, then reinstall.

  Usage (from Windows PowerShell, in this folder):
      .\build-and-reinstall.ps1

  What it does:
    1. Builds the app  (npm run tauri build  ->  tsc + vite + Rust bundle)
    2. Uninstalls any existing "KaalOS" install (MSI or NSIS)
    3. Installs the freshly built installer

  Prerequisites (one-time):
    - Node + npm            (you have these)
    - Rust toolchain        https://rustup.rs   (rustup + MSVC target)
    - VS C++ Build Tools    "Desktop development with C++"
    - WebView2 runtime      (preinstalled on Windows 10/11)
    See https://tauri.app/start/prerequisites/ if the build step fails.

  Note: your data lives in  %APPDATA%\com.kaalos.app  (Roaming) and is NOT
  removed by the uninstall, so tasks / notes / XP survive the reinstall.
#>

$ErrorActionPreference = 'Stop'

$AppName   = 'KaalOS'
$Version   = '0.1.0'
$AppDir    = Join-Path $PSScriptRoot 'app'
$BundleDir = Join-Path $AppDir 'src-tauri\target\release\bundle'
$NsisExe   = Join-Path $BundleDir ("nsis\{0}_{1}_x64-setup.exe" -f $AppName, $Version)
$MsiFile   = Join-Path $BundleDir ("msi\{0}_{1}_x64_en-US.msi" -f $AppName, $Version)

# ---- 1. Build -------------------------------------------------------------
Write-Host "==> [1/3] Building $AppName $Version (tsc + vite + tauri bundle)..." -ForegroundColor Cyan
Push-Location $AppDir
try {
    npm run tauri build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed (exit $LASTEXITCODE). If cargo/rustc is missing, install the Rust toolchain: https://tauri.app/start/prerequisites/"
    }
} finally {
    Pop-Location
}

# ---- 2. Uninstall previous ------------------------------------------------
Write-Host "==> [2/3] Removing any existing $AppName install..." -ForegroundColor Cyan
$removed = $false

# MSI-registered packages
$pkg = Get-Package -Name "$AppName*" -ErrorAction SilentlyContinue
if ($pkg) {
    $pkg | Uninstall-Package -Force -ErrorAction SilentlyContinue | Out-Null
    Write-Host "    Removed MSI package: $($pkg.Name)"
    $removed = $true
}

# Registry uninstall strings (covers NSIS setups)
if (-not $removed) {
    $keys = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    $entry = Get-ChildItem $keys -ErrorAction SilentlyContinue |
        Get-ItemProperty -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -like "$AppName*" } |
        Select-Object -First 1
    if ($entry -and $entry.UninstallString) {
        Write-Host "    Found: $($entry.DisplayName)"
        if ($entry.UninstallString -match 'msiexec') {
            $code = ($entry.UninstallString -replace '.*({[0-9A-Fa-f\-]+}).*', '$1')
            Start-Process msiexec.exe -ArgumentList "/x $code /qb" -Wait
        } else {
            $exe = $entry.UninstallString.Trim('"')
            Start-Process $exe -ArgumentList '/S' -Wait
        }
        $removed = $true
    }
}

if ($removed) { Write-Host "    Previous install removed." -ForegroundColor Green }
else { Write-Host "    No existing install found - skipping." -ForegroundColor Yellow }

# ---- 3. Install fresh build ----------------------------------------------
Write-Host "==> [3/3] Installing the new build..." -ForegroundColor Cyan
if (Test-Path $NsisExe) {
    Write-Host "    Launching NSIS installer:"
    Write-Host "      $NsisExe"
    Start-Process $NsisExe -Wait
} elseif (Test-Path $MsiFile) {
    Write-Host "    Launching MSI installer:"
    Write-Host "      $MsiFile"
    Start-Process msiexec.exe -ArgumentList "/i `"$MsiFile`" /qb" -Wait
} else {
    throw "No installer found under $BundleDir - check the build output above."
}

Write-Host "`nDone. Your data in %APPDATA%\com.kaalos.app is preserved across the reinstall." -ForegroundColor Green
