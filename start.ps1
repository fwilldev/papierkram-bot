Write-Host "



  _____        _____ _____ ______ _____  _  _______            __  __
 |  __ \ /\   |  __ \_   _|  ____|  __ \| |/ /  __ \     /\   |  \/  |
 | |__) /  \  | |__) || | | |__  | |__) | ' /| |__) |   /  \  | \  / |
 |  ___/ /\ \ |  ___/ | | |  __| |  _  /|  < |  _  /   / /\ \ | |\/| |
 | |  / ____ \| |    _| |_| |____| | \ \| . \| | \ \  / ____ \| |  | |
 |_|_/_/ ___\_\_|___|_____|______|_|  \_\_|\_\_|  \_\/_/    \_\_|  |_|
 |  _ \ / __ \__   __|
 | |_) | |  | | | |
 |  _ <| |  | | | |
 | |_) | |__| | | |
 |____/ \____/  |_|


"

Write-Host "Automatisch Zeiten buchen vom Start Datum bis End Datum - Wochenenden und Feiertage für ausgewähltes Bundesland ausgeschlossen."
Write-Host "Drücke STRG+C um das Skript abzubrechen!"

if (Get-Command 'Get-Date' -ErrorAction SilentlyContinue) {
    $now = Get-Date -Format "dd.MM.yyyy"
    Write-Host "Heutiges Datum: $now"
}

$usemonth = $null
while ($usemonth -ne "y" -and $usemonth -ne "n") {
    $usemonth = Read-Host "Soll für den aktuellen Monat gebucht werden? z.B. wenn keine Urlaub genommen wurde [y/n]"
}

$eightHours = $null
while ($eightHours -ne "y" -and $eightHours -ne "n") {
    $eightHours = Read-Host "Sollen immer 8 Stunden (08:00 Uhr bis 16:00 Uhr) gebucht werden? [y/n]"
}

if ($usemonth -eq "n") {
    $startdatevar = Read-Host 'Start Datum (Format: DD.MM.YYYY)'
    $enddatevar = Read-Host 'End Datum (Format: DD.MM.YYYY)'
}

if ($eightHours -eq "y") {
    $starttimevar = '08:00'
    $endtimevar = '16:00'
}
else {
    $starttimevar = Read-Host 'Start Zeit: (Format: HH:MM)'
    $endtimevar = Read-Host 'End Zeit: (Format: HH:MM)'
}

if (Test-Path "history.json") {
    $history = Get-Content "history.json" | ConvertFrom-Json
    Write-Host '-----------Historie-----------'
    Write-Host 'Zuletzt verwendet:'
    Write-Host "Papierkram-URL: $($history.url)"
    Write-Host "E-Mail Adresse: $($history.email)"
    Write-Host "Tätigkeitsbeschreibung: $($history.subject)"
    Write-Host '------------------------------'

    $input = $null
    while ($input -ne "y" -and $input -ne "n") {
        $input = Read-Host "Werte aus der Historie verwenden? [y/n]"
    }

    if ($input -ne "y") {
        $urlvar = Read-Host 'Papierkram URL'
        $descriptionvar = Read-Host 'Tätigkeitsbeschreibung: (zB Entwicklung)'
        $emailvar = Read-Host 'E-Mail Adresse'
    }
    else {
        $urlvar = $history.url
        $descriptionvar = $history.subject
        $emailvar = $history.email
    }
}
else {
    $urlvar = Read-Host 'Papierkram URL'
    $descriptionvar = Read-Host 'Tätigkeitsbeschreibung: (zB Entwicklung)'
    $emailvar = Read-Host 'E-Mail Adresse'
}

if ($usemonth -eq "n" -and (-not $startdatevar -or -not $enddatevar -or -not $starttimevar -or -not $endtimevar -or -not $descriptionvar -or -not $emailvar -or -not $urlvar)) {
    Write-Host "Ein Argument ist leer. Bitte alle Argumente ausfüllen!"
    exit
}

& node index.js $startdatevar $enddatevar $starttimevar $endtimevar $descriptionvar $emailvar $urlvar $usemonth "false"
Write-Host "Script durchgelaufen."
