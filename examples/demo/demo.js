$(function() {
  /************/
  /*  GRAPHS  */
  /************/
  var firebaseRef = new Firebase("https://FireGrapherStocks.firebaseIO-demo.com/");
  // var fireGrapher1 = new FireGrapher(firebaseRef.child("stocks"), "#graph1", {
  //   type : "line",
  //   path: "$symbol/*",
  //   title: "Price over Time (Stocks in USD)",
  //   xCoord: {
  //     "label" : "Time",
  //     "value" : "time",
  //     "min": 0,
  //     "max": 30
  //   },
  //   yCoord: {
  //     "label" : "Price",
  //     "value" : "price",
  //     "min": 40,
  //     "max": 150
  //   },
  //   series: "$symbol"
  // });

  var fireGrapher1 = new FireGrapher(firebaseRef.child("stocks"), "#graph1", {
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


  var currentValue = 0;
  setInterval(function() {
    firebaseRef.child("math").set({
      "sine": {
        "value": Math.sin(currentValue) * 100
      },
      "cosine": {
        "value": Math.cos(currentValue) * 100
      }
    });
    currentValue += 0.1;
  }, 100);

  var fireGrapher1 = new FireGrapher(firebaseRef.child("math"), "#graph4", {
    type: "line",
    path: "$function",
    title: "Math Function Waves",
    xCoord: {
      "label" : "Time",
      "stream" : true,
      "limit": 30
    },
    yCoord: {
      "label" : "Value",
      "value" : "value"
    },
    series: "$function"
  });


  var currentValue = 0;
  setInterval(function() {
    firebaseRef.child("math").set({
      "sine": {
        "value": Math.sin(currentValue) * 100
      },
      "cosine": {
        "value": Math.cos(currentValue) * 100
      }
    });
    currentValue += 0.1;
  }, 100);

  var fireGrapher2 = new FireGrapher(firebaseRef.child("stocks"), "#graph2", {
    type : "scatter",
    path: "$symbol/*",
    title: "Price over Time (Stocks in USD)",
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
        "size": 15,
        "style": "flat"
      }
    },
    series: "$symbol"
  });


  var fireGrapher3 = new FireGrapher(firebaseRef.child("stocks"), "#graph3", {
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

  document.getElementById("resetFirebaseButton").addEventListener("click", resetFirebase);
  document.getElementById("addYahooStocksButton").addEventListener("click", addYahooStocks);
  document.getElementById("removeGoogleStocksButton").addEventListener("click", removeGoogleStocks);
  document.getElementById("removeStocksButton").addEventListener("click", function() { removeStocks(10) });







  /* Scroll animations */
  $(window).scroll(function(){
    var scrollBottom = $(window).scrollTop() + $(window).height();
    var windowWidth = $(window).width();

    var scrollButtonRotation;
    if ((scrollBottom  - 500- $("#scrollButton").height()) > $("#section4").offset().top) {
      scrollButtonRotation = "rotate(180deg)";
      $("#scrollButton").addClass("rotated");
    }
    else {
      scrollButtonRotation = "rotate(0deg)";
      $("#scrollButton").removeClass("rotated");
    }
    $("#scrollButton").css({
      "transition": "0.5s",
      "-webkit-transform": scrollButtonRotation,
      "-moz-transform": scrollButtonRotation,
      "-ms-transform": scrollButtonRotation,
      "-o-transform": scrollButtonRotation,
      "transform": scrollButtonRotation
    });

    $(".fadeInSection").each(function(index) {
      if (!$(this).hasClass("fadedIn")) {
        var sectionImage = $(this).find("img");
        var sectionText = $(this).find("p");

        var imageOffset = sectionImage.offset();
        var textOffset = sectionText.offset();

        if (scrollBottom > (imageOffset.top + (sectionImage.height() / 2))) {
          // Ensure the animation only runs once
          $(this).addClass("fadedIn");

          // At small widths, the sliding animation messes things up, so just fade in the elements
          if (windowWidth < 1000) {
            $(this).find("*").animate({
              opacity: 1
            }, 1000, function() {
              $(this).attr("style", "opacity: 1");
            });
          }

          // Otherwise, slide them in
          else {
            // Move the elements left and right while still hidden
            var leftElement, rightElement;
            if (index % 2 == 0) {
              leftElement = sectionImage;
              rightElement = sectionText;

              sectionImage.offset({
                left: imageOffset.left - 50
              });

              sectionText.offset({
                left: textOffset.left + 50
              });
            }
            else {
              leftElement = sectionText;
              rightElement = sectionImage;

              sectionImage.offset({
                left: imageOffset.left + 50
              });

              sectionText.offset({
                left: textOffset.left - 50
              });
            }

            // Fade and slide in the elements
            leftElement.animate({
              opacity: 1,
              left: "+=50"
            }, 1000, function() {
              $(this).attr("style", "opacity: 1");
            });

            rightElement.animate({
              opacity: 1,
              left: "-=50"
            }, 1000, function() {
              $(this).attr("style", "opacity: 1");
            });
          }
        }
      }
    });
  });

  /* Scroll button */
  $("#scrollButton").on("click", function() {
    // Get the scroll bar's bottom position (top + height + padding)
    var scrollButtonBottom = $(this).offset().top + $(this).height() + 50 + 300;

    var section1Top = $("#section1").offset().top;
    var section2Top = $("#section2").offset().top;
    var section3Top = $("#section3").offset().top;
    var section4Top = $("#section4").offset().top;

    if (scrollButtonBottom <= section1Top + $("#section1").height()) {
      $("html, body").animate({
        scrollTop: section2Top
      }, 750);
    }
    else if (scrollButtonBottom < section2Top + $("#section2").height()) {
      $("html, body").animate({
        scrollTop: section2Top
      }, 750);
    }
    else if (scrollButtonBottom < section3Top + $("#section3").height()) {
      $("html, body").animate({
        scrollTop: section3Top
      }, 750);
    }
    else if (scrollButtonBottom < section4Top + $("#section4").height()) {
      $("html, body").animate({
        scrollTop: section4Top
      }, 750);
    }
    else if ($(this).hasClass("rotated")) {
      $("html, body").animate({
        scrollTop: section1Top
      }, 750);
    }
    else {
      $("html, body").animate({
        scrollTop: copyrightSectionTop
      }, 750);
    }
  });
});