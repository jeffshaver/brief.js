var $ = (function (document, Element, NodeList) {
  'use strict';
  /* We will have to manage a list of listeners that have
   * been passed in as event delegations so that we can
   * remove them later if need be
   */
  var delegatedListeners = {},
      i = 0,
      // This is the main function. It will grab elements using
      // querySelectorAll
      $ = function (query) {
        var r = document.querySelectorAll(query);
        // If we only have one element, return the element
        // instead of a NodeList
        return r.length === 1 ? r[0] : r;
      };
  Element.prototype.on = function (type, callback, delegatee) {
    // If we aren't trying to delegate this listener
    // we can just add the listener to the element
    if (!delegatee) {
      this.addEventListener(type, callback, false);
    // If we are delegating the event we will have 
    // to do some extra stuff
    } else {
      var elements = $(delegatee),
          newFunction;
      // If we are dealing with an ID
      if (delegatee.indexOf('#') !== -1) {
        newFunction = function (event) {
          if (event.srcElement.id === delegatee.substring(1)) {
            callback(event);
          }
        };
      // If we are dealing with a class
      } else if (delegatee.indexOf('.') !== -1) {
        newFunction = function (event) {
          if (event.srcElement.classList.contains(delegatee.substring(1))) {
            callback(event);
          }
        };
      // If we are dealing with a tag
      } else {
        newFunction = function (event) {
          if (event.srcElement.tagName.toLowerCase() === delegatee) {
            callback(event);
          }
        };
      }
      // Apply the function we created to the listener
      this.addEventListener(type, newFunction, true);
      /* We need to store both the original function and new
       * function we made in order to remove it later
       */ 
      delegatedListeners[i++] = {
        originalCallback: callback,
        createdCallback: newFunction
      };
    }
    return this;
  };

  NodeList.prototype.on = function (type, callback, delegatee) {
    [].forEach.call(this, function (element) {
      element.on(type, callback, delegatee);
    });
    return this;
  };
  Element.prototype.off = function(type, callback, delegatee) {
    if (!delegatee) {
      this.removeEventListener(type, callback);
    } else {
      for (var key in delegatedListeners) {
        var obj = delegatedListeners[key];
        if (obj.originalCallback == callback) {
          this.removeEventListener(type, obj.createdCallback, true);
          break;
        }
      }
    }
    return this;
  };
  NodeList.prototype.off = function (type, callback, delegatee) {
    [].forEach.call(this, function (element) {
      element.off(type, callback, delegatee);
    });
    return this;
  };
  return $;
}(document, Element, NodeList));