var evaluating = [],
    watcherQueue = [],
    currentTick = 0,
    buffering = false;

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

            addWatchersToQueue(watchers);

            if (!buffering) {
                currentTick++;
                processQueue();
            }

            return self;
        }

        if (evaluating.length) {
            evaluating[0]._depends(self);
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
            processQueue();
        }

        return self._value();
    };

    self._value = function() {

        var newValue;

        dependencies.forEach(function(dep) {
            dep.unwatch();
        });
        dependencies = [];

        evaluating.unshift(self);

        newValue = evaluator();

        evaluating.shift();

        if (evaluating.length) {
            evaluating[0]._depends(self);
        }

        self.tick = currentTick;

        return newValue;

    };

    self.watch = function(callback, initial) {

        var watcher = {
            callback: function() {
                callback(self._value());
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

    self._hasDependency = function(dependency) {
        return containsWhere(dependencies, function(dep) { return dep.obj === dependency; });
    };

    self._depends = function(dependency) {

        // If self already depends on this new one, do nothing
        if (self._hasDependency(dependency)) {
            return;
        }

        dependencies.unshift({
            unwatch: dependency.watch(function() {
                addWatchersToQueue(watchers);
                processQueue();
            }, false),
            obj: dependency
        });

    };

    return self;

};

exports.bufferedUpdate = function(writer) {
    buffering = true;
    writer();
    currentTick++;
    processQueue();
};

exports.effects = function() {};