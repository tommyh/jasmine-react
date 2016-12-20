var React = require('react');

var spies = [],
  componentStubs = [],
  renderedComponents = [];

var jasmineReact = {
  render: function(component, container, callback){
    if(typeof container === "undefined"){
      container = this.getDefaultContainer();
    }

    var comp = (typeof callback === "undefined") ?
      React.render(component, container) :
      React.render(component, container, callback);

    // keep track of the components we render, so we can unmount them later
    renderedComponents.push(comp);

    return comp;
  },

  spyOnClass: function(klass, methodName){
    var klassProto = this.classPrototype(klass),
      original = klassProto[methodName],
      jasmineSpy = spyOn(klassProto, methodName),
      methodNameIndex;

    // react.js will autobind `this` to the correct value and it caches that
    //  result on a __reactAutoBindMap for performance reasons.
    // React 0.14.x
    if(klassProto.__reactAutoBindMap){
      klassProto.__reactAutoBindMap[methodName] = jasmineSpy;
    }

    // React 15.x
    if(klassProto.__reactAutoBindPairs){
      methodNameIndex = klassProto.__reactAutoBindPairs.indexOf(methodName);
      if(methodNameIndex >= 0){
        klassProto.__reactAutoBindPairs[methodNameIndex + 1] = jasmineSpy;
      }
    }

    // keep track of the spies, so we can clean up the __reactAutoBindMap/__reactAutoBindPairs later
    // (Jasmine 2.1)
    spies.push({
      spy: jasmineSpy,
      baseObj: klassProto,
      methodName: methodName,
      methodNameIndex: methodNameIndex,
      originalValue: original
    });

    return jasmineSpy;
  },

  classComponentConstructor: function(klass){
    return klass.type ||                                    // React 0.11.1
           klass.componentConstructor ||                    // React 0.8.0
           klass.prototype && klass.prototype.constructor;  // React 15
  },

  classPrototype: function(klass){
    var componentConstructor = this.classComponentConstructor(klass);

    if(typeof componentConstructor === "undefined"){
      throw("A component constructor could not be found for this class.  Are you sure you passed in a the component definition for a React component?");
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
      // React 0.14.x
      if(spy.baseObj.__reactAutoBindMap){
        spy.baseObj.__reactAutoBindMap[spy.methodName] = spy.originalValue;
      }

      // React 15.x
      if(spy.baseObj.__reactAutoBindPairs){
        spy.baseObj.__reactAutoBindPairs[spy.methodNameIndex + 1] = spy.originalValue;
      }
      spy.baseObj[spy.methodName] = spy.originalValue;
    }

    spies = [];
  },

  unmountAllRenderedComponents: function(){
    for (var i = 0; i < renderedComponents.length; i++) {
      var renderedComponent = renderedComponents[i];
      this.unmountComponent(renderedComponent);
    }

    renderedComponents = [];
  },

  unmountComponent: function(component){
    if(component.isMounted()){
      return React.unmountComponentAtNode(component.getDOMNode().parentNode);
    } else {
      return false;
    }
  },

  getDefaultContainer: function(){
    return document.getElementById("jasmine_content");
  }
};

// backwards compatability for React < 0.12
jasmineReact.renderComponent = jasmineReact.render;

// TODO: this has no automated test coverage.  Add some integration tests for coverage.
afterEach(function(){
  jasmineReact.removeAllSpies();
  jasmineReact.resetComponentStubs();
  jasmineReact.unmountAllRenderedComponents();
});

module.exports = jasmineReact;
