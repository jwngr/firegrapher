/**
 * Creates a D3Map instance.
 *
 * @constructor
 * @this {D3Map}
 * @param {object} config A list of options and styles which explain what the graph and how to style the graph.
 * @param {string} cssSelector The CSS selector of the tag which will hold the graph.
 */
var D3Map = function(config, cssSelector) {

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  var _cssSelector = cssSelector;
  var _mapOverlay;

  var _this = this;

  /**
   * Public
   */
  this.init = function() {
    this.data = [];
    var map = new google.maps.Map(d3.select(_cssSelector).node(), {
      zoom: 8,
      center: new google.maps.LatLng(37.76487, -122.41948),
      mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    _mapOverlay = new google.maps.OverlayView();

    _mapOverlay.onAdd = function() {
      var layer = d3.select(_mapOverlay.getPanes().overlayLayer)
        .append("div")
          .attr("class", "stations");

      var projection = _mapOverlay.getProjection(),
          padding = 10;

      function transform(d) {
        d = new google.maps.LatLng(d.latitude, d.longitude);
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(_this)
            .style("left", (d.x - padding) + "px")
            .style("top", (d.y - padding) + "px");
      }

      // Draw each marker as a separate SVG element.
      _mapOverlay.draw = function() {

        if (_this.data.length !== 0) {
          var marker = layer.selectAll("svg")
              .data(_this.data)
              .each(transform) // update existing markers
            .enter().append("svg:svg")
              .each(transform)
              .attr("class", "marker");

          // Add a circle.
          // TODO: convert to line so that its radius r is stylable via CSS?
          // http://stackoverflow.com/questions/14255631/style-svg-circle-with-css
          marker.append("svg:circle")
              .attr("r", function(d) {
                return d.radius;
              })
              .attr("cx", function(d) {
                return d.radius + padding;
              })
              .attr("cy", function(d) {
                return d.radius + padding;
              });

          // Add a label.
          marker.append("svg:text")
              .attr("x", padding + 7)
              .attr("y", padding)
              .attr("dy", ".31em")
              .text(function(d) { return d.label; });
        }
        else {
          layer.selectAll("svg").remove();
        }
      };
    };

    // Bind our overlay to the map…
    _mapOverlay.setMap(map);
  };

  this.draw = function() {
    _mapOverlay.draw();
  };

  this.addDataPoint = function(newDataPoint) {
    _this.data.push(newDataPoint);
    _this.drawMap();
  };
};
