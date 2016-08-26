filth
=====
Yet another common tools library. Suitable for browser use via browserify.


Installation
------------
Works with [Node.js](https://nodejs.org/en/), [Browserify](http://browserify.org/), or directly in
the browser.
```shell
$ npm install filth
```


Usage
-----
Create an Object that can safely be used as a hash table.
```javascript
var filth = require ('filth');
var myMap = new filth.SafeMap();
console.log (myMap.__proto__); // undefined
```

Get simplified type strings for tricky items.
```javascript
filth.typeof (document.createTextNode ('foo'));
fs.readFile (filename, function (err, buf) {
    console.log (filth.typeof (buf)); // buffer
});
```

Perform simple JSON manipulations. Note that `clone` will produce SafeMap instances instead of bare
Objects.
```javascript
var alfa = { foo:'nine' };
var beta = { bar:'ten' };
var fullDoc = filth.merge (
    filth.clone (alfa),
    beta
);
console.log (fullDoc.foo) // "nine"
console.log (fullDoc.bar) // "ten"
console.log (alfa.bar); // undefined
console.log (filth.compare (fullDoc, alfa)) // false
filth.merge (alfa, beta);
console.log (filth.compare (fullDoc, alfa)) // true
```

Inherit from parent classes. Mainly useful when building a `browserify` package as the standard
`util` module is enormous.
```javascript
function ParentClass(){}
function ModifyingClass(){}

// you can create a non-destructive child
var ChildClass = filth.createChild (
    ModifyingClass,
    ParentClass
);

// or just modify the child directly
filth.inherit (ModifyingClass, ParentClass);
```

If you're using `filth` in `Node.js` you might want to check out the LatencyLogger class. It logs
the duration of a sequence of tasks as integer microseconds.
```javascript
var timeLogger = new filth.LatencyLogger();

do_long_task ("task_01");
timeLogger.latency ("task_01");

do_long_task ("task_02");
timeLogger.latency ("task_02");

do_long_task ("task_03");
timeLogger.latency ("task_03");

var latencies = timeLogger.getFinalLatency();
for (var name in latencies)
    console.log (
        name
      + ': '
      + latencies[name]
      + ' microseconds'
    );
```

To limit access to a shared resource, consider the `Lock` primitive. It does not include timeouts so
use responsibly.
```javascript
var filth = require ('filth');
var async = require ('async');

// create a lock for four users
var taskLock = new filth.Lock (4);
async.each (tasks, function (task, callback) {
    taskLock.take (function(){
        run_long_task (task, function (err) {
            taskLock.free();
            callback (err);
        });
    });
}, function (err) {
    if (err) {
        // clear unstarted tasks
        taskLock.clear();
    }

    // all tasks complete
});
```

See [the API Documentation](shenanigans.github.io/node-filth/docs/module/filth/index.html)
for more information.


LICENSE
-------
The MIT License (MIT)

Copyright (c) 2016 Kevin "Schmidty" Smith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
