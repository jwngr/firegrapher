(function() {
  var firebaseRef = new Firebase("https://FireGrapherStocks.firebaseIO-demo.com/");

  function getRandomValue(min, max) {
    return Math.ceil(Math.random() * (max - min)) + min;
  };

  function addStockPrice(path, symbol, time, price, grouped) {
    if (grouped) {
      firebaseRef.child(path + "/" + symbol).push({
        "time": time,
        "price": price
      });
    }
    else {
      firebaseRef.child(path).push({
        "symbol": symbol,
        "time": time,
        "price": price
      });
    }
  };

  function removeGoogleStocks() {
    firebaseRef.child("stocks/GOOG").remove();
    firebaseRef.child("stocks2").on("child_added", function(snapshot) {
      var data = snapshot.val();
      if (data.symbol === "GOOG") {
        snapshot.ref().remove();
      }
    });
  };

  function removeStocks(numStocksToRemove) {
    var ref = new Firebase("https://FireGrapherStocks.firebaseIO-demo.com/stocks2");
    ref.limit(10).on("child_added", function(snapshot) {
      if (numStocksToRemove > 0) {
        numStocksToRemove -= 1;
        snapshot.ref().remove();
      }
      else {
        ref.off("child_added");
      }
    });
  };

  function addYahooStocks() {
    for (var i = 0; i < 30; ++i) {
      addStockPrice("stocks", "YHOO", i, getRandomValue(5, 40), true);
      addStockPrice("stocks2", "YHOO", i, getRandomValue(5, 40), false);
    }
  };

  function resetFirebase() {
    firebaseRef.remove(function() {
      // Populate /stocks/
      for (var i = 0; i < 30; ++i) {
        addStockPrice("stocks", "MSFT", i, getRandomValue(50, 55), true);
        addStockPrice("stocks", "AAPL", i, getRandomValue(40, 60), true);
        addStockPrice("stocks", "GOOG", i, getRandomValue(0, 100), true);
      }

      // Populate /stock2/
      for (var i = 0; i < 30; ++i) {
        addStockPrice("stocks2", "MSFT", i, getRandomValue(50, 55), false);
        addStockPrice("stocks2", "AAPL", i, getRandomValue(40, 60), false);
        addStockPrice("stocks2", "GOOG", i, getRandomValue(0, 100), false);
      }
    });
  };

  function startJacobcoin() {
    window.setInterval(function() {
      firebaseRef.child("currencies").set({
        jacobcoin: {
          ask: getRandomValue(40, 70)
        },
        /*tonycoin: {
          ask: getRandomValue(50, 60)
        }*/
      });
    }, 250);
  };


  //document.getElementById("resetFirebaseButton").addEventListener("click", resetFirebase);
  document.getElementById("addYahooStocksButton").addEventListener("click", addYahooStocks);
  document.getElementById("removeGoogleStocksButton").addEventListener("click", removeGoogleStocks);
  document.getElementById("removeStocksButton").addEventListener("click", function() { removeStocks(10) });
  document.getElementById("startJacobcoinButton").addEventListener("click", startJacobcoin);

  var fireGrapher1 = new FireGrapher();
  fireGrapher1.graph("#stockChart1", firebaseRef.child("stocks"), {
    type : "line",
    path: "$symbol/*",
    xCoord: {
      "label" : "Time",
      "value" : "time",
      "min": 0,
      "max": 30
    },
    yCoord: {
      "label" : "Price",
      "value" : "price",
      "min": 40,
      "max": 150
    },
    series: "$symbol",
    styles: {
      axes: {
        x: {
          ticks: {
            fillColor: "#FFF"
          },
          label: {
            fillColor: "#FFF"
          }
        },
        y: {
          ticks: {
            fillColor: "#FFF"
          },
          label: {
            fillColor: "#FFF"
          }
        }
      }
    }
  });

  var fireGrapher2 = new FireGrapher();
  fireGrapher2.graph("#stockChart2", firebaseRef.child("stocks2"), {
    type : "scatter",
    path: "*",
    xCoord: {
      "label" : "Time",
      "value" : "time"
    },
    yCoord: {
      "label" : "Price",
      "value" : "price"
    },
    styles: {
      "outerStrokeWidth": 5,
      "innerStrokeWidth": 2,
      "fillColor": "#35FC7A",
      "fillOpacity": 0.1,
      "outerStrokeColor": "#AB8B6B",
      "innerStrokeColor": "#F4F2B7",
      "axes": {
        "x": {
          "ticks": {
            "fillColor": "#F54C99",
            "fontSize": "8px"
          },
          "label": {
            "fillColor": "#4C99F5",
            "fontSize": "30px"
          }
        },
        "y": {
          "ticks": {
            "fillColor": "#4CF599",
            "fontSize": "20px"
          },
          "label": {
            "fillColor": "#4CF1F5",
            "fontSize": "10px"
          }
        }
      },
      "markers": {
        "size": 8,
        "style": "flat"
      }
    },
    series: "symbol"
  });

  firebaseRef.update({
    "users": {
      "0" : {
        "firstName": "Jacob",
        "lastName": "Wenger",
        "email": "jacob@firebase.com",
        "gender": "Male",
        "isPaid": false
      },
      "1" : {
        "firstName": "Tony",
        "lastName": "Meng",
        "email": "tony@firebase.com",
        "gender": "Male",
        "isPaid": true
      },
      "2" : {
        "firstName": "Al",
        "lastName": "Coholic",
        "email": "al@firebase.com",
        "gender": "Male",
        "isPaid": true
      },
      "3" : {
        "firstName": "Anne",
        "lastName": "Teak",
        "email": "anne@firebase.com",
        "gender": "Female",
        "isPaid": false
      },
      "4" : {
        "firstName": "Portia",
        "lastName": "Johns",
        "email": "portia@firebase.com",
        "gender": "Female",
        "isPaid": false
      },
      "5" : {
        "firstName": "Stan",
        "lastName": "Francisco",
        "email": "stan@firebase.com",
        "gender": "Male",
        "isPaid": true
      },
      "6" : {
        "firstName": "Paulie",
        "lastName": "Exclusion",
        "email": "paulie@firebase.com",
        "gender": "Male",
        "isPaid": false
      },
      "7" : {
        "firstName": "Jeff",
        "lastName": "Jefferson",
        "email": "jeff@firebase.com",
        "gender": "Male",
        "isPaid": true
      },
      "8" : {
        "firstName": "Mary",
        "lastName": "Annette",
        "email": "mary@firebase.com",
        "gender": "Female",
        "isPaid": true
      },
      "9" : {
        "firstName": "Firebase",
        "lastName": "Williams",
        "email": "firebase@firebase.com",
        "gender": "Male",
        "isPaid": false
      }
    }
  });

  var fireGrapher3 = new FireGrapher();
  fireGrapher3.graph("#userTable", firebaseRef.child("users"), {
    type : "table",
    path: "$userId",
    columns: [
      { "label": "First Name", "value": "firstName", "width" : "50" },
      { "label": "Last Name", "value": "lastName", "width" : "50" },
      { "label": "Email", "value": "email", "width" : "80"  },
      { "label": "Gender", "value": "gender", "width" : "30" },
      { "label": "Is Paid?", "value": "isPaid", "width" : "20" }
    ]
  });


  var fireGrapher4 = new FireGrapher();
  fireGrapher4.graph("#jacobcoinChart", firebaseRef.child("currencies"), {
    type : "line",
    path: "$currency",
    xCoord: {
      "label" : "Time",
      "stream" : true,
      "limit": 30
    },
    yCoord: {
      "label" : "Price (USD)",
      "value" : "ask",
      "min": 40,
      "max": 60
    },
    series: "$currency"
  });

  var currencyRef = new Firebase("https://publicdata-cryptocurrency.firebaseio.com/");
  var fireGrapher5 = new FireGrapher();
  fireGrapher5.graph("#digitalCurrencyChart", currencyRef, {
    type : "line",
    path: "bitcoin",
    xCoord: {
      "label" : "Time",
      "stream" : true,
      "limit": 30
    },
    yCoord: {
      "label" : "Price (USD)",
      "value" : "ask",
      "min": 446,
      "max": 448
    },
    styles: {
      "size": {
        "width": 500,
        "height": 300
      }
    },
    series: "$currency"
  });

  var fireGrapher6 = new FireGrapher();
  fireGrapher6.graph("#stockChart6", firebaseRef.child("stocks"), {
    type : "bar",
    path: "$symbol/*",
    xCoord: {
      "label" : "Symbols"
    },
    yCoord: {
      "label" : "Price (USD)"
    },
    styles: {
      "size": {
        "width": 500,
        "height": 150
      }
    },
    value : "price",
    series: "$symbol"
  });

  var fireGrapher7 = new FireGrapher();
  fireGrapher7.graph("#map", firebaseRef.child("map"), {
    type : "map",
    path : "*",
    marker : {
      label : "key",
      latitude : "latitude",
      longitude : "longitude",
      magnitude : "radius"
    }
  });
})();