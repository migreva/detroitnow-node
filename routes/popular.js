var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var needle = Promise.promisifyAll(require('needle'));

var express = require('express');
var router = express.Router();

var config = require('../config');
var parse = require('../helpers/parse');

var chartbeat_template = _.template("<%= chartbeat_url %>/live/toppages/v3/?limit=50&apikey=<%= api_key %>&host=");
var chartbeat_string = chartbeat_template({
  chartbeat_url: config.chartbeat_url,
  api_key: config.api_key
});

var urls = [];
_.forEach(config.sites, function(site) {
  urls.push(chartbeat_string + site);
});

router.get('/', function(req, res, next) {
  res.render('popular', { title: 'Popular Articles' });
});

// Required to handle an array of promises
// https://github.com/petkaantonov/bluebird/blob/master/API.md#promisecoroutineaddyieldhandlerfunction-handler---void
Promise.coroutine.addYieldHandler(function(yieldedValue) {
  if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
});

module.exports = {
  router: router,
  beat: function(app) {
    app.io.route('popular', function(req) {
      req.io.join('popular');
    });

    var fetchData = Promise.coroutine(function* () {
      if (!app.io.sockets.clients('popular').length) {
        console.log(moment() + ": no clients connected to the popular dashboard, ignoring request");
        setTimeout(function(app) {
          fetchData(app);
        }, config.loop_interval);
        return;
      }

      var promises = [];
      var articles = [];

      console.log(moment() + ": fetching popular data");
      _.forEach(urls, function(url) {
        promises.push(needle.getAsync(url));
      });

      // send requests to chartbeat in parallel
      try {
        var responses = yield promises;
      } catch (e) {
        console.log(moment() + ": " + e);
      }

      // parse chartbeat response data
      _.forEach(responses, function(response) {
        _.forEach(response[1].pages, function(article) {
          if (parse.isSectionPage(article.path)) return;

          articles.push({
            path: article.path,
            title: article.title,
            visits: article.stats.visits
          });
        });
      });

      // send parsed chartbeat data to client
      app.io.room('popular').broadcast('chartbeat', {
        articles: articles.splice(0, 40)
      });

      setTimeout(function(app) {
        fetchData(app);
      }, config.loop_interval);
    });

    fetchData(app);
  }
};
