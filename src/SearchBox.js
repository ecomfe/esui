/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 搜索框控件
 * @author otakustay
 */
define(
    function (require) {
        var lib = require('./lib');
        var ui = require('esui');
        var Control = require('./Control');

        require('./TextBox');
        require('./Button');

        /**
         * 搜索框控件，由一个文本框和一个搜索按钮组成
         *
         * @extends Control
         * @param {Object} [options] 初始化参数
         * @constructor
         */
        function SearchBox(options) {
            Control.apply(this, arguments);
        }

        SearchBox.prototype.type = 'SearchBox';

        /**
         * 初始化参数
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        SearchBox.prototype.initOptions = function (options) {
            var properties = {
                // 搜索模式：`instant`、`normal`
                searchMode: 'normal',
                // 默认值为''
                text: '',
                // 控件内部使用的状态，外部MUST NOT设置该属性
                searched: false
            };
            lib.extend(properties, options);

            if (properties.disabled === 'false') {
                properties.disabled = false;
            }

            if (lib.isInput(this.main)) {
                if (!properties.placeholder) {
                    properties.placeholder =
                        lib.getAttribute(this.main, 'placeholder');
                }

                if (!properties.text) {
                    properties.text = this.main.value;
                }

                if (!properties.maxLength && (lib.hasAttribute(this.main, 'maxlength') || this.main.maxLength > 0)) {
                    properties.maxLength = this.main.maxLength;
                }
            }
            // TODO: custom elments 的兼容
            else {
                if (!properties.text) {
                    properties.text = lib.getText(this.main);
                }
            }

            if (!properties.title) {
                properties.title = this.main.title;
            }

            if (properties.text) {
                properties.searched = true;
            }

            Control.prototype.initOptions.call(this, properties);
        };

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        SearchBox.prototype.initStructure = function () {
            var tpl = ''
                + '<div data-ui-mode="text" data-ui-child-name="text"'
                +     'data-ui-type="TextBox" data-ui-placeholder="${placeholder}"'
                +     'data-ui-icon="${clearClasses}" data-ui-icon-position="right">'
                + '</div>';

            // 即时搜索不需要搜索按钮
            var searchIconHTML = '<span class="' + this.helper.getIconClass('search') + '"></span>';
            var searchTPL = ''
                + '<button data-ui="childName:search;type:Button;" class="${searchClasses} ui-button-primary">'
                +     searchIconHTML
                + '</button>';
            if (this.searchMode === 'instant') {
                tpl += searchIconHTML;
            }
            else {
                tpl += searchTPL;
            }

            var html = lib.format(
                tpl,
                {
                    placeholder: this.placeholder,
                    clearClasses: this.helper.getIconClass('times-circle'),
                    searchClasses: this.helper.getPartClassName('search')
                }
            );

            if (lib.isInput(this.main)) {
                this.helper.replaceMain();
            }

            this.main.innerHTML = html;
            this.helper.initChildren(this.main);
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        SearchBox.prototype.initEvents = function () {
            var textbox = this.getChild('text');
            var delegate = require('mini-event').delegate;

            // 处理输入事件
            textbox.on('input', onInput, this);
            // 即时模式下输入触发搜索
            if (this.searchMode === 'instant') {
                delegate(textbox, 'input', this, 'search');
            }

            // 代理回车键事件
            delegate(textbox, 'enter', this, 'search');
            // 回车时要取消掉默认行为，否则会把所在的表单给提交了
            textbox.on(
                'keypress',
                function (e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                    }
                }
            );

            // 清除搜索按钮
            textbox.on('iconclick', clear, this);
            textbox.on('focus', lib.bind(this.addState, this, 'focus'));
            textbox.on('blur', lib.bind(this.removeState, this, 'focus'));

            var searchButton = this.getChild('search');
            if (searchButton) {
                delegate(searchButton, 'click', this, 'search');
            }
        };

        /**
         * 处理输入框的input事件，根据输入框是否有内容增加/移除`searched`状态
         */
        function onInput() {
            var textbox = this.getChild('text');
            var method = textbox.getValue() ? 'addState' : 'removeState';
            this[method]('searched');
        }

        /**
         * 清除搜索关键词，`instant`模式下触发搜索
         */
        function clear() {
            var textbox = this.getChild('text');
            textbox.setValue('');
            this.removeState('searched');
            if (this.searchMode === 'instant') {
                this.fire('search');
            }
        }

        /**
         * 获取输入值
         *
         * @return {string}
         * @override
         */
        SearchBox.prototype.getValue = function () {
            var text = this.getChild('text');
            return text.getValue();
        };

        var paint = require('./painters');

        /**
         * 渲染自身
         *
         * @protected
         * @override
         */
        SearchBox.prototype.repaint = paint.createRepaint(
            Control.prototype.repaint,
            paint.attribute('title'),
            {
                name: [
                    'maxLength', 'placeholder', 'text',
                    'width', 'height', 'disabled', 'readOnly'
                ],
                /* eslint-disable max-params */
                paint: function (box, maxLength, placeholder, text, width, height, disabled, readOnly) {
                    var properties = {
                        /**
                         * @property {number} maxLength
                         *
                         * 最大长度，参考{@link TextBox#maxLength}
                         */
                        maxLength: maxLength,
                        /**
                         * @property {string} placeholder
                         *
                         * 无内容时的提示文字，参考{@link TextBox#placeholder}
                         */
                        placeholder: placeholder,
                        /**
                         * @property {string} text
                         *
                         * 文字内容
                         */
                        value: text,

                        /**
                         * @property {number} width
                         *
                         * 设定文本框宽度，参考{@link TextBox#width}
                         */
                        width: width,
                        height: height,
                        disabled: disabled,
                        readOnly: readOnly
                    };
                    box.getChild('text').setProperties(properties);
                }
                /* eslint-enable max-params */
            },
            {
                name: 'disabled',
                paint: function (box, disabled) {
                    var searchButton = box.getChild('search');
                    searchButton && searchButton.set('disabled', disabled);
                }
            },
            {
                name: 'height',
                paint: function (box, height) {
                    var searchBtn = box.getChild('search');
                    if (searchBtn) {
                        searchBtn.setProperties({height: height});
                    }
                }
            },
            {
                /**
                 * @property {boolean} fitWidth
                 *
                 * 设定当前控件是否独占一行宽度
                 */
                name: 'fitWidth',
                paint: function (box, fitWidth) {
                    var method = fitWidth ? 'addState' : 'removeState';
                    box[method]('fit-width');
                }
            },
            {
                /**
                 * @property {boolean} searched
                 *
                 * 设定SearchBox是否已有搜素关键词
                 */
                name: 'searched',
                paint: function (box, searched) {
                    var method = searched ? 'addState' : 'removeState';
                    box[method]('searched');
                }
            },
            {
                /**
                 * @property {boolean} searched
                 *
                 * 设定SearchBox的工作模式：`instant` | `normal`
                 */
                name: 'searchMode',
                paint: function (box, searchMode) {
                    box.addState(searchMode);
                }
            }
        );

        lib.inherits(SearchBox, Control);
        ui.register(SearchBox);
        return SearchBox;
    }
);
