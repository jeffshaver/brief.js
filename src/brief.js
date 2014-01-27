var $ = (function (document, Element, NodeList) {
  'use strict';
  var delegatedListeners = {},
      i = 0,
      $ = function (query) {
        var r = document.querySelectorAll(query);
        return r.length === 1 ? r[0] : r;
      };
  Element.prototype.on = function (type, callback, delegatee) {
    if (!delegatee) {
      this.addEventListener(type, callback, false);
    } else {
      var elements = $(delegatee),
          newFunction;
      if (!elements.length) {
        newFunction = function (event) {
          if (event.srcElement.id === delegatee.substring(1)) {
            callback(event);
          }
        };
        this.addEventListener(type, newFunction, true);
      } else {
        if (delegatee.indexOf('.') === -1) {
          newFunction = function (event) {
            if (event.srcElement.tagName.toLowerCase() === delegatee) {
              callback(event);
            }
          };
          this.addEventListener(type, newFunction, true);
        } else {
          newFunction = function (event) {
            if (event.srcElement.classList.contains(delegatee.substring(1))) {
              callback(event);
            }
          };
          this.addEventListener(type, newFunction, true);
        }
      }
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