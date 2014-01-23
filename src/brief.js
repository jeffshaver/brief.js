var $ = function(query) {
  var r = document.querySelectorAll(query);
  return r.length == 1 ? r[0] : r;
};
Element.prototype.on = function(type, callback, delegatee) {
  if (!delegatee) {
    this.addEventListener(type, callback, false);
  } else {
    var elements = $(delegatee);
    if (!elements.length) {
      this.addEventListener(type, function(event) {
        if (event.srcElement.id == delegatee.substring(1)) {
          callback(event);
        }
      }, true);
    } else {
      console.log(delegatee.indexOf('.'));
      if (delegatee.indexOf('.') == -1) {
        this.addEventListener(type, function(event) {
            if (event.srcElement.tagName.toLowerCase() == (delegatee)) {
                callback(event);
            }
        }, true);
      } else {
        this.addEventListener(type, function(event) {
            if (event.srcElement.classList.contains(delegatee.substring(1))) {
                callback(event);
            }
        }, true);
      }
    }
  }
  return this;
}

NodeList.prototype.on = function(type, callback, delegatee) {
  [].forEach.call(this, function(element) {
    element.on(type, callback, delegatee);
  });
  return this;
}