# DetroitNow - Node

## Dependencies
* [Nodejs](http://nodejs.org)
* [Grunt](http://gruntjs.com)
* [Bower](http://bower.io)
* [Nodemon](http://nodemon.io/)

## Install
```bash
npm install
npm install -g grunt-cli nodemon bower
bower install
```

## Setup
* Create a config.js file with the following contents
```javascript
module.exports = {
  chartbeatUrl: 'http://api.chartbeat.com',
  api_key: '...', // Chartbeat API key
  sites: [...] // list of sites to look at chartbeat info for
}
```

## Run
```bash
nodemon app.js
```

Opens at ```http://localhost:3000```

## Watch js files
```bash
grunt browserify:watch
```