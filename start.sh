echo "


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
echo "Automatisch Zeiten buchen vom Start Datum bis End Datum - Wochenenden und Feiertage für ausgewähltes Bundesland ausgeschlossen."
echo "Drücke STRG+C um das Skript abzubrechen!"
if command -v cal > /dev/null 2>&1; then
  echo "Aktueller Monat: "
  echo ""
  cal
fi
if command -v date > /dev/null 2>&1;  then
  now=$(date +"%d.%m.%Y")
  echo "Heutiges Datum: $now"
fi
while [[ $usemonth != "y" && $usemonth != "n" ]]; do
  echo ""
  read -p "Soll für den aktuellen Monat gebucht werden? z.B. wenn keine Urlaub genommen wurde [y/n]" usemonth
done
while [[ $eightHours != "y" && $eightHours != "n" ]]; do
  echo ""
  read -p "Sollen immer 8 Stunden (08:00 Uhr bis 16:00 Uhr) gebucht werden? [y/n]" eightHours
done
if [[ $usemonth == "n" ]]; then
  echo "Bitte Start und End Datum eingeben: "
  read -p 'Start Datum (Format: DD.MM.YYYY): ' startdatevar
  read -p 'End Datum (Format: DD.MM.YYYY): ' enddatevar
fi
if [[ $eightHours == "y" ]]; then
  starttimevar='08:00'
  endtimevar='16:00'
else
  echo "Bitte Start Zeit und End Zeit eingeben: "
  read -p 'Start Zeit: (Format: HH:MM) ' starttimevar
  read -p 'End Zeit: (Format: HH:MM) ' endtimevar
fi

if [ -f history.json ]; then
  urlvar=$(grep -o '"url": "[^"]*' history.json | grep -o '[^"]*$')
  descriptionvar=$(grep -o '"subject": "[^"]*' history.json | grep -o '[^"]*$')
  emailvar=$(grep -o '"email": "[^"]*' history.json | grep -o '[^"]*$')
  echo '-----------Historie-----------'
  echo 'Zuletzt verwendet:'
  echo 'Papierkram-URL: ' "$urlvar"
  echo 'E-Mail Adresse: ' "$emailvar"
  echo 'Tätigkeitsbeschreibung: ' "$descriptionvar"
  echo '------------------------------'
  while [[ $input != "y" && $input != "n" ]]; do
    read -p "Werte aus der Historie verwenden? [y/n]" input
  done
  if [[ $input == "y" ]]; then
    echo ""
  else
      echo "Neue Werte eingeben: "
      read -p 'Papierkram URL: ' urlvar
      read -p 'Tätigkeitsbeschreibung: (zB Entwicklung) ' descriptionvar
      read -p 'E-Mail Adresse: ' emailvar
  fi
else
  read -p 'Papierkram URL: ' urlvar
  read -p 'Tätigkeitsbeschreibung: (zB Entwicklung) ' descriptionvar
  read -p 'E-Mail Adresse: ' emailvar
fi

if [[ $usemonth == "n" ]]; then
  if test -z "$startdatevar" || test -z "$enddatevar" || test -z "$starttimevar" || test -z "$endtimevar" || test -z "$descriptionvar" || test -z "$emailvar" || test -z "$urlvar" ; then
    echo "Ein Argument ist leer. Bitte alle Argumente ausfüllen!"
    exit 0
  fi
fi

node index.js "$startdatevar" "$enddatevar" "$starttimevar" "$endtimevar" "$descriptionvar" "$emailvar" "$urlvar" "$usemonth" "false"
echo "Script durchgelaufen."
