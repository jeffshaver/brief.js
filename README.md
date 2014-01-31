brief.js
========

Small (~1.5k) wrapper overtop of the querySelectorAll method that enables chaining and simple event listening (and delegation).

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

Similar to jQuery, brief.js will use the brief function to grab elements. But that is all that it will do.

brief.js also adds ```.on``` methods to the Element and NodeList prototypes.

The ```.on``` method for either accepts 4 arguments. ```type```, ```callback```, ```[delegatee]``` and ```[autoRemove]```.

The ```.on``` method is chainable. It will return the Element or NodeList that it was called on.

The first two arguments are required and the last 2 are optional.

The first optional argument is used if you want to delegate the event. This argument can be any CSS selector. This can be completely ignored if you don't want to delegate the event, or if you only want to use the last argument.

The last last optional argument can be used if you want to remove the event listener after the first time that it is called. However, a convenience method is added for you ```.once``` so that you can avoid using this altogether.


The magical $
=============

If it isn't taken, brief.js will also take over the $ so that you can have an even shorter syntax!

So any example below that uses ```brief``` could also use ```$``` as long as another library isn't using it.

Grabbing Elements
=================

You can use brief to grab elements easily. Since it is a wrapper for querySelectorAll you can use it like this:

```
var elements = brief('#id > .class');
var element = brief('#id');
```

If briefs query returns one element from querySelectorAll, then it will return an Element. If the query returns multiple elements, it returns a NodeList.


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
