# FireGrapher

TODO
-----
Remaining FireGrapher work
** CSS works remains
* additional configurations [Jacob]
* documentation [Jacob]
* clean up in general [both]
* clean up CSS class names [Jacob]
* add additional examples [Tony]
* add datatype for xCoord and yCoord values (e.g. Number, Date, etc) [Both]

FireGrapher is a graphing/charting library for your Firebase data. It's goal is to provide an expressive, easily-customizable, and realtime graphing tool which requires no knowledge of existing graphing tools and only take a few lines of JavaScript to produce. FireGrapher is designed to work with Firebase and works no matter how you organize your data. Because FireGrapher is backed by Firebase, your graphs update in realtime with no extra work.

## Downloading

FireGrapher is built on top of both Firebase and d3.js. d3.js is a powerful graphing library ....

In order to use FireGrapher in your project, you need to include the following files in your HTML file:

```html
<!-- d3.js -->
<script src="d3.min.js"></script>

<!-- Firebase -->
<script src="firebase.min.js"></script>

<!-- FireGrapher -->
<script src="FireGrapher.min.js"></script>
```

You can find each of these files in the `/dest/` directory of this GitHub repository. For debugging purposes, there is also non-minified `FireGrapher.js` file in the `/dest/` directory.

You can also download all of these files via Bower [__Note__: FireGrapher is currently not available via bower]:

```bash
$ bower install d3?? firebase [geofire]
```

## API Reference

### FireGrapher

#### new FireGrapher()

Returns a new `FireGrapher` instance. Every `FireGrapher` instace can generate a single graph.

#### FireGrapher.graph(cssSelector, firebaseRef, config)

Creates a graph of the data stored at `firebaseRef` and places it in the element specified by `cssSelector`.

`cssSelector` is a CSS selector which uniquely identifies a single HTML element on your page.

`firebaseRef` is a reference to a Firebase location.

`config` is a configuration dictionary which explains what your data looks like and what type of graph you want to generate.

## Graph Types

The `config` you pass into `FireGrapher.graph()` is where all the magic happens. Every graph type requires at least the following to be specified in the `config` object:

* `type`: the type of the graph (one of "line", "scatter", "bar", "table", or "map").
* `path`: the subpath from the `firebaseRef` you passed into `FireGrapher.graph()` to an individual data point or record. You can specify wildcard paths using `$. Here is an example: TODO

The following lists the specific `config` options for each graph type.

### Line Graph

  {
    *type: "line",
    *path: "/path/to/records/*",
    *series: "nameOfSeries",
    *axes: {
      *x: {
        label: "",
        *value: "string",
        numTicks: #,
        stream: # [default is 0]
      },
      *y: {
        label: "",
        *value: [required],
        numTicks: #
      }
    },
    legend: boolean [default is true],
    size: {
      width: 500,
      heigh 300
    }
  }

### Scatter Plot

  {
    *type: "line",
    *path: "/path/to/records/*",
    *series: "nameOfSeries",
    *axes: {
      *x: {
        label: "",
        *value: "string",
        numTicks: #,
        stream: # [default is 0]
      },
      *y: {
        label: "",
        *value: [required],
        numTicks: #
      }
    },
    legend: boolean [default is true],
    size: {
      width: 500,
      heigh 300
    }
  }

### Bar Graph

  {
    *type: "bar",
    *path: "/path/to/records/*",
    *axes: {
      *x: {
        label: "",
        *value: "nameOfSeries"
      },
      *y: {
        label: "",
        *value: [required],
        aggregation: [*sum, mean, median, min, max],
        numTicks: #
      }
    },
    size: {
      width: 500,
      heigh 300
    }
  }

### Table

  {
    *type: "table",
    *path: "/path/to/records/*",
    *columns: [
      *{
        *label: ,
        *value: ,
        sortable: boolean [default is true]
      },
      ...
    ],
    sortedBy: "columnValue" [default is first column]
  }

### Map

  {
    *type: "map",
    *path: "/path/to/records/*",
    *markers: {
      *label: "key",
      *latitude: "latitude",
      *longitude: "longitude",
      *radius: "radius"
    }
  }

## Styling Graphs

Since d3.js generates graph using SVG, you can style your graphs the same as you would style any SVG: using CSS. FireGrapher assigns class to every piece of your graphs so that they are highly customizable. Here is a full class list for each graph type and the associated styles for them:

By default, FireGrapher assigns styles to your graphs, giving them all a consistent look at feel. However, you can customize as much or as little of those styles as you would like.

View the `TODO` directory for some sample CSS and SCSS files with custom styles. If you come up with a style set you would like to share, submit a PR and we can add it for others to use!

Classes:

- Line graph:
  - .fg-line
  - .fg-title
  - .fg-legend
    - .fg-legend-container
    - .fg-legend-text
  - .fg-axis
    - .fg-x-axis
      - path.domain - outer margin
      - g - individual tick line
        - .tick - tick line
        - text - tick label
    - .fg-y-axis
      - path.domain - outer margin
      - g - individual tick line
        - .tick - tick line
        - text - tick label
  - .fg-axis-label
    - .fg-x-axis-label
    - .fg-y-axis-label
  - .fg-series
    - .fg-series-#
  - .fg-marker
    - .fg-series-#

- Scatter plot

- Bar graph
  - fg-bar
  - fg-series
    - fg-series-#


- Table


"styles": {
      graph: {
        "fillColor": "#DDDDDD",
        "fillOpacity": 0.3,
        "outerStrokeColor": "#000000",
        "outerStrokeWidth": 2,
        "innerStrokeColor": "#000000",
        "innerStrokeWidth": 1
      },
      "size": {
        "width": 500,
        "height": 300
      },
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
        "strokeColors": defaultStrokeColors,
        "fillColors": ["none", "none", "none", "none", "none", "none", "none", "none", "none", "none", "none"]
      },
      "markers": {
        "size": 3.5,
        "strokeWidth": 2,
        "style": "default",
        "strokeColors": defaultStrokeColors,
        "fillColors": defaultFillColors // What about if style is set to "flat"?
      }
    },
    "xCoord": {
      "label": "",
      "min": 0,
      "max": 50
    },
    "yCoord": {
      "label": "",
      "min": 0,
      "max": 200
    },
    "marker": {
      "label" : "label",
      "latitude" : "latitude",
      "longitude" : "longitude",
      "magnitude" : "radius"
    }










Notes:
- Chart types
  - Grid
    - headers (maybe)
    - columns
    - what is a new row
  - Line graph
    - x-coord
    - y-coord
  - Histogram
    - y-label
    - what is an individual record
    - what is the record’s value
  - Scatter plot
    - x-coord
    - y-coord
  - Pie chart
    - what is an individual record
    - what is the record’s value
  - Gauge/ticker
    - Path to a value
    - Label
  - Map (all locations, heat map, per state/country)
    - out of scope
- Technologies
  - Firebase
  - Underscore (for client-side filtering)
  - D3.js (on npm, d3, d3-grid, d3-chart, d3-geomap, all here: https://www.npmjs.org/search?q=d3)
  - React?
- Plan
  - Goals: Grid, line graph, scatter plot
  - Day 1: parsable schema for each goal above and API (together)
  - Day 2: Define what the data needs to look like going into D3 for each goal above (Tony), start implementing user API which connects to Firebase and start test framework (Jacob)
  - Day 3: Sending correct data to D3 (Jacob) and rendering data for grid (Tony)
  - Day 4: Line and scatter (together)
  - Day 5: Clean up and make demo
- Examples
  - Users grid
    - Data layout
      /users/
        /uid1/
          /firstName
          /lastName
          /password
          /…
        /uid2/
          /firstName
          /lastName
          /password
          /...
    - HTML
      <div id=“userGrid”></div>
    - JS
      FireGrapher.chart($(“#userGrid), firebaseRef, {
        type: “grid”,
        headers: “
        x-coord-“/{stock-ticker}/*/price”
        lines: {stock-ticker}
      });
  - Stock chart
    - Data layout
      /stocks
        /MSFT
        /-asdfasdf
                 /time
                 /price
        /YHOO
        /AAPL
  - Code samples
    firebaseRef.child(“users”).on(“child_added” ,f(snap) {
      underscore
      d3.add(snap.firstname, ….)

    firebaseRef.chid9”users).on(“child_changed”)

    firebaseRef.chid9”users).on(“child_removed”)

    firebaseRef.chid(users).limit(1000).on(“child_changed”)


FireGrapher API

// line graph
FireGrapher.graph("cssSelector", firebase_ref, {
  type : "line",
  path: "/relative/to/firebase_ref/$symbol/*",
  xCoord: {
    "label" : "Time",
    "value" : "time"
  },
  yCoord: {
    "label" : "Price",
    "value" : "price"
  },
  line: "$symbol"
});

// grid
FireGrapher.graph("cssSelector", firebase_ref, {
  type : "grid",
  path : "/relative/to/firebase_ref/$uid",
  columns : {
    "First Name" : "firstName",
    "Last Name" : "lastName",
    "Paid" : "isPaid",
    "User ID" : "$uid"
  }
});

// scatterplot
FireGrapher.graph("cssSelector", firebase_ref, {
  type : "scatter",
  path: "/relative/to/firebase_ref/*",
  xCoord: {
    "label" : "Duration",
    "value" : "duration"
  },
  yCoord: {
    "label" : "Waiting Time",
    "value" : "waitingTime"
  }
});



