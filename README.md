# bbb-pads
BigBlueButton's pads manager

## Instructions
At your BigBlueButton server, clone and install this app:
```bash
git clone https://github.com/bigbluebutton/bbb-pads.git
cd bbb-pads
npm install
```
Copy the settings' template file and replace `ETHERPAD_API_KEY` with your Etherpad's server API key
Find the key at `/usr/share/etherpad-lite/APIKEY.txt`
```bash
cp config/settings.json.template config/settings.json
```
Stop the service if it's running:
```bash
sudo systemctl stop bbb-pads
```

Run the app:
```bash
npm start
```
