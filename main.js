
/**     @module filth
    Simple utility methods.
*/
module.exports.getTypeStr   = getTypeStr;
module.exports.clone        = clone;
module.exports.merge        = merge;
module.exports.inherit      = inherit;
module.exports.compare      = compare;
module.exports.Lock         = require ('./lib/Lock');


/**     @property/Function getTypeStr
    Gets a proper type name for a reference, in all lowercase.
@argument obj
*/
var typeGetter = ({}).toString;
// browser safing
var buff;
try { buff = Buffer; } catch (err) { buff = {}; }
function getTypeStr (obj) {
    var tstr = typeGetter.apply(obj).slice(8,-1).toLowerCase();
    if (tstr == 'object' && obj instanceof Buffer) return 'buffer';
    return tstr;
}


/**     @property/Function clone
    Create a JSON-identical duplicate of a reference with no refs in common.
@argument obj
*/
function clone (target) {
    var objType = getTypeStr (target);
    switch (objType) {
        case 'function':
            throw new Error ('cannot clone Functions');
        case 'undefined':
            return undefined;
        case 'number':
            return Number (target); // otherwise you get heap Numbers instead of natives... it's weird.
        case 'string':
            return String (target); // otherwise you get heap Strings instead of natives... it's weird.
        case 'boolean':
            return Boolean (target); // otherwise you get heap Strings instead of natives... it's weird.
        case 'array':
            return target.slice().map(clone);
        case 'object':
            var newObj = {};
            var keys = Object.keys(target);
            for (var i=0,j=keys.length; i<j; i++)
                newObj[keys[i]] = clone (target[keys[i]]);
            return newObj;
        default:
            throw new Error ('cannot clone type "'+objType+'"');
    }
}


/**     @property/Function merge
    Overwrite properties on an object with those of another object, recursing into Objects and
    Arrays.
@argument obj
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
            mergeArray (target[key], val);
        else
            target[key] = val;
    }
}

function mergeArray (target, source) {
    for (var i=0,j=source.length; i<j; i++) {
        var val = source[i];
        if (i > target.length) {
            target[i] = val;
            continue;
        }
        var type = getTypeStr (val);
        if (type != getTypeStr (target[i])) {
            target[i] = val;
            continue;
        }
        if (type == 'object')
            merge (target[i], val);
        else if (type == 'array')
            mergeArray (target[i], val);
        else
            target[i] = val;
    }
}


/**     @property/Function inherit
    Perform a simple prototype inheritence operation to cause the first argument to inherit from the
    last.
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


/**     @property/Function compare

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
            if (itemA.length != itemB.length || compareArrays (itemA, itemB))
                return false;
            else
                continue;
        if (itemA !== itemB)
            return false;
    }
    return true;
}

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
            if (itemA.length != itemB.length || compareArrays (itemA, itemB))
                return false;
            else
                continue;
        if (itemA !== itemB)
            return false;
    }
}
