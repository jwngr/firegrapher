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
            xCoord = parseInt(data[_config.xCoord.value]);
          }
          newDataPoint = {
            "series": series,
            "path": pathDict.path + childSnapshot.name(),
            "xCoord": xCoord,
            "yCoord": parseInt(data[_config.yCoord.value])
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