describe("jasmineReact", function(){

  describe("top level environment", function(){
    it("should define one global object called 'jasmineReact'", function(){
      expect(window.jasmineReact).toBeDefined();
    });
  });

  describe("renderComponent", function(){
    var fooKlass;

    beforeEach(function(){
      fooKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        }
      });

      spyOn(React, "renderComponent").andCallThrough();
    });

    it("should call React.renderComponent with the passed in component", function(){
      jasmineReact.renderComponent(fooKlass({foo: "bar"}), document.getElementById("jasmine_content"));

      var renderComponentArgs = React.renderComponent.mostRecentCall.args[0];

      expect(renderComponentArgs.props.foo).toBe("bar");
    });

    it("should call React.renderComponent with the passed in container", function(){
      var container = document.getElementById("jasmine_content");
      jasmineReact.renderComponent(fooKlass(), container);

      expect(React.renderComponent).toHaveBeenCalledWith(jasmine.any(Object), container);
    });

    it("should call React.renderComponent with #jasmine_content container if no container is passed in", function(){
      jasmineReact.renderComponent(fooKlass());

      expect(React.renderComponent).toHaveBeenCalledWith(jasmine.any(Object), document.getElementById("jasmine_content"));
    });

    it("should call React.renderComponent with a callback if one is passed in", function(){
      var fakeCallbackSpy = jasmine.createSpy("fakeCallback");

      jasmineReact.renderComponent(fooKlass(), document.getElementById("jasmine_content"), fakeCallbackSpy);

      expect(React.renderComponent).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object), fakeCallbackSpy);
    });

    it("should return the return value of React.renderComponent", function(){
      var returnValue = jasmineReact.renderComponent(fooKlass({baz: "bat"}), document.getElementById("jasmine_content"));

      expect(returnValue.props.baz).toBe("bat");
    });
  });

  describe("renderComponent: test pollution", function(){
    it("should not pollute a rendered component from one test into another test", function(){
      var coolKlass = React.createClass({
        render: function(){
          return React.DOM.div({
            id: "really-cool"
          });
        }
      });

      // lets pretend this is test #1
      jasmineReact.renderComponent(coolKlass());

      expect(document.getElementById("really-cool")).toBeDefined();

      // this is the method in the afterEach which is needed to prevent test pollution for renderComponent
      jasmineReact.unmountAllRenderedComponents();

      // lets pretend this is test #1
      expect(document.getElementById("really-cool")).toBeNull();
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

    it("should allow a react class to have a function be spied on (when called externally)", function(){
      jasmineReact.spyOnClass(fooKlass, "bar").andReturn("fake value");

      var foo = jasmineReact.renderComponent(fooKlass());

      expect(foo.bar()).not.toBe("real value");
      expect(foo.bar()).toBe("fake value");
    });

    it("should allow a react class to have a function be spied on (when called internally in a lifecycle function)", function(){
      var klassWithAnInitialState = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        getInitialState: function(){
          return {
            initialBar: this.bar()
          }
        },

        bar: function(){
          return "real value";
        }
      });

      jasmineReact.spyOnClass(klassWithAnInitialState, "bar").andReturn("fake value");

      var foo = jasmineReact.renderComponent(klassWithAnInitialState());

      expect(foo.state.initialBar).not.toBe("real value");
      expect(foo.state.initialBar).toBe("fake value");
    });

    it("should allow a react class to have a function be spied on (when called inside the render function)", function(){
      var klassWithARenderFunction = React.createClass({
        render: function(){
          return React.DOM.div({
            className: this.bar()
          });
        },

        bar: function(){
          return "real-value";
        }
      });

      jasmineReact.spyOnClass(klassWithARenderFunction, "bar").andReturn("fake-value");

      var foo = jasmineReact.renderComponent(klassWithARenderFunction());

      expect(foo.getDOMNode().className).not.toBe("real-value");
      expect(foo.getDOMNode().className).toBe("fake-value");
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
      jasmineReact.unmountAllRenderedComponents();

      // lets pretend this is test #2
      var barTwo = jasmineReact.renderComponent(barKlass());
      expect(barTwo.bar()).toBe("real value");
    });
  });

  describe("createStubComponent", function(){
    var namespace;

    beforeEach(function(){
      namespace = {
        Profile: "not a react class definition"
      };
    });

    it("should replace the property value with a valid react class definition", function(){
      jasmineReact.createStubComponent(namespace, "Profile");

      expect(jasmineReact.classPrototype(namespace.Profile).render).toBeDefined();
    });

    it("should have a react class definition which can be rendered", function(){
      jasmineReact.createStubComponent(namespace, "Profile");

      expect(function(){
        jasmineReact.renderComponent(namespace.Profile());
      }).not.toThrow();
    });

    it("should return the component stub", function(){
      var returnValue = jasmineReact.createStubComponent(namespace, "Profile");

      expect(returnValue).toBeDefined();
      expect(jasmineReact.classPrototype(returnValue).render).toBeDefined();
    });
  });

  describe("createStubComponent: test pollution", function(){
    it("should reset the property value to the original value after the test", function(){
      var namespace = {
        Profile: "not a react class definition"
      };

      // lets pretend this is test #1
      expect(namespace.Profile).toBe("not a react class definition");
      jasmineReact.createStubComponent(namespace, "Profile");
      expect(namespace.Profile).not.toBe("not a react class definition");
      expect(typeof namespace.Profile).toBe("function");
      expect(function(){
        jasmineReact.renderComponent(namespace.Profile());
      }).not.toThrow();

      // these are the methods in the afterEach which are needed to prevent test pollution for createStubComponent
      jasmineReact.resetComponentStubs();

      // lets pretend this is test #2
      expect(namespace.Profile).toBe("not a react class definition");
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

    it("should default the method definition to a no-op", function(){
      jasmineReact.addMethodToClass(fooKlass, "newMethod");

      var foo = jasmineReact.renderComponent(fooKlass());

      expect(foo.newMethod()).toBeUndefined();
    });

    it("should return the react class", function(){
      var returnValue = jasmineReact.addMethodToClass(fooKlass, "newMethod", function(){});

      expect(returnValue).toEqual(fooKlass);
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

    describe("the component is mounted", function(){
      it("should unmount the component", function(){
        var barComponent = jasmineReact.renderComponent(barKlass());
        expect(componentWillUnmountSpy.callCount).toBe(0);

        jasmineReact.unmountComponent(barComponent);

        expect(componentWillUnmountSpy.callCount).toBe(1);
      });

      it("should return the return value of unmountComponentAtNode", function(){
        var barComponent = jasmineReact.renderComponent(barKlass({cool: "town"}));

        var returnValue = jasmineReact.unmountComponent(barComponent);

        expect(returnValue).toBe(true);
      });
    });

    describe("the component is not mounted", function(){

      it("should not unmount the component", function(){
        var barComponent = jasmineReact.renderComponent(barKlass());

        React.unmountComponentAtNode(barComponent.getDOMNode().parentNode);

        expect(componentWillUnmountSpy.callCount).toBe(1);

        expect(function(){
          jasmineReact.unmountComponent(barComponent);
        }).not.toThrow();

        expect(componentWillUnmountSpy.callCount).toBe(1);
      });

      it("should return false", function(){
        var barComponent = jasmineReact.renderComponent(barKlass());

        React.unmountComponentAtNode(barComponent.getDOMNode().parentNode);

        var returnValue;

        expect(function(){
          returnValue = jasmineReact.unmountComponent(barComponent);
        }).not.toThrow();

        expect(returnValue).toBe(false);
      });
    });


  });

});