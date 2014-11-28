*jasmine-react* is a small suite of helper functions to make unit testing React.js components painless.

# Why do I need jasmine-react.js?

React.js' architecture is based on the idea that mutation is hard, so your React.js components should represent a state machine which can represent your UI under any state.  This is an extremely powerful idea and means that you will often compose components inside of other components.  While this is great for code reuse, it makes isolating one component for a unit test slightly more difficult.  React.js will also provide some very helpful features (like auto binding), which make it more difficult to get under the covers and stub things out.  jasmine-react aims to solve these testing issues.

# Synopsis

Here's an overview of how jasmineReact can be used:

### Spying on a method in a React Class

```javascript
/** @jsx React.DOM */
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

    jasmineReact.render(<HelloWorld />;

    // because we spy on the class and not the instance, we have to assert that the
    //   function on the class' prototype was called.
    expect(jasmineReact.classPrototype(HelloWorld).randomNumber).toHaveBeenCalled();
  });
});
```

### Replacing a component's subcomponent with a test double

This is very helpful for isolating your component tests to just that component, and avoiding
testing its subcomponents.

```javascript
/** @jsx React.DOM */
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

   expect(avatar.refs.pic.props.username).toBe("Zuck")
  });

});
```

### Adding a method to a component class

This is needed to make a test double implement an interface which the component under test requires.

```javascript
/** @jsx React.DOM */
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
```

# API

## jasmineReact.render

`jasmineReact.render(component, [container], [callback]);`

When rendering a React component, this is a convenience function for `React.render`.

It has a few helpful features:

* the component is actually rendered to an attached DOM node (unlike `React.addons.TestUtils.renderIntoDocument which
  renders into a detached DOM node).
* the component will be automatically unmounted after the test is complete.
  NOTE: If you call React.render in a jasmine test and the component is not unmounted, that component
  will pollute any subsequent tests which try to render into that container.
* the container argument is optional.  By default it will be: `document.getElementById("jasmine_content").  If you
  want to override this behavior, look at the documentation for `jasmineReact.getDefaultContainer`
* `React.render` will return before the rendering has occurred.  `jasmineReact.render` will wait
  until the async render has been performed.

Just like `React.render`, this method will return the component instance.


## jasmineReact.spyOnClass

`jasmineReact.spyOnClass(componentClass, functionName);`

When you want to render a component and stub on a function for that component, you need to spyOn the function
before the instance has been created because important functions (default props/state, render) happen during initialization.
This means you need to spyOn the component class, not the component instance.

This function performs the following:

* uses the vanilla `jasmine.spyOn` to spy on the component class prototype
* React does some performance tricks for [autobinding functions](http://facebook.github.io/react/blog/2013/07/02/react-v0-4-autobind-by-default.html),
  so this function will abstract those away from you
* returns a regular jasmine spy object, so you can chain additional spy functions onto it.
  For example: `jasmineReact.spyOnClass(Avatar, "getWidth").andCallFake(function(){ return 120; });`

## jasmineReact.classPrototype

`jasmineReact.classPrototype(componentClass)`

After you've spied on a component class using `jasmineReact.spyOnClass`, you will need to assert things
on that component class.  This function returns you the object you want to make your assertions against.

```js
jasmineReact.spyOnClass(Avatar, "getWidth");

var myAvatar = jasmineReact.render(<Avatar />);
myAvatar.getWidth();

expect(jasmineReact.classPrototype(Avatar).getWidth).toHaveBeenCalled();

// NOTE: your jasmine-fu will want todo this, but you can't:
// expect(myAvatar.getWidth).toHaveBeenCalled(); <-- DON'T DO THIS
```

## jasmineReact.createStubComponent

`jasmineReact.createStubComponent(namespace, className)`

React components are intended to be composable (using one component inside a render function of another component). While this is great for code reuse, it makes isolating one component for a unit test slightly more difficult.

  *Aside: Why do I want to isolate the component I'm testing from its subcomponents? In a unit test, when you test one component you do want to have to test the behavior of a subcomponent, because that would turn into an integration test.*

What you want todo is replace any subcomponent's real definition with a "test double". By default this stub component has only the miniumum behavior to be a valid React component: a render function which returns a dom node.

If you want to add behavior to this stubComponent, so it confirms to the interface of the real component class, use the `jasmineReact.addMethodToClass` function.

Let's say you have an avatar class named `ProfilePic` which is defined on the global namespace, `window`.
To replace window.ProfilePic with a stub component (for the life of the jasmine test), you would do:

```js
jasmineReact.createStubComponent(window, "ProfilePic");
```

## jasmineReact.unmountComponent

`jasmineReact.unmountComponent(component);`

This function makes it easy to unmount a component, given just the component instance.
Unmounting a component is needed to test `componentWillUnmount` behavior.

```js
var myAvatar = jasmineReact.render(<Avatar />);
jasmineReact.unmountComponent(myAvatar);
```

## jasmineReact.getDefaultContainer

The default container for jasmineReact is `document.getElementById("jasmine_content")`.

If your jasmine test page uses `#spec-dom` as its default dom node, then you'd want to define the following:

```js
jasmineReact.getDefaultContainer = function(){
  return document.getElementById("spec-dom");
};
```

# Installation

```
npm install jasmine-react-helpers --save-dev
```

Bower: TODO

Script Tag: TODO


# Testing

Install node, npm, and grunt.

To run all of the tests (Chrome, Firefox, PhantomJS) with autoWatch:

```bash
grunt karma
```

To run the tests once with PhantomJS:

```bash
grunt karma:unit
```

# TODO

* Add the following grunt tasks: minification, linting
* Make the project node compatible (https://blog.codecentric.de/en/2014/02/cross-platform-javascript/)
* Create a module on npm and bower
* Add the test suite to Travis CI
