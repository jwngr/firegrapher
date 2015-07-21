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