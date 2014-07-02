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
    module.exports = factory();
  } else {
    /*
     * Browser globals (root is window)
     */
    root.brief = factory();
  }
}(this, function() {
  'use strict';
  var d = document;
  var e = Element;
  var a = Array;
  /*
   * Main function that we will use to create brief object
   */
  var create;
  /*
   * For delegated listeners, we will need to manage a list of callbacks
   *
   * Structure:
   *   {
   *     click: [
   *       {
   *         element: element,
   *         delegatedTo: delegatedTo,
   *         callback: callback
   *       }
   *     ]
   *   }
   */
  var delegatedListeners = {};
  /*
   * Structure:
   *   {
   *     click: [
   *       [callback, callback], [callback, callback]
   *     ]
   *   }
   */
  var managedListeners = {};
  /*
   * Structure:
   *   {
   *     click: [
   *       element, element, element
   *     ]
   *   }
   */
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
    if (getVarType(elements) == 'String') {
      elements = brief(elements);
    }
    console.log(elements);
    if (!elements.isBrief && elements.length) {
      newBrief.add(elements);
    } else {
      newBrief.add(elements);
    }
    return newBrief;
  };
  /*
   * We will use this function in order to check parent
   * trees so we can mimic event propagation
   */
  var propagateEvent = function(event, element) {
    var target = element.parentNode || window;
    var elements = managedElements[event.type];
    var listeners = managedListeners[event.type];
    var index, elementListeners, i;
    /*
     * If the element that was passed is the window,
     * we don't need to continue running because
     * window as far as we can go
     */
    if (element === window) {
      return;
    }
    // While we can find a parent node
    while (target !== undefined) {
      if (event.propagationStopped) {
        break;
      }
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
      if (element !== target && index !== -1) {
        /*
         * If the target is the window,
         * make sure we know we don't need to 
         * call the windows listeners later
         */
        elementListeners = listeners[index];
        /*
         * Call all of the parents listeners
         */
        for (i = 0; i < elementListeners.length; i++) {
          elementListeners[i].call(target, event);
        }
      }
      // Change the target to the parentNode of the target
      target = (target.parentNode !== null ? target.parentNode : window);
    }
  };
  var pushToStack = function(briefObj, addStack) {
    if (addStack !== false) {
      briefObj.stack.push(briefObj.toArray());
    }
  };
  var delegatedListener = function(event, target) {
    
    var ev = new brief.Event(event);
    var listeners = delegatedListeners[ev.type];
    var i;
    var listener;
    var element;
    var delegatedTo;
    if (target === d) {
      return;
    }
    for (i = 0; i < listeners.length; i++) {
      target = ev.target;
      listener = listeners[i];
      element = listener.element;
      delegatedTo = listener.delegatedTo;
      while (target !== d) {
        if (match(target, delegatedTo)) {
          if (element === window || element.contains(target) && !ev.propagationStopped) {
            listener.callback.call(target, ev);
          }
        }
        target = target.parentNode;
      }
    }
  };
  var managedListener = function(event, target) {
    var ev = new brief.Event(event, target);
    var elements = managedElements[ev.type];
    var listeners = managedListeners[ev.type];
    var index = elements.indexOf(ev.target);
    var i, elementListeners;
    target = ev.target;
    /* 
     * If the event target doesn't have any
     * listeners attached, continually look 
     * at its parent to see if that has any
     */
    while (index === -1 && !ev.isArtificial) {
      target = (target.parentNode ? target.parentNode : window);
      index = elements.indexOf(target);
      /*
       * If we are at the window and we still don't have 
       * a match, we need to break out of the while loop
       */
      if (target === window && index === -1) {
        break;
      }
    }
    /*
     * If we found the target in the elements array,
     * call all of its listeners and then attempt to propagate the event
     */
    if (index !== -1) {
      elementListeners = listeners[index];
      for (i = 0; i < elementListeners.length; i++) {
        elementListeners[i].call(target, ev);
      }
      if (!ev.propagationStopped) {
        propagateEvent(ev, target);
      }
      return;
    }
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
    stack: [],
    add: function(addStack) {
      var args = slice.call(arguments, addStack !== false ? 0 : 1);
      var arg, i;
      pushToStack(this, addStack);
      /*
       * Loop over all arguments and add
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
    remove: function(addStack) {
      var args = slice.call(arguments, addStack !== false ? 0 : 1);
      pushToStack(this, addStack);
      if (args[0] == undefined) {
        args[0] = this.length - 1;
      }
      if (args[1] == undefined) {
        args[1] = 1;
      }
      this.splice(args[0], args[1]);
      return this;
    },
    revert: function() {
      if (this.stack.length === 0) {
        return this;
      }
      return this.empty(false).add(false, this.stack.pop());
    },
    toArray: function() {
      return slice.call(this, 0);
    },
    empty: function(addStack) {
      while(this.length > 0) {
        this.remove(addStack);
      }
      return this;
    },
    filter: function(filterFn, addStack) {
      var elements, selector;
      pushToStack(this, addStack);
      if (getVarType(filterFn) == 'String') {
        selector = filterFn;
        filterFn = function(item) {
          return match(item, selector);
        };
      }
      elements = filter.call(this.toArray(), filterFn);
      this.empty(false).add(false, elements);
      this.selector = selector || this.selector;
      return this;
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
      if (getVarType(index) != 'Number') {
        throw new TypeError('`index` must be a number');
      }
      return this[index];
    },
    find: function(selector, addStack) {
      var newElements = [];
      var i;
      if (getVarType(selector) != 'String') {
        throw new TypeError('selector must be a string');
      }
      pushToStack(this, addStack);
      console.log('this', this);
      for (i = 0; i < this.length; i++) {
        push.apply(newElements, slice.call(this.get(i).querySelectorAll(selector), 0));
      }
      console.log('elements', newElements);
      this.empty(false).add(false, newElements);
      this.selector = selector;
      return this;
    },
    getChildren: function(addStack) {
      var newElements = [];
      var i;
      pushToStack(this, addStack);
      for (i = 0; i < this.length; i++) {
        push.apply(newElements, this[i].children);
      }
      this.empty(false).add(false, newElements);
      return this;
    },
    forEach: function(callback) {
      if (getVarType(callback) != 'Function') {
        throw new TypeError('callback must be a function');
      }
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
    getAttr: function(attr) {
      return this.map(function(element) {
        return element.getAttribute(attr);
      });
    },
    setAttr: function(attr, value) {
      return this.forEach(function(element) {
        if (value === false) {
          element.removeAttribute(attr);
        } else {
          element.setAttribute(attr, value);
        }
      });
    },
    on: function(type, callback, delegatee, autoRemove) {
      var newFunction = callback;
      var me = this;
      var element, i;
      if (getVarType(type) != 'String') {
        throw new TypeError('type must be a string');
      }
      if (getVarType(callback) != 'Function') {
        throw new TypeError('callback must be a function');
      }
      if (getVarType(delegatee) == 'Boolaen') {
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
            managedListeners[type] = [];
            d.addEventListener(type, managedListener, true);
          }
          if (managedElements[type].indexOf(element) === -1) {
            managedElements[type].push(element);
            managedListeners[type].push([]);
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
          d.addEventListener(type, delegatedListener, true);
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
            listeners.splice(index, 1);
          }
          if (elements.length === 0) {
            d.removeEventListener(type, managedListener, true);
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
          d.removeEventListener(type, delegatedListener, true);
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
    },
    trigger: function(eventType) {
      this.forEach(function(e) {
        if (managedListeners[eventType] && managedListeners[eventType].length > 0) {
          managedListener(eventType, e);
        }
      });
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
      if (getVarType(context) == 'String' || !context && selector) {
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
          this.add(false, slice.call(r, 0));
        }
      }
      /*
       * If we just grabbed the elements related to the context
       */
      if (this.selector === context) {
        this.find(selector, false);
      /*
       * If we are dealing with a context which is a brief object
       */
      } else if (context && context.isBrief) {
        this.add(false, context.find(selector));
      /*
       * If we are dealing with an array like object or an HTML element
       */
      } else if (context && !context.isBrief) {
        this.add(false, context.querySelectorAll(selector));
      } else if (getVarType(context) == 'object') {
        this.add(false, context.length ? context : [context]);
        this.find(selector, false);
      }
    }
    return this;
  };
  create.prototype = brief.prototype;
  brief.Event = function(event, target) {
    // Event Object
    if (!target) {
      this.originalEvent = event;
      this.type = event.type;
      this.defaultPrevented = event.defaultPrevented;
      this.propagationStopped = false;
      this.timeStamp = event.timeStamp;
      this.currentTarget = event.currentTarget;
      this.target = event.target;
      this.srcElement = event.srcElement;
      this.isArtificial = false;
    } else {
      this.type = event;
      this.defaultPrevented = false;
      this.propagationStopped = true;
      this.timeStamp = new Date().getTime();
      this.currentTarget = target;
      this.target = target;
      this.srcElement = target;
      this.isArtificial = true;
    }
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
  /*
   * We don't want to force people to use the DOM Selection
   * API, so we are going to use these methods to allow them
   * to pass selectors/elements/nodelists/etc... into methods
   * attached to the brief funciton that will let them use
   * the eventing API without the selection API
   */
  ['on', 'onAll', 'off', 'offAll', 'once', 'onceAll', 'trigger'].forEach(function(e) {
    brief[e] = function() {
      var newBrief = standardizeElements(arguments[0]);
      var args = slice.call(arguments, 1);
      brief.prototype[e].apply(newBrief, args);
    };
  });
  return brief;
}));