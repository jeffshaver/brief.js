/*
 * brief.js
 *
 * Copyright 2014 Jeffrey E. Shaver II
 * Released under the MIT license

 * https://github.com/jeffshaver/brief.js/blob/master/LICENSE
 */

// UMD (Universal Module Definition)
// see https://github.com/umdjs/umd/blob/master/returnExports.js
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.brief = factory();
  }
}(this, function(document, Element, Array) {
  'use strict';
  return function() {
    // For delegated listeners, we will need to manage a list of callbacks
    var managedListeners = [];
    var i = 0;
    /*
     * We need to save references to some prototype methods that
     * we will need later
     */
    var arr = Array.prototype;
    var el = Element.prototype;
    var slice = arr.slice;
    var splice = arr.splice;
    var forEach = arr.forEach;
    var push = arr.push;
    var pop = arr.pop;
    var filter = arr.filter;
    var matchFunction = (
      el.matchesSelector ||
      el.msMatchesSelector ||
      el.mozMatchesSelector ||
      el.webkitMatchesSelector ||
      el.oMatchesSelector
    );
    /*
     * This function will use whatever matchesSelector function
     * is available for that browser
     */
    var match = function(el, selector) {
      return matchFunction.call(el, selector);
    }
    /*
     * The brief function will create and return a new brief object (array-like)
     */
    var brief = function(selector, context) {
      return new brief.prototype.create(selector, context);
    }
    brief.prototype = {
      length: 0,
      isBrief: true,
      splice: function() {
        splice.apply(this, slice.call(arguments, 0));
        return this;
      },
      push: function() {
        push.apply(this, slice.call(arguments, 0));
        return this;
      },
      pop: function() {
        pop.apply(this);
        return this;
      },
      toArray: function() {
        return slice.call(this, 0);
      },
      empty: function() {
        while(this.length > 0) {
          this.pop();
        }
        return this;
      },
      filter: function(selector) {
        var arr = filter.call(this, function(item) {
          return match(item, selector);
        });
        this.empty();
        push.apply(this, arr);
        return this;
      },
      indexOf: function(selector) {
        var i = 0;
        for ( ; i < this.length; i++) {
          if (match(this[i], selector)) {
            return i;
          }
        }
        return -1;
      },
      get: function(index) {
        return this[index];
      },
      find: function(selector) {
        var arr = [];
        this.forEach(function(item) {
          push.apply(arr, slice.call(item.querySelectorAll(selector), 0));
        });
        this.empty();
        push.apply(this, arr);
        return this;
      },
      forEach: forEach,
      on: function(type, callback, delegatee, autoRemove) {
        var newFunction = callback;
        var me = this;
        if (typeof delegatee == 'boolean') {
          autoRemove = delegatee;
          delegatee = undefined;
        }
        /*
         * Since we want to support multiple listeners types
         * at once, we need to split up the types if they
         * passed in a string
         */
        if (typeof type == 'string') {
          type = type.split(' ');
        }
        /*
         * If we are attempting to autoRemove this listener
         * we will have to override the callback so that it
         * automatically calls BriefObject.off and then
         * triggers the callback
         */
        if (autoRemove) {
          newFunction = function(event) {
            me.off(type, newFunction, false);
            callback.call(this, event);
          }
        }
        type.forEach(function(type) {
          this.forEach(function(element) {
            /*
             * If we aren't attempting to delegate the event,
             * we can just apply the listener to the element
             */
            if (!delegatee) {
              element.addEventListener(type, newFunction, false);
            /*
             * If we are attempting to delegate the event,
             * we are going to have to override the callback
             * and then we will have to log this listener inside
             * of managedListeners
             */
            } else {
              newFunction = function(event) {
                if (match(event.srcElement, delegatee)) {
                  if (autoRemove) {
                    me.off(type, callback, delegatee);
                  }
                  callback.call(this, event);
                }
              }
              managedListeners[i++] = {
                originalCallback: callback,
                createdCallback: newFunction
              }
              element.addEventListener(type, newFunction, true);
            }
          });
        }, this);
      },
      off: function(type, callback, delegatee) {
        if (typeof type == 'string') {
          type = type.split(' ');
        }
        type.forEach(function(type) {
          this.forEach(function(element) {
            /*
             * If the listener wasn't delegated, we can just remove it!
             */
            if (!delegatee) {
              element.removeEventListener(type, callback, false);
            /*
             * But if it was we have some work to do
             */
            } else {
              var i = 0;
              var len = managedListeners.length;
              for (; i < len; i++) {
                var obj = managedListeners[i];
                if (obj.originalCallback == callback) {
                  element.removeEventListener(type, obj.createdCallback, true);
                  /*
                   * When we remove a delegated event listener
                   * we need to remove it from our list of
                   * managed delegated listeners
                   */
                  managedListeners.splice(i, 1);
                  /* We don't need to continue once we have
                   * found a match
                   */
                  break;
                }
              }
            }
          });
        }, this);
      },
      once: function(type, callback, delegatee) {
        var args = slice.call(arguments, 0);
        args.push(true);
        return brief.prototype.on.apply(this, args);
      }
    };
    var create = brief.prototype.create = function(selector, context) {
      /*
       * If we are dealing with a context and or a selector that are strings
       */
      if (typeof context == 'string' || !context && selector) {
        var r = document.querySelectorAll(this.selector = context || selector);
        push.apply(this, slice.call(r, 0));
      }
      /*
       * If we just grabbed the elements related to the context
       */
      if (this.selector == context) {
        this.find(selector);
      /*
       * If we are dealing with a context which is a brief object
       */
      } else if (context && context.isBrief) {
        push.apply(this, context.find(selector));
      /*
       * If we are dealing with an array like object or an HTML element
       */
      } else if (typeof context == 'object') {
        push.apply(this, context.length ? context : [context]);
        this.find(selector);
      }
      return this;
    }
    create.prototype = brief.prototype;
    return brief.bind(document);
  };
}(document, Element, Array)));