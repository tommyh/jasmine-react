var React = require('react');

var spies = [],
  componentStubs = [];

var jasmineReact = {
  renderComponent: function(component, container, callback){
    if(typeof container === "undefined"){
      container = this.getJasmineContent();
    }

    var comp = (typeof callback === "undefined") ?
      React.renderComponent(component, container) :
      React.renderComponent(component, container, callback);

    return comp;
  },

  spyOnClass: function(klass, methodName){
    var klassProto = this.classPrototype(klass),
      jasmineSpy = spyOn(klassProto, methodName);

    // keep track of the spies, so we can clean up the __reactAutoBindMap later
    spies.push(jasmineSpy);

    // react.js will autobind `this` to the correct value and it caches that
    //  result on a __reactAutoBindMap for performance reasons.
    if(klassProto.__reactAutoBindMap){
      klassProto.__reactAutoBindMap[methodName] = jasmineSpy;
    }

    return jasmineSpy;
  },

  classComponentConstructor: function(klass){
    return klass.type ||                // React 0.11.1
           klass.componentConstructor;  // React 0.8.0
  },

  classPrototype: function(klass){
    var componentConstructor = this.classComponentConstructor(klass);

    if(typeof componentConstructor === "undefined"){
      throw("A component constructor could not be found for this class.  Are you sure you passed in a the component definition for a React component?")
    }

    return componentConstructor.prototype;
  },

  createStubComponent: function(obj, propertyName){
    // keep track of the components we stub, so we can swap them back later
    componentStubs.push({obj: obj, propertyName: propertyName, originalValue: obj[propertyName]});

    return obj[propertyName] = React.createClass({
      render: function(){
        return React.DOM.div();
      }
    });
  },

  addMethodToClass: function(klass, methodName, methodDefinition){
    if(typeof methodDefinition === "undefined"){
      methodDefinition = function(){};
    }
    this.classPrototype(klass)[methodName] = methodDefinition;
    return klass;
  },

  resetComponentStubs: function(){
    for (var i = 0; i < componentStubs.length; i++) {
      var stub = componentStubs[i];
      stub.obj[stub.propertyName] = stub.originalValue;
    }

    componentStubs = [];
  },

  removeAllSpies: function(){
    for (var i = 0; i < spies.length; i++) {
      var spy = spies[i];
      if(spy.baseObj.__reactAutoBindMap){
        spy.baseObj.__reactAutoBindMap[spy.methodName] = spy.originalValue;
      }
      spy.baseObj[spy.methodName] = spy.originalValue;
    }

    spies = [];
  },

  unmountComponent: function(component){
    return React.unmountComponentAtNode(component.getDOMNode().parentNode);
  },

  clearJasmineContent: function(){
    var jasmineContentEl = this.getJasmineContent();
    if(jasmineContentEl){
      React.unmountComponentAtNode(jasmineContentEl);
      jasmineContentEl.innerHTML = "";
    } else {
      var warningMessage = "jasmineReact is unable to clear out the jasmine content element, because it could not find an " +
        "element with an id of 'jasmine_content'. " +
        "This may result in bugs, because a react component which isn't unmounted may pollute other tests " +
        "and cause test failures/weirdness. " +
        "If you'd like to override this behavior to look for a different element, then implement a method like this: " +
        "jasmineReact.getJasmineContent = function(){ return document.getElementById('foo'); };"
      console.warn(warningMessage);
    }
  },

  getJasmineContent: function(){
    return document.getElementById("jasmine_content");
  }
};

// TODO: this has no automated test coverage.  Add some integration tests for coverage.
afterEach(function(){
  jasmineReact.removeAllSpies();
  jasmineReact.resetComponentStubs();
  jasmineReact.clearJasmineContent();
});

module.exports = jasmineReact;