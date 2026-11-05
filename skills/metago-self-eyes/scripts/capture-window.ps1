<#
capture-window.ps1 — 抓"任何屏幕上应用"的窗口画面（Word/PPT/桌面软件/游戏/任意窗口）。

用法：
  # 按窗口标题抓（支持正则片段）
  powershell -ExecutionPolicy Bypass -File capture-window.ps1 -Title "DeepSeek Harness" -Out D:\审计\win.png

  # 抓整屏
  powershell -ExecutionPolicy Bypass -File capture-window.ps1 -FullScreen -Out D:\审计\screen.png

  # 抓指定区域（物理像素）
  powershell -ExecutionPolicy Bypass -File capture-window.ps1 -Region 100,200,800,600 -Out D:\审计\region.png

说明：
  - 默认用 PrintWindow(PW_RENDERFULLCONTENT=2)，可抓到被遮挡窗口的真实内容；
  - 进程会临时声明 Per-Monitor-V2 DPI 感知，保证高缩放（200%）下坐标不偏；
  - 只读操作，不改变目标窗口状态（除必要时 SetForegroundWindow 失败时的兜底）。
#>
param(
  [string]$Title,
  [switch]$FullScreen,
  [int[]]$Region,
  [Parameter(Mandatory=$true)][string]$Out
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W32 {
  [DllImport("user32.dll")] public static extern IntPtr FindWindow(string c, string n);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

[void][W32]::SetProcessDPIAware()

function Save-Bitmap($bmp, $path) {
  $dir = Split-Path -Parent $path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("已保存: " + (Resolve-Path $path))
  Write-Output ("尺寸: " + $bmp.Width + "x" + $bmp.Height)
}

if ($Region -and $Region.Count -eq 4) {
  $x,$y,$w,$h = $Region
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
  $g.Dispose()
  Save-Bitmap $bmp $Out
  $bmp.Dispose()
  return
}

if ($FullScreen) {
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($b.X, $b.Y, 0, 0, $bmp.Size)
  $g.Dispose()
  Save-Bitmap $bmp $Out
  $bmp.Dispose()
  return
}

if (-not $Title) { throw '必须给 -Title 或 -FullScreen 或 -Region' }

# 在所有顶层窗口里按标题正则找
$target = Get-Process | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle -match $Title } | Select-Object -First 1
if (-not $target) { throw ("找不到标题匹配 '" + $Title + "' 的窗口") }

$h = $target.MainWindowHandle
if ($h -eq [IntPtr]::Zero) { throw '该进程没有主窗口句柄' }

$r = New-Object W32+RECT
[void][W32]::GetWindowRect($h, [ref]$r)
$w = $r.Right - $r.Left; $ht = $r.Bottom - $r.Top
if ($w -le 0 -or $ht -le 0) { throw '窗口尺寸无效（可能已最小化）' }

$bmp = New-Object System.Drawing.Bitmap $w, $ht
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
$ok = [W32]::PrintWindow($h, $hdc, 2)   # PW_RENDERFULLCONTENT
$g.ReleaseHdc($hdc)
$g.Dispose()

if (-not $ok) {
  # 兜底：置前 + 屏幕拷贝
  [void][W32]::ShowWindow($h, 9)   # SW_RESTORE
  [void][W32]::SetForegroundWindow($h)
  Start-Sleep -Milliseconds 350
  $g2 = [System.Drawing.Graphics]::FromImage($bmp)
  $g2.CopyFromScreen($r.Left, $r.Top, 0, 0, $bmp.Size)
  $g2.Dispose()
  Write-Output '注意: PrintWindow 失败，已改用屏幕拷贝（窗口必须可见）'
}

Write-Output ("窗口: " + $target.MainWindowTitle)
Save-Bitmap $bmp $Out
$bmp.Dispose()
