var helper = require('./helper');
var config = require('../config');
var _ = require('lodash');
var Promise = require('bluebird');
var needle = Promise.promisifyAll(require('needle'));

module.exports = function(app) {
  var connections = [];
  app.get('/pop', function(req, res, next) {
    res.render('popular_co', { title: 'Popular Articles' });
  });

  app.io.route('popular_co', function(req) {
    req.io.join('popular_co')
  });

  function fetchData() {
    if (!app.io.sockets.clients('popular_co').length) {
      setTimeout(fetchData, 5000);
      return;
    }
    // Format the URLs
    console.log("Fetching popular");
    var chartbeat_template = _.template("<%= chartbeat_url %>/live/toppages/v3/?limit=50&apikey=<%= api_key %>&host=")
    var chartbeat_string = chartbeat_template({
      chartbeat_url: config.chartbeat_url,
      api_key: config.api_key
    });

    var urls = [];
    _.forEach(config.sites, function(site) {
      urls.push(chartbeat_string + site);
    });

    var articles = [];
    var current = Promise.resolve();
    Promise.map(urls, function(URL) {
      current = current.then(function() {
        return needle.getAsync(URL);
      });
      return current;
    }).map(function(res) {
      var articles = [];
      //console.log(res[1]);
      _.forEach(res[1].pages, function(article) {
        if (helper.isSectionPage(article.path)) {
          return;
        }
        articles.push({
          path: article.path,
          title: article.title,
          visits: article.stats.visits
        });
      });

      return articles;
    }).then(function(articles) {
      articles = _.sortByOrder(_.flatten(articles), ['visits'], false);

      app.io.room('popular_co').broadcast('chartbeat', {
          articles: articles.splice(0, 40)
      });
    }).then(function() {
      console.log('All needle requests saved!')
    }).catch(function(e) {
      console.log(e);
    });

    setTimeout(fetchData, 5000);
  }

  fetchData();
}