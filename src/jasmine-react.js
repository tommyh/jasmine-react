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

  this.reactSpies_ = this.reactSpies_ || [];
  this.reactSpies_.push(jasmineSpy);

  // TODO: I need to check that __reactAutoBindMap exists.  Add a failing test for this behavior
  klassProto.__reactAutoBindMap[methodName] = jasmineSpy;

  return jasmineSpy;
};

jasmineReact.classPrototype = function(klass){
  var componentConstructor = klass.componentConstructor;

  if(typeof componentConstructor === "undefined"){
    throw("A component constructor could not be found for this class.  Are you sure you passed in a the component definition for a React component?")
  }

  return componentConstructor.prototype;
};

jasmineReact.addMethodToClass = function(klass, methodName, methodDefinition){
  jasmineReact.classPrototype(klass)[methodName] = methodDefinition;
  return klass;
};

jasmineReact.setDisplayNameForClass = function(klass, displayName){
  var originalDisplayName = klass.componentConstructor.displayName;
  klass.componentConstructor.displayName = displayName;

  this.reactClassDisplayNameOverrides_ = this.reactClassDisplayNameOverrides_ || [];
  this.reactClassDisplayNameOverrides_.push({klass: klass, originalDisplayName: originalDisplayName});
  
  return klass;
};


jasmineReact.resetDisplayNameForClasses = function(){
  if(!this.reactClassDisplayNameOverrides_){
    return;
  }

  for (var i = 0; i < this.reactClassDisplayNameOverrides_.length; i++) {
    var obj = this.reactClassDisplayNameOverrides_[i];
    obj.klass.componentConstructor.displayName = obj.originalDisplayName;
  }

  this.reactClassDisplayNameOverrides_ = [];
};

jasmineReact.removeAllSpies = function(){
  if(!this.reactSpies_){
    return;
  }

  for (var i = 0; i < this.reactSpies_.length; i++) {
    var spy = this.reactSpies_[i];
    // TODO: Do I need to check that baseObj.__reactAutoBindMap exists??
    spy.baseObj.__reactAutoBindMap[spy.methodName] = spy.originalValue;
    spy.baseObj[spy.methodName] = spy.originalValue;
  }

  this.reactSpies_ = [];
};

jasmineReact.clearJasmineContent = function(){
  var jasmineContentEl = jasmineReact.getJasmineContent();
  if(jasmineContentEl){
    React.unmountComponentAtNode(jasmineContentEl);
    jasmineContentEl.innerHTML = "";
  }
};

jasmineReact.getJasmineContent = function(){
  return document.getElementById("jasmine_content");
};

afterEach(function(){
  jasmineReact.removeAllSpies();
  jasmineReact.resetDisplayNameForClasses();
  jasmineReact.clearJasmineContent();
});