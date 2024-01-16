#!/usr/bin/env bash
cd "$(dirname "$0")"

cp config/settings.json.template config/settings.json
sed -i "s/ETHERPAD_API_KEY/\"$(cat /usr/share/etherpad-lite/APIKEY.txt)\"/" config/settings.json

for var in "$@"
do
    if [[ $var == --reset ]] ; then
    	echo "Performing a full reset..."
      rm -rf node_modules
    fi
done

if [ ! -d ./node_modules ] ; then
	npm install
fi

sudo systemctl stop bbb-pads
npm start
