
/**     @module/class filth.Lock
    An asynchronous lock that holds your callback in a queue until the locak is available.
    Optionally provides setup and/or takedown functions and a timeout that releases the lock (and
    calls any takedown function) if it is not freed.
@argument/Number timeout
    @optional
@argument/Function setup
@argument/Function takedown
@member/Boolean isTaken
@member/Array[Function] queue
    @private
*/
function Lock (/* timeout, setup, takedown */) {
    var timeout, setup, takedown;
    if (typeof arguments[0] == 'number') {
        timeout = arguments[0];
        setup = arguments[1];
        takedown = arguments[2];
    } else {
        setup = arguments[0];
        takedown = arguments[1];
    }

    this.timeout = timeout;
    this.setup = setup;
    this.takedown = takedown;
    this.isTaken = false;
    this.queue = [];
}
module.exports = Lock;

/**     @member/Function @Lock#acquire

@callback
*/
Lock.prototype.acquire = function (callback) {
    if (this.isTaken) {
        this.queue.push (callback);
        return;
    }
    this.isTaken = true;

    var self = this;
    function startJob (job) {
        var stillAlive = true;
        var watchdog;
        if (self.timeout)
            watchdog = setTimeout (function(){
                cleanup();
            }, self.timeout);
        function cleanup (err) {
            if (!stillAlive) return;
            stillAlive = false;

            var job;
            if (self.timeout)
                clearTimeout (watchdog);
            if (self.takedown) {
                self.takedown (err, function(){
                    job = self.queue.shift();
                    if (!job)
                        self.isTaken = false;
                    else
                        startJob (job);
                });
                return;
            }
            job = self.queue.shift();
            if (!job)
                self.isTaken = false;
            else
                startJob (job);
        }

        if (self.timeout)
            watchdog = setTimeout (function(){
                cleanup();
            }, self.timeout);

        if (self.setup)
            process.nextTick (function(){ self.setup (function(){
                process.nextTick (function(){ job (cleanup); });
            }); });
        else
            process.nextTick (function(){ job (cleanup); });
    }

    startJob (callback);
};
