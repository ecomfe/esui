/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 文本框输入控件
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var ui = require('./main');
        var InputControl = require('./InputControl');
        var supportPlaceholder = 
            ('placeholder' in document.createElement('input'));

        /**
         * 文本框输入控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function TextBox(options) {
            InputControl.apply(this, arguments);
        }

        /**
         * 默认属性值
         *
         * @type {Object}
         */
        TextBox.defaultProperties = {
            width: 200
        };

        TextBox.prototype.type = 'TextBox';

        /**
         * 创建主元素
         *
         * @return {HTMLElement} 主元素
         * @protected
         * @override
         */
        TextBox.prototype.createMain = function () {
            return document.createElement('div');
        };

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @protected
         * @override
         */
        TextBox.prototype.initOptions = function (options) {
            var properties = {
                mode: 'text',
                placeholder: '',
                autoSelect: false
            };
            u.extend(properties, TextBox.defaultProperties, options);

            if (!properties.name) {
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

                this.helper.extractOptionsFromInput(this.main, properties);
            }

            this.setProperties(properties);
        };

        TextBox.prototype.getFocusTarget = function () {
            return lib.g(this.inputId);
        };

        /**
         * 将特殊的按键分发为事件
         *
         * @param {TextBox} this 控件实例
         * @param {Event} e DOM事件对象
         */
        function dispatchSpecialKey(e) {
            var keyCode = e.which || e.keyCode;

            if (keyCode === 13) {
                this.fire('enter');
            }

            var args = {
                keyCode: keyCode,
                key: String.fromCharCode(keyCode),
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            };
            var event = require('mini-event').fromDOMEvent(e, 'keypress', args);
            this.fire('keypress', event);
        }

        /**
         * 控制placeholder的显示与隐藏
         *
         * @param {TextBox} textbox 控件实例
         * @param {boolean=} focused 额外指定文本框是否聚集
         */
        function togglePlaceholder(textbox, focused) {
            var input = lib.g(textbox.inputId);

            if (!supportPlaceholder) {
                var placeholder = textbox.helper.getPart('placeholder');
                if (typeof focused !== 'boolean') {
                    focused = document.activeElement === input;
                }
                // 只有没焦点且没值的时候才显示placeholder
                if (!focused && !textbox.getRawValue()) {
                    textbox.helper.removePartClasses(
                        'placeholder-hidden', placeholder);
                }
                else {
                    textbox.helper.addPartClasses(
                        'placeholder-hidden', placeholder);
                }
            }
        }

        /**
         * 获得焦点的逻辑
         *
         * @param {Event} e DOM事件对象
         */
        function focus(e) {
            togglePlaceholder(this, true);

            if (this.autoSelect) {
                input.select();
            }

            this.fire('focus');
        }

        /**
         * 失去焦点的逻辑
         *
         * @param {Event} e DOM事件对象
         */
        function blur(e) {
            togglePlaceholder(this, false);

            this.fire('blur');
        }

        /**
         * 同步DOM的值与控件的属性
         *
         * @param {Event} e DOM事件对象
         */
        function dispatchInputEvent(e) {
            if (e.type === 'input' || e.propertyName === 'value') {
                this.fire('input');
            }
        }

        /**
         * 初始化DOM结构
         *
         * @override
         * @protected
         */
        TextBox.prototype.initStructure = function () {
            if (lib.isInput(this.main)) {
                var main = this.helper.replaceMain();
                
                // `replaceMain`会复制`id`属性，但`TextBox`是特殊的，`id`要保留下来
                this.inputId = main.id || this.helper.getId('input');

                if (this.main.id) {
                    this.main.id = this.helper.getId();
                }

                // TextBox上会有`maxlength`之类的属性，因此不能直接丢掉，
                // 但保留下来就不能加`data-ctrl-id`属性，
                // 不加又会导致`main.init`重复创建控件，
                // 因此这里需要复制一个用，好在`cloneNode(false)`没兼容问题
                var input = main.cloneNode(false);
                // `helper.replaceMain`会给加上`data-ctrl-id`，要重新去掉
                lib.removeAttribute(
                    input, ui.getConfig('instanceAttr'));
                input.id = this.inputId;
                // 把原来的`<input>`或`<textarea>`放进去
                this.main.appendChild(input);
            }
            else {
                this.inputId = this.helper.getId('input');
                var html = this.mode === 'textarea'
                    ? '<textarea id="' + this.inputId + '"'
                    : '<input type="' + this.mode + '" '
                        + 'id="' + this.inputId + '"';
                if (this.name) {
                    html += ' name="' + u.escape(this.name) + '"';
                }
                html += this.mode === 'textarea'
                    ? '></textarea>'
                    : ' />';

                this.main.innerHTML = html;
            }

            var input = lib.g(this.inputId);
            this.helper.addDOMEvent(input, 'keypress', dispatchSpecialKey);
            this.helper.addDOMEvent(input, 'focus', focus);
            this.helper.addDOMEvent(input, 'blur', blur);
            var inputEventName = ('oninput' in input) 
                ? 'input' 
                : 'propertychange';
            this.helper.addDOMEvent(input, inputEventName, dispatchInputEvent);

            if (!supportPlaceholder) {
                var placeholder = document.createElement('label');
                placeholder.id = this.helper.getId('placeholder');
                lib.setAttribute(placeholder, 'for', input.id);
                this.helper.addPartClasses('placeholder', placeholder);
                lib.insertAfter(placeholder, input);
            }
        };

        /**
         * 重绘
         *
         * @param {Array=} 更新过的属性集合
         * @protected
         * @override
         */
        TextBox.prototype.repaint = require('./painters').createRepaint(
            InputControl.prototype.repaint,
            {
                name: 'rawValue',
                paint: function (textbox, rawValue) {
                    var input = lib.g(textbox.inputId);
                    var eventName = 
                        ('oninput' in input) ? 'input' : 'propertychange';
                    // 由于`propertychange`事件容易进入死循环，因此先要移掉原来的事件
                    textbox.helper.removeDOMEvent(input, eventName);
                    input.value = textbox.stringifyValue(rawValue);
                    textbox.helper.addDOMEvent(
                        input, eventName, dispatchInputEvent);

                    togglePlaceholder(textbox);
                }
            },
            {
                name: 'title',
                paint: function (textbox, title) {
                    var input = lib.g(textbox.inputId);
                    var placeholder = textbox.helper.getPart('placeholder');
                    if (title) {
                        lib.setAttribute(textbox.main, 'title', title);
                        lib.setAttribute(input, 'title', title);
                        if (placeholder) {
                            lib.setAttribute(placeholder, 'title', title);
                        }
                    }
                    else {
                        lib.removeAttribute(textbox.main, 'title');
                        lib.removeAttribute(input, 'title');
                        if (placeholder) {
                            lib.removeAttribute(placeholder, 'title');
                        }
                    }
                }
            },
            {
                name: 'maxLength',
                paint: function (textbox, maxLength) {
                    var input = lib.g(textbox.inputId);
                    maxLength = parseInt(maxLength, 10);
                    if (!maxLength || maxLength <= 0) {
                        try {
                            input.maxLength = undefined;
                            delete input.maxLength;
                        }
                        catch (badErrorForIE) {
                        }
                        lib.removeAttribute(input, 'maxlength');
                    }
                    else {
                        input.maxLength = maxLength;
                        lib.setAttribute(input, 'maxlength', maxLength);
                    }
                }
            },
            {
                name: ['disabled', 'readOnly'],
                paint: function (textbox, disabled, readOnly) {
                    var input = lib.g(textbox.inputId);
                    input.disabled = disabled;
                    input.readOnly = readOnly;
                }
            },
            {
                name: 'placeholder',
                paint: function (textbox, placeholder) {
                    var input = lib.g(textbox.inputId);
                    if (supportPlaceholder) {
                        if (placeholder) {
                            lib.setAttribute(input, 'placeholder', placeholder);
                        }
                        else {
                            lib.removeAttribute(input, 'placeholder');
                        }
                    }
                    else {
                        var label = textbox.helper.getPart('placeholder');
                        label.innerHTML = u.escape(placeholder || '');
                    }
                    togglePlaceholder(textbox);
                }
            },
            {
                name: ['hint', 'hintType'],
                paint: function (textbox, hint, hintType) {
                    var label = textbox.helper.getPart('hint');

                    textbox.removeState('hint-prefix');
                    textbox.removeState('hint-suffix');

                    if (!hint && label) {
                        lib.removeNode(label);
                    }

                    if (hint) {
                        if (!label) {
                            label = document.createElement('label');
                            label.id = textbox.helper.getId('hint');
                            textbox.helper.addPartClasses('hint', label);
                            lib.setAttribute(label, 'for', textbox.inputId);
                        }

                        label.innerHTML = u.escape(hint);
                        hintType = hintType === 'prefix' ? 'prefix' : 'suffix';
                        var method = hintType === 'prefix'
                            ? 'insertBefore'
                            : 'insertAfter';
                        var input = lib.g(textbox.inputId);
                        lib[method](label, input);

                        textbox.addState('hint-' + hintType);
                    }
                }
            },
            {
                name: ['width', 'hint', 'hidden'],
                paint: function (textbox, width, hint, hidden) {
                    if (hidden || isNaN(width)) {
                        return;
                    }

                    if (hint) {
                        var hintLabel = textbox.helper.getPart('hint');
                        if (hintLabel) {
                            width -= hintLabel.offsetWidth;
                        }
                    }

                    var input = lib.g(textbox.inputId);
                    input.style.width = width + 'px';
                    var placeholder = textbox.helper.getPart('placeholder');
                    if (placeholder) {
                        placeholder.style.maxWidth = width + 'px';
                    }
                }
            },
            {
                name: 'height',
                paint: function (textbox, height) {
                    if (isNaN(height)) {
                        return;
                    }

                    var hintLabel = textbox.helper.getPart('hint');
                    var heightWithUnit = height + 'px';
                    if (hintLabel) {
                        hintLabel.style.height = heightWithUnit;
                        hintLabel.style.lineHeight = heightWithUnit;
                    }

                    var input = lib.g(textbox.inputId);
                    input.style.height = heightWithUnit;
                    var placeholder = textbox.helper.getPart('placeholder');
                    if (placeholder) {
                        placeholder.style.height = heightWithUnit;
                        placeholder.style.lineHeight = heightWithUnit;
                    }
                }
            }
        );

        /**
         * 获取验证信息控件
         *
         * @return {Validity}
         * @public
         * @override
         */
        TextBox.prototype.getValidityLabel = function () {
            // `TextBox`根据`mode`来分配具体的类型
            var label = 
                InputControl.prototype.getValidityLabel.apply(this, arguments);
            if (label) {
                label.set(
                    'targetType', 
                    this.mode === 'textarea' ? 'TextArea' : 'TextBox'
                );
            }
            return label;
        };

        /**
         * 获取值
         *
         * @return {string}
         */
        TextBox.prototype.getRawValue = function () {
            var input = lib.g(this.inputId);
            return input ? input.value : (this.rawValue || this.value || '');
        };

        TextBox.prototype.getRawValueProperty = TextBox.prototype.getRawValue;

        lib.inherits(TextBox, InputControl);
        ui.register(TextBox);
        return TextBox;
    }
);
