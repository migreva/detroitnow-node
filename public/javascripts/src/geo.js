var $ = require('../../bower/jquery/dist/jquery.min');
var L = require('leaflet');
var io = require('socket.io-browserify');
var Handlebars = require('handlebars');

// :(
// http://learnjs.io/blog/2013/11/08/leaflet-basics/
L.Icon.Default.imagePath = '/images';

// Handlebars tempalte
$(function() {
  var marker_popup_template = Handlebars.compile($("#marker-popup-template").html());

  Handlebars.registerHelper("getPlatformImage", function(options){

    var platform = this.platform.toLowerCase();

    if (platform == "desktop"){
        return "<i class='fa fa-desktop fa-3x'></i>"
    }
    else if (platform == "mobile"){
        return "<i class='fa fa-mobile fa-5x'></i>"
    }
    else if (platform == "tablet"){
        return "<i class='fa fa-tablet fa-5x'></i>"
    }
    else{
        return platform;
    }
  });


  var map = L.map("map", { zoomControl:false })
              .setView([39.5, -96.196289], 5);

  // create the tile layer with correct attribution
  // add an OpenStreetMap tile layer
  L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var marker;

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }

  function connect_socket() {
    var socket = io.connect();
    socket.emit('geo');
    // Server sent a message to the client, update dashboard
    socket.on('chartbeat', function(data) {
      var response = data

      if (response.hasOwnProperty("users")) {
          $("#concurrent").html(response.users);
      }

      if (response.hasOwnProperty("geoPoint")) {
        var person = response.geoPoint;

        //place marker
        var data = {
          "title": person.title,
          "path": person.path,
          "platform": person.platform,
          "host": person.host.replace(".com", ""),
        };

        // Remove the currently placed point, if it exists
        if (!marker){
            marker = L.marker([person.lat, person.lng]).addTo(map);
        }
        else{
            marker.setLatLng([person.lat, person.lng]).update();
        }

        map.setView([person.lat + 3, person.lng]);

        var popup = L.popup({"className" : "marker-popup-class"}).
                        setContent(marker_popup_template(data));
        marker.bindPopup(popup).openPopup();

      }
    });

    return socket;
  }

  var socket = connect_socket();
});
