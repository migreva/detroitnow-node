var _ = require('lodash');
var util = require('util');
var moment = require('moment');
var Chance = require('chance');

var express = require('express');
var router = express.Router();

var config = require('../config');
var parse = require('../helpers/parse');
var constants = require('../helpers/constants');
var Beat = require('../helpers/obj/beat');

router.get('/', function(req, res, next) {
  res.render('geo', { title: 'Popular Articles' });
});

var lastLatLng = {
  lat: -Infinity,
  lng: -Infinity
}

module.exports = {
  router: router,
  beat: function(app) {
    var beat = Beat({
      app: app,
      page: 'geo',
      socket: 'geo',
      apiName: 'recent',
      siteFilter: function(sites) {
        return [parse.getRandomSite()];
      },
      chartbeatResponse: function(responses) {
        var chance = new Chance();

        // Only one response expected 
        if (responses.length > 1) {
          console.log('More than one response returned');
        }

        // Iterate over people reading
        var geoData = {};
        var people = responses[0];
        var numPeople = people.length;
        for (var i = 0; i < numPeople; i++) {
          // Get random person
          var randomIndex = chance.integer({
            min: 0,
            max: numPeople - 1
          });
          console.log(randomIndex);
          var person = people[randomIndex];
          // console.log(util.inspect(person));

          // Check random person
          if (parse.isSectionPage(person.path) ||
              !(person.title.trim())) {
            continue;
          }
          geoData = {
              lat: person.lat,
              lng: person.lng,
              platform: person.platform,
              domain: person.domain,
              host: person.host,
              path: person.path,
              title: person.title,
              user_agent: person.user_agent,
              country: person.country,
          }

          var latLngDelta = parse.getDistance(
                                lastLatLng.lat,
                                lastLatLng.lng,
                                person.lat,
                                person.lng)
          if (latLngDelta > 5.0) {
            break;
          }
        }

        lastLatLng.lat = geoData.lat;
        lastLatLng.lng = geoData.lng;


        // send parsed chartbeat data to client
        app.io.room('geo').broadcast('chartbeat', {
          geoPoint: geoData
        });
      }
    });
  }
};
