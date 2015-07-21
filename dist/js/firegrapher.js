// FireGrapher is a JavaScript library that allows you to chart and graph
// your Firebase data, updated in realtime.
//
//   FireGrapher 1.0.0
//   https://github.com/firebase/firegrapher/
//   License: MIT

// Include d3 if this is being run in node
if (typeof module !== "undefined" && typeof process !== "undefined") {
    var d3 = require("d3");
}

var FireGrapher = (function() {
  "use strict";
/**
   * Creates a d3 graph of the data at firebaseRef according to the config options
   * and places it in the element specified by the inputted CSS selector.
   *
   * param {Firebase} firebaseRef A Firebase reference to the data that will be graphed.
   * param {string} cssSelector A unique CSS selector whose corresponding element will hold the graph.
   * param {object} config A collection of graph configuration options.
   */
var FireGrapher = function(firebaseRef, cssSelector, config) {
  /********************/
  /*  PRIVATE METHODS */
  /********************/
  /**
   *  Recursively loops through the inputted config object and sets any unspecified
   *  options to their default values
   */
  function _recursivelySetDefaults(outputConfig, defaultConfig) {
    for (var key in defaultConfig) {
      if (typeof defaultConfig[key] === "object") {
        outputConfig[key] = (outputConfig[key]) ? outputConfig[key] : {};
        _recursivelySetDefaults(outputConfig[key], defaultConfig[key]);
      }
      else {
        outputConfig[key] = (outputConfig[key]) ? outputConfig[key] : defaultConfig[key];
      }
      // TODO: change
      //outputConfig[key] = outputConfig[key] || defaultConfig[key];
    }
  }

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  // Validate the inputs
  _validateFirebaseRef(firebaseRef);
  _validateCssSelector(cssSelector);
  _validateConfig(config);

  // Recursively loop through the global config object and set any unspecified options
  // to their default values
  _recursivelySetDefaults(config, _getDefaultConfig());
  var el = document.querySelector(cssSelector);
  config.styles.size = {
    width: el.clientWidth,
    height: el.clientHeight
  };

  var d3Grapher;
  switch(config.type) {
    case "line":
    case "scatter":
    case "bar":
      d3Grapher = new D3Graph(config, cssSelector);
      break;
    case "map":
      d3Grapher = new D3Map(config, cssSelector);
      break;
    case "table":
      d3Grapher = new D3Table(config, cssSelector);
      break;
    default:
      throw new Error("Invalid config type: " + config.type);
  }

  // Initialize the graph
  d3Grapher.init();

  var parser = new FireGrapherParser(firebaseRef, config, d3Grapher);

  var initialPathsToRecords = [{
    "pathArray": [],
    "path": "/",
    "params": {}
  }];
  parser.parsePath(initialPathsToRecords, 0);

  //console.log(initialPathsToRecords);
  //_parsePath(pathDicts, 0);
};
/**
 * Creates a FireGrapherParser instance.
 *
 * @constructor
 * @this {FireGrapherParser}
 * @param {Firebase} firebaseRef A Firebase reference from where the FireGrapher data will be read.
 * @param {object} config A list of options and styles which explain what the graph and how to style the graph.
 * @param {FireGrapherD3} grapher Grapher instance used to draw the data.
 */
var FireGrapherParser = function(firebaseRef, config, grapher) {
  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  // Validate the inputs
  _validateFirebaseRef(firebaseRef);
  _validateConfig(config);
  _validateGrapher(grapher);

  // Store the input parameters in private variables for later use
  var _firebaseRef = firebaseRef;
  var _config = config;
  var _grapher = grapher;

  // Store the this object in a private variable so private methods can access it
  var _this = this;

  this.pathsToRecords = [];

  // Parse the path to an individual record
  var _pathToRecordTokens = _config.path.split("/");

  // Store references to all firebase listeners so that we can remove them when there is
  // no more data
  var _seriesListeners = {};

  /********************/
  /*  PUBLIC METHODS  */
  /********************/
  /**
   * Parses the path to an individual record and sets appropriate Firebase event handlers
   * to make the graph dynamic.
   *
   * param {list of dictionaries} pathDicts A list of dictionaries which specify paths along
   * which we need to listen for new records.
   * param {integer} nodeIndex The index of the current node along the parse path.
   */
  this.parsePath = function(pathDicts, nodeIndex) {
    // If we've gone through all parts of the path, we have made it to the individual records level
    if (nodeIndex === _pathToRecordTokens.length) {
      var eventToListenTo = (_pathToRecordTokens[_pathToRecordTokens.length - 1] === "*") ? "child_added" : "value";

      pathDicts.forEach(function(pathDict) {
        _listenForNewRecords(pathDict, eventToListenTo);
        if (eventToListenTo === "child_added") {
          _listenForRemovedRecords(pathDict);
          _listenForChangedRecords(pathDict);
        }
      });
    }

    // Otherwise, parse the next part of the path
    else {
      // Get the name of the current node in the path
      var node = _pathToRecordTokens[nodeIndex];

      // Make sure the * is only used as the last part of the path
      if (node[0] === "*") {
        if (nodeIndex !== (_pathToRecordTokens.length - 1)) {
          throw new Error("You can only use * as the last character in your \"path\"");
        }

        // Parse the path one last time
        this.parsePath(pathDicts, nodeIndex + 1);
      }

      // For a wildcard node, add it to the params list and find every possible node name
      else if (node[0] === "$") {
        pathDicts.forEach(function(pathDict) {
          // Create a series for each child in the path
          _firebaseRef.child(pathDict.path).on("child_added", function(childSnapshot) {
            // Append the current node's value to a new path dictionary
            var newPathDict = {
              "path": pathDict.path + childSnapshot.name() + "/",
              "params": {}
            };
            newPathDict.pathArray = [].concat(pathDict.pathArray);
            newPathDict.pathArray.push(childSnapshot.name());

            // Create the params object for the new path dictionary
            newPathDict.params[node] = childSnapshot.name();
            for (var key in pathDict.params) {
              if (pathDict.params.hasOwnnKey(key)) {
                newPathDict.params[key] = pathDict.params;
              }
            }

            // Recursively parse the path at the next level
            this.parsePath([newPathDict], nodeIndex + 1);
          }.bind(this));

          // Remove series from the graph when they are removed from Firebase
          (function(pathArray) {
            _firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
              var array = [].concat(pathArray);
              array.push(childSnapshot.name());
              _removeSeries(childSnapshot.name(), array);
            });
          })(pathDict.pathArray);

        }.bind(this));
      }

      // Regular nodes
      else {
        // Append the current node to each path
        var newPathDicts = [];
        pathDicts.forEach(function(pathDict) {
          var newPathDict = {
            "path": pathDict.path + node + "/",
            "params": pathDict.params
          };
          newPathDict.pathArray = [].concat(pathDict.pathArray);
          newPathDict.pathArray.push(node);
          newPathDicts.push(newPathDict);
        });

        // Recursively parse the path at the next level
        this.parsePath(newPathDicts, nodeIndex + 1);
      }
    }
  };

  /********************/
  /*  PRIVATE METHODS */
  /********************/
  function _listenForNewRecords(pathDict, eventToListenTo) {
    _this.pathsToRecords.push(pathDict);
    if (typeof _seriesListeners[pathDict.pathArray.join()] === "undefined") {
      _seriesListeners[pathDict.pathArray.join()] = {};
    }
    _seriesListeners[pathDict.pathArray.join()][eventToListenTo] = _firebaseRef.child(pathDict.path).on(eventToListenTo, function(childSnapshot) {
      var data = childSnapshot.val();
      var series;

      var newDataPoint;

      switch (_config.type) {
        case "map":
          newDataPoint = {
            "path": pathDict.path + childSnapshot.name(),
            "label": data[_config.marker.label],
            "radius": data[_config.marker.magnitude],
            "latitude": parseFloat(data[_config.marker.latitude]),
            "longitude": parseFloat(data[_config.marker.longitude])
          };
          break;
        case "table":
          newDataPoint = [];
          _config.columns.forEach(function(column) {
            newDataPoint.push((typeof data[column.value] !== "undefined") ? data[column.value].toString() : "");
          });
          break;
        case "bar":
          series = (_config.series[0] === "$") ? pathDict.params[_config.series] : data[_config.series];
          newDataPoint = {
            "path": pathDict.path + childSnapshot.name(),
            "series": series,
            "value": parseInt(data[_config.value])
          };
          break;
        case "line":
        case "scatter":
          series = (_config.series[0] === "$") ? pathDict.params[_config.series] : data[_config.series];
          var xCoord;
          if (typeof _config.xCoord.stream !== "undefined" && _config.xCoord.stream) {
            xCoord = (_grapher.data[series] ? _grapher.data[series].streamCount : 0);
          }
          else {
            xCoord = parseFloat(data[_config.xCoord.value]);
          }
          newDataPoint = {
            "series": series,
            "path": pathDict.path + childSnapshot.name(),
            "xCoord": xCoord,
            "yCoord": parseFloat(data[_config.yCoord.value])
          };
          break;
      }

      _grapher.addDataPoint(newDataPoint);
    });
  }

  function _removeSeries(seriesName, pathArray) {
    switch (_config.type) {
      case "bar":
        delete _grapher.data[seriesName].aggregation;
        break;
      case "line":
      case "scatter":
        delete _grapher.data[seriesName].values;
        // TODO: want to make it so that we can remove the current series and re-use its series color
        // _grapher.numSeries -= 1; // Doesn't work since only opens up the latest color, not the current series' color
        break;
    }
    // remove all listeners for the series being removed
    Object.keys(_seriesListeners[pathArray.join()]).forEach(function(eventType) {
      var fn = _seriesListeners[pathArray.join()][eventType];
      _firebaseRef.child(pathArray.join("/")).off(eventType, fn);
    });
    _grapher.draw();
  }

  function _listenForRemovedRecords(pathDict) {
    switch (_config.type) {
      case "map":
        _firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
          _grapher.data.forEach(function(dataPoint, index) {
            if (dataPoint.path === (pathDict.path + childSnapshot.name())) {
              _grapher.data.splice(index, 1);
            }
          });
          _grapher.draw();
        });
        break;
      case "table":
        break;
      case "bar":
      case "line":
      case "scatter":
        if (typeof _seriesListeners[pathDict.pathArray.join()] === "undefined") {
          _seriesListeners[pathDict.pathArray.join()] = {};
        }
        _seriesListeners[pathDict.pathArray.join()].child_removed = _firebaseRef.child(pathDict.path).on("child_removed", function(childSnapshot) {
          var series = (_config.series[0] === "$") ? pathDict.params[_config.series] : childSnapshot.val()[_config.series];
          _grapher.data[series].values.forEach(function(dataPoint, index) {
            if (dataPoint.path === (pathDict.path + childSnapshot.name())) {
              var spliced = _grapher.data[series].values.splice(index, 1);
              if (_config.type === "bar") {
                _grapher.data[series].sum -= spliced;
              }
            }
          });
          _grapher.draw();
        });
        break;
    }
  }

  function _listenForChangedRecords() {
    // TODO: implement
  }
};
/**
 * Validates the inputted Firebase reference.
 *
 * @param {Firebase} firebaseRef The Firebase reference to validate.
 */
var _validateFirebaseRef = function(firebaseRef) {
  var error;
  if (typeof firebaseRef === "undefined") {
    error = "no \"firebaseRef\" specified";
  }
  else if (firebaseRef instanceof Firebase === false) {
    // TODO: can they pass in a limit query?
    error = "\"firebaseRef\" must be an instance of Firebase";
  }

  if (typeof error !== "undefined") {
    throw new Error("FireGrapher: " + error);
  }
};

/**
 * Validates the inputted CSS selector.
 *
 * @param {string} cssSelector The CSS selector to validate.
 */
var _validateCssSelector = function(cssSelector) {
  var error;
  if (typeof cssSelector === "undefined") {
    error = "no \"cssSelector\" specified";
  }
  else if (typeof cssSelector !== "string") {
    error = "\"cssSelector\" must be a string";
  }
  else {
    var matchedElements = document.querySelectorAll(cssSelector);
    if (matchedElements.length === 0) {
      error = "no element matches the CSS selector '" + cssSelector + "'";
    }
    else if (matchedElements.length > 1) {
      error = "multiple elements (" + matchedElements.length + " total) match the CSS selector '" + cssSelector + "'";
    }
  }

  if (typeof error !== "undefined") {
    throw new Error("FireGrapher: " + error);
  }
};

/**
 *  Validates the inputted config object and makes sure no options have invalid values.
 *
 *  @param {object} config The graph configuration object to validate.
 */
var _validateConfig = function(config) {
  // TODO: upgrade
  var error;

  if (typeof config === "undefined") {
    error = "no \"config\" specified";
  }
  else if (typeof config !== "object") {
    error = "\"config\" must be an object";
  }

  // Every config needs to specify the graph type
  var validGraphTypes = ["table", "line", "scatter", "bar", "map"];
  if (typeof config.type === "undefined") {
    error = "no graph \"type\" specified. Must be \"table\", \"line\", or \"scatter\"";
  }
  if (validGraphTypes.indexOf(config.type) === -1) {
    error = "Invalid graph \"type\" specified. Must be \"table\", \"line\", or \"scatter\"";
  }

  // Every config needs to specify the path to an individual record
  if (typeof config.path === "undefined") {
    error = "no \"path\" to individual record specified";
  }
  // TODO: other validation for things like $, *, etc.

  switch (config.type) {
    case "map":
      if (typeof config.marker === "undefined" ||
          typeof config.marker.latitude === "undefined" ||
          typeof config.marker.longitude === "undefined" ||
          typeof config.marker.magnitude === "undefined") {
        error = "incomplete \"marker\" definition specified. \nExpected: " + JSON.stringify(_getDefaultConfig().marker) + "\nActual: " + JSON.stringify(config.marker);
      }
      break;
    case "table":
      // Every table config needs to specify its column labels and values
      if (typeof config.columns === "undefined") {
        error = "no table \"columns\" specified";
      }
      config.columns.forEach(function(column) {
        if (typeof column.label === "undefined") {
          error = "missing \"columns\" label";
        }
        if (typeof column.value === "undefined") {
          error = "missing \"columns\" value";
        }
      });
      break;
    case "line":
      if (typeof config.xCoord === "undefined") {
        error = "no \"xCoord\" specified";
      }
      if (typeof config.yCoord === "undefined") {
        error = "no \"yCoord\" specified.";
      }
      break;
    case "bar":
      if (typeof config.value === "undefined") {
        error = "no \"value\" specified.";
      }
      break;
    case "scatter":
      break;
  }

  if (typeof error !== "undefined") {
    throw new Error("FireGrapher: " + error);
  }
};

/**
 *  Validates the inputted grapher object.
 *
 *  @param {object} grapher The grapher object to validate.
 */
var _validateGrapher = function(grapher) {
  var error;

  if (grapher === null || typeof grapher !== "object") {
    error = "\"grapher\" must be an object";
  }

  // TODO: figure out what this should be to support both production and testing
  /*if (grapher instanceof D3Graph === false &&
      grapher instanceof D3Table === false &&
      grapher instanceof D3Map === false) {
    throw new Error("FireGrapher: \"grapher\" must be an instance of FireGrapherD3");
  }*/

  else if (typeof grapher.init !== "function") {
    error = "\"grapher\" must have an init() method";
  }
  else if (typeof grapher.draw !== "function") {
    error = "\"grapher\" must have a draw() method";
  }
  else if (typeof grapher.addDataPoint !== "function") {
    error = "\"grapher\" must have a addDataPoint() method";
  }

  if (typeof error !== "undefined") {
    throw new Error("FireGrapher: " + error);
  }
};

/**
 *  Adds default values to the graph config object
 */
var _getDefaultConfig = function() {
  // Default colors (turquoise, alizaren (red), amethyst (purple), peter river (blue), sunflower, pumpkin, emerald, carrot, midnight blue, pomegranate)
  var defaultStrokeColors = ["#1ABC9C", "#E74C3C", "#9B59B6", "#3498DB", "#F1C40F", "#D35400", "#2ECC71", "#E67E22", "#2C3E50", "#C0392B"];
  var defaultFillColors = ["#28E1BC", "#ED7469", "#B07CC6", "#5FAEE3", "#F4D03F", "#FF6607", "#54D98B", "#EB9850", "#3E5771", "#D65448"];

  // Define a default config object
  return {
    "styles": {
      "fillColor": "#DDDDDD",
      "fillOpacity": 0.3,
      "outerStrokeColor": "#000000",
      "outerStrokeWidth": 2,
      "innerStrokeColor": "#000000",
      "innerStrokeWidth": 1,
      /*"size": {
        "width": 500,
        "height": 300
      },*/
      "axes": {
        "x": {
          "ticks": {
            "fillColor": "#000000",
            "fontSize": "14px"
          },
          "label": {
            "fillColor": "#000000",
            "fontSize": "14px"
          }
        },
        "y": {
          "ticks": {
            "fillColor": "#000000",
            "fontSize": "14px"
          },
          "label": {
            "fillColor": "#000000",
            "fontSize": "14px"
          }
        }
      },
      "series": {
        "strokeWidth": 2,
        "strokeColors": defaultStrokeColors
      },
      "markers": {
        "size": 3.5,
        "strokeWidth": 2,
        "style": "default",
        "strokeColors": defaultStrokeColors,
        "fillColors": defaultFillColors // What about if style is set to "flat"?
      },
      "legend": {
        "fontSize": "16px",
        "stroke": "#000000",
        "strokeWidth": "2px",
        "fill": "#AAAAAA",
        "fillOpacity": 0.7
      }
    },
    "xCoord": {
      "label": ""
    },
    "yCoord": {
      "label": ""
    },
    "marker": {
      "label" : "label",
      "latitude" : "latitude",
      "longitude" : "longitude",
      "magnitude" : "radius"
    }
  };
};
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
    _xDomain = { min: _config.xCoord.min, max: _config.xCoord.max };
    _yDomain = { min: _config.yCoord.min, max: _config.yCoord.max };
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

/**
 * Creates a D3Table instance.
 *
 * @constructor
 * @this {D3Table}
 * @param {object} config A list of options and styles which explain what the graph and how to style the graph.
 * @param {string} cssSelector The CSS selector of the tag which will hold the graph.
 */
var D3Table = function(config, cssSelector) {

  /*****************/
  /*  CONSTRUCTOR  */
  /*****************/
  var _config = config;
  var _cssSelector = cssSelector;
  var _table;

  var _this = this;

  /**
   * Public
   */
  this.init = function() {
    this.data = [];
    _table = d3.select(_cssSelector)
      .append("div")
        .attr("class", "fg-table")
        .attr("style", "display: inline-block;");
    _addTableHeaders(_config.columns);
  };
  
  this.draw = function() {

  };

  this.addDataPoint = function(newDataPoint) {
    _this.data.push(newDataPoint);
    _table
      .selectAll("div.fg-table-row")
        .data(_this.data).enter()
        .append("div")
          .attr("class", "fg-table-row")
          .attr("style", "display: block; text-align: center; border-left: solid 3px #000; border-top: solid 3px #000;")
          .selectAll("div.cell").data(function(d) {
            return d;
          }).enter()
          .append("div")
            .attr("class", "gf-table-cell")
            .attr("style", "float: left; width: 100px; border-right: solid 3px black; padding: 5px;")
            .attr("width", function(d, i) {
              return _config.columns[i].width;
            })
            .text(function(d) {
              return d;
            });
  };

  /**
   * Private
   */
  function _addTableHeaders(columns) {
    // draw header columns
    var sortColumn = 0;
    var sortAsc = true;
    _table
      .append("div")
        .attr("class", "fg-table-row")
        .selectAll("div.header")
          .data(columns).enter()
          .append("div")
            .attr("class", "fg-table-header")
            .attr("style", "font-weight: bold;")
            .attr("width", function(column) {
              return column.width;
            })
            .text(function (column) { return column.label; })
            .on("click", function (d) {
                // update sortColumn to sort on clicked on column
                var newSortColumn = 0;
                for (var i = 0; i < columns.length; i++) {
                  if (columns[i] === d) {
                    newSortColumn = i;
                  }
                }
                if (sortColumn !== newSortColumn) {
                  sortColumn = newSortColumn; // change sort column
                  sortAsc = true;
                } else {
                  sortAsc = !sortAsc; // change sort type
                }
                _table.selectAll("div.data").sort(function(a, b) {
                  if (a[sortColumn] === b[sortColumn]) {
                    return 0;
                  } else if (sortAsc) {
                    return a[sortColumn] > b[sortColumn];
                  } else {
                    return a[sortColumn] < b[sortColumn];
                  }
                });
            });
  }
};

  return FireGrapher;
})();

// Export FireGrapher if this is being run in node
if (typeof module !== "undefined" && typeof process !== "undefined") {
  module.exports = FireGrapher;
}
