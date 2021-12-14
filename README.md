# bbb-pads
BigBlueButton's pads manager

## Instructions
At your BigBlueButton server, clone and install this app:
```
git clone https://github.com/bigbluebutton/bbb-pads.git
cd bbb-pads
npm install
```
Copy the settings' template file and replace `ETHERPAD_API_KEY` with your Etherpad's server API key
```
cp config/settings.json.template config/settings.json
```
Run the app:
```
npm start
```
