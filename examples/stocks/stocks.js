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

  var jacobCoinInterval;
  function startJacobcoin() {
    jacobCoinInterval = window.setInterval(function() {
      var price = getRandomValue(40, 70);
      firebaseRef.child("jacobcoin").set({
        "bid": price,
        "ask": price
      })
    }, 500);
  };

  function stopJacobcoin() {
    window.clearInterval(jacobCoinInterval);
  }

  document.getElementById("resetFirebaseButton").addEventListener("click", resetFirebase);
  document.getElementById("addYahooStocksButton").addEventListener("click", addYahooStocks);
  document.getElementById("removeGoogleStocksButton").addEventListener("click", removeGoogleStocks);
  document.getElementById("removeStocksButton").addEventListener("click", function() { removeStocks(10) });
  document.getElementById("startJacobcoinButton").addEventListener("click", startJacobcoin);
  document.getElementById("stopJacobcoinButton").addEventListener("click", stopJacobcoin);

  var fireGrapher1 = new FireGrapher(firebaseRef.child("stocks"), "#stockChart1", {
    type : "line",
    path: "$symbol/*",
    title: "Price over Time (Stocks in USD)",
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
    series: "$symbol"
  });

  var fireGrapher2 = new FireGrapher(firebaseRef.child("stocks2"), "#stockChart2", {
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

  var fireGrapher3 = new FireGrapher(firebaseRef.child("users"), "#userTable", {
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


  var fireGrapher4 = new FireGrapher(firebaseRef, "#jacobcoinChart", {
    type : "line",
    path: "jacobcoin",
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
    styles: {
      "size": {
        "width": 500,
        "height": 150
      },
      "markers": {
        "size": 8,
        "strokeColors": ["red"], // TODO: also allow this to be a dictionary of $currency: color?
        "strokeWidth": 5,
        "fillColors": ["blue"]
      },
      "series": {
        "strokeWidth": 4,
        "strokeColors": ["yellow"],
        "fillColors": ["green"]
      }
    },
    series: "$currency"
  });

  var currencyRef = new Firebase("https://publicdata-cryptocurrency.firebaseio.com/");
  var fireGrapher5 = new FireGrapher(currencyRef, "#digitalCurrencyChart", {
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

  var fireGrapher6 = new FireGrapher(firebaseRef.child("stocks"), "#stockChart6", {
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
})();