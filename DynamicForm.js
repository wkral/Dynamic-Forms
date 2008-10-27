var simpleForm = {
    url: '/submit',
    method: 'post',
    fields: [
        {
            name: 'blah',
            label: 'My Text:',
            type: 'text',
            value: 'hello',
            validation: [
                {
                    expr: "^[A-Za-z]{0,10}$",
                    message: "Must be a maximum of 10 alphabetic characters"
                }
            ]
        },
        {
            name: 'blah2',
            label: 'My select:',
            type: 'select',
            value: 'choice2',
            options: ['choice1', 'choice2', 'choice3']
        }
    ]
};

var EnhancedForm = new Class({
    fieldFactories: {
        'text': function(field) {
            var input = new Element('input', {
                'name': field.name,
                'type': field.type,
                'value': field.value    
            });
            this.addValidation(field, input);
            return input;
        },
        'select': function(field) {
            this.validateProperty(field, 'options');
            var select = new Element('select', {'name': field.name});
            field.options.forEach(function(option) {
                new Element('option', {'value': option}).appendText(option)
                    .inject(this);
            }, select);
            select.setProperty('value', field.value);
            return select;
        }
    },
    
    initialize: function(labelTag, messageTag, labelClass, messageClass) {
        this.labelTag = this.getValue(labelTag, 'label');
        this.labelClass = this.getValue(labelClass, '');
        this.messageTag = this.getValue(messageTag, 'span');
        this.messageClass = this.getValue(messageClass, '');
    },
    
    buildForm: function(formJson) {
        var form = new Element('form', {
            'action': formJson.url,
            'method': this.getValue(formJson.method, 'post')
        });
        this.validateProperties(formJson, ['url', 'fields']);
        formJson.fields.forEach(function(field) {
            try {
                var newField = this.buildField(field)
                newField.inject(form);
                if(field.label) {
                    new Element(this.labelTag, {'class': this.labelClass})
                    .appendText(field.label).inject(newField, 'before');
                }
            } catch (e) {}
        }, this);
        return form;
    },
    
    buildField: function(field) {
        this.validateProperties(field, ['type', 'name']);
        this.validateValue(field, 'type',
                           ['text', 'select', 'selectMany', 'check']);
        var formField = this.fieldFactories[field.type].run(field, this);
        return formField;
    },
    
    addValidation: function(field, formField) {
        try {
            this.validateProperty(field, 'validation');
            field.validation.forEach(function(validation) {
                this.validateProperties(validation, ['expr', 'message']);
            }, this);
            formField.validations = field.validation.map(function(validation) {
                return [new RegExp(validation.expr),
                        new Element('span').appendText(validation.message)];
            });
            var validate = function(expr, messageElem) {
                if(!expr.test(this.value)) {
                    messageElem.inject(this, 'after');
                } else{
                    messageElem.dispose();
                }
            }
            formField.validate = validate.create({bind: formField});
            formField.addEvent('change', function() {
                console.log('(%s)', this.value);
                this.validations.forEach(function(validation) {
                    this.validate.run(validation);
                }, this);
            });
        } catch(e) {}
    },
    
    getValue: function(prop, defaultValue) {
        return prop ? prop : defaultValue;
    },
    
    validateProperty: function(obj, property) {
        if(!obj[property]) {
            console.error('required property "%s" missing from field object',
                          property);
            throw('validateProperty');
        }
    },
    
    validateProperties: function(obj, properties) {
        properties.forEach(function(property) {
            this.validateProperty(obj, property);
        }, this);
    },
    
    validateValue: function(obj, property, options) {
        if(!options.contains(obj[property])) {
            console.error('property "%s" must be one of (%s) in feild object',
                          property, options.join(', '));
            throw('validateValue');
        }
    }
});

window.addEvent('domready', function() {
    var formBuilder = new EnhancedForm();
    var form = formBuilder.buildForm(simpleForm);
    form.inject($$('body')[0]);
}); 