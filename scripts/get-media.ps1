[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
}[0]

function Await($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    $asTask = $asTaskGeneric.MakeGenericMethod($type)
    $netTask = $asTask.Invoke($null, @($asyncOp))
    $completed = $netTask.Wait(2500)
    if ($completed) {
        return $netTask.Result
    }
    return $null
}

try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media,ContentType=WindowsRuntime] | Out-Null
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media,ContentType=WindowsRuntime] | Out-Null
    [Windows.Storage.Streams.IRandomAccessStreamWithContentType,Windows.Storage.Streams,ContentType=WindowsRuntime] | Out-Null
    
    $asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
    $manager = Await $asyncOp ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    
    if (-not $manager) {
        Write-Output '{"Status":"NoManager"}'
        exit 0
    }

    $sessions = $manager.GetSessions()
    $targetSession = $null

    foreach ($s in $sessions) {
        if ($s.SourceAppUserModelId -like "*Spotify*") {
            $targetSession = $s
            break
        }
    }

    if (-not $targetSession) {
        $targetSession = $manager.GetCurrentSession()
    }

    if ($targetSession) {
        $info = $targetSession.GetPlaybackInfo()
        $propsOp = $targetSession.TryGetMediaPropertiesAsync()
        $props = Await $propsOp ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
        $timeline = $targetSession.GetTimelineProperties()

        if ($props) {
            $statusStr = if ($info) { "$($info.PlaybackStatus)" } else { "Unknown" }
            $pos = if ($timeline -and $timeline.Position) { [int]$timeline.Position.TotalSeconds } else { 0 }
            $dur = if ($timeline -and $timeline.EndTime) { [int]$timeline.EndTime.TotalSeconds } else { 0 }
            
            # Extrair Capa nativa via Windows SMTC
            $coverUrl = $null
            if ($props.Thumbnail) {
                try {
                    $coverDir = Join-Path $PSScriptRoot "..\public\cache"
                    if (-not (Test-Path $coverDir)) {
                        New-Item -ItemType Directory -Path $coverDir -Force | Out-Null
                    }

                    $rawKey = ($props.Artist + " - " + $props.Title).Trim()
                    $hashBytes = [System.Security.Cryptography.MD5]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($rawKey))
                    $hash = [BitConverter]::ToString($hashBytes).Replace('-', '').ToLower()
                    $fileName = "cover_$hash.png"
                    $filePath = Join-Path $coverDir $fileName

                    if (-not (Test-Path $filePath)) {
                        $streamOp = $props.Thumbnail.OpenReadAsync()
                        $streamType = [Windows.Storage.Streams.IRandomAccessStreamWithContentType,Windows.Storage.Streams,ContentType=WindowsRuntime]
                        $stream = Await $streamOp $streamType
                        if ($stream) {
                            $asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethods() | Where-Object {
                                $_.Name -eq 'AsStreamForRead' -and $_.GetParameters().Count -eq 1
                            }[0]
                            $inputStream = $asStreamMethod.Invoke($null, @($stream))
                            $fileStream = [System.IO.File]::Create($filePath)
                            $inputStream.CopyTo($fileStream)
                            $fileStream.Close()
                            $inputStream.Close()
                        }
                    }

                    if (Test-Path $filePath) {
                        $coverUrl = "/cache/$fileName"
                    }
                } catch {
                    # Falha silenciosa na extração de capa
                }
            }

            $result = [PSCustomObject]@{
                App = $targetSession.SourceAppUserModelId
                Title = $props.Title
                Artist = $props.Artist
                Album = $props.AlbumTitle
                CoverUrl = $coverUrl
                Status = $statusStr
                Position = $pos
                Duration = $dur
            }
            $json = $result | ConvertTo-Json -Compress
            [Console]::Out.WriteLine($json)
            exit 0
        }
    }
    
    Write-Output '{"Status":"NoSession"}'
} catch {
    $msg = $_.Exception.Message
    Write-Output "{""Status"":""Error"",""Message"":""$msg""}"
}
