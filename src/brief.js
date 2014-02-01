/*
 * brief.js
 *
 * Copyright 2014 Jeffrey E. Shaver II
 * Released under the MIT license

 * https://github.com/jeffshaver/brief.js/blob/master/LICENSE
 */

(function(document, Element, Array) {
  'use strict';
  var arr = [];
  // For delegated listeners, we will need to manage a list of callbacks
  var managedListeners = [];
  var i = 0;
  /*
   * We need to save references to some prototype methods that
   * we will need later
   */
  var slice = Array.prototype.slice;
  var splice = Array.prototype.splice;
  var forEach = Array.prototype.forEach;
  var push = Array.prototype.push;
  var pop = Array.prototype.pop;
  var matchFunction = (Element.prototype.matchesSelector || 
    Element.prototype.msMatchesSelector || 
    Element.prototype.mozMatchesSelector || 
    Element.prototype.webkitMatchesSelector || 
    Element.prototype.oMatchesSelector);
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
  var brief = function(selector) {
    return new brief.fn.create(selector);
  }
  brief.fn = brief.prototype = {
    length: 0,
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
      while(this.length > 0) {
        this.pop();
      }
      push.apply(this, arr);
      return this;
    },
    forEach: function() {
      forEach.apply(this, slice.call(arguments, 0));
    },
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
      if (type.constructor == String) {
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
        forEach.call(this, function(element) {
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
                if (autoRemove) me.off(type, callback, delegatee);
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
      if (type.constructor == String) {
        type = type.split(' ');
      }
      type.forEach(function(type) {
        forEach.call(this, function(element) {
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
      return brief.fn.on.apply(this, args);
    }
  };
  var create = brief.fn.create = function (selector) {
    var r = document.querySelectorAll(selector);
    push.apply(this, slice.call(r, 0));
    return this;
  }
  create.prototype = brief.fn;
  window.brief = brief.bind(document);
  if (!window.$) {
    window.$ = brief.bind(document);
  }
}(document, Element, Array));