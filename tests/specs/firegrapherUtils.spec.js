describe("FireGrapherUtils Tests:", function() {
  beforeEach(function(done) {
    beforeEachHelper(done);
  });

  afterEach(function(done) {
    afterEachHelper(done);
  });

  describe("Input Validation", function() {
    describe("_validateFirebaseRef():", function() {
      it("_validateFirebaseRef() throws errors given invalid Firebase refs", function() {
        invalidFirebaseRefs.forEach(function(invalidFirebaseRef) {
          expect(function() { _validateFirebaseRef(invalidFirebaseRef); }).toThrow();
        });
      });

      it("_validateFirebaseRef() does not throw errors given valid Firebase refs", function() {
        expect(function() { _validateFirebaseRef(firebaseRef); }).not.toThrow();
      });

      xit("_validateFirebaseRef() does not throw errors given Firebase query", function() {
        expect(true).toBeFalsy();
      });
    });

    describe("_validateCssSelector():", function() {
      it("_validateCssSelector() throws errors given invalid CSS selectors", function() {
        invalidCssSelectors.forEach(function(invalidCssSelector) {
          expect(function() { _validateCssSelector(invalidCssSelector); }).toThrow();
        });
      });

      it("_validateCssSelector() does not throw errors given valid CSS selectors", function() {
        validCssSelectors.forEach(function(validCssSelector) {
          expect(function() { _validateCssSelector(validCssSelector); }).not.toThrow();
        });
      });
    });

    describe("_validateConfig():", function() {
      xit("_validateConfig() throws errors given invalid config objects", function() {
        invalidConfigs.forEach(function(invalidConfig) {
          expect(function() { _validateConfig(invalidConfig); }).toThrow();
        });
      });

      it("_validateConfig() does not throw errors given valid config objects", function() {
        expect(function() { _validateConfig(validConfig); }).not.toThrow();
      });
    });

    describe("_validateGrapher():", function() {
      it("_validateGrapher() throws errors given invalid grapher objects", function() {
        invalidGraphers.forEach(function(invalidGrapher) {
          expect(function() { _validateGrapher(invalidGrapher); }).toThrow();
        });
      });

      it("_validateGrapher() does not throw errors given valid grapher objects", function() {
        expect(function() { _validateGrapher(grapherStub); }).not.toThrow();
      });
    });
  });
});