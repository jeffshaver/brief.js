/*
 * brief.js
 *
 * Copyright 2014 Jeffrey E. Shaver II
 * Released under the MIT license

 * https://github.com/jeffshaver/brief.js/blob/master/LICENSE
 */

/*
 * UMD (Universal Module Definition)
 * see https://github.com/umdjs/umd/blob/master/returnExports.js
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    /*
     * AMD. Register as an anonymous module.
     */
    define([], factory);
  } else if (typeof exports === 'object') {
    /*
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like enviroments that support module.exports,
     * like Node.
     */
    module.exports = factory();
  } else {
    /*
     * Browser globals (root is window)
     */
    root.brief = factory();
  }
}(this, function(document, Element, Array) {
  'use strict';
  return function() {
    /*
     * Main function that we will use to create brief object
     */
    var create;
    /*
     * For delegated listeners, we will need to manage a list of callbacks
     */
    var managedListeners = {};
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
    };
    /*
     * The brief function will create and return a new brief object (array-like)
     */
    var brief = function(selector, context) {
      return new brief.prototype.create(selector, context);
    };
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
        var newBrief = brief();
        this.forEach(function(item) {
          push.apply(newBrief, slice.call(item.querySelectorAll(selector), 0));
        });
        return newBrief;
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
          };
        }
        type.forEach(function(type) {
          if (!managedListeners[type]) {
            managedListeners[type] = [];
          }
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
              };
              newFunction._element = element;
              newFunction._delegatedTo = delegatee;
              newFunction._originalCallback = callback;
              managedListeners[type][managedListeners[type].length || 0] = newFunction;
              element.addEventListener(type, newFunction, true);
            }
          });
        }, this);
      },
      off: function(type, callback, delegatee) {
        var me = this;
        var i = 0;
        var j;
        var functions;
        var len;
        var func;
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
              /*
               * We might as well keep a reference to the listeners array
               * that we are going to look at
               */
              functions = managedListeners[type];
              len = functions.length;
              for (; i < len; i++) {
                func = functions[i];
                j = 0;
                /*
                 * If the element for this listener isn't the one we
                 * are looking for... skip that shit.
                 */
                if (func._element == element && (func._delegatedTo == delegatee || func._delegatedTo == '*')) {
                  element.removeEventListener(type, func, true);
                  /*
                   * Remove the function from the array
                   * and decrement i at the same time
                   */
                  functions.splice(i--, 1);
                  len = functions.length;
                }
              }
            }
          });
        }, this);
      },
      once: function() {
        var args = slice.call(arguments, 0);
        args.push(true);
        return brief.prototype.on.apply(this, args);
      }
    };
    create = brief.prototype.create = function(selector, context) {
      /*
       * Sometimes it could be possible to want a blank brief object.
       * In those cases, we can skip all this
       */
      if (selector || context) {
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
      }
      return this;
    };
    create.prototype = brief.prototype;
    return brief.bind(document);
  };
}(document, Element, Array)));