describe("jasmineReact", function(){

  describe("top level environment", function(){
    it("should define one global object called 'jasmineReact'", function(){
      expect(window.jasmineReact).toBeDefined();
    });
  });

  describe('TestUtils convenience property', function() {

    it('should have TestUtils property maps to React.addons.TestUtils', function() {

      expect(jasmineReact.TestUtils).toBe(React.addons.TestUtils);

    });

  });

});