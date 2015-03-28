var Handlebars = require('handlebars');
var _ = require('lodash');
var $ = require('jquery-browserify');

$(function() {
  var article_template = Handlebars.compile($('#article-template').html());
  var socket = io.connect();
  socket.emit('popular');
  socket.on('chartbeat', function(data) {
    $('.articles').html('');

    _.forEach(data.articles, function(article) {
      var html = article_template(article);
      $('.articles').append(html);
    })

  });  
});

