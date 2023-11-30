# Papierkram-Bot

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Automatische Zeiterfassung für die Finanzbuchhaltungssoftware "Papierkram".

Benötigt keinen Zugriff zur Papierkram API.

## Systemvoraussetzungen

Installierte Software:

- [Node.js](https://nodejs.org/en/download/)
- [Node Package Manager CLI (NPM CLI)](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## Installation

- Dieses Projekt auschecken oder herunterladen
- im entsprechenden Ordner `npm install` ausführen


## Benutzung

Linux/MacOS/WSL:
- `./start.sh` - script ausführen

Windows:
- Powershell-Script `start.ps1` ausführen 

Das Script leitet durch die einzelnen Schritte.

Die Papierkram-URL muss dabei immer die Subdomain bzw. URL zu der persönlichen Instanz sein!

Der Bot erfasst Zeiten in einem gegebenen Zeitraum und lässt dabei Wochenenden und Feiertage automatisch aus.

In der History werden folgende Elemente gespeichert und können wiederverwendet werden:

- Login E-Mail
- Tätigkeit
- Papierkram-URL

Außerdem kann unter MacOS das Passwort im Schlüsselbund gespeichert werden. 
