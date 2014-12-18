describe("jasmineReact", function(){

  describe("top level environment", function(){
    it("should define one global object called 'jasmineReact'", function(){
      expect(window.jasmineReact).toBeDefined();
    });
  });

  describe("render", function(){
    var FooKlass;

    beforeEach(function(){
      FooKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        }
      });

      spyOn(React, "render").andCallThrough();
    });

    it("should call React.render with the passed in component", function(){
      jasmineReact.render(<FooKlass foo="bar" />, document.getElementById("jasmine_content"));

      var renderArgs = React.render.mostRecentCall.args[0];

      expect(renderArgs.props.foo).toBe("bar");
    });

    it("should call React.render with the passed in container", function(){
      var container = document.getElementById("jasmine_content");
      jasmineReact.render(<FooKlass />, container);

      expect(React.render).toHaveBeenCalledWith(jasmine.any(Object), container);
    });

    it("should call React.render with #jasmine_content container if no container is passed in", function(){
      jasmineReact.render(<FooKlass />);

      expect(React.render).toHaveBeenCalledWith(jasmine.any(Object), document.getElementById("jasmine_content"));
    });

    it("should call React.render with a callback if one is passed in", function(){
      var fakeCallbackSpy = jasmine.createSpy("fakeCallback");

      jasmineReact.render(<FooKlass />, document.getElementById("jasmine_content"), fakeCallbackSpy);

      expect(React.render).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object), fakeCallbackSpy);
    });

    it("should return the return value of React.render", function(){
      var returnValue = jasmineReact.render(<FooKlass baz="bat" />, document.getElementById("jasmine_content"));

      expect(returnValue.props.baz).toBe("bat");
    });

    it("should alias jasmineReact.renderComponent to jasmineReact.render", function(){
      var returnValue = jasmineReact.renderComponent(<FooKlass baz="bat" />, document.getElementById("jasmine_content"));

      expect(returnValue.props.baz).toBe("bat");
    });
  });

  describe("render: test pollution", function(){
    it("should not pollute a rendered component from one test into another test", function(){
      var CoolKlass = React.createClass({
        render: function(){
          return React.DOM.div({
            id: "really-cool"
          });
        }
      });

      // lets pretend this is test #1
      jasmineReact.render(<CoolKlass />);

      expect(document.getElementById("really-cool")).toBeDefined();

      // this is the method in the afterEach which is needed to prevent test pollution for render
      jasmineReact.unmountAllRenderedComponents();

      // lets pretend this is test #1
      expect(document.getElementById("really-cool")).toBeNull();
    });
  });

  describe("spyOnClass", function(){
    var FooKlass;

    beforeEach(function(){
      FooKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        bar: function(){
          return "real value";
        }
      });
    });

    it("should allow a react class to have a function be spied on (when called externally)", function(){
      jasmineReact.spyOnClass(FooKlass, "bar").andReturn("fake value");

      var foo = jasmineReact.render(<FooKlass />);

      expect(foo.bar()).not.toBe("real value");
      expect(foo.bar()).toBe("fake value");
    });

    it("should allow a react class to have a function be spied on (when called internally in a lifecycle function)", function(){
      var KlassWithAnInitialState = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        getInitialState: function(){
          return {
            initialBar: this.bar()
          };
        },

        bar: function(){
          return "real value";
        }
      });

      jasmineReact.spyOnClass(KlassWithAnInitialState, "bar").andReturn("fake value");

      var foo = jasmineReact.render(<KlassWithAnInitialState />);

      expect(foo.state.initialBar).not.toBe("real value");
      expect(foo.state.initialBar).toBe("fake value");
    });

    it("should allow a react class to have a function be spied on (when called inside the render function)", function(){
      var KlassWithARenderFunction = React.createClass({
        render: function(){
          return React.DOM.div({
            className: this.bar()
          });
        },

        bar: function(){
          return "real-value";
        }
      });

      jasmineReact.spyOnClass(KlassWithARenderFunction, "bar").andReturn("fake-value");

      var foo = jasmineReact.render(<KlassWithARenderFunction />);

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
      var mySpy = jasmineReact.spyOnClass(FooKlass, "bar");
      var foo = jasmineReact.render(<FooKlass />);

      expect(mySpy.callCount).toBe(0);

      foo.bar();

      expect(mySpy.callCount).toBe(1);
    });

    it("should maintain regular jasmine spy behavior", function(){
      jasmineReact.spyOnClass(FooKlass, "bar").andReturn(42);

      var foo = jasmineReact.render(<FooKlass />);

      expect(foo.bar()).toBe(42);
    });
  });

  describe("spyOnClass: test pollution", function(){
    it("should not pollute a spied on function from one test into another test", function(){
      var BarKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        bar: function(){
          return "real value";
        }
      });

      // lets pretend this is test #1
      jasmineReact.spyOnClass(BarKlass, "bar").andCallFake(function(){
        return "fake value";
      });
      var barOne = jasmineReact.render(<BarKlass />);
      expect(barOne.bar()).toBe("fake value");

      // these are the methods in the afterEach which are needed to prevent test pollution for spyOnClass
      jasmineReact.removeAllSpies();
      jasmineReact.unmountAllRenderedComponents();

      // lets pretend this is test #2
      var barTwo = jasmineReact.render(<BarKlass />);
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

    // React is now doing this itself ...
    // it("should have a react class definition which can be rendered", function(){
    //   jasmineReact.createStubComponent(namespace, "Profile");
    //
    //   expect(function(){
    //     jasmineReact.render(namespace.Profile());
    //   }).not.toThrow();
    // });

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

      // React is now doing this itself ...
      // expect(function(){
      //   jasmineReact.render(namespace.Profile());
      // }).not.toThrow();

      // these are the methods in the afterEach which are needed to prevent test pollution for createStubComponent
      jasmineReact.resetComponentStubs();

      // lets pretend this is test #2
      expect(namespace.Profile).toBe("not a react class definition");
    });
  });

  describe("classPrototype", function(){

    var FooKlass;

    beforeEach(function(){
      FooKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        },

        bar: function(){},
        baz: "test"
      });
    });

    it("should return the prototype of the react class' component constructor", function(){
      var proto = jasmineReact.classPrototype(FooKlass);
      expect(proto.bar).toBeDefined();
      expect(proto.baz).toBe("test");
    });

    it("should throw a friendly error if a component is passed in (instead of a component class definition)", function(){
      var foo = jasmineReact.render(<FooKlass />);

      expect(function(){
        jasmineReact.classPrototype(foo);
      }).toThrow("A component constructor could not be found for this class.  Are you sure you passed in a the component definition for a React component?");
    });
  });

  describe("addMethodToClass", function(){
    var FooKlass;

    beforeEach(function(){
      FooKlass = React.createClass({
        render: function(){
          return React.DOM.div({});
        }
      });
    });

    it("should allow a method to be added to a react component class", function(){
      var fooOne = jasmineReact.render(<FooKlass />);

      expect(fooOne.newMethod).toBeUndefined();

      jasmineReact.addMethodToClass(FooKlass, "newMethod", function(){});

      var fooTwo = jasmineReact.render(<FooKlass />);

      expect(fooTwo.newMethod).toBeDefined();
    });

    it("should accept a method definition for the new method", function(){
      jasmineReact.addMethodToClass(FooKlass, "newMethod", function(){
        return "I'm a stub for a real method!";
      });

      var foo = jasmineReact.render(<FooKlass />);

      expect(foo.newMethod()).toBe("I'm a stub for a real method!");
    });

    it("should default the method definition to a no-op", function(){
      jasmineReact.addMethodToClass(FooKlass, "newMethod");

      var foo = jasmineReact.render(<FooKlass />);

      expect(foo.newMethod()).toBeUndefined();
    });

    it("should return the react class", function(){
      var returnValue = jasmineReact.addMethodToClass(FooKlass, "newMethod", function(){});

      expect(returnValue).toEqual(FooKlass);
    });
  });

  describe("unmountComponent", function(){
    var componentWillUnmountSpy, BarKlass;

    beforeEach(function(){
      componentWillUnmountSpy = jasmine.createSpy("componentWillUnmount");

      BarKlass = React.createClass({
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
        var barComponent = jasmineReact.render(<BarKlass />);
        expect(componentWillUnmountSpy.callCount).toBe(0);

        jasmineReact.unmountComponent(barComponent);

        expect(componentWillUnmountSpy.callCount).toBe(1);
      });

      it("should return the return value of unmountComponentAtNode", function(){
        var barComponent = jasmineReact.render(<BarKlass cool="town" />);

        var returnValue = jasmineReact.unmountComponent(barComponent);

        expect(returnValue).toBe(true);
      });
    });

    describe("the component is not mounted", function(){

      it("should not unmount the component", function(){
        var barComponent = jasmineReact.render(<BarKlass />);

        React.unmountComponentAtNode(barComponent.getDOMNode().parentNode);

        expect(componentWillUnmountSpy.callCount).toBe(1);

        expect(function(){
          jasmineReact.unmountComponent(barComponent);
        }).not.toThrow();

        expect(componentWillUnmountSpy.callCount).toBe(1);
      });

      it("should return false", function(){
        var barComponent = jasmineReact.render(<BarKlass />);

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
