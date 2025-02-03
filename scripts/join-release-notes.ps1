param (
  [string]$NotesPath,
  [string]$RootPath = "C:\CTMS",
  [switch]$Append
)
Push-Location $RootPath
if (-Not (Test-Path $NotesPath))
{
  Write-Output "ENOENT $NotesPath"
} else
{
  $AppComponent=Split-Path -leaf $NotesPath
  if ($Append)
  {
    "# $AppComponent" | Out-File -FilePath .\RELEASE-NOTES.md -Append -Force
  } else
  {
    "# $AppComponent" | Out-File -FilePath .\RELEASE-NOTES.md -Force
  }
  "-------------------------------------------------------------------------" | Out-File -FilePath .\RELEASE-NOTES.md -Append -Force
  Get-Content "$NotesPath\LATEST-RELEASE.md" | Out-File -FilePath .\RELEASE-NOTES.md -Append -Force
}
Pop-Location
