var $ = (function (document, Element, NodeList) {
  'use strict';
  /*
   * We will have to manage a list of listeners that have
   * been passed in as event delegations so that we can
   * remove them later if need be
   */
  var delegatedListeners = {};
  /*
   * We also need a simple var that can give us a unique
   * id for object properties
   */
  var i = 0;
  /*
   * This is the main function. It will grab elements using
   * querySelectorAll
   */
  var $ = function (query) {
    var r = document.querySelectorAll(query);
    /*
     * If we only have one element, return the element
     * instead of a NodeList
     */
    return r.length === 1 ? r[0] : r;
  };
  Element.prototype.on = function (type, callback, delegatee) {
    /*
     * Since we want to support multiple listeners types 
     * at once, we need to split up the types and run this
     * code for each type
     */
    type = type.split(' ');
    type.forEach(function(type) {
      /*
       * If we aren't trying to delegate this listener
       * we can just add the listener to the element
       */
      if (!delegatee) {
        this.addEventListener(type, callback, false);
      /*
       * If we are delegating the event we will have 
       * to do some extra stuff
       */
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
        /*
         * We need to store both the original function and new
         * function we made in order to remove it later
         */ 
        delegatedListeners[i++] = {
          originalCallback: callback,
          createdCallback: newFunction
        };
      }
    }, this);
    return this;
  };

  NodeList.prototype.on = function (type, callback, delegatee) {
    [].forEach.call(this, function (element) {
      element.on(type, callback, delegatee);
    });
    return this;
  };
  Element.prototype.off = function(type, callback, delegatee) {
    type = type.split(' ');
    type.forEach(function(type) {
      if (!delegatee) {
        this.removeEventListener(type, callback, false);
      } else {
        for (var key in delegatedListeners) {
          var obj = delegatedListeners[key];
          if (obj.originalCallback == callback) {
            this.removeEventListener(type, obj.createdCallback, true);
            /*
             * When we remove a delegated event listener
             * we need to remove it from our list of
             * managed delegated listeners
             */
            delete delegatedListeners[key];
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
    [].forEach.call(this, function (element) {
      element.off(type, callback, delegatee);
    });
    return this;
  };
  return $;
}(document, Element, NodeList));