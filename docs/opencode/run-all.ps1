<#
  KHO BAU TRI THUC - AUTO RUNNER v2 (task queue for OpenCode)

  Runs every task file in docs/opencode/queue/ (named NN_ID_description.md, in file-name order)
  with OpenCode, one at a time, then keeps watching the queue for new task files.
  Per task: branch p42/ID from main -> opencode run --auto -> commit leftovers ->
            npm run typecheck + npm test + npm run build -> up to 2 auto-fix rounds ->
            merge into LOCAL main.
  Never pushes to GitHub. A task that still fails is marked BLOCKED and the queue pauses there
  (edit that task file, or create docs/opencode/state/ID.retry, to try it again).

  Start : double-click docs\opencode\CHAY_TU_DONG.bat (after the first run it also starts with Windows)
  Stop  : docs\opencode\DUNG_LAI.bat (after the current task) or close the window (immediately)
  Off   : docs\opencode\TAT_TU_DONG.bat (stop + remove the Windows auto-start)
  Status: docs\opencode\TRANG_THAI.md      Logs: docs\opencode\logs\
  Model : docs\opencode\state\model.txt if present, else the model of your latest OpenCode
          session in this project, else the OpenCode default model.

  Parallel lanes (v3): a second runner can work in its own git worktree at the same time.
    -Lane B -Only "T10A,T10B"   this runner only takes these tasks
    -Skip "T10A,T10B"           this runner leaves these tasks to the other lane
    -After "T16=T11A;T20A=T10A,T11A"  wait until those tasks are merged into main before starting
    -PeerState <dir>            state dir of the other lane (status table + its OpenCode PIDs)
    -StatusFile <file>          where to write the status page
  Merging never checks out main: the task branch first takes in the newest main (OpenCode resolves
  conflicts, everything is verified again), then main is moved with a compare-and-swap update-ref.

  Model fallback (v3.1): state\model.txt may list several models, one per line (first = preferred).
  When OpenCode shows no progress for -StallMin minutes (free-model rate limit, 504 loops), hits the
  time limit, or ends without changing anything, that model rests for -CooldownMin minutes and the
  runner retries with the next model in the list.
#>
param(
  [string]$Model = '',
  [int]$TaskTimeoutMin = 240,
  [int]$FixTimeoutMin = 120,
  [int]$MaxFixAttempts = 2,
  [int]$IdlePollSec = 120,
  [int]$QuietMin = 20,
  [string]$Lane = '',
  [string]$Only = '',
  [string]$Skip = '',
  [string]$After = '',
  [string]$PeerState = '',
  [string]$StatusFile = '',
  [string]$OcPath = '',
  [int]$MergeWaitMin = 180,
  [int]$StallMin = 25,
  [int]$CooldownMin = 60,
  [switch]$Once,
  [switch]$NoAutostart,
  [switch]$NoWait
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

# Lane settings can live in state\lane.txt (key=value per line) so a restart or the Windows
# autostart keeps the same lane; command-line parameters win over the file. Only/Skip/After are
# read again before every task, so the work can be re-split between lanes without a restart.
$LaneCfg = Join-Path $PSScriptRoot 'state\lane.txt'
$BoundKeys = @($PSBoundParameters.Keys)
function Read-LaneConfig {
  if (-not (Test-Path $LaneCfg)) { return }
  foreach ($k in @('Only', 'Skip', 'After')) { if ($BoundKeys -notcontains $k) { Set-Variable -Name $k -Value '' -Scope Script } }
  foreach ($l in @(Get-Content -Path $LaneCfg -ErrorAction SilentlyContinue)) {
    if ($l -notmatch '^\s*([A-Za-z]+)\s*=\s*(.*)$') { continue }
    $k = $Matches[1]; $v = $Matches[2].Trim()
    if ($BoundKeys -contains $k) { continue }
    switch ($k) {
      'Lane'       { $script:Lane = $v }
      'Only'       { $script:Only = $v }
      'Skip'       { $script:Skip = $v }
      'After'      { $script:After = $v }
      'PeerState'  { $script:PeerState = $v }
      'StatusFile' { $script:StatusFile = $v }
      'Model'      { $script:Model = $v }
      'NoWait'     { if ($v -match '^(1|true|yes)$') { $script:NoWait = [switch]$true } }
    }
  }
}
Read-LaneConfig

$OcDir    = $PSScriptRoot
$Root     = Split-Path -Parent (Split-Path -Parent $OcDir)
$QueueDir = Join-Path $OcDir 'queue'
$StateDir = Join-Path $OcDir 'state'
$LogDir   = Join-Path $OcDir 'logs'
$RepDir   = Join-Path $OcDir 'reports'
$StatusMd = Join-Path $OcDir 'TRANG_THAI.md'
if ($StatusFile) { $StatusMd = $StatusFile }
$StopFile = Join-Path $StateDir 'STOP'
$PidFile  = Join-Path $StateDir 'ownpids.txt'
$LaneTag  = ''
if ($Lane) { $LaneTag = ' [luong ' + $Lane + ']' }

function Split-Ids([string]$S) {
  return @($S -split '[,; ]+' | Where-Object { $_ } | ForEach-Object { $_.Trim().ToUpper() })
}
function Apply-LaneIds {
  $script:OnlyIds = @(Split-Ids $Only)
  $script:SkipIds = @(Split-Ids $Skip)
  $script:AfterMap = @{}
  foreach ($pair in ($After -split ';')) {
    if ($pair -match '^\s*([A-Za-z0-9]+)\s*=\s*(.+)$') { $script:AfterMap[$Matches[1].Trim().ToUpper()] = @(Split-Ids $Matches[2]) }
  }
}
Apply-LaneIds
$LockFile = Join-Path $StateDir 'runner.lock'
$BeatFile = Join-Path $StateDir 'heartbeat.txt'
$EmptyIn  = Join-Path $StateDir 'empty-stdin.txt'
$MainLog  = Join-Path $LogDir 'runner.log'

foreach ($d in @($QueueDir, $StateDir, $LogDir, $RepDir)) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}
Set-Location -Path $Root
[System.IO.File]::WriteAllText($EmptyIn, '')

$script:Phase           = 'KHOI DONG'
$script:Current         = '-'
$script:Note            = ''
$script:ModelId         = ''
$script:OC              = $null
$script:AutoFlag        = ' --auto'
$script:TaskStart       = Get-Date
$script:Tasks           = @()
$script:OwnPids         = @()
$script:LastOwnActivity = [datetime]::MinValue

# ---------------------------------------------------------------- logging / status

function Log([string]$Msg) {
  $line = '[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ']' + $LaneTag + ' ' + $Msg
  Write-Host $line
  # another program reading the log (an editor, a tail) briefly blocks writes on Windows: retry
  for ($i = 0; $i -lt 10; $i++) {
    try { Add-Content -Path $MainLog -Value $line -Encoding Ascii -ErrorAction Stop; break } catch { Start-Sleep -Milliseconds 300 }
  }
}

function Is-PeerTask([string]$Id) {
  if ($SkipIds -contains $Id.ToUpper()) { return $true }
  if ($OnlyIds.Count -gt 0 -and ($OnlyIds -notcontains $Id.ToUpper())) { return $true }
  return $false
}

function Task-Result([string]$Id) {
  $dirs = @($StateDir)
  $peer = (Is-PeerTask $Id)
  if ($peer -and $PeerState) { $dirs = @($PeerState, $StateDir) }
  foreach ($d in $dirs) {
    $f = Join-Path $d ($Id + '.result')
    if (Test-Path $f) {
      $r = (Get-Content -Path $f -Encoding UTF8 -ErrorAction SilentlyContinue | Select-Object -First 1)
      if ($r) { if ($peer) { return ('(luong khac) ' + $r) } else { return $r } }
    }
  }
  if ($peer) { return '(luong khac) cho' }
  return 'cho'
}

function Task-Done([string]$Id) {
  if (Test-Path (Join-Path $StateDir ($Id + '.done'))) { return $true }
  if ($PeerState -and (Test-Path (Join-Path $PeerState ($Id + '.done')))) { return $true }
  return $false
}

function Write-Status {
  [string[]]$out = @()
  $out += ('# Kho Bau Auto Runner' + $LaneTag + ' - trang thai')
  $out += ''
  $out += ('- Cap nhat luc: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
  $out += ('- Tinh trang: **' + $script:Phase + '**')
  if ($script:ModelId) { $m = $script:ModelId } else { $m = '(model mac dinh cua OpenCode)' }
  $out += ('- Model OpenCode: ' + $m)
  $out += ('- Dang lam: ' + $script:Current + ' ' + $script:Note)
  $out += ('- Thu muc lam viec: ' + $Root)
  $done = 0
  foreach ($t in $script:Tasks) { if (Task-Done $t.Id) { $done++ } }
  $out += ('- Tien do (ca 2 luong): ' + $done + '/' + $script:Tasks.Count + ' task xong')
  $out += ''
  $out += '| # | Task | File | Ket qua |'
  $out += '|---|---|---|---|'
  $i = 0
  foreach ($t in $script:Tasks) {
    $i++
    $out += ('| ' + $i + ' | ' + $t.Id + ' | ' + $t.File + ' | ' + (Task-Result $t.Id) + ' |')
  }
  $out += ''
  $out += '- Them viec: tao file moi trong docs/opencode/queue/ (ten dang NN_ID_mo-ta.md), runner tu nhan.'
  $out += '- Chay lai task bi loi: sua file task do, hoac tao file docs/opencode/state/<ID>.retry'
  $out += '- Dung sau task dang lam: DUNG_LAI.bat | Tat han (ca tu bat cung Windows): TAT_TU_DONG.bat'
  $out += '- Log: docs/opencode/logs/ | Bao cao: docs/opencode/reports/'
  try { Set-Content -Path $StatusMd -Value $out -Encoding UTF8 } catch {}
  try { Set-Content -Path $BeatFile -Value ((Get-Date -Format s) + ' pid=' + $PID) -Encoding Ascii } catch {}
}

function Set-Result([string]$Id, [string]$Text) {
  try { Set-Content -Path (Join-Path $StateDir ($Id + '.result')) -Value $Text -Encoding UTF8 } catch {}
  Log ($Id + ': ' + $Text)
  Write-Status
}

function Heartbeat([string]$What) {
  $mins = [int]((Get-Date) - $script:TaskStart).TotalMinutes
  $script:Note = '(' + $What + ' - ' + $mins + ' phut, cap nhat ' + (Get-Date -Format 'HH:mm') + ')'
  try { $Host.UI.RawUI.WindowTitle = 'Kho Bau Auto Runner - ' + $script:Current + ' - ' + $What } catch {}
  Write-Status
}

# ---------------------------------------------------------------- Windows helpers

$script:CanStayAwake = $false
try {
  Add-Type -Namespace P42Native -Name Power -MemberDefinition '[System.Runtime.InteropServices.DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);' -ErrorAction Stop
  $script:CanStayAwake = $true
} catch {}
function Stay-Awake { if ($script:CanStayAwake) { try { [void][P42Native.Power]::SetThreadExecutionState([uint32]2147483649) } catch {} } }
function Allow-Sleep { if ($script:CanStayAwake) { try { [void][P42Native.Power]::SetThreadExecutionState([uint32]2147483648) } catch {} } }

# A click inside a console window (QuickEdit) freezes the script until a key is pressed - turn it off.
function Disable-QuickEdit {
  try {
    Add-Type -Namespace P42Native -Name Con -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("kernel32.dll")] public static extern System.IntPtr GetStdHandle(int nStdHandle);
[System.Runtime.InteropServices.DllImport("kernel32.dll")] public static extern bool GetConsoleMode(System.IntPtr hConsoleHandle, out uint lpMode);
[System.Runtime.InteropServices.DllImport("kernel32.dll")] public static extern bool SetConsoleMode(System.IntPtr hConsoleHandle, uint dwMode);
'@ -ErrorAction Stop
    $h = [P42Native.Con]::GetStdHandle(-10)
    $mode = [uint32]0
    if ([P42Native.Con]::GetConsoleMode($h, [ref]$mode)) {
      $new = [uint32](([int64]$mode -bor 128) -band 4294967231)
      [void][P42Native.Con]::SetConsoleMode($h, $new)
    }
  } catch {}
}

function Install-Autostart {
  if ($NoAutostart -or $Lane) { return }
  try {
    $startup = [Environment]::GetFolderPath('Startup')
    if (-not $startup) { return }
    $lnk = Join-Path $startup 'Kho Bau Auto Runner.lnk'
    $ws = New-Object -ComObject WScript.Shell
    $s = $ws.CreateShortcut($lnk)
    $s.TargetPath = (Join-Path $OcDir 'CHAY_TU_DONG.bat')
    $s.WorkingDirectory = $OcDir
    $s.WindowStyle = 7
    $s.Description = 'Kho Bau Tri Thuc - tu chay hang doi task OpenCode'
    $s.Save()
    Log ('Tu khoi dong cung Windows: ' + $lnk)
  } catch { Log ('Khong cai duoc tu khoi dong (bo qua): ' + $_.Exception.Message) }
}

function Acquire-Lock {
  if (Test-Path $LockFile) {
    $old = ''
    try { $old = ((Get-Content -Path $LockFile -ErrorAction Stop | Select-Object -First 1) + '').Trim() } catch {}
    if (($old -match '^\d+$') -and ([int]$old -ne $PID)) {
      $op = Get-Process -Id ([int]$old) -ErrorAction SilentlyContinue
      if ($op -and $op.ProcessName -like 'powershell*') {
        $age = 9999
        if (Test-Path $BeatFile) { $age = ((Get-Date) - (Get-Item $BeatFile).LastWriteTime).TotalMinutes }
        elseif (Test-Path $StatusMd) { $age = ((Get-Date) - (Get-Item $StatusMd).LastWriteTime).TotalMinutes }
        if ($age -lt 10) { return $false }
        # Stale: only kill it if it really is this runner (Windows reuses PIDs).
        $cmd = ''
        try { $cmd = [string](Get-CimInstance Win32_Process -Filter ('ProcessId=' + $old) -ErrorAction Stop).CommandLine } catch {}
        if ($cmd -like '*run-all.ps1*') {
          try { Stop-Process -Id ([int]$old) -Force -ErrorAction Stop; Log ('Da dung runner cu bi treo (PID ' + $old + ')') } catch {}
          Start-Sleep -Seconds 2
        }
      }
    }
  }
  Set-Content -Path $LockFile -Value $PID -Encoding Ascii
  return $true
}

# ---------------------------------------------------------------- OpenCode + git helpers

function Find-OpenCode {
  if ($OcPath) { return $OcPath }
  $c = Get-Command 'opencode.exe' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) { return $c.Source }
  $c = Get-Command 'opencode.cmd' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) { return $c.Source }
  $cands = @(
    (Join-Path $env:APPDATA 'npm\opencode.cmd'),
    (Join-Path $env:USERPROFILE '.opencode\bin\opencode.exe'),
    (Join-Path $env:USERPROFILE 'scoop\shims\opencode.exe'),
    (Join-Path $env:USERPROFILE '.bun\bin\opencode.exe'),
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\opencode.exe'),
    'C:\ProgramData\chocolatey\bin\opencode.exe'
  )
  foreach ($p in $cands) { if ($p -and (Test-Path $p)) { return $p } }
  return $null
}

function Detect-Capabilities {
  # Newer OpenCode: "run --auto" + "question" permission. Older: neither, so fall back to
  # explicit allow rules that every version understands.
  $script:AutoFlag = ''
  try {
    $ver = (& $script:OC --version 2>&1 | Out-String).Trim()
    Log ('OpenCode version: ' + $ver)
    $help = (& $script:OC run --help 2>&1 | Out-String)
    if ($help -match '--auto') { $script:AutoFlag = ' --auto' }
  } catch {}
  $deny = '"git push*":"deny","git checkout*":"deny","git switch*":"deny","git merge*":"deny","git rebase*":"deny","git reset --hard*":"deny","git clean*":"deny","git stash*":"deny","git branch -D*":"deny","git worktree*":"deny","gh *":"deny","npm publish*":"deny","rm -rf /*":"deny","rm -rf ~*":"deny"'
  if ($script:AutoFlag) {
    $env:OPENCODE_CONFIG_CONTENT = '{"permission":{"question":"deny","bash":{"*":"allow",' + $deny + '}}}'
    Log 'Che do: opencode run --auto'
  } else {
    $env:OPENCODE_CONFIG_CONTENT = '{"permission":{"edit":"allow","webfetch":"allow","doom_loop":"allow","external_directory":"allow","bash":{"*":"allow",' + $deny + '}}}'
    Log 'Che do: OpenCode cu (khong co --auto) - dung quyen allow trong config'
  }
}

function Detect-Model {
  if ($Model) { return $Model }
  $f = Join-Path $StateDir 'model.txt'
  if (Test-Path $f) {
    $m = (Get-Content -Path $f -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($m -and $m.Trim()) { return $m.Trim() }
  }
  try {
    $json = (& $script:OC session list --format json -n 5 2>$null | Out-String)
    $sids = [regex]::Matches($json, '"id"\s*:\s*"(ses_[A-Za-z0-9]+)"')
    foreach ($s in $sids) {
      $exp = (& $script:OC export $s.Groups[1].Value 2>$null | Out-String)
      $pv = [regex]::Matches($exp, '"providerID"\s*:\s*"([^"]+)"')
      $md = [regex]::Matches($exp, '"modelID"\s*:\s*"([^"]+)"')
      if ($pv.Count -gt 0 -and $md.Count -gt 0) {
        $m = $pv[$pv.Count - 1].Groups[1].Value + '/' + $md[$md.Count - 1].Groups[1].Value
        Set-Content -Path $f -Value $m -Encoding Ascii
        return $m
      }
    }
  } catch {}
  return ''
}

# state\model.txt: one model per line, first = preferred, the rest = fallbacks ('#' = comment).
function Model-List {
  $list = @()
  if ($Model) { $list += $Model }
  $f = Join-Path $StateDir 'model.txt'
  if (Test-Path $f) { $list += @(Get-Content -Path $f -ErrorAction SilentlyContinue | ForEach-Object { $_.Trim() } | Where-Object { $_ -and ($_ -notmatch '^#') }) }
  return @($list | Select-Object -Unique)
}

$script:Cooldown = @{}
function Pick-Model {
  $list = @(Model-List)
  if ($list.Count -eq 0) { return (Detect-Model) }
  $now = Get-Date
  foreach ($m in $list) {
    $t = $script:Cooldown[$m]
    if ((-not $t) -or (($now - $t).TotalMinutes -ge $CooldownMin)) { return $m }
  }
  # every model is resting: take the one that failed longest ago
  return ($list | Sort-Object { $script:Cooldown[$_] } | Select-Object -First 1)
}

function Mark-ModelBad([string]$Why) {
  if (-not $script:ModelId) { return }
  $old = $script:ModelId
  $script:Cooldown[$old] = Get-Date
  $script:ModelId = Pick-Model
  Log ('Model ' + $old + ': ' + $Why + ' -> doi sang ' + $script:ModelId)
  Write-Status
}

# fingerprint of the work in progress: HEAD + uncommitted diff + untracked files
function Work-State {
  $h = Git-Out @('rev-parse', 'HEAD')
  $d = (& git diff HEAD 2>$null | Out-String)
  $u = (& git ls-files --others --exclude-standard 2>$null | Out-String)
  return ($h + '|' + $d.Length + '|' + $d.GetHashCode() + '|' + $u.GetHashCode())
}

# after an OpenCode run: rest the model if it stalled, hit the time limit or did nothing
function Judge-Run([int]$Code, [string]$Before) {
  if ($Code -eq 125) { Mark-ModelBad ('khong tien trien ' + $StallMin + ' phut (rate limit / loi 5xx?)'); return }
  if ($Code -eq 124) { Mark-ModelBad 'qua thoi gian'; return }
  if ((Work-State) -eq $Before) { Mark-ModelBad ('ket thuc (exit ' + $Code + ') ma khong thay doi gi') }
}

function Git-Out([string[]]$GitArgs) {
  $o = & git @GitArgs 2>$null
  return (($o | Out-String).Trim())
}

function Cur-Branch { return (Git-Out @('rev-parse', '--abbrev-ref', 'HEAD')) }

function Ahead([string]$B) {
  $n = Git-Out @('rev-list', '--count', ('main..' + $B))
  if ($n -match '^\d+$') { return [int]$n }
  return 0
}

function Branch-Exists([string]$B) {
  & git rev-parse --verify --quiet ('refs/heads/' + $B) 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Commit-All([string]$Msg) {
  $st = Git-Out @('status', '--porcelain')
  if ($st) {
    & git add -A 2>$null | Out-Null
    & git commit -q -m $Msg 2>$null | Out-Null
    Log ('git commit: ' + $Msg)
  }
}

function Ensure-Branch([string]$B) {
  $cur = Cur-Branch
  if ($cur -eq $B) { return $true }
  Commit-All ('chore: auto-runner snapshot on ' + $cur)
  # a leftover task branch without any own commit is rebuilt from the newest main
  if ((Branch-Exists $B) -and ((Ahead $B) -gt 0)) { & git checkout -q $B 2>$null | Out-Null }
  else { & git checkout -q -B $B main 2>$null | Out-Null }
  return ((Cur-Branch) -eq $B)
}

function Track-OwnPids([datetime]$Since) {
  try {
    Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -like 'opencode*' } | ForEach-Object {
      $st = $null
      try { $st = $_.StartTime } catch {}
      if ($st -and ($st -ge $Since) -and ($script:OwnPids -notcontains $_.Id) -and ((Peer-Pids) -notcontains $_.Id)) { $script:OwnPids += $_.Id }
    }
  } catch {}
  try { Set-Content -Path $PidFile -Value ($script:OwnPids | Select-Object -Last 50) -Encoding Ascii } catch {}
}

# OpenCode processes started by the other lane are not "a person working in the repo".
function Peer-Pids {
  if (-not $PeerState) { return @() }
  $f = Join-Path $PeerState 'ownpids.txt'
  if (-not (Test-Path $f)) { return @() }
  return @(Get-Content -Path $f -ErrorAction SilentlyContinue | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ })
}

function Run-Cmd([string]$CmdLine, [string]$LogFile, [int]$TimeoutMin) {
  try { [System.IO.File]::AppendAllText($LogFile, ('===== ' + $CmdLine + '  [' + (Get-Date -Format s) + '] =====' + "`r`n")) } catch {}
  $argLine = '/d /s /c "' + $CmdLine + ' >> "' + $LogFile + '" 2>&1"'
  try {
    $p = Start-Process -FilePath $env:ComSpec -ArgumentList $argLine -WorkingDirectory $Root -NoNewWindow -PassThru -RedirectStandardInput $EmptyIn
  } catch {
    Log ('Loi chay lenh: ' + $CmdLine + ' - ' + $_.Exception.Message)
    return -1
  }
  $null = $p.Handle
  $deadline = (Get-Date).AddMinutes($TimeoutMin)
  while (-not $p.WaitForExit(30000)) {
    Stay-Awake
    Heartbeat ('dang chay: ' + $CmdLine)
    if ((Get-Date) -gt $deadline) {
      & taskkill.exe /PID $p.Id /T /F 2>$null | Out-Null
      Log ('Het gio: ' + $CmdLine)
      return 124
    }
  }
  $p.WaitForExit()
  return $p.ExitCode
}

function Run-OpenCode([string]$Prompt, [string]$Title, [string]$LogBase, [int]$TimeoutMin) {
  $argLine = 'run' + $script:AutoFlag
  if ($script:ModelId) { $argLine += ' -m ' + $script:ModelId }
  $argLine += ' --title "' + $Title + '" "' + $Prompt + '"'
  $out = $LogBase + '.out.log'
  $err = $LogBase + '.err.log'
  try { [System.IO.File]::WriteAllText(($LogBase + '.prompt.txt'), $Prompt) } catch {}
  Log ('OpenCode bat dau: ' + $Title + ' (gioi han ' + $TimeoutMin + ' phut)')
  $since = (Get-Date).AddSeconds(-5)
  try {
    $p = Start-Process -FilePath $script:OC -ArgumentList $argLine -WorkingDirectory $Root -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError $err -RedirectStandardInput $EmptyIn
  } catch {
    Log ('Khong chay duoc OpenCode: ' + $_.Exception.Message)
    return -1
  }
  $null = $p.Handle
  $deadline = (Get-Date).AddMinutes($TimeoutMin)
  $first = $true
  $lastSize = -1
  $lastGrow = Get-Date
  while (-not $p.WaitForExit(60000)) {
    Stay-Awake
    if ($first) { Track-OwnPids $since; $first = $false }
    Heartbeat $Title
    if ((Get-Date) -gt $deadline) {
      Log ('Qua ' + $TimeoutMin + ' phut - dung OpenCode.')
      & taskkill.exe /PID $p.Id /T /F 2>$null | Out-Null
      return 124
    }
    # Progress = OpenCode output grew or a project file changed. OpenCode's redirected output is
    # buffered (a model writing big content files can print nothing for a long time), so files count
    # too. No progress at all for a long time means it is waiting on a rate limit or retrying the
    # same failing request (504/503) - give up and let the caller switch models.
    $size = 0
    foreach ($lf in @($out, $err)) { try { $size += (Get-Item $lf -ErrorAction Stop).Length } catch {} }
    if ($size -ne $lastSize) { $lastSize = $size; $lastGrow = Get-Date }
    $work = Newest-Change
    if ($work -gt $lastGrow) { $lastGrow = $work }
    if (((Get-Date) - $lastGrow).TotalMinutes -ge $StallMin) {
      Log ('Khong tien trien ' + $StallMin + ' phut - dung OpenCode (' + $Title + ').')
      & taskkill.exe /PID $p.Id /T /F 2>$null | Out-Null
      return 125
    }
  }
  $p.WaitForExit()
  Track-OwnPids $since
  Log ('OpenCode ket thuc: ' + $Title + ' - exit ' + $p.ExitCode)
  return $p.ExitCode
}

# Newest change in the project made by anyone (the runner's own bookkeeping files are ignored).
function Newest-Change {
  $newest = [datetime]::MinValue
  foreach ($sub in @('src', 'tests', 'qa', 'public', 'docs', '.ai')) {
    $p = Join-Path $Root $sub
    if (-not (Test-Path $p)) { continue }
    $f = Get-ChildItem -Path $p -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { ($_.FullName -notlike '*docs?opencode*') -or ($_.FullName -like '*docs?opencode?reports*') } |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($f -and $f.LastWriteTime -gt $newest) { $newest = $f.LastWriteTime }
  }
  foreach ($rel in @('index.html', 'package.json', '.git\HEAD', '.git\logs\HEAD')) {
    $p = Join-Path $Root $rel
    if (Test-Path $p) {
      $w = (Get-Item $p).LastWriteTime
      if ($w -gt $newest) { $newest = $w }
    }
  }
  return $newest
}

# Never work in parallel with a person: if another OpenCode is open and the project changed
# (not by this runner) less than $QuietMin minutes ago, wait.
function Wait-UserSession {
  if ($NoWait) { return }
  while ($true) {
    $peer = Peer-Pids
    $ext = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -like 'opencode*' -and ($script:OwnPids -notcontains $_.Id) -and ($peer -notcontains $_.Id) })
    if ($ext.Count -eq 0) { return }
    $newest = Newest-Change
    if ($newest -le $script:LastOwnActivity.AddMinutes(2)) { return }
    $q = ((Get-Date) - $newest).TotalMinutes
    if ($q -ge $QuietMin) { return }
    $script:Phase = 'CHO PHIEN OPENCODE CUA BAN RANH'
    Heartbeat ('cho phien OpenCode khac ranh: repo yen ' + [int]$q + '/' + $QuietMin + ' phut')
    Start-Sleep -Seconds 60
    if (Test-Path $StopFile) { return }
  }
}

function Load-Queue {
  $list = @()
  $files = @(Get-ChildItem -Path $QueueDir -Filter '*.md' -File -ErrorAction SilentlyContinue | Sort-Object Name)
  foreach ($f in $files) {
    if ($f.Name -match '^\d+_([A-Za-z0-9]+)_') {
      $list += [pscustomobject]@{ Id = $Matches[1]; File = $f.Name; Path = $f.FullName; Blocked = $false }
    }
  }
  $script:Tasks = $list
}

# A dependency counts as met once it has a .done marker in either lane (written only after a
# successful merge into main, or by hand to skip a task).
function Deps-Missing([string]$Id) {
  $miss = @()
  $deps = $AfterMap[$Id.ToUpper()]
  if (-not $deps) { return @() }
  foreach ($d in $deps) { if (-not (Task-Done $d)) { $miss += $d } }
  return $miss
}

function Next-Task {
  foreach ($t in $script:Tasks) {
    if (Is-PeerTask $t.Id) { continue }
    if (Test-Path (Join-Path $StateDir ($t.Id + '.done'))) { continue }
    $miss = @(Deps-Missing $t.Id)
    if ($miss.Count -gt 0) {
      return [pscustomobject]@{ Id = $t.Id; File = $t.File; Path = $t.Path; Blocked = $false; WaitFor = ($miss -join ', ') }
    }
    $bf = Join-Path $StateDir ($t.Id + '.blocked')
    $rf = Join-Path $StateDir ($t.Id + '.retry')
    if (Test-Path $bf) {
      $retry = (Test-Path $rf)
      if (-not $retry) { $retry = ((Get-Item $t.Path).LastWriteTime -gt (Get-Item $bf).LastWriteTime) }
      if ($retry) {
        Remove-Item -Path $bf -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $rf -Force -ErrorAction SilentlyContinue
        Log ($t.Id + ': thu lai')
        return $t
      }
      return [pscustomobject]@{ Id = $t.Id; File = $t.File; Path = $t.Path; Blocked = $true }
    }
    return $t
  }
  return $null
}

function Prompt-Implement([string]$Id, [string]$File, [string]$B, [bool]$Continue) {
  $p = 'You are running UNATTENDED inside the Kho Bau auto-runner on Windows: nobody will answer questions, so decide by yourself and write your decisions in the report. '
  $p += '1) Read docs/opencode/00_RULES.md, docs/opencode/README.md and the task file docs/opencode/queue/' + $File + ' (task ' + $Id + '). If the task file names an original spec (docs/opencode/Txx_*.md), read it too - the task file wins where they differ. '
  $p += '2) Fully implement task ' + $Id + ' - real source code and content changes, not just a plan. Some of the work may already exist from an earlier session: check git log and the code first, do not duplicate it, finish what is missing. '
  if ($Continue) { $p += 'An earlier run of this task was interrupted and part of it is already committed on this branch - check git diff main first. ' }
  $p += '3) Git: you are already on branch ' + $B + '. Do not create, switch, merge, rebase, stash or push branches; just commit your work on this branch. '
  $p += '4) Before finishing, npm run typecheck, npm test and npm run build must all pass; fix every failure. '
  $p += '5) Write docs/opencode/reports/' + $Id + '_REPORT.md as the rules require and commit everything. '
  $p += '6) The main deliverable of the task (the content, lessons, questions, games or features it asks for) is never optional: if an edit fails (for example a whitespace mismatch), rewrite the whole file with the write tool or put the new content in new files and import them. Only a genuinely impossible part may be replaced by the closest safe alternative, explained in the report - infrastructure alone with the content left for later is a failed task. Keep every single file you write under about 300 lines: split big content into several files (one per unit/topic) and import them - very long outputs time out (504) on free models. '
  $p += 'Never edit docs/opencode/queue, docs/opencode/state, docs/opencode/logs or docs/opencode/TRANG_THAI.md.'
  return $p
}

function Prompt-Finish([string]$Id, [string]$File, [string]$B) {
  $p = 'You are running UNATTENDED inside the Kho Bau auto-runner on Windows: nobody will answer questions. '
  $p += 'Task ' + $Id + ' (docs/opencode/queue/' + $File + ') was worked on in the current branch ' + $B + ', but its report docs/opencode/reports/' + $Id + '_REPORT.md says part of the work is not done. '
  $p += 'Read the task file, the original spec it names, the report and git diff main, then DO the missing work of THIS task now - above all its main deliverable (content, lessons, questions, games, features). Items the report says belong to other tasks are not yours: leave them. '
  $p += 'If an edit fails (for example a whitespace mismatch), put the new content in new files (each under about 300 lines) and import them, or rewrite a small file with the write tool. Add tests for what you add. '
  $p += 'Stay on branch ' + $B + ': do not create, switch, merge, stash or push branches. Run npm run typecheck, npm test and npm run build until all pass, commit, and update the report so it lists what is now done (keep a "not done" note only for something truly impossible, with the reason).'
  return $p
}

function Prompt-Fix([string]$Id, [string]$File, [string]$B, [string]$Failed) {
  $p = 'You are running UNATTENDED inside the Kho Bau auto-runner on Windows: nobody will answer questions. '
  $p += 'Task ' + $Id + ' (docs/opencode/queue/' + $File + ') was implemented on the current branch ' + $B + ', but the automatic check failed for: ' + $Failed + '. '
  $p += 'Read docs/opencode/logs/' + $Id + '_FAIL.txt first - it contains the end of the failing output. '
  $p += 'Fix the root causes in the code or content. Do not delete, skip or weaken existing tests just to make them pass (docs/opencode/00_RULES.md lists the only allowed test changes), and never add code that resets saved progress. '
  $p += 'Stay on branch ' + $B + ': do not create, switch, merge, stash or push branches. '
  $p += 'Re-run npm run typecheck, npm test and npm run build until all three pass, commit the fixes, and add a short section named Auto-fix to docs/opencode/reports/' + $Id + '_REPORT.md (create the report if it is missing).'
  return $p
}

function Verify-Task([string]$Id, [int]$Round) {
  $steps = @(
    @{ Name = 'typecheck'; Cmd = 'npm run typecheck'; Min = 20 },
    @{ Name = 'test';      Cmd = 'npm test';          Min = 45 },
    @{ Name = 'build';     Cmd = 'npm run build';     Min = 20 }
  )
  [string[]]$failed = @()
  [string[]]$summary = @()
  foreach ($s in $steps) {
    Heartbeat ('kiem tra ' + $s.Name)
    $lf = Join-Path $LogDir ($Id + '_verify' + $Round + '_' + $s.Name + '.log')
    if (Test-Path $lf) { Remove-Item -Path $lf -Force -ErrorAction SilentlyContinue }
    $code = Run-Cmd $s.Cmd $lf $s.Min
    Log ('  ' + $s.Cmd + ' -> exit ' + $code)
    if ($code -ne 0) {
      $failed += $s.Name
      $summary += ('===== ' + $s.Cmd + ' (exit ' + $code + ') - last 150 lines =====')
      $summary += @(Get-Content -Path $lf -Tail 150 -Encoding UTF8 -ErrorAction SilentlyContinue)
      $summary += ''
    }
  }
  if ($failed.Count -gt 0) {
    try { Set-Content -Path (Join-Path $LogDir ($Id + '_FAIL.txt')) -Value $summary -Encoding UTF8 } catch {}
  }
  return ,$failed
}

function Prompt-Resolve([string]$Id, [string]$File, [string]$B) {
  $p = 'You are running UNATTENDED inside the Kho Bau auto-runner on Windows: nobody will answer questions. '
  $p += 'Task ' + $Id + ' (docs/opencode/queue/' + $File + ') is finished on the current branch ' + $B + '. Another runner lane merged other tasks into main meanwhile, so the runner has just merged the newest main into this branch, and that merge has conflicts (see git status and git diff). '
  $p += 'Resolve every conflict by editing the files so that BOTH sides keep working: keep the work of the other tasks that came from main and the work of task ' + $Id + '. Never drop lessons, questions, content, features or tests from either side; for lists and registries keep the entries of both sides; for .ai/CURRENT.md keep the lines of both sides. '
  $p += 'Remove every conflict marker, run npm run typecheck, npm test and npm run build until all three pass, then finish the merge with git add -A and git commit --no-edit. '
  $p += 'Stay on branch ' + $B + ': do not abort the merge and do not create, switch, rebase, stash or push branches. '
  $p += 'Add a short section named Merge to docs/opencode/reports/' + $Id + '_REPORT.md describing how the conflicts were resolved.'
  return $p
}

# verify, then let OpenCode fix failures up to $MaxFixAttempts times; returns the list of still failing steps
function Verify-And-Fix([string]$Id, [string]$File, [string]$B, [int]$Base) {
  $fails = Verify-Task $Id $Base
  $fix = 0
  while ($fails.Count -gt 0 -and $fix -lt $MaxFixAttempts) {
    $fix++
    Set-Result $Id ('dang tu sua loi lan ' + $fix + ': ' + ($fails -join ', '))
    $before = Work-State
    $code = @(Run-OpenCode (Prompt-Fix $Id $File $B ($fails -join ', ')) ('Auto ' + $Id + ' sua loi ' + ($Base + $fix)) (Join-Path $LogDir ($Id + '_fix' + ($Base + $fix))) $FixTimeoutMin)[-1]
    if ((Cur-Branch) -ne $B) { [void](Ensure-Branch $B) }
    Judge-Run $code $before
    Commit-All ('fix(' + $Id + '): auto-runner fix round ' + ($Base + $fix))
    $fails = Verify-Task $Id ($Base + $fix)
  }
  return ,$fails
}

# Worktrees that have main checked out: moving main under them would leave their files stale
# (and a later "git add -A" there would commit a silent revert), so merges wait for them.
function Main-CheckedOutAt {
  $paths = @()
  $cur = ''
  foreach ($line in @(& git worktree list --porcelain 2>$null)) {
    if ($line -like 'worktree *') { $cur = $line.Substring(9) }
    elseif ($line -eq 'branch refs/heads/main') { $paths += $cur }
  }
  return $paths
}

# Merge without ever checking out main (another lane may be merging at the same time):
#  1) merge the newest main into the task branch here (OpenCode resolves conflicts) and verify again
#  2) build the merge commit with commit-tree and move main with a compare-and-swap update-ref;
#     if main moved in between, go back to 1.
function Merge-Task([string]$B, [string]$Id, [string]$File) {
  Commit-All ('chore(' + $Id + '): luu truoc khi merge (auto-runner)')
  & git merge-base --is-ancestor $B main 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { return $true }
  $lf = Join-Path $LogDir ($Id + '_merge.log')
  $deadline = (Get-Date).AddMinutes($MergeWaitMin)
  $round = 0
  while ($true) {
    if ((Get-Date) -gt $deadline) { Log ($Id + ': qua ' + $MergeWaitMin + ' phut ma chua merge duoc'); return $false }
    if ((Cur-Branch) -ne $B) { [void](Ensure-Branch $B) }
    $old = Git-Out @('rev-parse', 'refs/heads/main')
    if (-not ($old -match '^[0-9a-f]{40}$')) { Log 'Khong doc duoc main'; return $false }
    & git merge-base --is-ancestor $old HEAD 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
      $round++
      if ($round -gt 4) { Log ($Id + ': main doi lien tuc, dung merge'); return $false }
      Heartbeat 'lay main moi nhat vao nhanh'
      Log ($Id + ': lay main moi nhat (' + $old.Substring(0, 7) + ') vao ' + $B)
      $code = Run-Cmd ('git merge --no-ff --no-edit ' + $old) $lf 5
      if ($code -ne 0) {
        $unmerged = Git-Out @('diff', '--name-only', '--diff-filter=U')
        if (-not $unmerged) {
          Run-Cmd 'git merge --abort' $lf 2 | Out-Null
          Log ($Id + ': git merge loi (khong phai xung dot) - xem logs/' + $Id + '_merge.log')
          return $false
        }
        Log ($Id + ': xung dot voi main o: ' + (($unmerged -split "`r?`n") -join ', ') + ' - giao OpenCode xu ly')
        Set-Result $Id ('dang xu ly xung dot khi merge (lan ' + $round + ')')
        for ($r = 1; $r -le 2; $r++) {
          $before = Work-State
          $code = @(Run-OpenCode (Prompt-Resolve $Id $File $B) ('Auto ' + $Id + ' xu ly xung dot ' + $round + '-' + $r) (Join-Path $LogDir ($Id + '_resolve' + $round + '_' + $r)) $FixTimeoutMin)[-1]
          $unmerged = Git-Out @('diff', '--name-only', '--diff-filter=U')
          $markers = Git-Out @('grep', '-n', '-I', '-E', '^(<<<<<<<|>>>>>>>) ', '--', '.')
          if (-not $unmerged -and -not $markers) { break }
          Judge-Run $code $before
        }
        if ($unmerged -or $markers -or ((Cur-Branch) -ne $B)) {
          Log ($Id + ': OpenCode chua xu ly het xung dot')
          Run-Cmd 'git merge --abort' $lf 2 | Out-Null
          if ((Cur-Branch) -ne $B) { & git checkout -q $B 2>$null | Out-Null }
          return $false
        }
        Commit-All ('merge(' + $Id + '): lay main moi nhat vao ' + $B + ' (auto-runner)')
        & git rev-parse -q --verify MERGE_HEAD 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { & git commit -q --no-edit 2>$null | Out-Null }
      }
      $fails = Verify-And-Fix $Id $File $B (10 * $round)
      if ($fails.Count -gt 0) {
        Log ($Id + ': sau khi lay main moi nhat van hong ' + ($fails -join ', '))
        return $false
      }
      continue
    }
    $busy = @(Main-CheckedOutAt)
    if ($busy.Count -gt 0) {
      $script:Note = ''
      Heartbeat ('cho merge: main dang duoc mo o ' + ($busy -join ', ') + ' - hay chuyen thu muc do sang nhanh khac')
      Start-Sleep -Seconds 60
      continue
    }
    $head = Git-Out @('rev-parse', 'HEAD')
    $tree = Git-Out @('rev-parse', 'HEAD^{tree}')
    $new = Git-Out @('commit-tree', $tree, '-p', $old, '-p', $head, '-m', ("Merge branch '" + $B + "'"))
    if (-not ($new -match '^[0-9a-f]{40}$')) { Log ($Id + ': commit-tree loi'); return $false }
    & git update-ref -m ('auto-runner: merge ' + $B) refs/heads/main $new $old 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Log ($Id + ': da merge vao main ' + $new.Substring(0, 7))
      return $true
    }
    Log ($Id + ': main vua doi trong luc merge - thu lai')
  }
}

function Process-Task($T) {
  $id = $T.Id
  $file = $T.File
  $b = 'p42/' + $id
  $script:Current = $id
  $script:TaskStart = Get-Date
  $report = Join-Path $RepDir ($id + '_REPORT.md')
  Set-Result $id 'dang chay'
  if (-not (Ensure-Branch $b)) { Set-Result $id 'LOI: khong tao/chuyen duoc sang nhanh git'; return $false }

  # 1) implement (resume-aware: a task counts as implemented once its report exists)
  $attempt = 0
  $models = @(Model-List).Count
  $maxAttempts = [Math]::Min(6, [Math]::Max(3, $models + 1))
  while ((-not (Test-Path $report)) -and $attempt -lt $maxAttempts) {
    $attempt++
    $cont = ((Ahead $b) -gt 0)
    Set-Result $id ('OpenCode dang lam (lan ' + $attempt + ', ' + $script:ModelId + ')')
    $before = Work-State
    $code = @(Run-OpenCode (Prompt-Implement $id $file $b $cont) ('Auto ' + $id + ' lan ' + $attempt) (Join-Path $LogDir ($id + '_run' + $attempt)) $TaskTimeoutMin)[-1]
    if ((Cur-Branch) -ne $b) { Log ('Canh bao: dang o nhanh ' + (Cur-Branch) + ', chuyen ve ' + $b); [void](Ensure-Branch $b) }
    if (-not (Test-Path $report)) { Judge-Run $code $before }
    Commit-All ('chore(' + $id + '): luu thay doi con lai (auto-runner)')
    if ((-not (Test-Path $report)) -and ((Ahead $b) -eq 0) -and $attempt -ge 2 -and $models -le 1) { break }
  }
  Commit-All ('chore(' + $id + '): luu thay doi con lai (auto-runner)')
  if ((-not (Test-Path $report)) -and ((Ahead $b) -eq 0)) {
    Set-Result $id ('LOI: OpenCode khong tao ra thay doi nao - xem logs/' + $id + '_run*.err.log')
    return $false
  }

  # 1b) a report that admits the main work is not done gets one extra round to finish it
  if (Test-Path $report) {
    $rtxt = ''
    try { $rtxt = [IO.File]::ReadAllText($report) } catch {}
    if ($rtxt -match '(?i)(ch\u01b0a (th\u1ef1c hi\u1ec7n|ho\u00e0n th\u00e0nh|ho\u00e0n t\u1ea5t)|kh\u00f4ng th\u1ec3 (th\u00eam|t\u1ea1o|s\u1eeda|ho\u00e0n)|not (implemented|done|completed)|left for later)') {
      Log ($id + ': bao cao ghi con viec chua lam - giao OpenCode lam not')
      Set-Result $id ('dang lam not phan con thieu (' + $script:ModelId + ')')
      $before = Work-State
      $code = @(Run-OpenCode (Prompt-Finish $id $file $b) ('Auto ' + $id + ' lam not') (Join-Path $LogDir ($id + '_finish')) $TaskTimeoutMin)[-1]
      if ((Cur-Branch) -ne $b) { [void](Ensure-Branch $b) }
      Judge-Run $code $before
      Commit-All ('chore(' + $id + '): lam not phan con thieu (auto-runner)')
    }
  }

  # 2) verify + automatic fix rounds
  $fails = Verify-And-Fix $id $file $b 0
  if ($fails.Count -gt 0) {
    Set-Result $id ('LOI: van hong ' + ($fails -join ', ') + ' sau ' + $MaxFixAttempts + ' lan tu sua - xem logs/' + $id + '_FAIL.txt')
    return $false
  }

  # 3) merge into local main (takes in the other lane's work first and verifies again)
  Set-Result $id 'dang merge vao main'
  if (-not (Merge-Task $b $id $file)) {
    Set-Result $id ('LOI: merge vao main that bai - xem logs/runner.log va logs/' + $id + '_merge.log')
    return $false
  }
  $mins = [int]((Get-Date) - $script:TaskStart).TotalMinutes
  Set-Content -Path (Join-Path $StateDir ($id + '.done')) -Value (Get-Date -Format s) -Encoding Ascii
  $extra = ''
  if (-not (Test-Path $report)) { $extra = ', THIEU bao cao' }
  Set-Result $id ('XONG - typecheck/test/build OK, da merge vao main (' + $mins + ' phut' + $extra + ')')
  return $true
}

# ---------------------------------------------------------------- main

Disable-QuickEdit
if (-not (Acquire-Lock)) {
  Write-Host 'Auto Runner dang chay o mot cua so khac - khong mo them. Xem docs\opencode\TRANG_THAI.md'
  Start-Sleep -Seconds 5
  exit 0
}
Remove-Item -Path $StopFile -Force -ErrorAction SilentlyContinue

# Clean environment: nothing inherited from git hooks, children marked as runner-owned.
Get-ChildItem Env: | Where-Object { $_.Name -like 'GIT_*' } | ForEach-Object { Remove-Item -Path ('Env:' + $_.Name) -ErrorAction SilentlyContinue }
$env:P42_RUNNER = '1'
$env:OPENCODE_DISABLE_AUTOUPDATE = '1'

# Changes this runner made just before a restart are its own, not a person's.
if (Test-Path $MainLog) { $script:LastOwnActivity = (Get-Item $MainLog).LastWriteTime }

$failedHard = $false
try {
  Log '===== Kho Bau Auto Runner v3.1 khoi dong ====='
  if ($Lane -or $Only -or $Skip -or $After) { Log ('Luong: ' + $Lane + ' | chi lam: ' + ($OnlyIds -join ',') + ' | bo qua: ' + ($SkipIds -join ',') + ' | cho: ' + $After + ' | thu muc: ' + $Root) }
  Install-Autostart
  Load-Queue
  Write-Status
  $script:OC = Find-OpenCode
  if (-not $script:OC) {
    $script:Phase = 'LOI: khong tim thay lenh opencode tren may nay'
    $failedHard = $true
    Log $script:Phase
  }
  else {
    Log ('OpenCode: ' + $script:OC)
    Detect-Capabilities
    # one-time cleanup of audit leftovers (the archive was committed by mistake in T01)
    & git ls-files --error-unmatch '.audit_src.tgz' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { & git rm -q --cached '.audit_src.tgz' 2>$null | Out-Null; Log 'Da bo .audit_src.tgz khoi git' }
    foreach ($junk in @('.audit_src.tgz', 'docs\opencode\state\kb_now.tgz', 'docs\opencode\state\run-all.v2.ps1')) {
      Remove-Item -Path (Join-Path $Root $junk) -Force -ErrorAction SilentlyContinue
    }
    while ($true) {
      if (Test-Path $StopFile) { $script:Phase = 'DA DUNG THEO YEU CAU'; break }
      $prevCfg = $Only + '|' + $Skip + '|' + $After
      Read-LaneConfig
      Apply-LaneIds
      if (($Only + '|' + $Skip + '|' + $After) -ne $prevCfg) { Log ('Doi phan cong luong: chi lam: ' + $Only + ' | bo qua: ' + $Skip + ' | cho: ' + $After) }
      Load-Queue
      $t = Next-Task
      if (-not $t) {
        $script:Phase = 'XONG HET HANG DOI - DANG CHO VIEC MOI'
        $script:Current = '-'
        $script:Note = ''
        Allow-Sleep
        Write-Status
        if ($Once) { break }
        Start-Sleep -Seconds $IdlePollSec
        continue
      }
      if ($t.WaitFor) {
        $script:Phase = ('CHO LUONG KHAC: ' + $t.Id + ' can ' + $t.WaitFor + ' xong truoc')
        $script:Current = $t.Id
        $script:Note = ''
        Allow-Sleep
        Write-Status
        if ($Once) { break }
        Start-Sleep -Seconds $IdlePollSec
        continue
      }
      if ($t.Blocked) {
        $script:Phase = ('TAM DUNG: ' + $t.Id + ' bi loi - sua file task hoac tao state/' + $t.Id + '.retry de chay lai')
        $script:Current = $t.Id
        $script:Note = ''
        Allow-Sleep
        Write-Status
        if ($Once) { break }
        Start-Sleep -Seconds $IdlePollSec
        continue
      }
      Wait-UserSession
      if (Test-Path $StopFile) { continue }
      $script:ModelId = Pick-Model
      $script:Phase = 'DANG CHAY'
      Stay-Awake
      $ok = Process-Task $t
      if (-not $ok) { Set-Content -Path (Join-Path $StateDir ($t.Id + '.blocked')) -Value (Get-Date -Format s) -Encoding Ascii }
      $script:LastOwnActivity = Get-Date
      $script:Note = ''
      Allow-Sleep
    }
  }
}
catch {
  Log ('Loi khong mong doi: ' + $_.Exception.Message)
  $failedHard = $true
  $script:Phase = 'LOI KHONG MONG DOI - xem docs/opencode/logs/runner.log'
}
finally {
  $script:Note = ''
  Write-Status
  Allow-Sleep
  Remove-Item -Path $LockFile -Force -ErrorAction SilentlyContinue
  Log ('===== Ket thuc: ' + $script:Phase + ' =====')
}
