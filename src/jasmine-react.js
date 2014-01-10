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

  if(klassProto.__reactAutoBindMap){
    klassProto.__reactAutoBindMap[methodName] = jasmineSpy;
  }

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
    if(spy.baseObj.__reactAutoBindMap){
      spy.baseObj.__reactAutoBindMap[spy.methodName] = spy.originalValue;
    }
    spy.baseObj[spy.methodName] = spy.originalValue;
  }

  this.reactSpies_ = [];
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
  jasmineReact.resetDisplayNameForClasses();
  jasmineReact.clearJasmineContent();
});