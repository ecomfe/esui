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
         * @public
         */
        TextBox.defaultProperties = {
            width: 200,
            height: 25
        };

        TextBox.prototype.type = 'TextBox';

        /**
         * 创建主元素
         *
         * @return {HTMLElement} 主元素
         * @override
         * @protected
         */
        TextBox.prototype.createMain = function () {
            return document.createElement('div');
        };

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @override
         * @protected
         */
        TextBox.prototype.initOptions = function (options) {
            var properties = {
                mode: 'text',
                value: '',
                placeholder: '',
                autoSelect: false
            };
            lib.extend(properties, TextBox.defaultProperties, options);

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

                if (!properties.value) {
                    properties.value = this.main.value;
                }

                if (!properties.maxLength) {
                    properties.maxLength = this.main.maxLength;
                }
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
         * @inner
         */
        function dispatchSpecialKey(e) {
            var keyCode = e.which || e.keyCode;

            if (keyCode === 13) {
                this.fire('enter');
            }

            var isDefaultPrevented = false;
            var event = {
                keyCode: keyCode,
                key: String.fromCharCode(keyCode),
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                preventDefault: function () {
                    isDefaultPrevented = true;
                }
            };
            this.fire('keypress', event);
            if (isDefaultPrevented) {
                e.preventDefault();
            }
        }

        /**
         * 控制placeholder的显示与隐藏
         *
         * @param {TextBox} textbox 控件实例
         * @param {boolean=} focused 额外指定文本框是否聚集
         * @inner
         */
        function togglePlaceholder(textbox, focused) {
            var input = lib.g(textbox.inputId);

            if (!supportPlaceholder) {
                var placeholder = 
                    lib.g(helper.getId(textbox, 'placeholder'));
                if (typeof focused !== 'boolean') {
                    focused = document.activeElement === input;
                }
                // 只有没焦点且没值的时候才显示placeholder
                if (!focused && !textbox.rawValue) {
                    helper.removePartClasses(
                        textbox, 'placeholder-hidden', placeholder);
                }
                else {
                    helper.addPartClasses(
                        textbox, 'placeholder-hidden', placeholder);
                }
            }
        }

        /**
         * 获得焦点的逻辑
         *
         * @param {TextBox} this 控件实例
         * @param {Event} e DOM事件对象
         * @inner
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
         * @param {TextBox} this 控件实例
         * @param {Event} e DOM事件对象
         * @inner
         */
        function blur(e) {
            togglePlaceholder(this, false);

            this.fire('blur');
        }

        /**
         * 同步DOM的值与控件的属性
         *
         * @param {TextBox} this 控件实例
         * @param {Event} e DOM事件对象
         * @inner
         */
        function syncValue(e) {
            var input = lib.g(this.inputId);
            if (e.type === 'input' || e.propertyName === 'value') {
                this.rawValue = input.value;
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
                var main = helper.replaceMain(this);
                
                this.inputId = main.id || helper.getId(this, 'input');

                // TextBox上会有`maxlength`之类的属性，因此不能直接丢掉，
                // 但保留下来就不能加`data-ctrl-id`属性，
                // 不加又会导致`main.init`重复创建控件，
                // 因此这里需要复制一个用，好在`cloneNode(false)`没兼容问题
                var input = main.cloneNode(false);
                // `helper.replaceMain`会给加上`data-ctrl-id`，要重新去掉
                lib.removeAttribute(
                    input, require('./main').getConfig('instanceAttr'));
                input.id = this.inputId;
                // 把原来的`<input>`或`<textarea>`放进去
                this.main.appendChild(input);
            }
            else {
                this.inputId = helper.getId(this, 'input');
                var html = this.mode === 'textarea'
                    ? '<textarea id="' + this.inputId + '"'
                    : '<input type="' + this.mode + '" '
                        + 'id="' + this.inputId + '"';
                if (this.name) {
                    html += ' name="' + lib.encodeHTML(this.name) + '"';
                }
                html += this.mode === 'textarea'
                    ? '></textarea>'
                    : ' />';

                this.main.innerHTML = html;
            }

            var input = lib.g(this.inputId);
            helper.addDOMEvent(this, input, 'keypress', dispatchSpecialKey);
            helper.addDOMEvent(this, input, 'focus', focus);
            helper.addDOMEvent(this, input, 'blur', blur);
            var inputEventName = ('oninput' in input) 
                ? 'input' 
                : 'propertychange';
            helper.addDOMEvent(this, input, inputEventName, syncValue);

            if (!supportPlaceholder) {
                var placeholder = document.createElement('label');
                placeholder.id = helper.getId(this, 'placeholder');
                lib.setAttribute(placeholder, 'for', input.id);
                placeholder.className = 
                    helper.getPartClasses(this, 'placeholder').join(' ');
                lib.insertAfter(placeholder, input);
            }
        };

        /**
         * 重绘
         *
         * @param {Array=} 更新过的属性集合
         * @override
         * @protected
         */
        TextBox.prototype.repaint = helper.createRepaint(
            InputControl.prototype.repaint,
            {
                name: 'title',
                paint: function (textbox, title) {
                    var input = lib.g(textbox.inputId);
                    var placeholder = 
                        lib.g(helper.getId(textbox, 'placeholder'));
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
                    maxlength = parseInt(maxLength, 10);
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
                        input.maxLength = maxLength, 10;
                    }
                }
            },
            {
                name: 'rawValue',
                paint: function (textbox, rawValue) {
                    var input = lib.g(textbox.inputId);
                    var eventName = 
                        ('oninput' in input) ? 'input' : 'propertychange';
                    // 由于`propertychange`事件容易进入死循环，因此先要移掉原来的事件
                    helper.removeDOMEvent(textbox, input, eventName);
                    input.value = textbox.stringifyValue(rawValue);
                    helper.addDOMEvent(textbox, input, eventName, syncValue);

                    togglePlaceholder(textbox);
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
                        var label = 
                            lib.g(helper.getId(textbox, 'placeholder'));
                        label.innerHTML = lib.encodeHTML(placeholder || '');
                    }
                }
            },
            {
                name: ['hint', 'hintType'],
                paint: function (textbox, hint, hintType) {
                    var label = lib.g(helper.getId(textbox, 'hint'));

                    textbox.removeState('hint-prefix');
                    textbox.removeState('hint-suffix');

                    if (!hint && label) {
                        lib.removeNode(label);
                    }

                    if (hint) {
                        if (!label) {
                            label = document.createElement('label');
                            label.id = helper.getId(textbox, 'hint');
                            helper.addPartClasses(textbox, 'hint', label);
                            lib.setAttribute(label, 'for', textbox.inputId);
                        }

                        label.innerHTML = lib.encodeHTML(hint);
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
                    if (hidden) {
                        return;
                    }

                    if (hint) {
                        var hintLabel = lib.g(helper.getId(textbox, 'hint'));
                        if (hintLabel) {
                            width -= hintLabel.offsetWidth;
                        }
                    }

                    var input = lib.g(textbox.inputId);
                    input.style.width = width + 'px';
                    var placeholder = 
                        lib.g(helper.getId(textbox, 'placeholder'));
                    if (placeholder) {
                        placeholder.style.maxWidth = width + 'px';
                    }
                }
            },
            {
                name: 'height',
                paint: function (textbox, height) {
                    var hintLabel = lib.g(helper.getId(textbox, 'hint'));
                    if (hintLabel) {
                        hintLabel.style.height = height + 'px';
                        hintLabel.style.lineHeight = height + 'px';
                    }

                    var input = lib.g(textbox.inputId);
                    input.style.height = height + 'px';
                    var placeholder = 
                        lib.g(helper.getId(textbox, 'placeholder'));
                    if (placeholder) {
                        placeholder.style.height = height + 'px';
                    }
                }
            }
        );

        /**
         * 获取验证信息控件
         *
         * @return {Validity}
         * @override
         * @public
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

        require('./lib').inherits(TextBox, InputControl);
        require('./main').register(TextBox);
        return TextBox;
    }
);
