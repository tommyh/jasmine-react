window.jasmineReact = {};

jasmineReact.renderComponent = function(component, container, callback){
  if(typeof container === "undefined"){
    container = jasmineReact.getJasmineContent();
  }

  var comp = (typeof callback === "undefined") ?
      React.renderComponent(component, container) :
      React.renderComponent(component, container, callback);

  return comp;
};

jasmineReact.spyOnClass = function(klass, methodName){
  var klassProto = jasmineReact.classPrototype(klass),
    jasmineSpy = spyOn(klassProto, methodName);

  this.jasmineReactSpies_ = this.jasmineReactSpies_ || [];
  this.jasmineReactSpies_.push(jasmineSpy);

  if(klassProto.__reactAutoBindMap){
    klassProto.__reactAutoBindMap[methodName] = jasmineSpy;
  }

  return jasmineSpy;
};

jasmineReact.classComponentConstructor = function(klass){
  return klass.type ||                // React 0.11.1
         klass.componentConstructor;  // React 0.8.0
};

jasmineReact.classPrototype = function(klass){
  var componentConstructor = jasmineReact.classComponentConstructor(klass);

  if(typeof componentConstructor === "undefined"){
    throw("A component constructor could not be found for this class.  Are you sure you passed in a the component definition for a React component?")
  }

  return componentConstructor.prototype;
};

jasmineReact.createStubComponent = function(obj, propertyName){
  this.jasmineReactComponentStubs_ = this.jasmineReactComponentStubs_ || [];
  this.jasmineReactComponentStubs_.push({obj: obj, propertyName: propertyName, originalValue: obj[propertyName]});

  return obj[propertyName] = React.createClass({
    render: function(){
      return React.DOM.div();
    }
  });
};

jasmineReact.addMethodToClass = function(klass, methodName, methodDefinition){
  if(typeof methodDefinition === "undefined"){
    methodDefinition = function(){};
  }
  jasmineReact.classPrototype(klass)[methodName] = methodDefinition;
  return klass;
};

jasmineReact.resetComponentStubs = function(){
  if(!this.jasmineReactComponentStubs_){
    return;
  }

  for (var i = 0; i < this.jasmineReactComponentStubs_.length; i++) {
    var stub = this.jasmineReactComponentStubs_[i];
    stub.obj[stub.propertyName] = stub.originalValue;
  }

  this.jasmineReactComponentStubs_ = [];
};

jasmineReact.removeAllSpies = function(){
  if(!this.jasmineReactSpies_){
    return;
  }

  for (var i = 0; i < this.jasmineReactSpies_.length; i++) {
    var spy = this.jasmineReactSpies_[i];
    if(spy.baseObj.__reactAutoBindMap){
      spy.baseObj.__reactAutoBindMap[spy.methodName] = spy.originalValue;
    }
    spy.baseObj[spy.methodName] = spy.originalValue;
  }

  this.jasmineReactSpies_ = [];
};

jasmineReact.unmountComponent = function(component){
  return React.unmountComponentAtNode(component.getDOMNode().parentNode);
};

jasmineReact.clearJasmineContent = function(){
  var jasmineContentEl = jasmineReact.getJasmineContent();
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
};

jasmineReact.getJasmineContent = function(){
  return document.getElementById("jasmine_content");
};

afterEach(function(){
  jasmineReact.removeAllSpies();
  jasmineReact.resetComponentStubs();
  jasmineReact.clearJasmineContent();
});