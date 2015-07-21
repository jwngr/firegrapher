describe("FireGrapherParser Tests:", function() {
  beforeEach(function(done) {
    beforeEachHelper(done);
  });

  afterEach(function(done) {
    afterEachHelper(done);
  });

  describe("Constructor:", function() {
    it("Constructor throws errors given invalid Firebase refs", function() {
      invalidFirebaseRefs.forEach(function(invalidFirebaseRef) {
        expect(function() { new FireGrapherParser(invalidFirebaseRef, validConfig, grapherStub); }).toThrow();
      });
    });

    xit("Constructor throws errors given invalid config objects", function() {
      expect(true).toBeFalsy();
    });

    it("Constructor throws errors given invalid graphers", function() {
      invalidGraphers.forEach(function(invalidGrapher) {
        expect(function() { new FireGrapherParser(firebaseRef, validConfig, invalidGrapher); }).toThrow();
      });
    });

    it("Constructor does not throw errors given valid inputs", function() {
      expect(function() { new FireGrapherParser(firebaseRef, validConfig, grapherStub); }).not.toThrow();
    });
  });

  describe("parsePath():", function() {
    it("parsePath() returns the correct paths to records", function(done) {
      var config = {
        type : "line",
        path: "*",
        xCoord: {
          "value" : "time"
        },
        yCoord: {
          "value" : "price"
        },
        series: "series"
      };

      var parser = new FireGrapherParser(firebaseRef, config, grapherStub);
      parser.parsePath([{
        "path": "/",
        "params": {}
      }], 0);
      window.setTimeout(function() {
        expect(parser.pathsToRecords.length).toEqual(1);
        expect(parser.pathsToRecords).toEqual([
          { path: "/", params: {} }
        ]);
        done();
      }, 50);

      expect(true).toBeTruthy();
    });

    it("parsePath() returns the correct paths to records when using wildcard in path and series", function(done) {
      var config = {
        type : "line",
        path: "$series/*",
        xCoord: {
          "value" : "time"
        },
        yCoord: {
          "value" : "price"
        },
        series: "$series"
      };

      firebaseRef.set({
        "a": true,
        "b": true,
        "c": true
      }, function() {
        var parser = new FireGrapherParser(firebaseRef, config, grapherStub);
        parser.parsePath([{
          "path": "/",
          "params": {}
        }], 0);
        window.setTimeout(function() {
          expect(parser.pathsToRecords.length).toEqual(3);
          expect(parser.pathsToRecords).toEqual([
            { path: "/a/", params: { $series : "a" } },
            { path: "/b/", params: { $series : "b" } },
            { path: "/c/", params: { $series : "c" } }
          ]);
          done();
        }, 500);
      });
      expect(true).toBeTruthy();
    });

    it("parsePath() returns the correct paths to records when not using *", function(done) {
      var config = {
        type : "line",
        path: "jacobcoin",
        xCoord: {
          "value" : "time"
        },
        yCoord: {
          "value" : "price"
        },
        series: "jacobcoin"
      };

      firebaseRef.set({
        "jacobcoin": true
      }, function() {
        var parser = new FireGrapherParser(firebaseRef, config, grapherStub);
        parser.parsePath([{
          "path": "/",
          "params": {}
        }], 0);
        window.setTimeout(function() {
          expect(parser.pathsToRecords.length).toEqual(1);
          expect(parser.pathsToRecords).toEqual([
            { path: "/jacobcoin/", params: {} }
          ]);
          done();
        }, 500);
      });
      expect(true).toBeTruthy();
    });
  });
});