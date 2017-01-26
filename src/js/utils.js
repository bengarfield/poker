Utils = {};

Utils.arraysEqual = function(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

Utils.isCyclic = function(obj) {
    var seenObjects = [];

    function detect (obj) {
        if (obj && typeof obj === 'object') {
            if (seenObjects.indexOf(obj) !== -1) {
                return true;
            }
            seenObjects.push(obj);
            for (var key in obj) {
                if (obj.hasOwnProperty(key) && detect(obj[key])) {
                    console.log(obj, 'cycle at ' + key);
                    return true;
                }
            }
        }
        return false;
    }

    return detect(obj);
};

/**
 * Simple is object check.
 * @param item
 * @returns {boolean}
 */
Utils.isObject = function(item) {
    return (item && typeof item === 'object' && item !== null);
};

/**
 * Deep merge two objects.
 * @param target
 * @param source
 */
Utils.mergeDeep = function(target, source) {
    if (Utils.isObject(target) && Utils.isObject(source)) {
        Object.keys(source).forEach(function(key){
            if (Utils.isObject(source[key])) {
                if (!target[key]){
                    Object.assign(target, {key: {}});
                }
                Utils.mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {key: source[key]});
            }
        });
    }
    return target;
};

Utils.toggleVisible = function(object, visible) {
    object.visible = visible;
    for (var i = 0, max = object.children.length; i < max; i++) {
        Utils.toggleVisible(object.children[i], visible);
    }
};
