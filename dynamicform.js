if(!__utilities_present__) {
    throw 'Missing utilities';
}

function defaultPrefs(prefs) {
    var defaults = {
        label: {
            tag: 'label',
            clazz: 'formLabel'
        },
        message: {
            tag: 'span',
            clazz: 'errorMessage'
        },
        container: {
            use: true,
            tag: 'div',
            clazz: 'fieldContainer'
        },
        selectItems: {
            clazz: 'selectItem',
            useFieldSet: false,
            useLegend: false
        },
        radio: {
            threshold: 2
        }
    }
    if(!prefs) {
        return defaults;
    }
    var newPrefs = {};
    $.each(defaults, function(key, value) {
        if(prefs[key]) {
            newPrefs[key] = getProperties(prefs[key], keys(value), value);
        }
    });
    return newPrefs;
}

function buildForm(formJson, prefs) {
    prefs = defaultPrefs(prefs);
    var formVals = getProperties(formJson, ['url', 'fields', 'method'],
                                 {method: 'post'});
    var form = $(format('<form action="{url}" method="{method}"/>', formVals));
    $.each(formJson.fields, function(i, field) {
        try {
            var container = form;
            if(prefs.container.use) {
                container = buildFieldContainer(prefs.container);
                form.append(container);
            }

            var newField = buildField(field, prefs);
            container.append(newField);

            if(field.validation) {
                addValidation(field.validation, newField, prefs.message);
            }
        } catch (e) {
            error(e);
            if(__debug__) {
                throw e;
            }
        }
    });
    return form;
}

var fieldFactories = {
    text: function(field, prefs) {
        var val = field.value ? format('value="{0}"', [field.value]) : '';
        var text = [(format('<input type="text" name="{0}" {1}/>',
                            [field.name, val]))];
        addLabel(text, field, prefs);
        return $(text.join(''));
    },
    selectOne: function(field, prefs) {
        validateProperty(field, 'options');
        if(field.options.length > prefs.radio.threshold) {
            var select = [format('<select name="{name}">', field)];
            $.each(field.options, function() {
                select.push(format('<option value="{0}">{0}</option>', [this]));
            });
            select.push('</select>');
            addLabel(select, field, prefs)
            var elems = $(select.join(''));
            if(field.value) {
                elems.nextAll('select').val(field.value);
            }
            return elems;
        } else {
            var radios = $.map(field.options, function(o) {
                return format('<input type="radio" name="{0}" id="{0}{1}" {3}/>\
                               <label class="{2}" for="{0}{1}">{1}</label>',
                              [field.name, o, prefs.selectItems.clazz,
                               o == field.value ? 'checked="checked"' : '']);
            });
            return $(addFieldSet(radios, field, prefs).join(''));
        }
    },
    selectMany: function(field, prefs) {
        validateProperty(field, 'options');
        var checks = $.map(field.options, function(o) {
            return format('<input type="checkbox" name="{0}" id="{0}{1}" {3}/>\
                           <label class="{2}" for="{0}{1}">{1}</label>',
                          [field.name, o, prefs.selectItems.clazz,
                           $.inArray(o, field.values) > -1 ?
                               'checked="checked"' : '']);
        });
        if(prefs.useFieldSet) {
            if(prefs.useLegend) {
                checks.unshift(format('<legend>{label}</legend>', field));
            }
            checks.unshift(format('<fieldset id="{name}">', field));
            checks.push(format('</fieldset>'));
        }

        return $(addFieldSet(checks, field, prefs).join(''));
    }
}

function buildField(field, prefs) {
    validateProperties(field, ['type', 'name']);
    validateValue(field, 'type', ['text', 'selectOne', 'selectMany']);
    var formField = fieldFactories[field.type](field, prefs);
    return formField;
}

function buildFieldContainer(prefs) {
    return $(format('<{tag} class="{clazz}"></{tag}>', prefs));
}

function addLabel(elem, field, prefs) {
    if(field.label) {
        elem.unshift(labelTemplate(field, prefs.label));
    }
}

function labelTemplate(field, prefs) {
    var forAttr = prefs.tag.toLowerCase() == 'label' ?
        format('for="{name}"', field) : '';
    return format('<{0} class="{1}" {3}>{2}</{0}>', [prefs.tag, prefs.clazz,
                                                     field.label, forAttr]);
}

function addFieldSet(elemStrs, field, prefs) {
    if(prefs.selectItems.useFieldSet) {
        if(prefs.selectItems.useLegend) {
            elemStrs.unshift(format('<legend>{label}</legend>', field));
        }
        elemStrs.unshift(format('<fieldset id="{name}">', field));
        elemStrs.push(format('</fieldset>'));
    }
    if(!(prefs.selectItems.useFieldSet && prefs.selectItems.useLegend) &&
       field.label) {
        elemStrs.unshift(labelTemplate(field, prefs.label));
    }
    return elemStrs;
}

function addValidation(validations, field, prefs) {
    try {
        $.each(validations, function(i, validation) {
            validateProperties(validation, ['expr', 'message']);
        });
        field.data('validations', $.map(validations, function(v) {
            return {expr: new RegExp(v.expr), message: v.message,
                    id: simpleHash(v.message)};
        }));
        field.data('prefs', prefs);
        field.keyup(function() {
            var self = $(this);
            $.each(self.data('validations'), function(i, validation) {
                var prefs = self.data('prefs');
                prefs['id'] = validation.id;
                var selector = format('#{id}', prefs);
                if(!validation.expr.test(self.val())) {
                    if(self.nextAll(selector).length < 1) {
                        prefs['message'] = validation.message;
                        self.after(format('<{tag} id="{id}" class="{clazz}">\
                                           {message}</{tag}>', prefs));
                    }
                } else {
                    self.nextAll(selector).remove();
                }
            });
        });
    } catch(e) {
        error(e);
    }
}
