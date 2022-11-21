echo "Papierkram Bot V1"
echo "--------------------------------"
echo "Automatisches Zeiten buchen vom Start Datum bis End Datum - Wochenenden ausgeschlossen."
read -p 'Papierkram URL: ' urlvar
read -p 'Start Datum (Format: DD.MM.YYYY): ' startdatevar
read -p 'End Datum (Format: DD.MM.YYYY): ' enddatevar
read -p 'Start Zeit: (Format: HH:MM) ' starttimevar
read -p 'End Zeit: (Format: HH:MM) ' endtimevar
read -p 'Tätigkeitsbeschreibung: (zB Entwicklung) ' descriptionvar
read -p 'Email Adresse: ' emailvar
echo 'Passwort: '
read -s passwortvar

if test -z "$startdatevar" || test -z "$enddatevar" || test -z "$starttimevar" || test -z "$endtimevar" || test -z "$startdatevar" || test -z "$descriptionvar" || test -z "$emailvar" || test -z "$passwortvar"
then
      echo "Ein Argument ist leer. Bitte alle Argumente ausfüllen!"
      exit 0
fi

echo "Prüfe und installiere Dependencies: "
npm install

node index.js $startdatevar $enddatevar $starttimevar $endtimevar $descriptionvar $emailvar $passwortvar $urlvar
echo "Script durchgelaufen."
