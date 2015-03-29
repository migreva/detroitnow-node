var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var needle = Promise.promisifyAll(require('needle'));

var config = require('../config');
var helper = require('./helper');

module.exports = function(app) {
  'use strict';

  app.get('/', function(req, res, next) {
    res.render('popular', { title: 'Popular Articles' });
  });

  app.io.route('popular', function(req) {
    req.io.join('popular')
  });

  var chartbeat_template = _.template("<%= chartbeat_url %>/live/toppages/v3/?limit=50&apikey=<%= api_key %>&host=")
  var chartbeat_string = chartbeat_template({
    chartbeat_url: config.chartbeat_url,
    api_key: config.api_key
  });

  var urls = [];
  _.forEach(config.sites, function(site) {
    urls.push(chartbeat_string + site);
  });

  // Required to handle an array of promises
  // https://github.com/petkaantonov/bluebird/blob/master/API.md#promisecoroutineaddyieldhandlerfunction-handler---void
  Promise.coroutine.addYieldHandler(function(yieldedValue) {
    if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
  });

  // Coroutine = generator + promises
  // https://github.com/petkaantonov/bluebird/blob/master/API.md#generators
  var fetchData = Promise.coroutine(function* () {
    if (!app.io.sockets.clients('popular').length) {
      setTimeout(fetchData, 5000);
      console.log(moment() + ": no clients connected to the popular dashboard, ignoring request")
      return;
    }

    console.log(moment() + ": fetching popular data");

    var promises = [];
    var articles = [];

    _.forEach(urls, function(url) {
      promises.push(needle.getAsync(url));
    });

    // send requests to chartbeat in parallel
    try {
      var responses = yield promises;
    } catch (e) {
      console.log(moment() + ": " + e);
    }

    _.forEach(responses, function(response) {
      _.forEach(response[1].pages, function(article) {
        if (helper.isSectionPage(article.path)) return;

        articles.push({
          path: article.path,
          title: article.title,
          visits: article.stats.visits
        });
      });
    });

    app.io.room('popular').broadcast('chartbeat', {
      articles: articles.splice(0, 40)
    });

    setTimeout(fetchData, 5000);
  });

  fetchData();
}