var config = require('../config.js');
var _ = require('lodash');
var request = require('request');

var getChartbeatUrls = function(urls, return_function) {

  var responses = [];
  var num_urls = urls.length;

  // Iterate over all URLs, making requests to each and
  // getting the response
  _.forEach(urls, function(url) {
    console.log("Fetching URL" + url);
    request(url, function(error, response, body) {
      console.log('returned');
      responses.push(response);

      // When we've gotten all the responses, call the return function
      if (num_urls === responses.length) {
        return_function(responses);
      }
    });
  });
}

var isSectionPage = function(url) {
  if (url != "" &&
      url.indexOf('story/') === -1 &&
      url.indexOf('article/') === -1 &&
      url.indexOf('picture-gallery/') === -1 &&
      url.indexOf('longform/') === -1) {
    return true;
  }
  return false;
}

module.exports = {
  getChartbeatUrls: getChartbeatUrls,
  isSectionPage: isSectionPage
}