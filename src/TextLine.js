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
                        unique: true,
                        width: 300,
                        height: 200,
                        itemErrorMessage: '格式错误'
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
                    this.helper.addDOMEvent(back, 'click', u.bind(toggleOverlay, this, false));

                    // 单项删除
                    var content = this.helper.getPart('search-content');
                    var removeClass = this.helper.getPartClassName('search-content-remove');
                    this.helper.addDOMEvent(
                        content,
                        'click',
                        '.' + removeClass,
                        u.bind(deleteItemHandler, this)
                    );

                    // 全部删除
                    var searchInfoWrapper = this.helper.getPart('search-info');
                    var clearAllClass = this.helper.getPartClassName('search-clear-link');
                    this.helper.addDOMEvent(
                        searchInfoWrapper,
                        'click',
                        '.' + clearAllClass,
                        u.bind(clearHandler, this)
                    );
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
                            $(textLine.main).css('width', width || textLine.width);
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
                            if (query) {
                                // 搜索和错误列表是互斥的
                                textLine.setProperties({errors: []});

                                var allList = textLine.getValueRepeatableItems();
                                var re = u.isString(query) ? new RegExp(query) : query;
                                var searchList = [];
                                u.each(allList, function (text, index) {
                                    if (re.test(text)) {
                                        searchList.push(text);
                                    }
                                });
                                renderOverlay.call(textLine, searchList, true);
                            }
                            toggleOverlay.call(textLine);
                        }
                    },
                    {
                        name: 'errors',
                        paint: function (textLine, errors) {
                            var allList = textLine.getRawValue();
                            errors = u.intersection(allList, errors);
                            if (!u.isEmpty(errors)) {
                                // 搜索和错误列表是互斥的
                                textLine.setProperties({query: ''});
                                textLine.errors = errors;
                                renderOverlay.call(textLine, errors);
                            }
                            toggleOverlay.call(textLine);
                        }
                    }
                ),

                /**
                 * @override
                 * 显示错误时，针对多行错误，给出特殊的错误样式
                 */
                showValidity: function (validity) {
                    // 先找出需要逐行显示的错误信息
                    u.find(
                        validity.getStates(),
                        function (state) {
                            var message = this.parseErrorMessage(state.getMessage());
                            message = u.intersection(this.getRawValue(), message);
                            if (u.isArray(message) && !u.isEmpty(message)) {
                                this.showErrors(message);
                                state.setMessage(this.itemErrorMessage);
                            }
                        },
                        this
                    );
                    this.$super([validity]);
                },

                /**
                 * 解析逐行错误信息
                 *
                 * @param {string} errorMessage 错误信息
                 * @return {Array}
                 */
                parseErrorMessage: function (errorMessage) {
                    return errorMessage.split(',');
                },

                /**
                 * 在textline z轴上方逐行显示错误项，和搜索格式相似
                 *
                 * @param {Array} errors 错误信息，数组格式
                 */
                showErrors: function (errors) {
                    this.setProperties({errors: errors});
                },

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
                    var value = this.getValueRepeatableItems();
                    if (this.unique) {
                        return u.unique(value);
                    }
                    return value;
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
                    return this.getRawValue().length;
                },

                /**
                 * 增加内容
                 *
                 * @param {string[]} lines 需添加的行
                 */
                addLines: function (lines) {
                    var content;
                    var value = this.getRawValue();
                    if (this.unique) {
                        content = u.union(value, lines);
                    }
                    else {
                        content = value.contact(lines);
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
            numberSearchText: '共找到{count}个',
            numberErrorText: '共找到错误项{count}个',
            clearLinkText: '全部删除',
            backLinkText: '返回',
            emptyResultText: '搜索结果为空'
        };

        var NUMBER_TPL = [
            '<span class="${textClass}">${num}</span>'
        ].join('');

        var SEARCH_ITEM_TPL = [
            '<div class="${lineClass}">',
                '<span class="${numClass}">${num}</span>',
                '<span class="${textClass}">${text}</span>',
                '<span class="${removeClass}" data-value="${text}"></span>',
            '</div>'
        ].join('');

        /**
         * 渲染searchList
         *
         * @param {Array} searchList 搜索后的列表
         * @param {boolean=} isSearch 是否显示搜索结果
         * @inner
         */
        function renderOverlay(searchList, isSearch) {
            var html = [];
            var controlHelper = this.helper;
            u.each(
                searchList,
                function (val, index) {
                    var data = {
                        num: index + 1,
                        text: val,
                        lineClass: controlHelper.getPartClassName('search-content-line')
                            + ' '
                            + controlHelper.getPartClassName(
                                this.isSearch ? 'search-content-search' : 'search-content-error'
                            ),
                        textClass: controlHelper.getPartClassName('search-content-text'),
                        removeClass: controlHelper.getPartClassName('search-content-remove')
                            + ' '
                            + controlHelper.getIconClass(),
                        numClass: controlHelper.getPartClassName('search-content-num')
                    };
                    html.push(lib.format(SEARCH_ITEM_TPL, data));
                },
                this
            );
            html = html.join('')
                || '<div class="' + controlHelper.getPartClassName('empty-text')
                + '">' + this.emptyResultText + '</div>';
            this.helper.getPart('search-content').innerHTML = html;

            var hintWrapper = this.helper.getPart('search-hint');
            // 左侧提示内容
            var numberHtml = lib.format(
                NUMBER_TPL,
                {
                    textClass: this.helper.getPartClasses('search-hint-text'),
                    num: searchList.length
                }
            );
            hintWrapper.innerHTML = lib.langFormat(
                isSearch ? this.numberSearchText : this.numberErrorText,
                {count: numberHtml}
            );

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
            var rawValue = u.without(this.getValueRepeatableItems(), val);
            // 搜索模式
            if (this.query) {
                // query置空强制触发repaint
                var query = this.query;
                this.query = '';
                this.setProperties(
                    {
                        rawValue: rawValue,
                        query: query
                    }
                );
            }
            // 错误列表模式
            else if (!u.isEmpty(this.errors)) {
                this.setProperties(
                    {
                        rawValue: rawValue,
                        errors: u.without(this.errors, val)
                    }
                );
            }

            /**
             * 触发删除事件
             * @Event
             */
            this.fire('deleteItem', {item: val});
        }

        /**
         * 删除浮层中所有项
         *
         * @param {Event} e 事件对象
         * @inner
         */
        function clearHandler(e) {
            var words = [];
            var textClass = this.helper.getPartClassName('search-content-text');
            $(this.main).find('.' + textClass).each(
                function (index, item) {
                    words.push($(item).text());
                }
            );
            var rawValue = u.difference(this.rawValue, words);
            // 搜索模式
            if (this.query) {
                this.setProperties(
                    {
                        rawValue: rawValue,
                        query: ''
                    }
                );
            }
            // 错误列表模式
            else if (!u.isEmpty(this.errors)) {
                this.setProperties(
                    {
                        rawValue: rawValue,
                        errors: []
                    }
                );
            }

            /**
             * 触发清空事件
             * @Event
             */
            this.fire('clear');
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

                textLine.helper.getPartBeginTag('search-info', 'div'),
                textLine.helper.getPartBeginTag('search-hint', 'div'),
                // content内容动态填充
                textLine.helper.getPartEndTag('search-hint', 'div'),
                textLine.helper.getPartBeginTag('search-back', 'div'),
                textLine.backLinkText,
                textLine.helper.getPartEndTag('search-back', 'div'),

                textLine.helper.getPartBeginTag('search-clear-link', 'a'),
                textLine.clearLinkText,
                textLine.helper.getPartEndTag('search-clear-link', 'a'),

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
            this.rawValue = this.getValueRepeatableItems();
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
         * 切换浮层
         *
         * @param {boolean=} isShow 是否显示浮层
         * @inner
         */
        function toggleOverlay(isShow) {
            if (u.isUndefined(isShow)) {
                // 如果没有明确给出isShow,则需要判断
                isShow = !!this.query || !u.isEmpty(this.errors);
            }
            var listWrapper = this.helper.getPart('wrapper');
            var searchInfo = this.helper.getPart('search-info');
            var searchWrapper = this.helper.getPart('search-wrapper');
            if (isShow) {
                listWrapper.style.display = 'none';
                searchInfo.style.display = 'block';
                searchWrapper.style.display = 'block';
            }
            else {
                listWrapper.style.display = 'block';
                searchInfo.style.display = 'none';
                searchWrapper.style.display = 'none';
            }
        }
        esui.register(TextLine);

        return TextLine;
    }
);
