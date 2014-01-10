describe("jasmineReact", function(){

  describe("top level environment", function(){
    it("should define one global object called 'jasmineReact'", function(){
      expect(window.jasmineReact).toBeDefined();
    });
  });

  describe("renderComponent", function(){
    var fakeComponentSpy, fakeContainerSpy, fakeRenderComponentResponseSpy;

    beforeEach(function(){
      fakeComponentSpy = jasmine.createSpy("fakeComponent");
      fakeContainerSpy = jasmine.createSpy("fakeContainer");

      fakeRenderComponentResponseSpy = jasmine.createSpy("fakeRenderComponentResponse");
      spyOn(React, "renderComponent").andReturn(fakeRenderComponentResponseSpy);
    });

    it("should call React.renderComponent", function(){
      jasmineReact.renderComponent();

      expect(React.renderComponent).toHaveBeenCalled();
    });

    it("should call React.renderComponent with the passed in component", function(){
      jasmineReact.renderComponent(fakeComponentSpy, fakeContainerSpy);

      expect(React.renderComponent).toHaveBeenCalledWith(fakeComponentSpy, jasmine.any(Function));
    });

    it("should call React.renderComponent with the passed in container", function(){
      jasmineReact.renderComponent(fakeComponentSpy, fakeContainerSpy);

      expect(React.renderComponent).toHaveBeenCalledWith(jasmine.any(Function), fakeContainerSpy);
    });

    it("should call React.renderComponent with #jasmine_content container if no container is passed in", function(){
      jasmineReact.renderComponent(fakeComponentSpy);

      expect(React.renderComponent).toHaveBeenCalledWith(jasmine.any(Function), document.getElementById("jasmine_content"));
    });

    it("should call React.renderComponent with a callback if one is passed in", function(){
      var fakeCallbackSpy = jasmine.createSpy("fakeCallback");

      jasmineReact.renderComponent(fakeComponentSpy, fakeContainerSpy, fakeCallbackSpy);

      expect(React.renderComponent).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function), fakeCallbackSpy);
    });

    it("should return the return value of React.renderComponent", function(){
      var returnValue = jasmineReact.renderComponent(fakeComponentSpy, fakeContainerSpy);

      expect(returnValue).toBe(fakeRenderComponentResponseSpy);
    });
  });

  describe("spyOnClass", function(){
    var fooKlass;

    beforeEach(function(){
      fooKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        bar: function(){
          return "real value";
        }
      });
    });

    it("should allow a react class to have a function be spied on (when called via the auto bind map)", function(){
      jasmineReact.spyOnClass(fooKlass, "bar").andReturn("fake value");

      var foo = jasmineReact.renderComponent(fooKlass());

      expect(foo.bar()).not.toBe("real value");
      expect(foo.bar()).toBe("fake value");
    });

    it("should allow a react class to have a function be spied on (when called via the class prototype)", function(){
      var klassWithADefaultProp = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        getDefaultProps: function(){
          return {
            defaultBar: this.bar()
          }
        },

        bar: function(){
          return "real value";
        }
      });

      jasmineReact.spyOnClass(klassWithADefaultProp, "bar").andReturn("fake value");

      var foo = jasmineReact.renderComponent(klassWithADefaultProp());

      expect(foo.props.defaultBar).not.toBe("real value");
      expect(foo.props.defaultBar).toBe("fake value");
    });

    it("should allow a react class to have a function which was added via 'jasmineReact.addMethodToClass' be spied on", function(){
      var simpleKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        }
      });
      jasmineReact.addMethodToClass(simpleKlass, "fauxMethod", function(){});
      jasmineReact.spyOnClass(simpleKlass, "fauxMethod").andCallFake(function(){});
    });

    it("should return the spy as the return value", function(){
      var mySpy = jasmineReact.spyOnClass(fooKlass, "bar");
      var foo = jasmineReact.renderComponent(fooKlass());

      expect(mySpy.callCount).toBe(0);

      foo.bar();

      expect(mySpy.callCount).toBe(1);
    });
    
    it("should maintain regular jasmine spy behavior", function(){
      jasmineReact.spyOnClass(fooKlass, "bar").andReturn(42);

      var foo = jasmineReact.renderComponent(fooKlass());

      expect(foo.bar()).toBe(42);
    });
  });

  describe("spyOnClass: test pollution", function(){
    it("should not pollute a spied on function from one test into another test", function(){
      var barKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        bar: function(){
          return "real value";
        }
      });

      // lets pretend this is test #1
      jasmineReact.spyOnClass(barKlass, "bar").andCallFake(function(){
        return "fake value";
      });
      var barOne = jasmineReact.renderComponent(barKlass());
      expect(barOne.bar()).toBe("fake value");

      // these are the methods in the afterEach which are needed to prevent test pollution for spyOnClass
      jasmineReact.removeAllSpies();
      jasmineReact.clearJasmineContent();

      // lets pretend this is test #2
      var barTwo = jasmineReact.renderComponent(barKlass());
      expect(barTwo.bar()).toBe("real value");
    });
  });

  describe("classPrototype", function(){

    var fooKlass;

    beforeEach(function(){
      fooKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        bar: function(){},
        baz: "test"
      });
    });

    it("should return the prototype of the react class' component constructor", function(){
      var proto = jasmineReact.classPrototype(fooKlass);
      expect(proto.bar).toBeDefined();
      expect(proto.baz).toBe("test");
    });

    it("should throw a friendly error if a component is passed in (instead of a component class definition)", function(){
      var foo = jasmineReact.renderComponent(fooKlass());

      expect(function(){
        jasmineReact.classPrototype(foo);
      }).toThrow("A component constructor could not be found for this class.  Are you sure you passed in a the component definition for a React component?");
    });
  });

  describe("addMethodToClass", function(){
    var fooKlass;

    beforeEach(function(){
      fooKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        }
      });
    });

    it("should allow a method to be added to a react component class", function(){
      var fooOne = jasmineReact.renderComponent(fooKlass());

      expect(fooOne.newMethod).toBeUndefined();

      jasmineReact.addMethodToClass(fooKlass, "newMethod", function(){});

      var fooTwo = jasmineReact.renderComponent(fooKlass());

      expect(fooTwo.newMethod).toBeDefined();
    });

    it("should accept a method definition for the new method", function(){
      jasmineReact.addMethodToClass(fooKlass, "newMethod", function(){
        return "I'm a stub for a real method!";
      });

      var foo = jasmineReact.renderComponent(fooKlass());

      expect(foo.newMethod()).toBe("I'm a stub for a real method!");
    });

    it("should return the react class", function(){
      var returnValue = jasmineReact.addMethodToClass(fooKlass, "newMethod", function(){});

      expect(returnValue).toEqual(fooKlass);
    });
  });

  describe("setDisplayNameForClass", function(){

    var fooKlass;

    beforeEach(function(){
      fooKlass = React.createClass({

        propTypes: {
          myRequiredString: React.PropTypes.string.isRequired
        },

        render: function(){
          return React.DOM.div({});
        }
      });
    });

    it("should allow a displayName to be set for a class", function(){
      jasmineReact.setDisplayNameForClass(fooKlass, "testClass");

      expect(function(){
        var foo = jasmineReact.renderComponent(fooKlass());
      }).toThrow("Invariant Violation: Required prop `myRequiredString` was not specified in `testClass`.");
    });

    it("should return the class", function(){
      var returnValue = jasmineReact.setDisplayNameForClass(fooKlass, "testClass");
      expect(returnValue).toBe(fooKlass);
    });

  });

  describe("setDisplayNameForClass: test pollution", function(){
    it("should not let setting a displayName in one test pollute another test", function(){
      var fakeDisplayName = "testClass",
        barKlass = React.createClass({
          render: function(){
            return React.DOM.div({});
          }
        });

      // let's pretend this is test #1
      expect(barKlass.componentConstructor.displayName).toBeUndefined();
      jasmineReact.setDisplayNameForClass(barKlass, fakeDisplayName);
      expect(barKlass.componentConstructor.displayName).toBe(fakeDisplayName);

      // these are the methods in the afterEach which are needed to prevent test pollution for setDisplayNameForClass
      jasmineReact.resetDisplayNameForClasses();

      // let's pretend this is test #2
      expect(barKlass.componentConstructor.displayName).not.toBe(fakeDisplayName);
      expect(barKlass.componentConstructor.displayName).toBeUndefined();
    });
  });

  describe("unmountComponent", function(){
    var componentWillUnmountSpy, barKlass;

    beforeEach(function(){
      componentWillUnmountSpy = jasmine.createSpy("componentWillUnmount");

      barKlass = React.createClass({
        render: function(){
          return React.DOM.div();
        },
        componentWillUnmount: function(){
          componentWillUnmountSpy();
        }
      });

    });

    it("should unmount the component", function(){
      var barComponent = jasmineReact.renderComponent(barKlass());
      expect(componentWillUnmountSpy.callCount).toBe(0);

      jasmineReact.unmountComponent(barComponent);

      expect(componentWillUnmountSpy.callCount).toBe(1);
    });

    it("should return the return value of unmountComponentAtNode", function(){
      var fakeUnmount = jasmine.createSpy("unmountComponentAtNode");
      spyOn(React, "unmountComponentAtNode").andReturn(fakeUnmount);

      var barComponent = jasmineReact.renderComponent(barKlass());

      expect(jasmineReact.unmountComponent(barComponent)).toBe(fakeUnmount);
    });
  });

  describe("clearJasmineContent", function(){
    it("should clear out the html in #jasmine_content", function(){
      var barKlass = React.createClass({
        render: function(){
          return React.DOM.div({id: "bar-test-div"});
        }
      });

      jasmineReact.renderComponent(barKlass());
      expect(document.getElementById("bar-test-div")).toBeDefined();

      jasmineReact.clearJasmineContent();

      expect(document.getElementById("bar-test-div")).toBeNull();
    });

    it("should unmount the react component in #jasmine_content", function(){
      var componentWillUnmountSpy = jasmine.createSpy("componentWillUnmount");

      var barKlass = React.createClass({
        render: function(){
          return React.DOM.div({id: "bar-test-div"});
        },
        componentWillUnmount: function(){
          componentWillUnmountSpy();
        }
      });

      jasmineReact.renderComponent(barKlass());
      expect(componentWillUnmountSpy.callCount).toBe(0);

      jasmineReact.clearJasmineContent();

      expect(componentWillUnmountSpy.callCount).toBe(1);
    });

    it("should warn the user if a jasmine content element can't be found", function(){
      spyOn(jasmineReact, "getJasmineContent").andCallFake(function(){
        return document.getElementById("bogus");
      });

      spyOn(console, "warn");

      jasmineReact.clearJasmineContent();

      expect(console.warn).toHaveBeenCalled();
      expect(console.warn.mostRecentCall.args[0].substring(0, 63)).toBe("jasmineReact is unable to clear out the jasmine content element");
    });
  });

});