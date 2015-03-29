var config = require('../../config');
var constants = require('../constants');

var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var needle = Promise.promisifyAll(require('needle'));


// Required to handle an array of promises
// https://github.com/petkaantonov/bluebird/blob/master/API.md#promisecoroutineaddyieldhandlerfunction-handler---void
Promise.coroutine.addYieldHandler(function(yieldedValue) {
  if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
});

module.exports = function(__options) {
  /** Options: 
    {
      // REQUIRED
      app: (obj) Express app
      page: (string) Jade template in <root>/views that will be displayed
      socket: (string) name of the event to listen to for socket connections
                        NOTE this will also be the name of the socket.io room that gets broadcasted to
      apiName: (string) e.g:  'toppages' (https://chartbeat.com/docs/api/explore/#endpoint=live/toppages/v3/)
                              'recent' (https://chartbeat.com/docs/api/explore/#endpoint=live/recent/v3/)
                        Will use chartbeat API + config.apiKey and config.sites to form the API

      // OPTIONAL
      articleResponse: (function) function used to parse chartbeat response. 
                                  DEFAULT - will pass all responses to client in array 

                        :param responses: All responses from the chartbeat API calls
    }
  */

  // Store variables
  var app;
  var options = __options;
  var requiredErrorTemplate = _.template('Required option "<%= name %> missing. <%= reason %>"');
  var chartbeatTemplate = _.template('<%= chartbeatUrl %><%= chartbeatApiString %>&apikey=<%= apiKey %>&host=');
  var chartbeatApis = {
    'toppages': '/live/toppages/v3/?limit=50'
  }
  var urls = [];
  var articleResponse = function(responses) {
      app.io.room('popular').broadcast('chartbeat', {
        responses: responses
      });
  }


  // Parse options
  // TODO make this parsing for types, etc of every option
  var requiredOptions = [{
    name: 'page',
    reason: 'Need jade template to render HTML page' 
  }, {
    name: 'socket',
    reason: 'Need a socket to connect to from the client side, and room to broadcast to'
  }, {
    name: 'apiName',
    reason: 'Need Chartbeat API name'
  }];
  _.forEach(requiredOptions, function(option) {
    if (!__options.hasOwnProperty(option.name)) {
      throw new Error(requiredErrorTemplate({
        name: option.name,
        reason: option.hasOwnProperty('reason') ? option.reason : ''
      }));
    }
  });

  // Iterate over options, do stuff with the one you want
  _.forEach(options, function(value, name) {
    if (name === 'app') {
      app = value;
    }

    if (name === 'socket') {
      options.room = value;
    }

    if (name === 'apiName') {
      if (!(value in chartbeatApis)) {
        throw new Error (_.template('API Name "<%= apiName =>" doesn\'t exist')({
          apiName: value
        }));
      }
    }

    if (name === 'articleResponse') {
      articleResponse = value;
    }
  });

  // Format chartbeat APIs
  var chartbeatString = chartbeatTemplate({
    chartbeatUrl: config.chartbeatUrl,
    chartbeatApiString: chartbeatApis[options.apiName],
    apiKey: config.apiKey
  });
  _.forEach(config.sites, function(site) {
    urls.push(chartbeatString + site);
  });

  // Register the route 
  app.io.route(options.socket, function(req) {
    req.io.join(options.socket);
  });

  var start = Promise.coroutine(function* () {
    var promises = [];

    // Don't do anything if no one's in this room
    if (!app.io.sockets.clients(options.room).length) {
      setTimeout(start, constants.loop_interval);
      return;
    }

    console.log(moment() + " Fetching " + options.socket);

    // Fetch URLs
    _.forEach(urls, function(url) {
      promises.push(needle.getAsync(url));
    });

    // Yield the responses
    try {
      var responses = []; 
      responses = yield promises;
    } catch (e) {
      console.log(moment() + ": " + e);
    }

    console.log('respones length (beat) ' + responses.length);

    articleResponse(responses);

    setTimeout(start, constants.loop_interval);
  });

  start();

  return {
    start: start
  }
}