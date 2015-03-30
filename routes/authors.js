var _ = require('lodash');
var util = require('util');
var moment = require('moment');
var Promise = require('bluebird');
var needle = Promise.promisifyAll(require('needle'));

var express = require('express');
var router = express.Router();

var config = require('../config');
var parse = require('../helpers/parse');
var constants = require('../helpers/constants');
var Beat = require('../helpers/obj/beat');

router.get('/', function(req, res, next) {
  res.render('authors', { title: 'Popular Authors' });
});

module.exports = {
  router: router,
  beat: function(app) {
    var beat = Beat({
      app: app,
      page: 'authors',
      socket: 'authors',
      apiName: 'toppages',
      chartbeatResponse: function(responses) {
        var authors = {};

        // parse chartbeat response data
        _.forEach(responses, function(response) {
          _.forEach(response[1].pages, function(item) {
            // Parse item
            var keys = ['path', 'title', 'authors', 'stats'];
            keyError = false;
            _.forEach(keys, function(key) {
              if (!item.hasOwnProperty(key)) {
                keyError = true;
                return false;
              }
            });

            if (keyError || 
                !item.stats.hasOwnProperty('visits') ||
                parse.isSectionPage(item.path) ||
                !item.title.trim()) {
              return;
            }

            var newArticle = {
              title: item.title,
              url: item.path,
              visits: item.stats.visits,
              authors: item.authors
            };

            // Iterate over authors for this item
            _.forEach(item.authors, function(auth) {
              auth = auth.replace('by', '').replace('the', '');
              var authorSplit = auth.split(' and ');

              // Split and really iterate this time
              _.forEach(authorSplit, function(author) {
                author = parse.toTitleCase(author.trim());
                if (!author) {
                  return;
                }

                // Add to author object
                if (author in authors) {
                  authors[author].articles.push(newArticle);
                  authors[author].totalVisits += newArticle.visits;
                }
                else {
                  authors[author] = {
                    name: author,
                    articles: [newArticle],
                    totalVisits: newArticle.visits
                  }
                }
              });
            });  
            
          });
        });
  
        authors = _.sortByOrder(authors, ['totalVisits'], [false]);
        console.log('sending articles');
        // send parsed chartbeat data to client
        app.io.room('authors').broadcast('chartbeat', {
          authors: {
            name: 'authors',
            children: authors.slice(0, 50)
          }
        });
      }
    });
  }
};
