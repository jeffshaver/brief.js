/*
 * brief.js
 *
 * Copyright 2014 Jeffrey E. Shaver II
 * Released under the MIT license

 * https://github.com/jeffshaver/brief.js/blob/master/LICENSE
 */

(function (document, Element, NodeList) {
  'use strict';
  /*
   * We will have to manage a list of listeners that have
   * been passed in as event delegations so that we can
   * remove them later if need be
   */
  var managedListeners = [];
  /*
   * Save references for some of the prototype methods
   * we will need
   */
  var slice = Array.prototype.slice;
  var forEach = Array.prototype.forEach;
  var matchFunction = (Element.prototype.matchesSelector || 
    Element.prototype.msMatchesSelector || 
    Element.prototype.mozMatchesSelector || 
    Element.prototype.webkitMatchesSelector || 
    Element.prototype.oMatchesSelector);
  /*
   * We also need a simple var that can give us a unique
   * id for object properties
   */
  var i = 0;
  var match = function(el, selector) {
    return matchFunction.call(el, selector);
  }
  /*
   * This is the main function. It will grab elements using
   * querySelectorAll
   */
  var brief = function (query) {
    var r = this.querySelectorAll(query);
    /*
     * If we only have one element, return the element
     * instead of a NodeList
     */
    return r.length === 1 ? r[0] : r;
  };
  Element.prototype.brief = brief;
  Element.prototype.on = function (type, callback, delegatee, autoRemove) {
    if (typeof delegatee == 'boolean') {
      autoRemove = delegatee;
      delegatee = undefined;
    }
    /*
     * Since we want to support multiple listeners types 
     * at once, we need to split up the types and run this
     * code for each type
     */
    type = type.split(' ');
    type.forEach(function(type) {
      var newFunction = callback;
      if (autoRemove) newFunction = function(event) {
        var me = newFunction;
        this.off(type, newFunction, delegatee);
        callback(event);
      }
      /*
       * If we aren't trying to delegate this listener
       * we can just add the listener to the element
       */
      if (!delegatee) {
        this.addEventListener(type, newFunction, false);
      /*
       * If we are delegating the event we will have 
       * to do some extra stuff
       */
      } else {
        newFunction = function(event) {
          if (match(event.srcElement, delegatee)) {
            if (autoRemove) this.off(type, callback, delegatee);
            callback(event);
          }
        }
        // Apply the function we created to the listener
        this.addEventListener(type, newFunction, true);
        /*
         * We need to store both the original function and new
         * function we made in order to remove it later
         */ 
        managedListeners[i++] = {
          originalCallback: callback,
          createdCallback: newFunction
        };
      }
    }, this);
    return this;
  };
  
  Element.prototype.one = function() {
    var args = slice.call(arguments,0);
    args.push(true);
    return Element.prototype.on.apply(this, args);
  };

  NodeList.prototype.on = function (type, callback, delegatee) {
    forEach.call(this, function (element) {
      element.on(type, callback, delegatee);
    });
    return this;
  };
  NodeList.prototype.one = function() {
    var args = slice.call(arguments,0);
    forEach.call(this, function (element) {
      element.one.apply(element, args);
    });
  };
  Element.prototype.off = function(type, callback, delegatee) {
    type = type.split(' ');
    type.forEach(function(type) {
      if (!delegatee) {
        this.removeEventListener(type, callback, false);
      } else {
        for (var i = 0, len = managedListeners.length; i < len; i++) {
          var obj = managedListeners[i];
          if (obj.originalCallback == callback) {
            this.removeEventListener(type, obj.createdCallback, true);
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
    }, this);
    return this;
  };
  NodeList.prototype.off = function (type, callback, delegatee) {
    forEach.call(this, function (element) {
      element.off(type, callback, delegatee);
    });
    return this;
  };
  // Assign brief to the window object
  window.brief = brief.bind(document);
  // If the $ isn't taken, we can use that too just to be short
  if (!window.$) {
    window.$ = brief.bind(document);
  }
}(document, Element, NodeList));