filth
=====
Yet another common tools library. Suitable for browser use via browserify.

getTypeStr
----------
Uses the `Object.prototype.toString` method to quickly generate a lowercase type string sensitive
to both Arrays and Buffers.

clone
-----
Creates a "JSON clone" of a reference by recursing Array items and Object own properties. POJOs in
the input will become Objects and Arrays in the clone.

merge
-----
Recursively overwrites properties of one Object with those of another Object. When types do not
match, the new value is accepted. When Objects and Arrays are found, they are recursed. If an Array
is merged with a longer Array, novel items are appended.

Lock
----
A basic locking primitive providing an aqcuire/release pattern, and optionally setup/takedown
functions and a lock timeout. Timeouts are measured before takedown functions occur. When a timeout
event occurs the takedown function is still called.
