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
     * We need a document to use brief, so throw an error if we
     * are in environments likes node
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
  var forEach = arr.forEach;
  var map = arr.map;
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
  var body = d.body;
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
  var getVarType = function(v) {
    return Object.prototype.toString.call(v).replace(/^\[\w*\s|\]/g,'');
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
  /*
   * We will use this function in order to check parent
   * trees so we can mimic event propagation
   */
  var propagateEvent = function(event, element) {
    var target = event.target;
    var elements = managedElements[event.type];
    var listeners = managedListeners[event.type];
    var index, elementListeners, i, windowEventsNotCalled = true;
    // While we can find a parent node
    while (target !== undefined) {
      /* 
       * The get the index of the target inside of
       * our elements array, if it exists
       */
      index = elements.indexOf(target);
      /*
       * If the target isn't the same as the element passed in
       * OR the target is the window
       * AND the the element exists in the elements array
       */
      if ((element !== target || target === window) && index !== -1) {
        /*
         * If the target is the window,
         * make sure we know we don't need to 
         * call the windows listeners later
         */
        if (target === window) {
          windowEventsNotCalled = false;
        }
        elementListeners = listeners[index];
        /*
         * Call all of the parents listeners
         */
        for (i = 0; i < elementListeners.length; i++) {
          elementListeners[i].call(target, event);
        }
      }
      // Change the target to the parentNode of the target
      target = (target !== body ? target.parentNode : window);
    }
    /*
     * Return whether or not we ran any listeners
     * on the window element so that we know
     * whether or not to run the window listeners
     * sepereately
     */
    return windowEventsNotCalled;
  };
  var delegatedListener = function(event) {
    var target;
    var listeners = delegatedListeners[event.type];
    var ev = new brief.Event(event);
    var i;
    var listener;
    var element;
    var delegatedTo;
    if (target === document) {
      return;
    }
    for (i = 0; i < listeners.length; i++) {
      target = event.target;
      listener = listeners[i];
      element = listener.element;
      delegatedTo = listener.delegatedTo;
      while (target !== document) {
        if (match(target, delegatedTo)) {
          if (element === window || element.contains(target) && !ev.propagationStopped) {
            listener.callback.call(target, ev);
          }
        }
        target = target.parentNode;
      }
    }
  };
  var managedListener = function(event) {
    var elements = managedElements[event.type];
    var listeners = managedListeners[event.type];
    var ev = new brief.Event(event);
    var windowEventsNotCalled = true;
    var target = ev.target;
    var index = elements.indexOf(target);
    var i, elementListeners;

    /* If the event target doesn't have any
     * listeners attached, continually look 
     * at its parent to see if that has any
     */
    while (index === -1 && target !== body) {
      target = target.parentNode;
      index = elements.indexOf(target);
    }
    /*
     * If we found the target in the elements array,
     * call all of its listeners and then attempt to propagate the event
     */
    if (index !== -1) {
      for (i = 0; i < listeners[index].length; i++) {
        listeners[index][i].call(target, ev);
      }
      if (!ev.propagationStopped) {
        windowEventsNotCalled = propagateEvent(event, elements[index]);
      }
      return;
    }
    /*
     * If we haven't stopped propagation thus far,
     * we need to run the listeners on
     * the window element
     */
    if (!ev.propagationStopped && windowEventsNotCalled) {
      elementListeners = listeners[elements.indexOf(window)];
      if (elementListeners) {
        for (i = 0; i < elementListeners.length; i++) {
          elementListeners[i].call(window, ev);
        }
      }
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
  var onAll = function() {
    var newBrief = standardizeElements(arguments[0]);
    var args = slice.call(arguments, 1);
    brief.prototype.onAll.apply(newBrief, args);
  };
  var off = function() {
    var newBrief = standardizeElements(arguments[0]);
    var args = slice.call(arguments, 1);
    brief.prototype.off.apply(newBrief, args);
  };
  var offAll = function() {
    var newBrief = standardizeElements(arguments[0]);
    var args = slice.call(arguments, 1);
    brief.prototype.offAll.apply(newBrief, args);
  };
  var once = function() {
    var newBrief = standardizeElements(arguments[0]);
    var args = slice.call(arguments, 1);
    brief.prototype.once.apply(newBrief, args);
  };
  var onceAll = function() {
    var newBrief = standardizeElements(arguments[0]);
    var args = slice.call(arguments, 1);
    brief.prototype.onceAll.apply(newBrief, args);
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
      splice.apply(this, arguments);
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
      forEach.call(this, callback);
      return this;
    },
    map: function(callback) {
      return map.call(this, callback);
    },
    getOffsets: function() {
      if (!this.length || this[0] == null) {
        return null;
      }
      return this.map(function(item) {
        var offset = item.getBoundingClientRect();
        return {
          top: offset.top,
          left: offset.left
        };
      });
    },
    on: function(type, callback, delegatee, autoRemove) {
      var newFunction = callback;
      var me = this;
      var element, i;
      if (typeof delegatee == 'boolean') {
        autoRemove = delegatee;
        delegatee = undefined;
      }
      /*
       * If we are attempting to autoRemove this listener
       * we will have to override the callback so that it
       * automatically calls BriefObject.off and then
       * triggers the callback
       */
      if (!delegatee && autoRemove) {
        newFunction = function(event) {
          me.off(type, newFunction);
          callback.call(this, event);
        };
      }
      /*
       * For each listener type, we need to go through each element
       * in the brief object and apply the listeners to each one
       */
      for (i = 0; i < me.length; i++) {
        /*
         * Set the current element
         */
        element = me[i];
        /*
         * If we aren't trying to delegate this listener than we
         * can just apply the listener to the element
         */
        if (!delegatee) {
          if (!managedElements[type]) {
            
            managedElements[type] = [];
            managedListeners[type] = {};
            document.addEventListener(type, managedListener, true);
          }
          if (managedElements[type].indexOf(element) === -1) {
            managedElements[type].push(element);
            managedListeners[type][managedElements[type].length-1] = [];
          }
          managedListeners[type][managedElements[type].indexOf(element)].push(newFunction);
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
    },
    onAll: function(types, callback, delegatee, autoRemove) {
      var i;
      for (i = 0; i < types.length; i++) {
        this.on(types[i], callback, delegatee, autoRemove);
      }
    },
    off: function(type, callback, delegatee) {
      var me = this;
      var elements, element, len, listeners, elementListeners, listener, index, i, j;
      for (i = 0; i < me.length; i++) {
        /*
         * Set the current element
         */
        element = me[i];
        /*
         * If the listener wasn't delegated, we can
         * just remove the listener from the element
         */
        if (!delegatee) {
          listeners = managedListeners[type];
          elements = managedElements[type];
          index = elements.indexOf(element);
          elementListeners = listeners[index];
          for (j = 0; j < elementListeners.length; j++) {
            if (elementListeners[j] !== callback)  {
              continue;
            }
            elementListeners.splice(j, 1);
          }
          if (elementListeners.length === 0) {
            elements.splice(index, 1);
            listeners[index] = null;
          }
          if (elements.length === 0) {
            document.removeEventListener(type, managedListener, true);
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
    },
    offAll: function(types, callback, delegatee) {
      var i;
      for (i = 0; i < types.length; i++) {
        this.off(types[i], callback, delegatee);
      }
    },
    once: function() {
      var args = slice.call(arguments, 0);
      args.push(true);
      return brief.prototype.on.apply(this, args);
    },
    onceAll: function() {
      var args = slice.call(arguments, 0);
      args.push(true);
      return brief.prototype.onAll.apply(this, args);
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
  brief.Event = function(event) {
    this.originalEvent = event;
    this.type = event.type;
    this.defaultPrevented = event.defaultPrevented;
    this.propagationStopped = false;
    this.timeStamp = event.timeStamp;
    this.currentTarget = event.currentTarget;
    this.target = event.target;
    this.srcElement = event.srcElement;
  };
  brief.Event.prototype = {
    preventDefault: function() {
      this.defaultPrevented = true;
      this.originalEvent.preventDefault();
    },
    stopPropagation: function() {
      this.propagationStopped = true;
      this.originalEvent.stopPropagation();
    }
  };
  /*
   * Extend method which allows combining of objects.
   * Slightly modified from node-extend
   * https://github.com/dreamerslab/node.extend
   */
  brief.extend = function() {
    var target = arguments[0] || {};
    var i = 1;
    var length = arguments.length;
    var deep = false;
    var options, name, src, copy, copyIsArray, clone, targetType, srcType, copyType;

    // Handle a deep copy situation
    if (typeof target === 'boolean') {
      deep = target;
      target = arguments[1] || {};
      targetType = getVarType(target);
      // skip the boolean and the target
      i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== 'object' && targetType !== 'Function') {
      target = {};
    }

    for (; i < length; i++) {
      // Only deal with non-null/undefined values
      options = arguments[i];
      if (options != null) {
        if (typeof options === 'string') {
          options = options.split('');
        }
        // Extend the base object
        for (name in options) {
          src = target[name];
          srcType = getVarType(src);
          copy = options[name];
          copyType = getVarType(copy);

          // Prevent never-ending loop
          if (target === copy) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (copyType === 'Object' || (copyIsArray = copyType === 'Array'))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && srcType === 'Array' ? src : [];
            } else {
              clone = src && srcType === 'Object' ? src : {};
            }

            // Never move original objects, clone them
            target[name] = brief.extend(deep, clone, copy);

          // Don't bring in undefined values
          } else if (typeof copy !== 'undefined') {
            target[name] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  };
  brief.on = on;
  brief.onAll = onAll;
  brief.off = off;
  brief.offAll = offAll;
  brief.once = once;
  brief.onceAll = onceAll;
  return brief;
}.bind(this, document, Element, Array)));