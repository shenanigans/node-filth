
/*      @module filth
    Simple utility methods and primitives. Typecheck with ease, merge and compare Objects, inherit
    from a class, lock resources, and batch frequent function calls.

    Browserify users frequenty define their own version of `util.inherits` because the full
    browser-compatible `util` module is quite large and contains a lot of things almost nobody uses.
    `filth` is a lightweight way to access inheritence without rewriting `inherits` or rolling your
    own classes.
*/

/*      @class SafeMap
    Constructs an Object with no own properties or property name caveats. Optionally shallow copies
    a source Object. A convenient and browser-safe way to convert Object literals to null-prototype
    Objects.
@argument/Object source
    @optional
    An Object to shallow copy into the new `SafeMap` instance.
*/
function SafeMap (source) {
    if (!(this instanceof SafeMap))
        return new SafeMap (source);
    if (source) {
        var keys = Object.keys (source);
        for (var i=0,j=keys.length; i<j; i++) {
            var key = keys[i];
            this[key] = source[key];
        }
    }
}
if (Object.create)
    SafeMap.prototype = Object.create (null);
else if (Object.defineProperty)
    Object.defineProperty (
        SafeMap.prototype,
        '__proto__',
        { enumerable:false, writable:true, value:undefined }
    );
else
    SafeMap.prototype = null;


/*      @property/Function getTypeStr
    Gets a proper type name for a reference, in all lowercase, by exploiting the native string
    representation mechanism. Some possible values:
     * object
     * array
     * buffer
     * string
     * boolean
     * number
     * function
     * element
     * textnode
     * commentnode
     * nodelist
     * htmlcollection
     * htmldocument
@argument obj
*/
/*      @property/Function typeof
    @alias filth.getTypeStr
*/
var typeGetter = ({}).toString;
// browser safing
var buff;
try { buff = Buffer; } catch (err) { buff = {}; }
function getTypeStr (obj) {
    var tstr = typeGetter.apply(obj).slice(8,-1).toLowerCase();
    if (tstr == 'object')
        if (obj instanceof buff) return 'buffer';
        else return tstr;
    if (tstr == 'text') return 'textnode';
    if (tstr == 'comment') return 'commentnode';
    if (tstr.slice (-7) == 'element') return 'element'
    return tstr;
}


/*      @property/Function clone
    Create a JSON-identical duplicate of a reference with no refs in common.
@argument obj
    One argument of any JSON-compatible type to be cloned.
@returns newObj
    A new object which is json-identical to `obj` ([compare](.compare) will return `true`) but
    shares no common Object or Array instances.
*/
function clone (target) {
    var objType = getTypeStr (target);
    switch (objType) {
        case 'undefined':
            return undefined;
        case 'number':
            return Number (target); // otherwise you get heap Numbers instead of natives... it's weird.
        case 'string':
            return String (target); // otherwise you get heap Strings instead of natives... it's weird.
        case 'boolean':
            return Boolean (target); // otherwise you get heap Booleans instead of natives... it's weird.
        case 'array':
            return target.slice().map(clone);
        case 'object':
            var newObj = new SafeMap();
            var keys = Object.keys(target);
            for (var i=0,j=keys.length; i<j; i++)
                newObj[keys[i]] = clone (target[keys[i]]);
            return newObj;
        case 'function':
            throw new Error ('cannot clone Functions');
        default:
            throw new Error ('cannot clone type "'+objType+'"');
    }
}


/*      @property/Function merge
    Overwrite properties on an object with those of another object, recursing into Objects. Source
    Arrays are appended to target Arrays. Whenever `source` and `target` or values found within them
    have different types, the `source` value overwrites the 'target' value.
@argument/Object target
@argument/Object source
*/
function merge (target, source) {
    var keys = Object.keys (source);
    for (var i=0,j=keys.length; i<j; i++) {
        var key = keys[i];
        var val = source[key];
        if (!Object.hasOwnProperty.call (target, key)) {
            target[key] = val;
            continue;
        }
        var type = getTypeStr (val);
        if (type != getTypeStr (target[key])) {
            target[key] = val;
            continue;
        }
        if (type == 'object')
            merge (target[key], val);
        else if (type == 'array')
            target[key].push.apply (target[key], val);
        else
            target[key] = val;
    }
}


/*      @property/Function inherit
    Perform a simple prototype inheritence operation to cause the first argument to inherit from the
    last. Unlike [util.inherits]() the child prototype's own properties are copied over, so you can
    call `inherit` after setting up the prototype on `child` without anything getting left behind.
@argument/Function child
    The class which will inherit from `parent`. Its prototype will be replaced with one chained to
    `parent` and own properties will be transfered over.
@argument/Function parent
    The class which will modify `child`. It is used to generate a new prototype for `child` which is
    chained to `parent` and its ancestors.
*/
function inherit (child, parent) {
    var dummy = function(){};
    dummy.prototype = parent.prototype;
    dummy = new dummy();
    var keys = Object.keys (child.prototype);
    for (var i=0,j=keys.length; i<j; i++) {
        var key = keys[i];
        dummy[key] = child.prototype[key];
    }
    child.prototype = dummy;
}


/*      @property/Function createChild
    A non-destructive version of [inherit](.inherit). Creates a **new** class from `child` which
    inherits from `parent`.
@argument/Function child
    The class which will be copied before inheriting from `parent`.
@argument/Function parent
    The class which will modify `child`.
*/
function createChild (child, parent) {
    var dummy = function(){};
    dummy.prototype = parent.prototype;
    dummy = new dummy();
    var keys = Object.keys (child.prototype);
    for (var i=0,j=keys.length; i<j; i++) {
        var key = keys[i];
        dummy[key] = child.prototype[key];
    }
    var newChild = function(){ child.apply (this, arguments); };
    newChild.prototype = dummy;
    return newChild;
}


/*      @property/Function compare
    Determine whether two JSON Objects are identical. Object key ordering is not considered.
@argument/Object objA
@argument/Object objB
@returns/Boolean
*/
function compare (objA, objB) {
    var keys = Object.keys (objA);
    for (var i=0,j=keys.length; i<j; i++) {
        var key = keys[i];
        if (!Object.hasOwnProperty.call (objB, key))
            return false;
        var itemA = objA[key];
        var itemB = objB[key];
        var aType = getTypeStr (itemA);
        var bType = getTypeStr (itemB);
        if (aType != bType) return false;
        if (aType == 'object')
            if (compare (itemA, itemB))
                continue;
            else
                return false;
        if (aType == 'array')
            if (itemA.length != itemB.length || !compareArrays (itemA, itemB))
                return false;
            else
                continue;
        if (itemA !== itemB)
            return false;
    }
    return true;
}

/*      @property/Function compareArrays
    Determine whether two JSON Arrays are recursively identical. Key ordering in child Objects is
    not considered.
@argument/Array arrA
@argument/Array arrB
@returns/Boolean
*/
function compareArrays (arrA, arrB) {
    for (var i=0,j=arrA.length; i<j; i++) {
        var itemA = arrA[i];
        var itemB = arrB[i];
        var aType = getTypeStr (itemA);
        var bType = getTypeStr (itemB);
        if (aType != bType) return false;
        if (aType == 'object')
            if (compare (itemA, itemB))
                continue;
            else
                return false;
        if (aType == 'array')
            if (itemA.length != itemB.length || !compareArrays (itemA, itemB))
                return false;
            else
                continue;
        if (itemA !== itemB)
            return false;
    }
    return true;
}

/*      @property/Function hrDiff
    Return the difference between two [high-resolution timestamps](process.hrtime) as integer
    microseconds. This is suitable for latencies up to roughly 285 years 224 days.
*/
function hrDiff (start, end) {
    var micro = Math.floor (( end[1] - start[1] ) / 1000 );
    micro += 1000000 * ( end[0] - start[0] );
    return micro;
}

/*
    An easy logging tool for tracking the myriad latencies of a long serial process and reporting
    them all at once.
*/
function LatencyLogger (latencies) {
    this.start = process.hrtime();
    this.latencies = latencies || {};
    this.latencies.total = 0;
}

/*
    Log a latency number in integer microseconds relative to the last latency logged. Calling with
    no `name` argument will reset the start time for the next logged latency. Multiple calls with
    the same `name` will be added together to produce a total latency for the name.
@argument/String name
    @optional
    The name under which this latency should be logged. If no name is passed, or the passed name has
    already been used, no latency is logged but the start time of the next logged latency is still
    updated.

    Note that any latency logged as `total` will be overwritten when [getFinalLatency]
    (#getFinalLatency) is called.
returns/Boolean written
    Whether a latency value was stored. `false` when a name conflict occurs.
*/
LatencyLogger.prototype.latency = function (name) {
    var then = this.latencyTime;
    var now = this.latencyTime = process.hrtime();
    if (!name)
        return false;
    if (Object.hasOwnProperty.call (this.latencies, name))
        this.latencies[name] += hrDiff (then, now);
    else
        this.latencies[name] = hrDiff (then, now);
    return true;
};

/*      @member/Function LatencyLogger#log
    @alias filth.LatencyLogger#latency
*/
LatencyLogger.prototype.log = LatencyLogger.prototype.latency;


/*
    Generate the final latency figure relative to a provided initial time, add it to the latencies
    under the property name `total`, then return the entire latency map.
@returns/Object<String, Number> latencies
    A map of logged latency names against the integer microsecond duration of each latency.
*/
LatencyLogger.prototype.getFinalLatency = function(){
    if (!this.latencies.total)
        this.latencies.total = hrDiff (this.start, process.hrtime());
    return this.latencies;
};

/*
    A simple lock for `width` users. Calls to `take` queue up until a slot to process them is
    available within the lock's width. Does not implement a timeout so it's up to you to worry about
    ensuring that `free` always gets called.
@argument/Number width
    @optional
    The maximum number of times the lock may be taken in parallel.
*/
function Lock (width) {
    this.width = width || 1;
    this.taken = 0;
    this.queue = [];
    this.isPaused = false;
};

/*      @member/Function .Lock#take
    Fires a callback when a slot is available within the [lock width](.Lock(width).
@callback
*/
Lock.prototype.take = function (callback) {
    if (!this.isPaused && this.taken < this.width) {
        this.taken++;
        process.nextTick (callback);
        return;
    }
    this.queue.push (callback);
};

/*      @member/Function .Lock#free
    Release the lock, permitting the next callback in the queue to fire.
*/
Lock.prototype.free = function(){
    if (!this.queue.length || this.isPaused)
        this.taken = Math.max (0, this.taken - 1);
    else
        process.nextTick (this.queue.shift());
};

/*      @member/Function .Lock#pause
    Stop firing new callbacks from the queue until [play](.Lock#play) is called.
*/
Lock.prototype.pause = function(){
    this.isPaused = true;
};

/*      @member/Function .Lock#clear
    Pauses the Lock and deletes all queued callbacks.
*/
Lock.prototype.clear = function(){
    this.isPaused = true;
    this.queue = [];
};

/*      @member/Function .Lock#play
    Start firing new callbacks from the queue again after [pause](.Lock#pause) was called.
*/
Lock.prototype.play = function(){
    this.isPaused = false;
    while (this.queue.length && this.taken < this.width) {
        this.taken++;
        process.nextTick (this.queue.shift());
    }
};

module.exports.getTypeStr    = getTypeStr;
module.exports.typeof        = getTypeStr;
module.exports.SafeMap       = SafeMap;
module.exports.clone         = clone;
module.exports.deepCopy      = clone;
module.exports.merge         = merge;
module.exports.inherit       = inherit;
module.exports.createChild   = createChild;
module.exports.compare       = compare;
module.exports.compareArrays = compareArrays;
module.exports.Lock          = Lock;
if (typeof document === 'undefined') {
    module.exports.hrDiff        = hrDiff;
    module.exports.LatencyLogger = LatencyLogger;
}
