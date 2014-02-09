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
    root.brief = factory(document, Element, Array);
  }
}(this, function(document, Element, Array) {
  'use strict';
  /*
   * Main function that we will use to create brief object
   */
  var create;
  /*
   * For delegated listeners, we will need to manage a list of callbacks
   */
  var managedListeners = [];
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
   * A couple of regexs that we will use
   */
  var idRegex = /^#[\w\d]*$/;
  var classRegex = /^\.[\w\d]*$/;
  var tagRegex = /^[\w\d]*$/;
  /*
   * This function will use whatever matchesSelector function
   * is available for that browser
   */
  var match = function(el, selector) {
    return matchFunction.call(el, selector);
  };
  var standardizeTypes = function(types) {
    var ret;
    if (typeof types == 'string') {
      ret = types.split(' ');
    }
    return ret || slice.call(types, 0);
  };
  var standardizeElements = function(elements) {
    var newBrief = brief();
    if (typeof elements == 'string') {
      elements = brief(elements);
    }
    if (!elements.isBrief && elements.length) {
      push.apply(newBrief, elements);
    } else {
      newBrief.push(elements);
    }
    return newBrief;
  };
  var on = function() {
    var newBrief = standardizeElements(arguments[0]);
    var args = slice.call(arguments, 1);
    brief.prototype.on.apply(newBrief, args);
  };
  var off = function() {
    var newBrief = standardizeElements(arguments[0]);
    var args = slice.call(arguments, 1);
    brief.prototype.off.apply(newBrief, args);
  };
  var once = function() {
    var newBrief = standardizeElements(arguments[0]);
    var args = slice.call(arguments, 1);
    brief.prototype.once.apply(newBrief, args);
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
      var args = slice.call(arguments, 0);
      var i = 0;
      var length = args.length;
      var arg;
      /*
       * Loop over all arguments and push
       * things into the brief object if
       * the current argument is a brief object,
       * an array of elements or an element
       */
      for (; i < length; i++) {
        arg = args[i];
        if (arg.isBrief) {
          push.apply(this, arg.toArray());
        } else if (arg.length) {
          push.apply(this, arg);
        } else {
          push.call(this, arg);
        }
      }
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
      var newBrief = filter.call(this, function(item) {
        return match(item, selector);
      });
      newBrief.selector = this.selector;
      return newBrief;
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
      var length = this.length;
      var i = 0;
      for (; i < length; i++) {
        push.apply(newBrief, slice.call(item.querySelectorAll(selector), 0));
      }
      newBrief.selector = this.selctor;
      return newBrief;
    },
    getChildren: function() {
      var newBrief = brief();
      for (var i = 0; i < this.length; i++) {
        push.apply(newBrief, this[i].children);
      }
      return newBrief;
    },
    forEach: function(callback) {
      var i = 0;
      var length = this.length;
      for (; i < length; i++) {
        callback(this[i], i, this);
      }
      return this;
    },
    on: function(types, callback, delegatee, autoRemove) {
      var newFunction = callback;
      var me = this;
      var i = 0;
      var element, type, j, listeners, typesLen, meLen;
      if (typeof delegatee == 'boolean') {
        autoRemove = delegatee;
        delegatee = undefined;
      }
      /*
       * Since we want to support multiple listeners types
       * at once, we need to split up the types if they
       * passed in a string
       */
      types = standardizeTypes(types);
      /*
       * If we are attempting to autoRemove this listener
       * we will have to override the callback so that it
       * automatically calls BriefObject.off and then
       * triggers the callback
       */
      if (!delegatee && autoRemove) {
        newFunction = function(event) {
          me.off(types, newFunction, false);
          callback.call(this, event);
        };
      }
      /*
       * If we are going to delegate this function, grab the 
       * existing one or make a new function
       */
      if (delegatee) {
        newFunction = managedListeners[callback.__briefId] || function(event) {
          if (match(event.srcElement, delegatee)) {
            if (autoRemove) {
              me.off(type, callback, delegatee);
            }
            callback.call(this, event);
          }
        };
      }
      /*
       * We need to loop through each type that was passed
       * in so that we apply all the listeners correctly
       */
      for (typesLen = types.length; i < typesLen; i++) {
        /*
         * We need to reset j and get the current type
         */
        j = 0;
        type = types[i];
        /*
         * For each listener type, we need to go through each element
         * in the brief object and apply the listeners to each one
         */
        for (meLen = me.length; j < meLen; j++) {
          /*
           * Set the current element
           */
          element = me[j];
          /*
           * If we aren't trying to delegate this listener than we
           * can just apply the listener to the element
           */
          if (!delegatee) {
            element.addEventListener(type, newFunction, false);
            continue;
          }
          /*
           * If we haven't assigned a briefId to the callback,
           * we need to do some extra stuff.
           */
          if (callback.__briefId === undefined) {
            /*
             * We need to assign a briefId as well as
             * add some properties to the newFunction that
             * we made to keep track of it.
             */
            callback.__briefId = managedListeners.length;
            newFunction._instances = [];
            newFunction._originalCallback = callback;
            managedListeners[callback.__briefId] = newFunction;
          }
          /*
           * Everytime we do this for this callback,
           * we need to push an instance to the 
           * array on the function
           */
          newFunction._instances.push({
            element: element,
            type: type,
            delegatedTo: delegatee
          });
          element.addEventListener(type, newFunction, true);
        }
      }
    },
    off: function(types, callback, delegatee) {
      var me = this;
      var i = 0;
      var type, element, j, len, listener, instances, typesLen, meLen;
      /*
       * Since we want to support multiple listeners types
       * at once, we need to split up the types if they
       * passed in a string
       */
      types = standardizeTypes(types);
      /*
       * For each listener type, we need to go through each element
       * in the brief object and apply the listeners to each one
       */
      for (typesLen = types.length ; i < typesLen; i++) {
        /*
         * We need to reset j and get the current type
         */
        j = 0;
        type = types[i];
        /*
         * For each listener type, we need to go through each element
         * in the brief object and apply the listeners to each one
         */
        for (meLen = me.length; j < meLen; j++) {
          /*
           * Set the current element
           */
          element = me[j];
          /*
           * If the listener wasn't delegated, we can
           * just remove the listener from the element
           */
          if (!delegatee) {
            element.removeEventListener(type, callback, false);
            continue;
          }
          /*
           * If we are dealing with a delegated listener,
           * we need to get the function that this callback
           * is linked to
           */
          listener = managedListeners[callback.__briefId];
          element.removeEventListener(type, listener, true);
          instances = listener._instances;
          len =  instances.length;
          while (len--) {
            if (instances[len].element == element &&
                instances[len].type == type &&
                instances[len].delegatedTo == delegatee) {
              listener._instances.splice(len, 1);
            }
          }
        }
      }
    },
    once: function() {
      var args = slice.call(arguments, 0);
      args.push(true);
      return brief.prototype.on.apply(this, args);
    }
  };
  create = brief.prototype.create = function(selector, context) {
    var r;
    /*
     * Sometimes it could be possible to want a blank brief object.
     * In those cases, we can skip all this
     */
    if (selector || context) {
      /*
       * If we are dealing with a context and or a selector that are strings
       */
      if (typeof context == 'string' || !context && selector) {
        this.selector = context || selector;
        if (idRegex.test(this.selector)) {
          r = [document.getElementById(this.selector.substring(1))];
        } else if (classRegex.test(this.selector)) {
          r = document.getElementsByClassName(this.selector.substring(1));
        } else if (tagRegex.test(this.selector)) {
          r = document.getElementsByTagName(this.selector);
        } else {
          r = document.querySelectorAll(this.selector);
        }
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
  brief.on = on;
  brief.off = off;
  brief.once = once;
  return brief;
}.bind(this, document, Element, Array)));