function format(str, args) {
    var myregex = /\{([^{}]+)\}/g;
    var literals = str.split(myregex);
    $.each(literals, function(i, value) {
        if(i % 2 == 1) {
            if (!literals[i].match(/^\{.*\}/)) {
                literals[i] = '' + args[value];
            }
        }
    });
    var newString = literals.join('');
    newString = newString.replace(/\{\{/, '{');
    newString = newString.replace(/\}\}/, '}');
    return newString;
}

$(function () {
    alert(format('<input type="{type}" value="{value}" name="{name}" />', {type:'text', name: 'name', value:'William'}));
});