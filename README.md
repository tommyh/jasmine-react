*jasmine-react* is a small suite of helper functions to make unit testing React.js components painless.

# Why do I need jasmine-react.js?

React.js' architecture is based on the idea that mutation is hard, so your React.js components should represent a state machine which can represent your UI under any state.  This is an extremely powerful idea and means that you will often compose components inside of other components.  While this is great for code reuse, it makes isolating one component for a unit test slightly more difficult.  React.js will also provide some very helpful features (like auto binding), which make it more difficult to get under the covers and stub things out.  jasmine-react aims to solve these testing issues.

# Synopsis

Here's an overview of how jasmineReact can be used:

### Spying on a method in a React Class

```javascript
window.HelloWorld = React.createClass({
  getDefaultProps: function(){
    return { number: this.randomNumber() };
  },
  randomNumber: function(){
    return Math.random();
  },
  render: function() {
    return (<div>Hello {this.props.number}</div>);
  }
});

describe("HelloWorld", function(){
  it("can spy on a function for a React class", function(){
    jasmineReact.spyOnClass(HelloWorld, "randomNumber").andReturn(42);

    // jasmineReact wraps React.renderComponent, so you don't have to worry
    //  about the async nature of when the actual DOM get's rendered, or selecting
    //  where your component needs to get rendered (default is #jasmine_content)
    var myWorld = jasmineReact.renderComponent(<HelloWorld />);

    expect(myWorld.props.number).toBe(42);
  });

  it("can assert that a spy has been called", function(){
    jasmineReact.spyOnClass(HelloWorld, "randomNumber");

    jasmineReact.renderComponent(HelloWorld());

    // because we spy on the class and not the instance, we have to assert that the
    //   function on the class' prototype was called.
    expect(jasmineReact.classPrototype(HelloWorld).randomNumber).toHaveBeenCalled();
  });
});
```

### Replacing a component's subcomponent with a test double

This is very helpful for isolating your component tests to just that component, and avoiding
testing it's subcomponents.

```javascript
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
   var avatar = jasmineReact.renderComponent(<Avatar />);

   expect(avatar.refs.pic.props.username).toBe("Zuck")
  });

});
```

### Adding a method to a component class

This is needed to make a test double implement an interface which the component under test requires.

```javascript
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
      jasmineReact.createStubComponent(window, "Profile");
      jasmineReact.addMethodToClass(window.Profile, "rotate", function(){});
      jasmineReact.spyOnClass(window.Profile, "rotate");

      var avatar = jasmineReact.renderComponent(<Avatar />);

      expect(jasmineReact.classPrototype(fakeProfileKlass).rotate).not.toHaveBeenCalled();
      avatar.rotateProfile();
      expect(jasmineReact.classPrototype(fakeProfileKlass).rotate).toHaveBeenCalled();
    });
  });
});
```