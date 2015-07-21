/*************/
/*  GLOBALS  */
/*************/
// Override the default timeout interval for Jasmine
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

// Get a reference to a random demo Firebase
var demoFirebaseUrl = "https://" + generateRandomString() + ".firebaseio-demo.com";

// Define examples of valid and invalid parameters
var invalidFirebaseRefs = [null, undefined, true, false, [], {}, function() {}, 0, 5, "", "a", {a:1}, ["hi", 1]];
var validCssSelectors = ["#graph1", "#graph2", "#graph3"];
var invalidCssSelectors = [".graph", "div", "#graph0", null, undefined, true, false, [], {}, function() {}, 0, 5, "", "a"];
var invalidGraphers = [null, undefined, true, false, [], {}, function() {}, 0, 5, "", "a",
  {
    init: function() {},
    draw: function() {}
  },
  {
    init: function() {},
    addDataPoint: function() {}
  },
  {
    draw: function() {},
    addDataPoint: function() {}
  }
];
var validConfig = {
  type : "line",
  path: "*",
  xCoord: {
    "value" : "time"
  },
  yCoord: {
    "value" : "price"
  },
  series: "symbol"
};

// Stub out the grapher class
var D3Graph = function() {
  this.init = function() {};
  this.draw = function() {};
  this.addDataPoint = function() {};
};
var grapherStub = new D3Graph();

/**********************/
/*  HELPER FUNCTIONS  */
/**********************/
/* Helper function which runs before each Jasmine test has started */
function beforeEachHelper(done) {
  // Create a new firebase ref with a new context
  firebaseRef = new Firebase(demoFirebaseUrl, Firebase.Context());

  // Reset the Firebase
  firebaseRef.remove(function() {
    // Create a new firebase ref at a random node
    firebaseRef = firebaseRef.child(generateRandomString());

    done();
  });
}

/* Helper function which runs after each Jasmine test has completed */
function afterEachHelper(done) {
  done();
}

/* Returns a random alphabetic string of variable length */
function generateRandomString() {
  var possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var numPossibleCharacters = possibleCharacters.length;

  var text = "";
  for (var i = 0; i < 10; i++) {
    text += possibleCharacters.charAt(Math.floor(Math.random() * numPossibleCharacters));
  }

  return text;
}

/* Returns the current data in the Firebase */
function getFirebaseData() {
  return new RSVP.Promise(function(resolve, reject) {
    firebaseRef.once("value", function(dataSnapshot) {
      resolve(dataSnapshot.val());
    });
  });
};