/*
 * The objective of this spec is to test all of the code samples in the official documentation.
 *   If the code samples are wrong, people will think the library is wrong - which is no bueno. :)
 *   Note: These tests might not be the best because they'll use global variables and stuff like that,
 *   but for right now that trade-off is fine.  That's another reason why this spec is completely
 *   isolated from the core spec suite.
 */

describe("README.md", function(){

  describe("Spying on a method in a React Class", function(){
    window.HelloWorld = React.createClass({
      getInitialState: function(){
        return { number: this.randomNumber() };
      },
      randomNumber: function(){
        return Math.random();
      },
      render: function() {
        return (<div>Hello {this.state.number}</div>);
      }
    });

    describe("HelloWorld", function(){
      it("can spy on a function for a React class", function(){
        jasmineReact.spyOnClass(HelloWorld, "randomNumber").andReturn(42);

        // jasmineReact wraps React.render, so you don't have to worry
        //  about the async nature of when the actual DOM get's rendered, or selecting
        //  where your component needs to get rendered (default is #jasmine_content)
        var myWorld = jasmineReact.render(<HelloWorld />);

        expect(myWorld.state.number).toBe(42);
      });

      it("can assert that a spy has been called", function(){
        jasmineReact.spyOnClass(HelloWorld, "randomNumber");

        jasmineReact.render(<HelloWorld />);

        // because we spy on the class and not the instance, we have to assert that the
        //   function on the class' prototype was called.
        expect(jasmineReact.classPrototype(HelloWorld).randomNumber).toHaveBeenCalled();
      });
    });
  });

  describe("Replacing a component's subcomponent with a test double", function(){
    window.Avatar = React.createClass({
      render: function() {
        return (
          <div>
            <Profile username="Zuck" ref="pic" />
          </div>
          );
      }
    });

    window.Profile = React.createClass({
      render: function(){
        throw("I like to blow up");
      }
    });

    describe("Avatar", function(){

      it("should spy on a subcomponent and use a test double component", function(){
        jasmineReact.createStubComponent(window, "Profile");

        // This line won't throw the "I like to blow up" error because we've replaced the class with a test double!
        var avatar = jasmineReact.render(<Avatar />);

        expect(avatar.refs.pic.props.username).toBe("Zuck");
      });

    });

  });

  describe("Adding a method to a component class", function(){
    window.Avatar = React.createClass({
      render: function() {
        return (
          <div>
            <Profile username="Zuck" ref="pic" />
          </div>
          );
      },

      rotateProfile: function(){
        this.refs.pic.rotate();
      }
    });

    describe("Avatar", function(){
      describe("rotateProfile", function(){
        it("should call 'rotate' on the Profile subcomponent", function(){
          var profileClassStub = jasmineReact.createStubComponent(window, "Profile");

          // We could also do: jasmineReact.addMethodToClass(window.Profile, "rotate", function(){});
          jasmineReact.addMethodToClass(profileClassStub, "rotate", function(){});
          jasmineReact.spyOnClass(profileClassStub, "rotate");

          var avatar = jasmineReact.render(<Avatar />);

          expect(jasmineReact.classPrototype(profileClassStub).rotate).not.toHaveBeenCalled();
          avatar.rotateProfile();
          expect(jasmineReact.classPrototype(profileClassStub).rotate).toHaveBeenCalled();
        });
      });
    });
  });

});
