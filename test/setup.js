
// Polyfill Function.prototype.bind for PhantomJS
// see https://github.com/facebook/react/pull/347
// source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind

if(!Function.prototype.bind) {

    console.warn('Polyfill Function.prototype.bind');
    console.warn('Should appear in PhantomJS only');

    Function.prototype.bind = function(oThis) {
        if(typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal 
            // IsCallable function
            throw new Error("Function.prototype.bind - "
                            + "what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            Ap = Array.prototype,
            fToBind = this, 
            fNOP = function() {},
            fBound = function() {
                return fToBind.apply(this instanceof fNOP && oThis ? 
                                     this:oThis,
                                     aArgs.concat(Ap.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
};


var content = document.createElement('div');
content.id = 'jasmine_content';
document.body.appendChild(content);

// Make sure react is here 
window.React = require('react/addons');
