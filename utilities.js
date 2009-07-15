var __debug__ = true;

try {
    $.jquery;
} catch(e) {
    throw 'jQuery not present';
}

var __utilities_present__ = true;

function format(str, args) {
    var tokens = /\{([^{}]+)\}/g;
    var literals = str.split(tokens);
    $.each(literals, function(i, value) {
        // every other value should be a replacement token
        if(i % 2 == 1) {
            // check if this token has been escaped
            if (!literals[i].match(/^\{.*\}/)) {
                literals[i] = '' + args[value];
            }
        }
    });
    return literals.join('').replace(/\{\{/, '{').replace(/\}\}/, '}');
}

function log(msg, level) {
    if(!__debug__) {
        return;
    }
    if(!level) {
        level = 'log';
    }
    try {
        console[level]('%s', msg);
    } catch(e) {
        alert(msg);
    }
}

function error(msg) {
    log(msg, 'error');
}

function simpleHash(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function keys(obj) {
    var list = [];
    $.each(obj, function(i) {
        list.push(i);
    });
    return list;
}

function combine(obj1, obj2) {
    var newObj = {};
    $.each(obj1, function(k, v) {
        newObj[k] = v;
    });
    $.each(obj2, function(k, v) {
        newObj[k] = v;
    });
    return newObj
}

function getProperty(obj, prop, def) {
    if(obj[prop]) {
        return obj[prop];
    } else {
        return def;
    }
}

function getProperties(obj, props, defaults) {
    var newObj = {};
    $.each(props, function() {
        newObj[this] = getProperty(obj, this, defaults[this]);
    });
    return newObj
}

function validateProperty(obj, property) {
    if(!obj[property]) {
        error(format('required property "{0}" missing from object',
              [property]));
        throw('validateProperty');
    }
}

function validateProperties(obj, properties) {
    $.each(properties, function() {
        validateProperty(obj, this);
    });
}

function validateValue(obj, property, options) {
    if($.inArray(obj[property], options) < 0) {
        error(format('property "{0}" must be one of ({1}) in object',
                     [property, options.join(', ')]));
        throw('validateValue');
    }
}
