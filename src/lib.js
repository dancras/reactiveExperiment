
var i = 0;

function wrappedLog(message) {
    // if (i++ > 200) throw 'done';
    // console.log(message);
}

var evaluating = [],
    changingData,
    watcherQueue = [],
    waitingRoom = [],
    currentTick = 0;


// # On data change
// Register as changing
// Put watchers in the queue
// While the queue isn't empty, unshift and run callback

// # Callback
// Set hasBeenChanged to false
// Join waiting room
// Try to evaluate self and notify

// # Evaluating Data
// As it is now..

// # Evaluating Junction
// If hasBeenChanged is true, return value
// If watcherQueue is empty, performEvaluation
// If waitingRoom

function addWatchersToQueue(watchers) {
    watcherQueue = watchers.concat(watcherQueue);
}

function processQueue() {
    var currentWatcher;

    while (currentWatcher = watcherQueue.shift()) {
        if (currentWatcher.isActive) {
            currentWatcher.callback();
        }
    }
}



exports.data = function(initialValue) {

    var currentValue = initialValue,
        watchers = [];

    var self = function(newValue) {

        if (newValue) {
            currentValue = newValue;
            //watchers.forEach(function(watcher) {
            changingData = self;
            addWatchersToQueue(watchers);
            currentTick++;
            processQueue();
            //    watcher.callback(currentValue);
            changingData = null;
            //});
            return self;
        }

        if (evaluating.length) {

            if ( evaluating[0].hasBoundValueFor(self) ) {
                return evaluating[0].boundValueFor(self);
            }

            wrappedLog('data depends');
            evaluating[0].depends(self);
        }

        return currentValue;
    };

    self.watch = function(callback, initial) {

        var watcher = {
            callback: function() {
                callback(currentValue);
            },
            isActive: true
        };

        watchers.push(watcher);

        if (initial !== false) {
            watcher.callback();
        }

        return function unwatch() {

            var index = watchers.indexOf(watcher);

            if (index < 0) {
                return;
            }

            watchers.splice(index, 1);

            watcher.isActive = false;

        };
    };

    self.hasDependency = function() {
        return false;
    };

    self.depCount = function() {
        return 0;
    };

    self.isData = true;

    return self;

};

function containsWhere(list, predicate) {
    var found = false;
    list.forEach(function(item) {
        found = found || predicate(item);
        return !found;
    });
    return found;
}

exports.junction = function(evaluator) {

    var watchers = [],
        dependencies = [];

    var self = function() {

        if (self.tick !== currentTick) {
            waitingRoom.unshift(self);
            processQueue();
        }

        return self.innerValue();
    };

    self.innerValue = function() {

        var newValue;

        wrappedLog('innerValue');

        dependencies.forEach(function(dep) {
            dep.unwatch();
        });
        dependencies = [];

        wrappedLog('registering as evaluating');
        evaluating.unshift(self);

        newValue = evaluator();

        wrappedLog('done evaluating');
        evaluating.shift();

        if (evaluating.length) {
            evaluating[0].depends(self);
        }

        self.tick = currentTick;

        return newValue;

    };

    self.isData = false;

    self.hasBoundValueFor = function(dependency) {
        wrappedLog('checking bound value');
    };

    self.boundValueFor = function(dependency) {
        wrappedLog('using bound value');
    };

    self.watch = function(callback, initial) {

        wrappedLog('watching junction');

        var watcher = {
            callback: function() {
                callback(self.innerValue());
            },
            isActive: true
        };

        watchers.push(watcher);

        if (initial !== false) {
            watcher.callback();
        }

        return function unwatch() {

            var index = watchers.indexOf(watcher);

            if (index < 0) {
                return;
            }

            watchers.splice(index, 1);

            watcher.isActive = false;

        };
    };

    self.hasDependency = function(dependency) {
        return containsWhere(dependencies, function(dep) { return dep.obj === dependency; });
    };

    self.depCount = function() {
        return dependencies.length;
    };

    self.depends = function(dependency) {

        // var clash;
        wrappedLog('running depends', dependency.depCount());

        // If self already depends on this new one, do nothing
        if (self.hasDependency(dependency)) {
            wrappedLog('has dep');
            return;
        }

        // If data dep, always depend
        // if (dependency.isData) {

        // }

        // If not, register dep with excludes?

            // Don't notify if it has direct data dep of currently changing

            // Don't notify if it told you not to when it subscribed

            // Accumulate a list of data deps you already have

            // Send accumulating list to each junction encountered

            // If a junction is repeated it should still be in the list so nothing will happen



            // Will need to recheck non data deps to see if they are still useful

        // Else, ask new dependency if it has any data deps you don't have

        // If self already has a dependency which depends on this new one
        // Or if this new one has a dependency which self has
        // clashes = dependencies.filter(function(dep) {
        //     return dep.obj.hasDependency(dependency) || dependency.hasDependency(dep.obj);
        // });

        // wrappedLog(clashes.length)

        // if (clashes.length > 0) {

        //     wrappedLog('has clash');

        //     clashes.forEach(function(dep) { dep.unwatch(); });

        //     wrappedLog('before', dependencies.length);
        //     dependencies = dependencies.filter(function(dep) {
        //         return !containsWhere(clashes, function(clash) { return dep.obj === clash.obj; });
        //     });
        //     wrappedLog('after', dependencies.length);

        // }

        

            // Drop those dependencies

            // Create an intermediary

            // Bind to that for both of those dependencies

        // If A first

        // dependency = C, not evaluated, deps unknown..

        // When getting value, ask evaluating (chain?) if it has a value for you

        // If not start evaluating. Notify each dependency encountered?

        // Ask other dependencies if they depend too

        // If so

            // Drop dependency

        // clashingDependency

        // self.bind(clashingDependency, lib.junction(function() {
        //     return self.bound(clashingDependency).evaluateWith(dependency, dependency());
        // }), dependency);

        // // Bind allows a different junction to be used to resolve a dep

        //     // Create junction with extracted shared dep
        // var sharedDepValue = lib.dependee();

        // var intermediary = lib.junction(function() {

        //     return extracted.evaluateWith(sharedDep, sharedDepValue());

        // });

        //     // Create junction depending on extracted and shared dep
        // var replacedSelf = lib.junction(function() {

        //     // Need to exclude from being notified about changes due to dependency()
        //     return self.evaluateWith({
        //         dependency: dependency(),
        //         otherDependency: intermediary.evaluateWith(sharedDepValue, dependency())
        //     });

        // });

            // Depend on that junction

        dependencies.unshift({
            unwatch: dependency.watch(function() {
                wrappedLog('notifying junction watchers');

                addWatchersToQueue(watchers);
                processQueue();
                // watchers.forEach(function(watcher) {
                //     watcher.callback(self.innerValue());
                // });
            }, false),
            obj: dependency
        });

    };

    return self;

};

exports.effects = function() {};