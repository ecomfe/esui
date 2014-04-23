/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
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
         * 文本框输入控件
         *
         * 负责单行、密码或多行文本的输入，由{@link TextBox#mode}决定
         *
         * @extends {InputControl}
         * @param {Object} options 初始化参数
         * @constructor
         */
        function TextBox(options) {
            InputControl.apply(this, arguments);
        }

        /**
         * @cfg defaultProperties
         *
         * 默认属性值
         *
         * @cfg {boolean} [defaultProperties.width=200] 默认宽度
         * @static
         */
        TextBox.defaultProperties = {
            width: 200
        };

        /**
         * 控件类型，始终为`"TextBox"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        TextBox.prototype.type = 'TextBox';

        /**
         * 初始化参数
         *
         * 如果主元素是`<input>`或`<textarea>`元素，
         * 控件会从主元素上抽取相关DOM属性作为控件自身的值，
         * 详细参考{@link Helper#extractOptionsFromInput}方法
         *
         * 此外还会按以下逻辑抽取一些属性：
         *
         * - 将主元素的`placeholder`作为控件的`placeholder`属性
         * - 根据主元素的标签类型和`type`属性来确定`mode`属性：
         *     - 如果主元素是`<input type="password">`，则`mode`值为`"password"`
         *     - 如果主元素是`<textarea>`，则`mode`值为`textarea`
         *     - 其它情况下，`mode`值为`text`
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        TextBox.prototype.initOptions = function (options) {
            var properties = {
                /**
                 * @property {string} [mode="text"]
                 *
                 * 指定文本框模式，可以有以下值：
                 *
                 * - `text`：表示普通单行文本框
                 * - `textarea`：表示多行文本框
                 * - `password`：表示密码框
                 *
                 * 此属性仅能在初始化时设置，运行期不能修改
                 *
                 * 具体从DOM中获取此属性的逻辑参考{@link TextBox#initOptions}方法说明
                 *
                 * @readonly
                 */
                mode: 'text',
                placeholder: '',
                /**
                 * @property {boolean} [autoSelect=false]
                 *
                 * 指定文本框获得焦点时是否自动全选
                 */
                autoSelect: false
            };
            u.extend(properties, TextBox.defaultProperties);

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

            u.extend(properties, options);

            if (!properties.hasOwnProperty('title') && this.main.title) {
                properties.title = this.main.title;
            }

            this.setProperties(properties);
        };

        /**
         * 获得应当获取焦点的元素，主要用于验证信息的`<label>`元素的`for`属性设置
         *
         * @return {HTMLElement}
         * @protected
         * @override
         */
        TextBox.prototype.getFocusTarget = function () {
            return lib.g(this.inputId);
        };

        /**
         * 将特殊的按键分发为事件
         *
         * @param {TextBox} this 控件实例
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function dispatchSpecialKey(e) {
            var keyCode = e.which || e.keyCode;

            if (keyCode === 13) {
                /**
                 * @event enter
                 *
                 * 在控件上按回车时触发
                 *
                 * @member TextBox
                 */
                this.fire('enter');
            }

            var args = {
                keyCode: keyCode,
                key: String.fromCharCode(keyCode),
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            };

            var event = require('mini-event').fromDOMEvent(e, 'keypress', args);
            /**
             * @event keypress
             *
             * 在控件上按键时触发
             *
             * @param {number} keyCode 按键的编码
             * @param {string} key 按键对应的单字
             * @param {boolean} ctrlKey CTRL键是否按下
             * @param {boolean} altKey ALT键是否按下
             * @member TextBox
             */
            this.fire('keypress', event);
        }

        /**
         * 控制placeholder的显示与隐藏
         *
         * @param {TextBox} textbox 控件实例
         * @param {boolean} [focused] 额外指定文本框是否聚集
         * @ignore
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
         * @ignore
         */
        function focus(e) {
            togglePlaceholder(this, true);
            if (this.autoSelect) {
                var input = lib.g(this.inputId);
                input.select();
            }

            /**
             * @event focus
             *
             * 文本框获得焦点时触发
             *
             * @member TextBox
             */
            this.fire('focus');
        }

        /**
         * 失去焦点的逻辑
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function blur(e) {
            togglePlaceholder(this, false);

            /**
             * @event blur
             *
             * 文本框失去焦点时触发
             *
             * @member TextBox
             */
            this.fire('blur');
        }

        /**
         * 同步DOM的值与控件的属性
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function dispatchInputEvent(e) {
            if (e.type === 'input' || e.propertyName === 'value') {
                /**
                 * @event input
                 *
                 * 输入内容变化时触发
                 *
                 * 在IE下，使用退格（Backspace或Delete）键时可能不触发此事件
                 *
                 * @member TextBox
                 */
                this.fire('input');
            }
        }

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        TextBox.prototype.initStructure = function () {
            if (lib.isInput(this.main)) {
                var main = this.helper.replaceMain();

                // 如果原来有`tabindex`属性会放到`main`上来，要去掉，
                // 不然会出现TAB导航的问题，需要2次TAB才能正确到文本框
                lib.removeAttribute(this.main, 'tabindex');

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
                    : '<input type="' + this.mode + '" placeholder="'
                        + this.placeholder + '" id="' + this.inputId + '"';
                if (this.name) {
                    html += ' name="' + u.escape(this.name) + '"';
                }
                html += this.mode === 'textarea'
                    ? '></textarea>'
                    : ' />';

                this.main.innerHTML = html;
            }

            if (!supportPlaceholder) {
                var input = lib.g(this.inputId);
                var placeholder = document.createElement('label');
                placeholder.id = this.helper.getId('placeholder');
                lib.setAttribute(placeholder, 'for', input.id);
                this.helper.addPartClasses('placeholder', placeholder);
                lib.insertAfter(placeholder, input);
            }
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        TextBox.prototype.initEvents = function () {
            var input = lib.g(this.inputId);
            this.helper.addDOMEvent(input, 'keypress', dispatchSpecialKey);
            this.helper.addDOMEvent(input, 'focus', focus);
            this.helper.addDOMEvent(input, 'blur', blur);
            var inputEventName = ('oninput' in input)
                ? 'input'
                : 'propertychange';
            this.helper.addDOMEvent(input, inputEventName, dispatchInputEvent);
            this.helper.delegateDOMEvent(input, 'change');
        };

        /**
         * 重渲染
         *
         * @method
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
                /**
                 * @property {string} title
                 *
                 * 鼠标悬停后的提示内容
                 */
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
                /**
                 * @property {number} maxLength
                 *
                 * 最大可输入长度
                 *
                 * 在IE低版本中，当{@link TextBox#mode}值为`"textarea"`时，
                 * 当前属性仅影响验证，不会导致文本框达到最大长度后无法输入
                 */
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
                        lib.removeAttribute(input, 'maxLength'); // 兼容IE7
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
                /**
                 * @property {string} placeholder
                 *
                 * 无内容时的提示信息
                 *
                 * 在IE9下，该提示信息的颜色始终与文本框文字颜色相同且无法通过CSS修改
                 */
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
                /**
                 * @property {string} hint
                 *
                 * 放置在文本框前面或后面的提示内容，
                 * 根据{@link TextBox#hintType}决定放置的位置，
                 * 该属性会影响到文本框可输入内容区域的宽度，
                 * 具体参考{@link TextBox#width}属性的说明
                 */

                /**
                 * @property {string} hintType
                 *
                 * 指定{@link TextBox#hint}放置的位置，
                 * 可以为`"prefix"`指定放在前面，或`"suffix"`指定放在后面，如：
                 *
                 *     <div data-ui-type="TextBox"
                 *         data-ui-hint="http://"
                 *         data-ui-hint-type="prefix">
                 *     </div>
                 *
                 * 则在文本框前面显示`"http://"`字样
                 *
                 *     <div data-ui-type="TextBox"
                 *         data-ui-hint="RMB"
                 *         data-ui-hint-type="suffix">
                 *     </div>
                 *
                 * 则在文本框后面显示`"RMB"`字样
                 */
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
                /**
                 * @property {number} width
                 *
                 * 设定文本框宽度
                 *
                 * 文本框的宽度包含以下内容：
                 *
                 * - 可输入区域的宽
                 * - 由{@link TextBox#hint}产生的提示信息区域的宽
                 * - 边框宽度
                 *
                 * 因此可以认为文本框的宽度是一个`<div>`元素在`border-box`状态下计算的
                 */
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
                /**
                 * @property {number} height
                 *
                 * 文本框的高度
                 */
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
         * @override
         */
        TextBox.prototype.getRawValue = function () {
            var input = lib.g(this.inputId);
            return input ? input.value : (this.rawValue || this.value || '');
        };

        /**
         * 获取`rawValue`的比对值，用于`setProperties`比对
         *
         * @protected
         */
        TextBox.prototype.getRawValueProperty = TextBox.prototype.getRawValue;

        lib.inherits(TextBox, InputControl);
        ui.register(TextBox);
        return TextBox;
    }
);
