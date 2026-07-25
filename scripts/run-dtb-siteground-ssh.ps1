[CmdletBinding()]
param(
    [string]$HostName = "ssh.elliottm4.sg-host.com",
    [int]$Port = 18765,
    [string]$UserName = "u2350-gksz9clvygx0",
    [string]$IdentityFile = "C:\Users\Elliott\.ssh\dtb-production",
    [string]$RemoteDirectory = "/home/u2350-gksz9clvygx0/www/elliottm4.sg-host.com/public_html",
    [string]$Command = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Assert-Executable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required executable '$Name' was not found. Enable the Windows OpenSSH Client."
    }
}

Assert-Executable -Name "ssh"

if (-not (Test-Path -LiteralPath $IdentityFile -PathType Leaf)) {
    throw "SSH private key not found: $IdentityFile"
}

$target = "$UserName@$HostName"

$sshArguments = @(
    "-p", "$Port",
    "-i", $IdentityFile,
    "-o", "IdentitiesOnly=yes",
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "ServerAliveInterval=30",
    "-o", "ServerAliveCountMax=4",
    "-o", "TCPKeepAlive=yes"
)

Write-Host ""
Write-Host "Drywall Toolbox SiteGround SSH"
Write-Host "Target:           $target"
Write-Host "Port:             $Port"
Write-Host "Remote directory: $RemoteDirectory"
Write-Host ""

if ([string]::IsNullOrWhiteSpace($Command)) {
    $remoteBootstrap = "cd '$RemoteDirectory' && exec bash -l"
    & ssh @sshArguments -t $target $remoteBootstrap
}
else {
    $escapedCommand = $Command.Replace("'", "'\''")
    $remoteBootstrap = "cd '$RemoteDirectory' && bash -lc '$escapedCommand'"
    & ssh @sshArguments $target $remoteBootstrap
}

$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    throw "SSH session ended with exit code $exitCode."
}
