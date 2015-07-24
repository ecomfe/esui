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
        var eoo = require('eoo');
        var esui = require('./main');
        var u = require('underscore');
        var lib = require('./lib');
        var InputControl = require('./InputControl');
        var $ = require('jquery');
        var painters = require('./painters');

        require('./TextBox');

        /**
         * 带行号的输入框
         *
         * @extends InputControl
         * @requires TextBox
         * @constructor
         */
        var TextLine = eoo.create(
            InputControl,
            {
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
                        height: 200
                    };
                    // 从textarea获取vlaue值
                    if (lib.isInput(this.main)) {
                        this.helper.extractOptionsFromInput(this.main, properties);
                    }

                    // 如果没有获取到，设一个缺省的
                    properties.value = properties.value || '';
                    properties.placeholder = this.main.getAttribute('placeholder') || '';
                    u.extend(properties, TextLine.defaultProperties, options);

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
                    var textbox = this.getTextBox();
                    textbox.on('input', u.bind(onInput, this));

                    var textArea = this.getTextArea();
                    this.helper.addDOMEvent(textArea, 'scroll', this.resetScroll);
                    this.helper.addDOMEvent(textArea, 'focus', inputFocus);
                    var back = this.helper.getPart('search-back');
                    this.helper.addDOMEvent(back, 'click', u.bind(wrapperChange, this, false));
                    var content = this.helper.getPart('search-content');
                    var clearClass = this.helper.getPartClassName('search-content-clear');
                    this.helper.addDOMEvent(content, 'click', '.' + clearClass, u.bind(deleteItemHandler, this));
                },
                /**
                 * 重新渲染
                 *
                 * @method
                 * @protected
                 * @override
                 */
                repaint: painters.createRepaint(
                    InputControl.prototype.repaint,
                    {
                        /**
                         * @property {number} height
                         *
                         * 控件的高度
                         */
                        name: 'height',
                        paint: function (textLine, height) {
                            height = height || textLine.height;
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
                            width = width || textLine.width;
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

                            if (value) {
                                if (u.isArray(value)) {
                                    textLine.value = u.unescape(value.join('\n'));
                                }
                                // 好怕怕有一个人直接设置了字符串
                                else if (typeof value === 'string') {
                                    textLine.value = u.unescape(value);
                                }

                                var textbox = textLine.getTextBox();
                                textbox.setRawValue(textLine.value);
                                refreshLineNum.call(textLine);
                            }
                        }
                    },
                    {
                        name: ['disabled', 'readOnly'],
                        paint: function (textLine, disabled, readOnly) {
                            var textbox = textLine.getTextBox();
                            textbox.setProperties(
                                {
                                    disabled: !!disabled,
                                    readOnly: !!readOnly
                                }
                            );
                        }
                    },
                    {
                        name: 'query',
                        paint: function (textLine, query) {
                            if (!query) {
                                wrapperChange.call(textLine, false);
                                return;
                            }
                            wrapperChange.call(textLine, true);
                            var allList = textLine.getValueRepeatableItems();
                            var re = u.isString(query) ? new RegExp(query) : query;
                            var searchList = [];
                            u.each(allList, function (text, index) {
                                if (re.test(text)) {
                                    searchList.push(text);
                                }
                            });
                            var numCtr = textLine.helper.getPart('search-hint-text');
                            numCtr.innerHTML = searchList.length;
                            renderSearchList.call(textLine, searchList);
                        }
                    }
                ),

                /**
                 * 滚动文本输入框
                 */
                resetScroll: function () {
                    var textArea = this.getTextArea();
                    var lineNumber = this.helper.getPart('num-line');
                    // 因为可能产生滚动条，所以要同步一下行码区和文字区的高度
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
                getRawValue: function () {
                    return u.unique(this.getValueRepeatableItems());
                },

                /**
                 * 获取内容数组形式,并去除空串内容（不去重）
                 *
                 * @return {string[]}
                 */
                getValueRepeatableItems: function () {
                    var textbox = this.getTextBox();
                    var text = textbox.getValue();
                    var items = text.split('\n');

                    return u.chain(items).map(lib.trim).compact().value();
                },

                /**
                 * 获取内容行数
                 *
                 * @return {number}
                 */
                getRowsNumber: function () {
                    var items = this.getValue().split('\n');
                    return items.length;
                },

                /**
                 * 增加内容
                 *
                 * @param {string[]} lines 需添加的行
                 */
                addLines: function (lines) {
                    var content = lines.join('\n');
                    var value = this.getValue();

                    if (value.length > 0) {
                        content = value + '\n' + content;
                    }

                    this.setRawValue(content);
                },

                /**
                 * 获取TextBox子控件
                 *
                 * @return {ui.TextBox}
                 */
                getTextBox: function () {
                    return this.getChild('input');
                },

                /**
                 * 获取TextBox子控件中的textarea元素
                 *
                 * @return {Element}
                 */
                getTextArea: function () {
                    var textbox = this.getTextBox();
                    return lib.g(textbox.inputId);
                }
            }
        );

        TextLine.defaultProperties = {
            beforeNumberText: '共找到',
            afterNumberText: '个',
            backLinkText: '返回',
            emptyResultText: '搜索结果为空'
        };

        var SEARCH_ITEM_TPL = [
            '<div class="${lineClass}">',
                '<span class="${numClass}">${num}</span>',
                '<span class="${textClass}">${text}</span>',
                '<span class="${clearClass}" data-value="${text}"></span>',
            '</div>'
        ].join('');

        /**
         * 渲染searchList
         *
         * @param {Array} searchList 搜索后的列表
         * @inner
         */
        function renderSearchList(searchList) {
            var html = [];
            var controlHelper = this.helper;
            u.each(searchList, function (val, index) {
                var data = {
                    num: index + 1,
                    text: val,
                    lineClass: controlHelper.getPartClassName('search-content-line'),
                    textClass: controlHelper.getPartClassName('search-content-text'),
                    clearClass: controlHelper.getPartClassName('search-content-clear')
                        + ' '
                        + controlHelper.getIconClass(),
                    numClass: controlHelper.getPartClassName('search-content-num')
                };
                html.push(lib.format(SEARCH_ITEM_TPL, data));
            }, this);
            html = html.join('')
                || '<div class="' + controlHelper.getPartClassName('empty-text')
                + '">' + this.emptyResultText + '</div>';
            this.helper.getPart('search-content').innerHTML = html;
            var infoHeight = $(this.helper.getPart('search-info')).height();
            var searchWrapper = $(this.helper.getPart('search-wrapper'));
            searchWrapper.height(this.height - infoHeight);
        }

        /**
         * 删除搜索后的每一行处理函数
         *
         * @param {Event} e 事件对象
         * @inner
         */
        function deleteItemHandler(e) {
            var val = $(e.target).attr('data-value');
            var query = this.query;
            this.query = '';
            this.setProperties({
                rawValue: u.without(this.getValueRepeatableItems(), val),
                query: query
            });
            /**
             * 触发删除事件
             * @Event
             */
            this.fire('deleteItem', {
                item: val
            });
        }

        /**
         * 获取主体的HTML
         *
         * @param {TextLine} textLine 控件实例
         * @ignore
         * @return {string}
         */
        function getMainHTML(textLine) {
            var textareaHTML = [
                '<div style="width:100%;height:100%;" data-ui-child-name="input"',
                    ' data-ui-type="TextBox" data-ui-mode="textarea"',
                    ' data-ui-width="100%"',
                    ' data-ui-placeholder="${placeholder}">',
                '</div>'
            ].join('');

            textareaHTML = lib.format(
                textareaHTML,
                {
                    placeholder: textLine.placeholder
                }
            );

            var html = [
                // 控件主体
                textLine.helper.getPartBeginTag('wrapper', 'div'),
                textLine.helper.getPartBeginTag('num-line', 'div'),
                '1', // 默认至少有一行
                textLine.helper.getPartEndTag('num-line', 'div'),
                textLine.helper.getPartBeginTag('text-container', 'div'),
                textareaHTML,
                textLine.helper.getPartEndTag('text-container', 'div'),
                textLine.helper.getPartEndTag('wrapper', 'div'),
                // search提示
                textLine.helper.getPartBeginTag('search-info', 'div'),
                textLine.helper.getPartBeginTag('search-hint', 'div'),
                textLine.beforeNumberText,
                textLine.helper.getPartBeginTag('search-hint-text', 'span'),
                '0',
                textLine.helper.getPartEndTag('search-hint-text', 'span'),
                textLine.afterNumberText,
                textLine.helper.getPartEndTag('search-hint', 'div'),
                textLine.helper.getPartBeginTag('search-back', 'div'),
                textLine.backLinkText,
                textLine.helper.getPartEndTag('search-back', 'div'),
                textLine.helper.getPartEndTag('search-info', 'div'),
                // search后结果面板
                textLine.helper.getPartBeginTag('search-wrapper', 'div'),
                textLine.helper.getPartBeginTag('search-num-line', 'div'),
                textLine.helper.getPartEndTag('search-num-line', 'div'),
                textLine.helper.getPartBeginTag('search-content', 'div'),
                textLine.helper.getPartEndTag('search-content', 'div'),
                textLine.helper.getPartEndTag('search-wrapper', 'div')
            ];
            return html.join('');
        }

        /**
         * 输入时刷新其它部件
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function onInput(e) {
            refreshLineNum.call(this);
            this.fire('input');
        }

        /**
         * 重置行号，增加内容和`keyup`时可调用
         *
         * @ignore
         */
        function refreshLineNum() {
            var textbox = this.getTextBox();
            var num = textbox.getValue().split('\n').length;
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

        function inputFocus() {
            var me = this;
            var $mainElement = $(me.main);
            var helper = me.helper;
            var focusClass = helper.getPrimaryClassName('focus');
            var textArea = this.getTextArea();
            var blurEvent = function () {
                $mainElement.removeClass(focusClass);
                me.removeState('focus');
                helper.removeDOMEvent(textArea, 'blur', blurEvent);
            };

            $mainElement.addClass(focusClass);
            me.addState('focus');
            helper.addDOMEvent(textArea, 'blur', blurEvent);
        }

        /**
         * 切换search 和 list
         *
         * @param {boolean} isSearch 是否是搜索状态
         * @inner
         */
        function wrapperChange(isSearch) {
            var listWrapper = this.helper.getPart('wrapper');
            var searchInfo = this.helper.getPart('search-info');
            var searchWrapper = this.helper.getPart('search-wrapper');
            if (isSearch) {
                listWrapper.style.display = 'none';
                searchInfo.style.display = 'block';
                searchWrapper.style.display = 'block';
            }
            else {
                this.query = '';
                listWrapper.style.display = 'block';
                searchInfo.style.display = 'none';
                searchWrapper.style.display = 'none';
            }
        }
        esui.register(TextLine);

        return TextLine;
    }
);
