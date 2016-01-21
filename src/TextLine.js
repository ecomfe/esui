/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 多行带行码输入框
 * @author dbear, otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var InputControl = require('./InputControl');
        var ui = require('./main');
        var supportPlaceholder = ('placeholder' in document.createElement('input'));

        require('./TextBox');

        /**
         * 带行号的输入框
         *
         * 输入：数组（rawValue) or 字符串(value)
         * 中间处理：会根据用户配置，做去重、去前后空格、去空行处理
         * 输出：处理后的数组（rawValue）or 字符串（value）
         *
         * @extends InputControl
         * @requires TextBox
         * @constructor
         */
        function TextLine() {
            InputControl.apply(this, arguments);
        }

        /**
         * 获取主体的HTML
         *
         * @ignore
         * @param {TextLine} textLine 控件实例
         * @return {string} 主体的HTML
         */
        function getMainHTML(textLine) {
            var textareaHTML = ''
                + '<textarea wrap="off" '
                + 'placeholder="' + (textLine.placeholder || '') + '" '
                + 'id="' + textLine.helper.getId('text') + '">'
                + '</textarea>';
            var html = [
                textLine.helper.getPartBeginTag('num-line', 'div'),
                    '1', // 默认至少有一行
                textLine.helper.getPartEndTag('num-line', 'div'),
                textLine.helper.getPartBeginTag('text-container', 'div'),
                    textareaHTML,
                textLine.helper.getPartEndTag('text-container', 'div')
            ];
            return html.join('');
        }

        /**
         * 获得焦点的逻辑
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function focus(e) {
            togglePlaceholder(this, true);

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
         * 输入时刷新其它部件
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function refreshOnInput(e) {
            if (e.type === 'input' || e.propertyName === 'value') {
                togglePlaceholder(this);
                this.rawValue = this.getRawValue();
                refreshLineNum.call(this);
                /**
                 * @event change
                 *
                 * 当值变化时触发
                 *
                 * @member TextLine
                 */
                this.fire('change');
            }
        }

        /**
         * 重置行号，增加内容和`keyup`时可调用
         *
         * @ignore
         */
        function refreshLineNum() {
            var num = this.getRawValueOfTextarea().split('\n').length;
            if (num !== this.number) {
                this.number = num;
                var numLine = this.helper.getPart('num-line');
                numLine.innerHTML = u.range(1, num + 1).join('<br />');
            }
            this.resetScroll();
        }

        /**
         * 控制placeholder的显示与隐藏
         *
         * @param {TextLine} textLine 控件实例
         * @param {boolean} [focused] 额外指定文本框是否聚集
         * @ignore
         */
        function togglePlaceholder(textLine, focused) {
            var input = lib.g(textLine.helper.getId('text'));

            if (!supportPlaceholder) {
                var placeholder = textLine.helper.getPart('placeholder');
                if (typeof focused !== 'boolean') {
                    focused = document.activeElement === input;
                }
                // 只有没焦点且没值的时候才显示placeholder
                if (!focused && !textLine.getRawValue().length) {
                    textLine.helper.removePartClasses('placeholder-hidden', placeholder);
                }
                else {
                    textLine.helper.addPartClasses('placeholder-hidden', placeholder);
                }
            }
        }

        TextLine.prototype = {
            /**
             * 控件类型，始终为`"TextLine"`
             *
             * @type {string}
             * @readonly
             * @override
             */
            type: 'TextLine',

            /**
             * 初始化参数
             *
             * @param {Object} [options] 构造函数传入的参数
             * @protected
             * @override
             */
            initOptions: function (options) {
                // 默认选项配置
                var properties = {
                    // 是否要去重，true去重，false不去重
                    unique: true,
                    // 是否去前后空格
                    trim: true,
                    // 是否包含空行，true不包含空行，false包含空行
                    withoutBlankLine: true,
                    width: 300,
                    height: 200,
                    value: ''
                };
                if (lib.isInput(this.main)) {
                    this.helper.extractOptionsFromInput(this.main, properties);
                }
                u.extend(properties, options);

                if (!properties.hasOwnProperty('title') && this.main.title) {
                    properties.title = this.main.title;
                }

                if (properties.unique === 'false') {
                    properties.unique = false;
                }

                if (properties.trim === 'false') {
                    properties.trim = false;
                }

                if (properties.withoutBlankLine === 'false') {
                    properties.withoutBlankLine = false;
                }

                this.setProperties(properties);
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             * @override
             */
            initStructure: function () {
                // 如果主元素是输入元素，替换成`<div>`
                // 如果输入了非块级元素，则不负责
                if (lib.isInput(this.main)) {
                    this.helper.replaceMain();
                }

                this.main.innerHTML = getMainHTML(this);

                if (!supportPlaceholder) {
                    var inputId = this.helper.getId('text');
                    var input = lib.g(inputId);
                    var placeholder = document.createElement('label');
                    placeholder.id = this.helper.getId('placeholder');
                    lib.setAttribute(placeholder, 'for', inputId);
                    this.helper.addPartClasses('placeholder', placeholder);
                    lib.insertAfter(placeholder, input);
                }

                // 创建控件树
                this.helper.initChildren();
            },

            /**
             * 初始化事件交互
             *
             * @protected
             * @override
             */
            initEvents: function () {
                // 输入区变化监听
                var textArea = this.helper.getPart('text');
                var inputEvent = ('oninput' in textArea)
                    ? 'input'
                    : 'propertychange';
                this.helper.addDOMEvent(textArea, inputEvent, refreshOnInput);
                this.helper.addDOMEvent(textArea, 'scroll', this.resetScroll);
                this.helper.addDOMEvent(textArea, 'focus', focus);
                this.helper.addDOMEvent(textArea, 'blur', blur);
            },

            /**
             * 批量设置控件的属性值
             *
             * @param {Object} properties 属性值集合
             * @override
             */
            setProperties: function (properties) {
                if (properties.hasOwnProperty('rawValue')) {
                    var rawValue = properties.rawValue;
                    // 好怕怕有一个人直接设置了字符串
                    if (typeof rawValue === 'string') {
                        properties.rawValue = [rawValue];
                    }
                    // 如果不是字符串也不是数组，那你想干啥？不理了！
                    if (!u.isArray(rawValue)) {
                        delete properties.rawValue;
                    }
                    else {
                        // 根据属性修正一下
                        var copyRawValue = lib.deepClone(properties.rawValue);
                        properties.rawValue = this.reviseRawValue(copyRawValue);
                    }
                }
                return InputControl.prototype.setProperties.call(this, properties);
            },

            /**
             * 重新渲染
             *
             * @method
             * @protected
             * @override
             */
            repaint: require('./painters').createRepaint(
                InputControl.prototype.repaint,
                {
                    /**
                     * @property {number} height
                     *
                     * 控件的高度
                     */
                    name: 'height',
                    paint: function (textLine, height) {
                        height = height || 300;

                        // 渲染行号区高度
                        var lineNumDiv = textLine.helper.getPart('num-line');
                        lineNumDiv.style.height = height + 'px';

                        // 主体高度
                        textLine.main.style.height = height + 'px';
                    }
                },
                {
                    /**
                     * @property {number} width
                     *
                     * 控件的宽度
                     */
                    name: 'width',
                    paint: function (textLine, width) {
                        width = width || 300;

                        // 主体高度
                        textLine.main.style.width = width + 'px';
                    }
                },
                {
                    /**
                     * @property {string[]} rawValue
                     *
                     * 控件的原始值，为字符串数组，每行表示一个字符串
                     *
                     * @override
                     */
                    name: 'rawValue',
                    paint: function (textLine, rawValue) {
                        // 输入区
                        var textArea = textLine.helper.getPart('text');

                        if (rawValue) {
                            textArea.value = textLine.stringifyValue(rawValue);
                            refreshLineNum.call(textLine);

                            /**
                             * @event change
                             *
                             * 当值变化时触发
                             *
                             * @member TextLine
                             */
                            textLine.fire('change');
                        }
                    }
                },
                {
                    name: ['disabled', 'readOnly'],
                    paint: function (textLine, disabled, readOnly) {
                        var textArea = textLine.helper.getPart('text');
                        textArea.disabled = !!disabled;
                        textArea.readOnly = !!readOnly;
                    }
                },
                {
                    name: 'placeholder',
                    paint: function (textLine, placeholder) {
                        var textArea = textLine.helper.getPart('text');
                        if (supportPlaceholder) {
                            if (placeholder) {
                                lib.setAttribute(textArea, 'placeholder', placeholder);
                            }
                            else {
                                lib.removeAttribute(textArea, 'placeholder');
                            }
                        }
                        else {
                            var label = textLine.helper.getPart('placeholder');
                            label.innerHTML = u.escape(placeholder || '');
                        }
                        togglePlaceholder(textLine);
                    }
                }
            ),

            /**
             * 滚动文本输入框
             */
            resetScroll: function () {
                var textArea = this.helper.getPart('text');
                var lineNumber = this.helper.getPart('num-line');
                // 因为可能产生滚动条，所以要同步一下行码区和文字区的高度
                lineNumber.style.height = Math.max(textArea.clientHeight, this.height) + 'px';
                lineNumber.scrollTop = textArea.scrollTop;
            },

            /**
             * 将值从原始格式转换成字符串
             *
             * @param {string[]} rawValue 原始值
             * @return {string}
             * @protected
             * @override
             */
            stringifyValue: function (rawValue) {
                return rawValue.join('\n');
            },

            /**
             * 将字符串类型的值转换成原始格式
             *
             * @param {string} value 字符串值
             * @return {string[]}
             * @protected
             * @override
             */
            parseValue: function (value) {
                // 要区分开一开始的空白状态和已经输入一个空行的状态
                var rawValue = value === '' ? [] : value.split('\n');
                return this.reviseRawValue(rawValue);
            },

            /**
             * 根据配置修正rawValue
             *
             * @param {Array} value 数组值
             * @return {string[]}
             */
            reviseRawValue: function (value) {
                // 如果要去空行
                if (this.withoutBlankLine) {
                    // 去掉数组中空值
                    value = u.compact(value);
                }

                // 如果要去前后空格
                if (this.trim) {
                    value = u.map(value, lib.trim);
                }

                // 如果要去重
                if (this.unique) {
                    value = u.unique(value);
                }
                return value;
            },

            /**
             * 获取内容数组形式（根据配置选择去重，去空行以及去单行前后空格）
             *
             * @return {string[]}
             * @override
             */
            getRawValue: function () {
                return this.parseValue(this.getRawValueOfTextarea());
            },


            /**
             * 从textarea中获取原始值
             *
             * @public
             * @return {string}
             */
            getRawValueOfTextarea: function () {
                return this.helper.getPart('text').value;
            },

            /**
             * 获取内容数组形式,并去除空串内容（不去重）
             * 理论上有了配置，这个接口没用了，但为了保证向前兼容，暂时放在这里
             *
             * @deprecated
             * @return {string[]}
             */
            getValueRepeatableItems: function () {
                var value = this.getRawValueOfTextarea().split('\n');
                return u.chain(value).map(lib.trim).compact().value();
            },

            /**
             * 获取内容行数
             *
             * @return {number}
             */
            getRowsNumber: function () {
                return this.getRawValue().length;
            },

            /**
             * 增加内容
             *
             * @param {string[]} lines 需添加的行
             */
            addLines: function (lines) {
                var value = this.getRawValue();
                var content = this.unique ? u.union(value, lines) : value.concat(lines);
                this.setRawValue(content);
            }

        };

        lib.inherits(TextLine, InputControl);
        ui.register(TextLine);

        return TextLine;
    }
);
