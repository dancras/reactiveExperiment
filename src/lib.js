
exports.data = function(initialValue) {

    var currentValue = initialValue,
        watchers = [];

    var self = function(newValue) {

        if (newValue) {
            currentValue = newValue;
            watchers.forEach(function(watcher) {
                watcher.callback(currentValue);
            });
            return self;
        }

        return currentValue;
    };

    self.watch = function(callback) {

        var watcher = {
            callback: callback,
            isActive: true
        };

        watchers.push(watcher);

        watcher.callback(currentValue);

        return function unwatch() {

            var index = watchers.indexOf(watcher);

            if (index < 0) {
                return;
            }

            watchers.splice(index, 1);

        };
    };

    return self;

};