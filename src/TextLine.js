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

        require('./TextBox');

        /**
         * 带行号的输入框
         *
         * @extends InputControl
         * @requires TextBox
         * @constructor
         */
        function TextLine(options) {
            InputControl.apply(this, arguments);
        }

        /**
         * 获取主体的HTML
         *
         * @param {TextLine} textLine 控件实例
         * @ignore
         */
        function getMainHTML(textLine) {
            var textareaHTML = ''
                + '<textarea wrap="off" '
                + 'id="'+ textLine.helper.getId('text') + '"'
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
         * 输入时刷新其它部件
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function refreshOnInput(e) {
            if (e.type === 'input' || e.propertyName === 'value') {
                refreshLineNum.call(this);
            }
        }


        /**
         * 重置行号，增加内容和`keyup`时可调用
         *
         * @ignore
         */
        function refreshLineNum() {
            var num = this.helper.getPart('text').value.split('\n').length;
            if (num !== this.number) {
                this.number = num;
                var numLine = this.helper.getPart('num-line');
                numLine.innerHTML = u.range(1, num + 1).join('<br />');
            }
            this.resetScroll();
            /**
             * @event change
             *
             * 当值变化时触发
             *
             * @member TextLine
             */
            this.fire('change');
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
                    paint: function (textLine, value) {
                        // 输入区
                        var textArea = textLine.helper.getPart('text');

                        if (value) {
                            if (u.isArray(value)) {
                                textLine.value = u.unescape(value.join('\n'));
                            }
                            // 好怕怕有一个人直接设置了字符串
                            else if (typeof value === 'string') {
                                textLine.value = u.unescape(value);
                            }

                            var inputEvent = 'oninput' in textArea
                                ? 'input'
                                : 'propertychange';
                            textLine.helper.removeDOMEvent(
                                textArea, inputEvent, refreshOnInput);
                            textArea.value = textLine.value;
                            textLine.helper.addDOMEvent(
                                textArea, inputEvent, refreshOnInput);

                            refreshLineNum.call(textLine);
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
                }
            ),

            /**
             * 滚动文本输入框
             */
            resetScroll: function () {
                var textArea = this.helper.getPart('text');
                var lineNumber = this.helper.getPart('num-line');
                // 因为可能产生滚动条，所以要同步一下行码区和文字区的高度
                lineNumber.style.height = textArea.clientHeight + 'px';
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
                return lib.trim(value.replace(/\n{2,}/g, '\n')).split('\n');
            },

            /**
             * 获取内容数组形式（去重，去空行）
             *
             * @return {string[]}
             * @override
             */
            getRawValue: function() {
                return u.unique(this.getValueRepeatableItems());
            },

            /**
             * 获取内容数组形式,并去除空串内容（不去重）
             *
             * @return {string[]}
             */
            getValueRepeatableItems: function() {
                var text = this.helper.getPart('text').value;
                var items = text.split('\n');

                return u.chain(items).map(lib.trim).compact().value();
            },

            /**
             * 获取内容行数
             *
             * @return {number}
             */
            getRowsNumber: function() {
               var items = this.getValue().split('\n');
               return items.length;
            },

            /**
             * 增加内容
             *
             * @param {string[]} lines 需添加的行
             */
            addLines: function(lines) {
                var content = lines.join('\n');
                var value = this.getValue();

                if (value.length > 0) {
                    content = value + '\n' + content;
                }

                this.setRawValue(content);
            }

        };

        lib.inherits(TextLine, InputControl);
        ui.register(TextLine);

        return TextLine;
    }
);
