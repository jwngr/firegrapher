/**
 * Creates a D3Graph instance.
 *
 * @constructor
 * @this {D3Graph}
 * @param {object} config A list of options and styles which explain what the graph and how to style the graph.
 * @param {string} cssSelector The CSS selector of the tag which will hold the graph.
 */
var D3Graph = function(config, cssSelector) {

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  var _config = config;
  var _cssSelector = cssSelector;
  var _graph;
  var _xScale, _yScale, _xDomain, _yDomain;
  var _numSeries;

  var _this = this;

  /**
   * Public
   */
  this.init = function() {
    this.data = {};
    _xDomain = { min: 0, max: 0 };
    _yDomain = { min: 0, max: 0 };
    _numSeries = 0;

    if (_config.type === "bar") {
      _xScale = d3.scale.ordinal();
    }
    else {
      _xScale = d3.scale.linear()
        .domain([_xDomain.min, _xDomain.max]); // wait for first data point to auto-snap
    }

    _xScale
      .range([0, _config.styles.size.width]);
    _yScale = d3.scale.linear()
      .domain([_yDomain.min, _yDomain.max]) // wait for first data point to auto-snap
      .range([_config.styles.size.height, 0]);
  };

  this.draw = function() {
    var margin = { top: 20, bottom: 30, left: 60, right: 20 };
    var height = _config.styles.size.height - margin.bottom - margin.top;
    var width = _config.styles.size.width - margin.left - margin.right;

    // if we need to redraw the scales,
    // that means everything on it, is not to scale
    // so we need to redraw the entire graph
    if (!_graph || d3.selectAll(_cssSelector + " svg").empty()) {
      _graph = d3.select(_cssSelector)
        .append("svg")
          .attr("class", "fg-" + _config.type)
          .attr("width", _config.styles.size.width)
          .attr("height", _config.styles.size.height)
          .append("g")
            .attr("transform", "translate("+margin.left+", "+margin.bottom+")");
      // append graph title
      if (_config.title) {
        _graph.append("text")
          .attr("class", "fg-title")
          .attr("x", (width / 2))
          .attr("y", 0 - (margin.top / 2))
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("text-decoration", "underline")
          .text(_config.title);
      }
    }

    // set the range based on the calculated width and height
    _yScale.range([height-margin.bottom, 0]);
    if (_config.type === "bar") {
      _xScale.rangeRoundBands([0, width], 0.1, 1);
    } else {
      _xScale.range([0, width]);
    }

    // set the new axes
    var xAxis = d3.svg.axis()
      .orient("bottom")
      .scale(_xScale)
      .ticks(Math.floor(width * 0.035))
      .tickSize(-height+margin.bottom, -height+margin.bottom);

    var yAxis = d3.svg.axis()
      .orient("left")
      .scale(_yScale)
      .ticks(Math.floor(height * 0.035))
      .tickSize(-width, -width);

    // adding new x scale
    if (_graph.selectAll("g.fg-x-axis").empty()) {
      _graph
        .append("g")
          .attr("class", "fg-axis fg-x-axis")
          .attr("transform", "translate(0," + (height-margin.bottom) + ")")
          .attr("shape-rendering", "crispEdges")
          .call(xAxis);
      _graph
        .append("text")
          .attr("class", "fg-axis-label fg-x-axis-label")
          .attr("transform", "translate("+width+", "+(height+margin.bottom/2)+")")
          .attr("fill", _config.styles.axes.x.label.fillColor)
          .attr("font-size", _config.styles.axes.x.label.fontSize)
          .attr("font-weight", "bold")
          .style("text-anchor", "end")
          .text(_config.xCoord.label);
    } else {
      // update axis with new xAxis
      _graph.selectAll("g.fg-x-axis")
        .call(xAxis);
    }
    
    // adding new y scale
    if (_graph.selectAll("g.fg-y-axis").empty()) {
      _graph
        .append("g")
          .attr("class", "fg-axis fg-y-axis")
          .attr("shape-rendering", "crispEdges")
          .call(yAxis);
      _graph
        .append("text")
          .attr("class", "fg-axis-label fg-y-axis-label")
          .attr("transform", "rotate(-90)")
          .attr("fill", _config.styles.axes.y.label.fillColor)
          .attr("font-size", _config.styles.axes.y.label.fontSize)
          .attr("font-weight", "bold")
          .attr("dy", -margin.left + 16) // -margin.left will put it at 0, need to make room for text so add a bit for text size
          .style("text-anchor", "end")
          .text(_config.yCoord.label);
    } else {
      // update axis with new yAxis
      _graph.selectAll("g.fg-y-axis")
        .call(yAxis);
    }

    // Style the graph
    _graph.selectAll(".domain")
      .attr("stroke", _config.styles.outerStrokeColor)
      .attr("stroke-width", _config.styles.outerStrokeWidth)
      .attr("fill", _config.styles.fillColor)
      .attr("fill-opacity", _config.styles.fillOpacity);
    _graph.selectAll(".fg-x-axis .tick")
      .attr("stroke", _config.styles.innerStrokeColor)
      .attr("stroke-width", (_config.type === "bar") ? 0 : _config.styles.innerStrokeWidth);
    _graph.selectAll(".fg-x-axis text")
      .attr("stroke", "none")
      .attr("fill", _config.styles.axes.x.ticks.fillColor)
      .attr("font-size", _config.styles.axes.x.ticks.fontSize);
    _graph.selectAll(".fg-y-axis .tick")
      .attr("stroke", _config.styles.innerStrokeColor)
      .attr("stroke-width", _config.styles.innerStrokeWidth);
    _graph.selectAll(".fg-y-axis text")
      .attr("stroke", "none")
      .attr("fill", _config.styles.axes.y.ticks.fillColor)
      .attr("font-size", _config.styles.axes.y.ticks.fontSize);

    // reload the lines and datapoints
    for (var seriesName in _this.data) {
      if (_this.data.hasOwnProperty(seriesName)) {
        var seriesIndex = _this.data[seriesName].seriesIndex;
        var coordinates = _this.data[seriesName].values;

        // if scales haven't changed, go ahead and add the new data point
        switch (_config.type) {
          case "line":
            _drawLegend();
            _drawLine(seriesIndex, coordinates);
            _drawDataPoints(seriesIndex, coordinates);
            break;
          case "scatter":
            _drawLegend();
            _drawDataPoints(seriesIndex, coordinates);
            break;
          case "bar":
            _drawBar(seriesIndex, seriesName, _this.data[seriesName].aggregation);
            break;
        }
        if (typeof coordinates === "undefined") {
          // coordinates have been removed, delete the series
          delete _this.data[seriesName];
          if (_config.type === "bar") {
            // update xDomain to remove empty bar and redraw
            _xScale.domain(Object.keys(_this.data));
            _this.draw();
          }
        }
      }
    }
  };

  this.addDataPoint = function(newDataPoint) {
    switch (_config.type) {
      case "bar":
        _addDataPointToBarGraph(newDataPoint);
        break;
      case "line":
      case "scatter":
        _addDataPointToGraph(newDataPoint);
        break;
    }
  };

  /**
   * Private
   */
  function _addDataPointToBarGraph(newDataPoint) {
    var redrawGraph = false;
    // if a series doesn't exist, create it
    if (typeof _this.data[newDataPoint.series] === "undefined") {
      redrawGraph = true;
      _numSeries += 1;
      _this.data[newDataPoint.series] = {
        seriesIndex: _numSeries,
        values : [],
        aggregation: 0
      };
      // x is an ordinal of all of the series, since a new one was introduced, add it
      _xScale.domain(Object.keys(_this.data));
    }
    _this.data[newDataPoint.series].values.push(newDataPoint.value);
    var aggtype = "median";
    var i = 0;
    switch(aggtype) {
      case "mean":
        var sum = 0;
        for (; i < _this.data[newDataPoint.series].values.length; i++) {
          sum += _this.data[newDataPoint.series].values[i];
        }
        _this.data[newDataPoint.series].aggregation = sum / _this.data[newDataPoint.series].values.length;
        break;
      case "median":
        var tmpArray = _this.data[newDataPoint.series].values.slice(0); // slice will clone
        tmpArray.sort(function(a, b) { return a-b; });
        _this.data[newDataPoint.series].aggregation = tmpArray[Math.ceil(tmpArray.length / 2)];
        break;
      case "min":
        _this.data[newDataPoint.series].aggregation = Number.MAX_VALUE;
        for (; i < _this.data[newDataPoint.series].values.length; i++) {
          if (_this.data[newDataPoint.series].values[i] < _this.data[newDataPoint.series].aggregation) {
            _this.data[newDataPoint.series].aggregation = _this.data[newDataPoint.series].values[i];
          }
        }
        break;
      case "max":
        _this.data[newDataPoint.series].aggregation = Number.MIN_VALUE;
        for (; i < _this.data[newDataPoint.series].values.length; i++) {
          if (_this.data[newDataPoint.series].values[i] > _this.data[newDataPoint.series].aggregation) {
            _this.data[newDataPoint.series].aggregation = _this.data[newDataPoint.series].values[i];
          }
        }
        break;
      case "sum":
        _this.data[newDataPoint.series].aggregation += newDataPoint.value;
        break;
      default: // default sum
        _this.data[newDataPoint.series].aggregation += newDataPoint.value;
        break;
    }
    _this.data[newDataPoint.series].aggregation = (_this.data[newDataPoint.series].aggregation) ? _this.data[newDataPoint.series].aggregation : 0;

    redrawGraph = redrawGraph || _changeScales(
      // x is an ordinal, don't try to set min and max domains
      null,
      // y is based on 0 to the max value in values
      [0, _this.data[newDataPoint.series].aggregation]);
    if (redrawGraph) {
      // if the scales have changed, we will redraw everything with the new data points
      _this.draw();
    } else {
      // if scales haven't changed, go ahead and add the new data point
      _drawBar(_numSeries, newDataPoint.series, _this.data[newDataPoint.series].aggregation);
    }
  }

  function _addDataPointToGraph(newDataPoint) {
    // TODO: BUG: there seem to be multiples of each data point for series 1+
    // if a series doesn't exist, create it
    if (typeof _this.data[newDataPoint.series] === "undefined") {
      _this.data[newDataPoint.series] = {
        seriesIndex: _numSeries,
        streamCount : 0,
        values : []
      };
      _numSeries += 1;
    }
    _this.data[newDataPoint.series].streamCount += 1;

    // Update the data at the datapoint
    var coordinates = _this.data[newDataPoint.series].values;
    coordinates.push(newDataPoint);
    if (coordinates.length > 1 && newDataPoint.xCoord <= coordinates[coordinates.length - 2].xCoord) {
      // need to sort because x coords are now out of order (so that our line doesn't plot backwards)
      coordinates.sort(function(a, b) { return b.xCoord - a.xCoord; });
    }

    // get the domain with the new coordinate
    var redrawGraph = _changeScales(
      d3.extent(coordinates, function(d) { return d.xCoord; }),
      d3.extent(coordinates, function(d) { return d.yCoord; }));

    // if we're doing a time series, shift the graph accordingly
    if (_config.xCoord.limit && coordinates.length > _config.xCoord.limit) {
      coordinates.shift();
      // force the domain change after shifting all the points
      _xScale.domain(d3.extent(coordinates, function(d) { return d.xCoord; }));
      redrawGraph = true;
    }

    // if the scales have changed, we will redraw everything with the new data points
    if (redrawGraph) {
      _this.draw();
    } else {
      var seriesIndex = _this.data[newDataPoint.series].seriesIndex;
      _drawLegend();
      switch (_config.type) {
        case "line":
          _drawLine(seriesIndex, coordinates);
          _drawDataPoints(seriesIndex, coordinates);
          break;
        case "scatter":
          _drawDataPoints(seriesIndex, coordinates);
          break;
      }
    }
  }

  // Graphing Methods
  /**
   * Takes in a min and max for both x and y coordinates and adjusts the scales as necessary
   * @xMinMax is an array of 2 numbers [min, max]
   * @yMinMax is an array of 2 numbers [min, max]
   * @return true if scales were changed
   */
  function _changeScales(xMinMax, yMinMax) {
    var changedX = false, changedY = false;
    // update the scales based on the new domains
    if (xMinMax && xMinMax[0] < _xDomain.min) {
      _xDomain.min = xMinMax[0];
      changedX = true;
    }
    if (xMinMax && xMinMax[1] > _xDomain.max) {
      _xDomain.max = xMinMax[1];
      changedX = true;
    }
    if (yMinMax && yMinMax[0] < _yDomain.min) {
      _yDomain.min = yMinMax[0];
      changedY = true;
    }
    if (yMinMax && yMinMax[1] > _yDomain.max) {
      _yDomain.max = yMinMax[1];
      changedY = true;
    }
    if (changedX) {
      _xScale.domain([_xDomain.min, _xDomain.max]);
    }
    if (changedY) {
      var padding = (_yDomain.max - _yDomain.min) * 0.1;
      _yScale.domain([_yDomain.min - padding, _yDomain.max + padding]);
    }
    return changedX || changedY;
  }

  function _drawLegend() {
    var series = [];
    for (var k in _this.data) {
      if (k !== "undefined") {
        series.push(k);
      }
    }
    // if multiple series, draw new legend
    _graph.selectAll("g.fg-legend").remove();
    if (series.length > 1) {
      var margin = { top: 5, bottom: 5, left: 5, right: 5 };
      var padding = { right: 5, bottom: 15 };
      var legendWidth = 50;
      var legendHeight = series.length * 20;
      var x = _config.styles.size.width - (legendWidth + margin.left + margin.right) * 2 - padding.right;
      var y = _config.styles.size.height - (legendHeight + margin.top + margin.bottom) * 2 - padding.bottom;

      // can't attach text to rect, so make a g with both
      var gs = _graph.append("g")
        .attr("class", "fg-legend");
      gs
        .append("rect") // append rectangle for shape if necessary, stroke set to none to remove
          .attr("class", "fg-legend-container")
          .attr("x", x)
          .attr("y", y)
          .attr("width", legendWidth + margin.left + margin.right)
          .attr("height", legendHeight + margin.top + margin.bottom)
          .style("stroke", _config.styles.legend.stroke)
          .style("stroke-width", _config.styles.legend.strokeWidth)
          .style("fill", _config.styles.legend.fill)
          .style("fill-opacity", _config.styles.legend.fillOpacity);

      // append the series name and appropriate stroke color
      var texts = gs.selectAll("text")
        .data(series);
      texts
        .enter().append("text")
          .attr("class", function(d, i) {
            return "fg-legend-series fg-series-" + i;
          })
          .attr("x", x)
          .attr("y", y)
          .attr("dx", legendWidth)
          .attr("dy", function(d, i) { return (i+1) * 20; })
          .style("text-anchor", "end")
          .style("stroke", "none")
          .style("fill", function(d, i) {
            return _config.styles.series.strokeColors[i];
          })
          .style("font-size", _config.styles.legend.fontSize)
          .text(function(d) {
            return d;
          });
    }
  }

  function _drawLine(seriesIndex, dataPoints) {
    var margin = { top: 20, bottom: 30, left: 60, right: 20 };
    // margin.bottom * 2 because we subtract it once in the yAxis transform and once in the range
    var height = _config.styles.size.height - margin.bottom * 2 - margin.top;

    var area = d3.svg.area()
      .defined(function(d) { return d !== null; })
      .x(function(value) {
        return _xScale(value.xCoord);
      })
      // we want to fill from the bottom of the line to the bottom of the graph
      // y0 is the added height for the difference between the line and the graph bottoms
      .y0(height)
      // y1 is the added height between the top of the line and the bottom of the line
      .y1(function(value) {
        return _yScale(value.yCoord);
      });

    if (dataPoints) {
      // if we have data points, graph it
      var areaObj = _graph.selectAll("path.fg-area-" + seriesIndex);
      if (areaObj.empty()) {
        // if path doesn't exist, create it
        areaObj = _graph
          .append("path")
            .attr("class", "fg-area fg-area-" + seriesIndex)
            .attr("stroke", _config.styles.series.strokeColors[seriesIndex])  // What if more series than colors?
            .attr("stroke-width", _config.styles.series.strokeWidth)
            .attr("fill", _config.styles.series.strokeColors[seriesIndex])
            .attr("fill-opacity", 0.5);
      }
      // update the path with the data points if any
      if (dataPoints.length > 0) {
        areaObj
          .attr("d", area(dataPoints));
      }
    } else {
      // if there's no data, remove the path element
      _graph
        .selectAll("path.fg-area-" + seriesIndex)
          .remove();
    }
  }

  function _drawDataPoints(seriesIndex, dataPoints) {
    // add/remove data points as necessary
    if (dataPoints) {
      var dataPointObjects = _graph
        .selectAll("circle.fg-series-" + seriesIndex)
          .data(dataPoints);
      dataPointObjects
        .enter()
          .append("circle")
          .attr("class", "fg-marker fg-series-" + seriesIndex)
          .attr("stroke", _config.styles.markers.strokeColors[seriesIndex]) // What if more series than colors?
          .attr("stroke-width", _config.styles.markers.strokeWidth)
          .attr("fill", _config.styles.markers.fillColors[seriesIndex]);
      dataPointObjects
        .exit().remove();

      // update remaining data points x and y
      dataPointObjects
        .attr("cx", function(dataPoint) {
          return _xScale(dataPoint.xCoord);
        })
        .attr("cy", function(dataPoint) {
          return _yScale(dataPoint.yCoord);
        })
        .attr("r", _config.styles.markers.size);
    } else {
      _graph.selectAll("circle.fg-series-" + seriesIndex).remove();
    }
  }

  function _drawBar(seriesIndex, seriesName, value) {
    if (typeof value !== "undefined") {
      if (_graph.selectAll(".fg-bar .fg-series-" + seriesIndex).empty()) {
        // bar doesn't exist for series, add it
        _graph
          .append("rect")
            .attr("class", "fg-bar fg-series-" + seriesIndex);
      } else {
        // bar exists, update values
        _graph
          .select(".fg-bar .fg-series-" + seriesIndex)
            .datum(value)
            .attr("x", function() { return _xScale(seriesName); })
            .attr("width", _xScale.rangeBand())
            .attr("y", function(d) { return _yScale(d); })
            .attr("height", function(d) { return _yScale.range()[0] - _yScale(d); });
      }
    } else {
      // no data, no bar
      _graph.selectAll(".fg-bar .fg-series-" + seriesIndex).remove();
    }
  }
};
