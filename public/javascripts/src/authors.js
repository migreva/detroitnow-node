/*
* Authors popularity data representing live content
* aggregated from ChartBeat, updated every 5 seconds
*/

var $ = jQuery = require('../../bower/jquery/dist/jquery.min');
var _ = require('lodash');
var io = require('socket.io-browserify');
var d3 = require('../../bower/d3/d3.min');
var colorbrewer = require('../../bower/colorbrewer2/colorbrewer');
var bootstrap = require('../../bower/bootstrap/dist/js/bootstrap.min');

/*
* Globals for the scripts, mainly d3 variables setting the dimensions
* for the treemap
*/
$(function() {
  var margin = {
    "top": 10,
    "right": 10,
    "bottom": 100,
    "left": 10
  };
  var width = $(window).width() - margin.left - margin.right;
  var height = $(window).height() - margin.top - margin.bottom;
  var treemap = d3.layout.treemap()
                  .size([width, height])
                  .value(function(d) { return d.totalVisits; })
                  .sticky(false);
  // background colors
  var color = d3.scale.ordinal()
                .range(window.colorbrewer.Greens[9]);
  // primary treemap container
  var div = d3.select("#author_treemap")
              .append("div")
              .style("position", "relative")
              .style("width", (width + margin.left + margin.right) + "px")
              .style("height", (height + margin.top + margin.bottom) + "px")
              .style("left", margin.left + "px")
              .style("top", margin.top + "px");

  /*
  * Event Handlers
  */
  $("body").on("mouseenter", ".node", function() {
      $(this).css("border-color", "#000");
  });

  $("body").on("mouseleave", ".node", function() {
      $(this).css("border-color", "#FFF");
  });

  $("body").on("hidden.bs.modal", "#author_modal", function() {
      $(".modal-title").data("author", "");
  });

  /*
  * Functions
  */

  /*
   * Picks the font color based on the background color of the node
   */
  function font_color(bg_color) {
    var dark_colors = ["#00441b", "#006d2c", "#238b45", "#41ab5d"];
    if ($.inArray(bg_color, dark_colors) != -1) {
      return "white";
    }
    return "black";
  }

  /*
   * HTML that resides in an authors node
   */
  function node_html(data) {
    return data.children ? null : data.name + " <br/><span class='badge'>" + data.totalVisits + "</span>";
  }

  function position() {
    this.style("left", function(d) { return d.x + "px"; })
        .style("top", function(d) { return d.y + "px"; })
        .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
        .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
  };

  /*
   * Bootstrap modal that displays the author's articles and their popularity
  */
  function author_modal(data) {
    $(".modal-title")
      .data("author", data.name)
      .html(data.name + ": <span class='badge'>" + data.totalVisits + "</span> Total Visitors");

    var content = '';
    for (var i = 0; i < data.articles.length; i++) {
      content += '<p><span class="badge">' + data.articles[i].visits +
                 '</span> <a href="//' + data.articles[i].url + '" target="_blank">' +
                 data.articles[i].title + '</a></p>';
    }
    $(".modal-body").html(content);
  };

  function update_modal() {
    var author = $(".modal-title").data("author");
    if (author != "") {
      $(".node").each(function(e) {
        var data = this.__data__;
        if (data.name == author) {
          author_modal(data);
          return;
        }
      });
    }
  };

  /*
  * Web Socket functionality, takes initial data to generate treemap
  * and then continually updates that data
  */
  function connect_socket() {
    // Websocket used for constant streaming of data
    var socket = io.connect();
    socket.emit('authors');
    socket.on('chartbeat', function(data) {

      var response = data;
      if (!response.hasOwnProperty("authors")) {
        console.log('No authors');
        return;
      }

      // update existing author node text if exists
      div.selectAll(".node").html(node_html);
      // create new author nodes with new data
      var nodes = div.selectAll(".node")
                     .data(treemap.nodes(response.authors), function(d) { return d.name; });
      nodes.enter().append("div")
        .attr("class", "node")
        .on("click", function(d) {
            $("#author_modal").modal("toggle");
            author_modal(d);
        })
        .html(node_html);
      // remove old author nodes
      nodes.exit().remove();
      // create smooth transition effect
      nodes.transition().duration(1500)
        .call(position)
        .call(update_modal)
        .style("background", function(d) { return color(d.name); })
        .style("color", function(d) {
            return font_color(color(d.name));
        });

      // adjust font size based on the width of the node
      $('.node').each(function() {
        var node_width = $(this).width();
        if (node_width <= 70) {
            $(this).css('font-size', '12px');
        } else if (node_width > 70 && node_width < 110) {
            $(this).css('font-size', '14px');
        } else if( node_width > 240) {
            $(this).css('font-size', '24px');
        }
      });
    });

    return socket;
  };

  var socket = connect_socket();

});