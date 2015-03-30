var _ = require('lodash');
var moment = require('moment');

var express = require('express');
var router = express.Router();

var config = require('../config');
var parse = require('../helpers/parse');
var constants = require('../helpers/constants');
var Beat = require('../helpers/obj/beat');

router.get('/', function(req, res, next) {
  res.render('popular', { title: 'Popular Articles' });
});

module.exports = {
  router: router,
  beat: function(app) {
    var beat = Beat({
      app: app,
      page: 'popular',
      socket: 'popular',
      apiName: 'toppages',
      chartbeatResponse: function(responses) {
        var articles = [];

        // parse chartbeat response data
        _.forEach(responses, function(response) {
          _.forEach(response.pages, function(article) {
            if (parse.isSectionPage(article.path)) return;

            articles.push({
              path: article.path,
              title: article.title,
              visits: article.stats.visits
            });
          });
        });

        articles = _.sortByOrder(articles, ['visits'], [false]);
        // send parsed chartbeat data to client
        app.io.room('popular').broadcast('chartbeat', {
          articles: articles.splice(0, 40)
        });
      }
    });
  }
};
