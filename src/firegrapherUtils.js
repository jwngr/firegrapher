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