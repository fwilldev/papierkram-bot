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
read -p 'Start Datum (Format: DD.MM.YYYY): ' startdatevar
read -p 'End Datum (Format: DD.MM.YYYY): ' enddatevar
read -p 'Start Zeit: (Format: HH:MM) ' starttimevar
read -p 'End Zeit: (Format: HH:MM) ' endtimevar

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
      read -p 'Email Adresse: ' emailvar
  fi
else
  read -p 'Papierkram URL: ' urlvar
  read -p 'Tätigkeitsbeschreibung: (zB Entwicklung) ' descriptionvar
  read -p 'Email Adresse: ' emailvar
fi

echo 'Passwort: '
read -s passwortvar

if test -z "$startdatevar" || test -z "$enddatevar" || test -z "$starttimevar" || test -z "$endtimevar" || test -z "$startdatevar" || test -z "$descriptionvar" || test -z "$emailvar" || test -z "$passwortvar"; then
      echo "Ein Argument ist leer. Bitte alle Argumente ausfüllen!"
      exit 0
fi

node index.js "$startdatevar" "$enddatevar" "$starttimevar" "$endtimevar" "$descriptionvar" "$emailvar" "$passwortvar" "$urlvar"
echo "Script durchgelaufen."
