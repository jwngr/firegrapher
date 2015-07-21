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
