brief.js
========

Small (~2.3k minified, ~1k gzipped) library used for DOM Selection and Event Listening.

```
// add a click listener to body that delegates to all the anchor tags.
brief('body').on('click', function(event) {
  // code to run
}, 'a');
```

brief objects
=============

brief objects are array-like objects that are created when using brief.js. These objects hold elements and provide several methods to interact with them:

```splice```, ```push```, ```pop```, ```toArray```, ```empty```, ```filter```, ```indexOf```, ```get```, ```find```, ```forEach```, ```on```, ```once``` and ```off`.

splice, push, pop and forEach are the original array methods applied to the brief object.

toArray turns the current brief object into an array of the elements that are contained in it.

empty removes all elements from the object

filter takes a selector and removes all elements that don't match the selector from the object

indexOf takes in a selector and looks for an element that matches that selector.

get takes in an index and returns the element at that position.

find takes in a selector and queries for elements within the context,

on takes four arguemnts (two required and two optional). it takes in a string of event types or an array of event types, a callback, and one of both of the following: a delegation selector and/or whether to automatically remove the listener after the first call and adds event listeners.

once is a convenience method that applies the .on method with the last parameter as true.

off takes in a string of event types or an array of event types, a callback and (optional) delegation selector and removes the event listeners.


Browser Support
===============

IE9+ and any modern browser.

We need to support 

```
document.addEventListener
```

```
document.querySelectorAll
```

```
Array.prototype.forEach
```

```
Element.prototype.matchesSelector // or one of it's prefixed verisons
```


Usage
=====

brief.js will use the brief function to grab elements and return them as an array-like brief object.

With this object you will be able to add event listeners, remove event listeners, iterate over the elements and search for child elements.

The ```.on``` method accepts 4 arguments. ```type```, ```callback```, ```[delegatee]``` and ```[autoRemove]```.

The ```.on``` method is chainable. It will return the Element or NodeList that it was called on.

The first two arguments are required and the last 2 are optional.

type can be a string of event types (space-separated) or an array or event types

callback must be a function. It will be passed an event object

The first optional argument is used if you want to delegate the event. This argument can be any CSS selector. This can be completely ignored if you don't want to delegate the event, or if you only want to use the last argument.

The last last optional argument can be used if you want to remove the event listener after the first time that it is called. However, a convenience method is added for you ```.once``` so that you can avoid using this altogether.


Grabbing Elements
=================

You can use brief to grab elements easily. You can pass in a selector (required) and a context (optional). The selector must be a string, however, the context can be a string or a brief object.

```
var elements = brief('#id > .class');
var element = brief('#id');
```

Any of these will return brief objects.


Non-delegation example
======================

```
brief('#id').on('click', function(event) {
  // code to run on click
});
```

You can also chain!

```
brief('#id').on('mouseover', function(event) {
  // code to run on mouseover
}).on('click', function(event) {
  // code to run on click
});
```

And it supports multiple event listener types for one function!

```
brief('#id').on('mouseenter mouseleave', function(event) {
  // code to run on mouseenter and mouseleave
});

// or

brief('#id').on(['mouseenter', 'mouseleave'], function(event) {
  // code to run on mouseenter and mouseleave
});
```

You can also add event listeners that only need to be run once!

```
brief('#id').once('click', function(event) {
  // code to run once on click
});
```

Delegation example
==================

```
brief('body').on('click', function(event) {
  // code to run on click if the element is an anchor tag
}, 'a');
```

You can chain these too!

```
brief('body').on('click', function(event) {
  // code to run on click if the element is an anchor tag
}, 'a').on('mouseover', function(event) {
  // code to run on mouseover if the element is an anchor tag
}, 'a');
```

You can run it on multiple event listeners too!

```
brief('body').on('mouseenter mouseleave', function(event) {
  // code to run on mouseenter and mouseleave of an anchor element
}, 'a');
```

You can run these once too!

```
brief('body').once('click', function(event) {
  //code to run once with the delegated listener
}, 'a');
```

Remove Event Listeners
======================

If you want to remove event listeners, you must have a reference to the function that you passed into the ```on``` method.

```
function handler(event) {
  // code
}
brief('#test').on('click', handler);
brief('#test').off('click', handler);
```

This also works for delegated listeners:

```
function handler(event) {
  // code
}

brief('body').on('click', handler, 'a');
brief('body').off('click', handler, 'a');
```
