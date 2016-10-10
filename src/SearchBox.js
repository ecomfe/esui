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
        var InputControl = require('./InputControl');

        require('./TextBox');
        require('./Button');

        /**
         * 搜索框控件，由一个文本框和一个搜索按钮组成
         *
         * @extends InputControl
         * @param {Object} [options] 初始化参数
         * @constructor
         */
        function SearchBox(options) {
            InputControl.apply(this, arguments);
        }

        /**
         * @override
         */
        SearchBox.prototype.type = 'SearchBox';

        /**
         * 初始化参数
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        SearchBox.prototype.initOptions = function (options) {
            var properties = {};
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

                if (!properties.maxLength && ( lib.hasAttribute(this.main, 'maxlength') || this.main.maxLength > 0)) {
                    properties.maxLength = this.main.maxLength;
                }
            }
            //TODO: custom elments 的兼容
            else {
                if (!properties.text) {
                    properties.text = lib.getText(this.main);
                }
            }

            if (!properties.title) {
                properties.title = this.main.title;
            }

            InputControl.prototype.initOptions.call(this, properties);
        };

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        SearchBox.prototype.initStructure = function () {
            // 一个搜索框由一个文本框和一个按钮组成
            var textboxOptions = {
                mode: 'text',
                childName: 'text',
                height: this.height,
                viewContext: this.viewContext,
                placeholder: this.placeholder
            };

            if (lib.isInput(this.main)) {
                this.helper.replaceMain();
            }

            var textbox = ui.create('TextBox', textboxOptions);
            textbox.appendTo(this.main);
            this.addChild(textbox);

            var buttonOptions = {
                main: document.createElement('span'),
                childName: 'button',
                content: '搜索',
                viewContext: this.viewContext
            };
            var button = ui.create('Button', buttonOptions);
            button.appendTo(this.main);
            this.addChild(button);
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

            delegate(textbox, this, 'input');
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
            textbox.on('focus', focus, this);
            textbox.on('blur', lib.bind(this.removeState, this, 'focus'));

            var button = this.getChild('button');
            button.on('click', click, this);
        };

        function focus() {
            this.removeState('clear');
            this.addState('focus');
        }

        function click() {
            if (this.hasState('clear')) {
                this.getChild('text').setValue('');
                this.removeState('clear');
            }
            this.fire('search');
        }

        /**
         * 获取输入原始值
         *
         * @return {string}
         * @override
         */
        SearchBox.prototype.getRawValue = function () {
            var text = this.getChild('text');
            return text.getValue();
        };

        /**
         * 获取输入值
         *
         * @return {string}
         * @override
         */
        SearchBox.prototype.getValue = function () {
            return this.getRawValue();
        };

        /**
         * 设置输入控件的原始值
         *
         * @param {string} rawValue 输入控件的原始值
         */
        SearchBox.prototype.setRawValue = function (rawValue) {
            this.set('text', rawValue);
        };

        /**
         * 设置输入控件的值
         *
         * @param {string} value 输入控件的值
         */
        SearchBox.prototype.setValue = function (value) {
            this.setRawValue(value);
        };

        var paint = require('./painters');

        /**
         * 渲染自身
         *
         * @protected
         * @override
         */
        SearchBox.prototype.repaint = paint.createRepaint(
            InputControl.prototype.repaint,
            paint.attribute('title'),
            {
                name: [
                    'maxLength', 'placeholder', 'text',
                    'width', 'disabled', 'readOnly'
                ],
                paint: function (box, maxLength, placeholder, text, width, disabled, readOnly) {
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
                        disabled: disabled,
                        readOnly: readOnly
                    };
                    box.getChild('text').setProperties(properties);
                }
            },
            {
                name: 'disabled',
                paint: function (box, disabled) {
                    if (disabled === 'false') {
                        disabled = false;
                    }

                    var button = box.getChild('button');
                    button.set('disabled', disabled);
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
            }
        );

        /**
         * 获取用于比对的text属性值
         *
         * @return {string}
         * @protected
         */
        SearchBox.prototype.getTextProperty = function () {
            var textbox = this.getChild('text');
            return textbox ? textbox.getValue() : this.text;
        };

        lib.inherits(SearchBox, InputControl);
        ui.register(SearchBox);
        return SearchBox;
    }
);
