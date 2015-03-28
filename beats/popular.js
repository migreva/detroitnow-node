var helper = require('./helper')
var config = require('../config');
var _ = require('lodash');

module.exports = function(app) {

  var connections = [];
  var num_connections = 
  app.io.route('popular', function(req) {
    req.io.join('popular')
  });

  function fetchData() {
    if (!app.io.sockets.clients('popular').length){
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

    // Fetch the URLs
    helper.getChartbeatUrls(urls, function(responses) {

      // Iterate over the articles in the responses
      var articles = [];
      _.forEach(responses, function(response) {

        // Iterate over each page
        var body = JSON.parse(response.body);
        _.forEach(body.pages, function(page) {

          // Don't include if it's a section page
          if (helper.isSectionPage(page.path)) {
            return;
          }

          var article = {
            path: page.path,
            title: page.title,
            visits: page.stats.visits
          } 

          articles.push(article);
        });
      });

      articles = _.sortByOrder(articles, ['visits'], false);

      app.io.room('popular').broadcast('chartbeat', {
          articles: articles.splice(0, 40)
      })
    });

    setTimeout(fetchData, 5000);
  }

  fetchData();
}