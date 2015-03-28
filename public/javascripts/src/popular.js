var _ = require('lodash');
var $ = require('jquery-browserify');
var article = require('./obj/article');

$(function() {
  var socket = io.connect();
  socket.emit('popular');
  socket.on('chartbeat', function(data) {
    $('.articles').html('');

    _.forEach(data.articles, function(article_data) {
      var article_obj = article(article_data);
      article_obj.draw();
    });

  });  
});

