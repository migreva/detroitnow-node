# DetroitNow - Node

## Install
```bash
npm install
npm install -g grunt-cli
```

## Setup
* Create a config.js file with the following contents
```javascript
module.exports = {
  chartbeat_url: 'http://api.chartbeat.com',
  api_key: '...', // Chartbeat API key
  sites: [...] // list of sites to look at chartbeat info for
}
```

## Run
```bash
node app.js
```

Opens at ```http://localhost:3000```

## Watch js files
```bash
grunt browserify:watch
```