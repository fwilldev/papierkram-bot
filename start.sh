read -p 'Papierkram URL mit https: ' urlvar
read -p 'Start Datum: ' startdatevar
read -p 'End Datum: ' enddatevar
read -p 'Start Zeit: ' starttimevar
read -p 'End Zeit: ' endtimevar
read -p 'Tätigkeitsbeschreibung: ' descriptionvar
read -p 'Email Adresse: ' emailvar
echo 'Passwort: '
read -s passwortvar

if test -z "$startdatevar" || test -z "$enddatevar" || test -z "$starttimevar" || test -z "$endtimevar" || test -z "$startdatevar" || test -z "$descriptionvar" || test -z "$emailvar" || test -z "$passwortvar"
then
      echo "Ein Argument ist leer. Bitte alle Argumente ausfüllen!"
      exit 0
fi
DIR="node_modules"

if [ ! -d "$DIR" ]; then
    echo "Node Modules existieren nicht. Werden installiert: "
    npm install
fi

node index.js $startdatevar $enddatevar $starttimevar $endtimevar $descriptionvar $emailvar $passwortvar $urlvar
