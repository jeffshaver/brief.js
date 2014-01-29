brief.js
========

Small wrapper overtop of the querySelectorAll method that enables chaining and simple event listening (and delegation).

Usage
=====

Similar to jQuery, brief.js will use the $ to grab elements. But that is all that it will do.

brief.js also adds ```.on``` methods to the Element and NodeList prototypes.

The ```.on``` method for either accepts 3 arguments. ```type```, ```callback``` and ```delegatee```.

The ```.on``` method is chainable. It will return the Element or NodeList that it was called on.

The first two arguments are required and the last of the three is optional.

The last argument is used if you want to delegate the event. This argument has to be a string and can be one of the following 3 things:

1) an ID: ```#testID```

2) a class name: ```.testClass```

3) a tag name: ```a```

Non-delegation example
======================

```
$('#id').on('click', function(event) {
  // code to run on click
});
```

You can also chain!

```
$('#id').on('mouseover', function(event) {
  // code to run on mouseover
}).on('click', function(event) {
  // code to run on click
});
```

And it supports multiple event listener types for one function!

```
$('#id').on('mouseenter, mouseleave', function(event) {
  // code to run on mouseenter and mouseleave
});
```

Delegation example
==================

```
$('body').on('click', function(event) {
  // code to run on click if the element is an anchor tag
}, 'a');
```

You can chain these too!

```
$('body').on('click', function(event) {
  // code to run on click if the element is an anchor tag
}, 'a').on('mouseover', function(event) {
  // code to run on mouseover if the element is an anchor tag
}, 'a');
```

You can run it on multiple event listeners too!

```
$('body').on('mouseenter, mouseleave', function(event) {
  // code to run on mouseenter and mouseleave of an anchor element
}, 'a');
```

Remove Event Listeners
======================

If you want to remove event listeners, you must have a reference to the function that you passed into the ```on``` method.

```
function handler(event) {
  // code
}
$('#test').on('click', handler);
$('#test').off('click', handler);
```

This also works for delegated listeners:

```
function handler(event) {
  // code
}

$('body').on('click', handler, 'a');
$('body').off('click', handler, 'a');
```
