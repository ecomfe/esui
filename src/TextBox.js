/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 文本框输入控件
 * @author erik
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');

        // css
        require('css!./css/TextBox.css');

        var DEFAULT_OPTION = {
            mode: 'text',
            value: '',
            placeholder: ''
        };

        /**
         * 文本框输入控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function TextBox(options) {
            InputControl.apply(this, arguments);
        }

        TextBox.prototype.type = 'TextBox';

        TextBox.prototype.createMain = function () {
            return document.createElement('div');
        };

        TextBox.prototype.initOptions = function (options) {
            var properties = {
                mode: 'text',
                value: '',
                placeholder: ''
            };
            lib.extend(properties, options);

            if (properties.name) {
                properties.name = this.main.getAttribute('name');
            }

            if (lib.isInput(this.main)) {
                var nodeName = this.main.nodeName.toLowerCase();

                if (nodeName === 'textarea') {
                    properties.mode = 'textarea';
                }
                else {
                    var type = this.main.type;
                    properties.mode = type === 'password' ? 'password' : 'text';
                }

                if (!properties.placeholder) {
                    properties.placeholder = 
                        this.main.getAttribute('placeholder');
                }
            }

            this.setProperties(properties);
        };

        function dispatchKey(textbox, e) {
            var keyCode = e.keyCode || e.which;
            
            if (keyCode === 13) {
                textbox.fire('enter');
            }
        }

        function togglePlaceholder(textbox) {
            var input = lib.g(helper.getId(textbox, 'input'));

            if (!('placeholder' in input)) {
                var placeholder = 
                    lib.g(helper.getId(textbox, 'placeholder'));
                // 只有没焦点且没值的时候才显示placeholder
                if (document.activeElement !== input && !textbox.rawValue) {
                    helper.removePartClasses(
                        textbox, 'placeholder-hidden', placeholder);
                }
                else {
                    helper.addPartClasses(
                        textbox, 'placeholder-hidden', placeholder);
                }
            }
        }

        function focus(textbox, e) {
            togglePlaceholder(textbox);

            if (textbox.autoSelect) {
                input.select();
            }

            textbox.fire('focus');
        }

        function blur(textbox, e) {
            togglePlaceholder(textbox);

            textbox.fire('blur');
        }

        function syncValue(textbox, e) {
            var input = lib.g(helper.getId(textbox, 'input'));
            if (e.type === 'input' || e.propertyName === 'value') {
                textbox.rawValue = input.value;
                textbox.fire('input');
            }
        }

        TextBox.prototype.initStructure = function () {
            if (lib.isInput(this.main)) {
                var main = this.createMain();
                lib.insertBefore(main, this.main);
                lib.removeNode(this.main);
                this.main = main;
            }

            var template = this.mode === 'textarea'
                ? '<textarea id="${id}" name="${name}"></textarea>'
                : '<input type="${type}" id="${id}" name="${name}" />';
            this.main.innerHTML = lib.format(
                template,
                {
                    type: this.mode,
                    id: helper.getId(this, 'input'),
                    name: this.name
                }
            );

            var input = lib.g(helper.getId(this, 'input'));
            helper.addDOMEvent(
                this,
                input,
                'keypress',
                lib.curry(dispatchKey, this)
            );
            helper.addDOMEvent(
                this,
                input,
                'focus',
                lib.curry(focus, this)
            );
            helper.addDOMEvent(
                this,
                input,
                'blur',
                lib.curry(blur, this)
            );
            var inputEventName = ('oninput' in input) ? 'input' : 'propertychange';
            helper.addDOMEvent(
                this,
                input,
                inputEventName,
                lib.curry(syncValue, this)
            );

            if (!('placeholder' in input)) {
                var placeholder = document.createElement('label');
                placeholder.id = helper.getId(this, 'placeholder');
                lib.setAttribute(placeholder, 'for', input.id);
                placeholder.className = 
                    helper.getPartClasses(this, 'placeholder').join(' ');
                lib.insertAfter(placeholder, input);
            }
        };

        var paint = require('./painters');

        TextBox.prototype.repaint = helper.createRepaint(
            paint.style('width'),
            paint.style('height'),
            {
                name: 'rawValue',
                paint: function (textbox, rawValue) {
                    var input = lib.g(helper.getId(textbox, 'input'));
                    var eventName = 
                        ('oninput' in input) ? 'input' : 'propertychange';
                    // 由于`propertychange`事件容易进入死循环，因此先要移掉原来的事件
                    helper.removeDOMEvent(textbox, input, eventName);
                    input.value = rawValue;
                    helper.addDOMEvent(
                        textbox,
                        input,
                        eventName,
                        lib.curry(syncValue, textbox)
                    );

                    togglePlaceholder(textbox);
                }
            },
            {
                name: 'placeholder',
                paint: function (textbox, placeholder) {
                    var input = lib.g(helper.getId(textbox, 'input'));
                    if ('placeholder' in input) {
                        input.setAttribute('placeholder', placeholder);
                    }
                    else {
                        var label = 
                            lib.g(helper.getId(textbox, 'placeholder'));
                        label.innerHTML = lib.encodeHTML(placeholder);
                    }
                }
            }
        );

        require('./lib').inherits(TextBox, InputControl);
        require('./main').register(TextBox);
        return TextBox;
    }
);
