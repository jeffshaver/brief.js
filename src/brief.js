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
  if (typeof define == 'function' && define.amd) {
    /*
     * AMD. Register as an anonymous module.
     */
    define([], factory);
  } else if (typeof exports == 'object') {
    /*
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like enviroments that support module.exports,
     * like Node.
     */
    module.exports = global.document ? factory() : function() {
      throw new Error('brief requires a document to run');
    };
  } else {
    /*
     * Browser globals (root is window)
     */
    root.brief = factory();
  }
}(this, function(d, e, a) {
  'use strict';
  /*
   * Main function that we will use to create brief object
   */
  var create;
  /*
   * For delegated listeners, we will need to manage a list of callbacks
   */
  var delegatedListeners = {};
  var managedListeners = {};
  var managedElements = {};
  /*
   * We need to save references to some prototype methods that
   * we will need later
   */
  var arr = a.prototype;
  var el = e.prototype;
  var slice = arr.slice;
  var splice = arr.splice;
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
  var idRegex = /^#[\w\d]+$/;
  var classRegex = /^\.[\w\d]+$/;
  var tagRegex = /^[\w\d]+$/;
  /*
   * This function will use whatever matchesSelector function
   * is available for that browser
   */
  var match = function(el, selector) {
    return matchFunction.call(el, selector);
  };
  /*
   * In order to allow devs to pass in different
   * ways to indicate types (strings/arrays), we
   * need to standardize the input
   */
  var standardizeTypes = function(types) {
    return typeof types == 'string' ? types.split(' ') : slice.call(types, 0);
  };
  /*
   * For the on/off/once methods that are attached
   * to the brief function, we need to be able
   * to standardize the input of the elements
   * so that they always end up as brief objects
   */
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
  var delegatedListener = function(event) {
    var target = event.target;
    var listeners = delegatedListeners[event.type];
    var i;
    var listener;
    var element;
    var delegatedTo;
    if (target === document) {
      return;
    }
    for (i = 0; i < listeners.length; i++) {
      listener = listeners[i];
      element = listener.element;
      delegatedTo = listener.delegatedTo;
      if (match(target, delegatedTo)) {
        if (element.contains(target)) {
          listener.callback.call(this, event);
        }
      }
    }
  };
  var managedListener = function(event) {
    var elements = managedElements[event.type];
    var listeners = managedListeners[event.type];
    var index = elements.indexOf(event.target);
    while (index !== -1) {
      listeners[index].call(this, event);
      index = elements.indexOf(event.target, index+1);
    }
  };
  /*
   * We don't want to force people to use the DOM Selection
   * API, so we are going to use these methods to allow them
   * to pass selectors/elements/nodelists/etc... into methods
   * attached to the brief funciton that will let them use
   * the eventing API without the selection API
   */
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

  /*
   * For some of these methods, we implement
   * the call the Arrays version of the method.
   * However, we wrap it in another function so
   * that we can return the object afterward
   * to enable method chaining.
   */
  brief.prototype = {
    length: 0,
    isBrief: true,
    splice: function() {
      splice.apply(this, slice.call(arguments, 0));
      return this;
    },
    push: function() {
      var args = slice.call(arguments, 0);
      var arg, i;
      /*
       * Loop over all arguments and push
       * things into the brief object if
       * the current argument is a brief object,
       * an array of elements or an element
       */
      for (i = 0; i < args.length; i++) {
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
    filter: function(filterFn) {
      var newBrief, selector;
      if (typeof filterFn == 'string') {
        selector = filterFn;
        filterFn = function(item) {
          return match(item, selector);
        };
      }
      newBrief = filter.call(this, filterFn);
      newBrief.selector = (selector ? selector : this.selector);
      return newBrief;
    },
    indexOf: function(selector) {
      var i;
      for (i = 0; i < this.length; i++) {
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
      var i;
      for (i = 0; i < this.length; i++) {
        push.apply(newBrief, slice.call(this.get(i).querySelectorAll(selector), 0));
      }
      newBrief.selector = this.selctor;
      return newBrief;
    },
    getChildren: function() {
      var newBrief = brief();
      var i;
      for (i = 0; i < this.length; i++) {
        push.apply(newBrief, this[i].children);
      }
      return newBrief;
    },
    forEach: function(callback) {
      var i;
      for (i = 0; i < this.length; i++) {
        callback(this[i], i, this);
      }
      return this;
    },
    getOffsets: function() {
      var offsets = [];
      if (!this.length || this[0] == null) {
        return null;
      }
      this.forEach(function(item) {
        var offset = item.getBoundingClientRect();
        offsets.push({
          top: offset.top,
          left: offset.left
        });
      });
      return offsets.length == 1 ? offsets[0] : offsets;
    },
    on: function(types, callback, delegatee, autoRemove) {
      var newFunction = callback;
      var me = this;
      var element, type, i, j;
      if (typeof delegatee == 'boolean') {
        autoRemove = delegatee;
        delegatee = undefined;
      }
      /*
       * Standardize types input
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
       * We need to loop through each type that was passed
       * in so that we apply all the listeners correctly
       */
      for (i = 0; i < types.length; i++) {
        /*
         * We need to reset j and get the current type
         */
        type = types[i];
        /*
         * For each listener type, we need to go through each element
         * in the brief object and apply the listeners to each one
         */
        for (j = 0; j < me.length; j++) {
          /*
           * Set the current element
           */
          element = me[j];
          /*
           * If we aren't trying to delegate this listener than we
           * can just apply the listener to the element
           */
          if (!delegatee) {
            if (!managedElements[type]) {
              managedElements[type] = [];
              managedListeners[type] = [];
              document.addEventListener(type, managedListener, true);
            }
            managedElements[type].push(element);
            managedListeners[type].push(newFunction);
            continue;
          }

          /*
           * If we haven't gotten a listener for this type
           * yet, lets create an array to hold listeners
           * for this type and create a listener on the document
           * to handle all the events
           */

          if (!delegatedListeners[type]) {
            delegatedListeners[type] = [];
            document.addEventListener(type, delegatedListener, true);
          }
          /*
           * We need to push an instance of this type into
           * the array so we can invoke/remove it later
           */
          delegatedListeners[type].push({
            element: element,
            delegatedTo: delegatee,
            callback: callback
          });
        }
      }
    },
    off: function(types, callback, delegatee) {
      var me = this;
      var type, elements, element, len, listeners, listener, index, i, j;
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
      for (i = 0; i < types.length; i++) {
        /*
         * We need to reset j and get the current type
         */
        j = 0;
        type = types[i];
        /*
         * For each listener type, we need to go through each element
         * in the brief object and apply the listeners to each one
         */
        for (j = 0; j < me.length; j++) {
          /*
           * Set the current element
           */
          element = me[j];
          /*
           * If the listener wasn't delegated, we can
           * just remove the listener from the element
           */
          if (!delegatee) {
            listeners = managedListeners[type];
            elements = managedElements[type];
            index = listeners.indexOf(callback);
            /*
             * While we can still find a match 
             * in the listeners array, keep splicing
             */
            while(index !== -1) {
              if (element === elements[index]) {
                elements.splice(index, 1);
                listeners.splice(index, 1);
                /*
                 * Since we spliced out an item, we need to
                 * decrease our current position so we can
                 * correctly calculate the next index
                 */
                index--;
              }
              /*
               * We can now look for the next index (if any)
               */
              index = listeners.indexOf(callback, index+1);
            }
            continue;
          }
          /*
           * If we are dealing with a delegated listener,
           * we need to get the listeners for this type
           */
          listeners = delegatedListeners[type];
          len = listeners.length;
          /*
           * Loop through the listeners for this type
           * and remove them if the element, delegatedSelector
           * and callback match what we have stored
           */
          while (len--) {
            listener = listeners[len];
            if (listener.element === element &&
                listener.delegatedTo === delegatee &&
                listener.callback === callback) {
              listeners.splice(len, 1);
            }
          }
          if (!listeners.length) {
            document.removeEventListener(type, delegatedListener, true);
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
          r = [d.getElementById(this.selector.substring(1))];
        } else if (classRegex.test(this.selector)) {
          r = d.getElementsByClassName(this.selector.substring(1));
        } else if (tagRegex.test(this.selector)) {
          r = d.getElementsByTagName(this.selector);
        } else {
          r = d.querySelectorAll(this.selector);
        }
        /*
         * If the query didn't return null
         */
        if (r.length && r[0] != null) {
          push.apply(this, slice.call(r, 0));
        }
      }
      /*
       * If we just grabbed the elements related to the context
       */
      if (this.selector === context) {
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