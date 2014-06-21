/*
 * brief-plugin-example.js
 *
 * Copyright 2014 Jeffrey E. Shaver II
 * Released under the MIT license

 * https://github.com/jeffshaver/brief.js/blob/master/LICENSE
 */

/*
 * UMD (Universal Module Definition)
 * see https://github.com/umdjs/umd/blob/master/returnExports.js
 */
(function(root, factory){
  if (typeof define == 'function' && define.amd) {
    /*
     * AMD. Register as an anonymous module.
     */
    define([], function() {
      return function(brief) {
        factory(brief);
      };
    });
  } else if (typeof exports == 'object') {
    /*
     * We need a document to use brief, so throw an error if we
     * are in environments likes node
     */
    module.exports = function(brief) {
      return factory(brief);
    };
  } else {
    /*
     * Browser globals (root is window)
     */
    factory(brief);
  }
}(this, function(brief) {
  'use strict';
  brief.prototype.method = function() {
    // code
  };
}));