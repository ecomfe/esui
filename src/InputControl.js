/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 输入控件基类模块
 * @author erik, otakustay
 */
define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var ValidityLabel = require('./Validity');
        var Validity = require('./validator/Validity');
        var main = require('./main');

        /**
         * 输入控件基类
         *
         * 输入控件用于表示需要在表单中包含的控件，
         * 其主要提供`getRawValue`和`getValue`方法供获取值
         *
         * 需要注意的是，控件其实并不通过严格的继承关系来判断一个控件是否为输入控件，
         * 只要`getCategory()`返回为`"input"`、`"check"或`"extend"`就认为是输入控件
         *
         * 相比普通控件的 **禁用 / 启用** ，输入控件共有3种状态：
         *
         * - 普通状态：可编辑，值随表单提交
         * - `disabled`：禁用状态，此状态下控件不能编辑，同时值不随表单提交
         * - `readOnly`：只读状态，此状态下控件不能编辑，但其值会随表单提交
         *
         * @extends Control
         * @constructor
         * @param {Object} [options] 初始化参数
         */
        function InputControl(options) {
            options = options ? lib.extend({}, options) : {};
            if (options.main && !options.name) {
                /**
                 * @property {string} name
                 *
                 * 输入控件的名称，用于表单提交时作为键值
                 *
                 * @readonly
                 */
                options.name = options.main.getAttribute('name');
            }
            Control.call(this, options);
        }

        InputControl.prototype = {
            constructor: InputControl,

            /**
             * 指定在哪些状态下该元素不处理相关的DOM事件，
             * 输入控件额外增加`read-only`状态
             *
             * @type {string[]}
             * @protected
             * @override
             */
            ignoreStates: Control.prototype.ignoreStates.concat('read-only'),

            /**
             * 获取控件的分类，默认返回`"input"`以表示为输入控件
             *
             * @return {string}
             * @override
             */
            getCategory: function () {
                return 'input';
            },

            /**
             * 获得应当获取焦点的元素，主要用于验证信息的`<label>`元素的`for`属性设置
             *
             * @return {HTMLElement}
             * @protected
             */
            getFocusTarget: function () {
                return null;
            },

            /**
             * 获取输入控件的值的字符串形式
             *
             * @return {string}
             */
            getValue: function () {
                /**
                 * @property {string} value
                 *
                 * 输入控件的字符串形式的值
                 */
                return this.stringifyValue(this.getRawValue());
            },

            /**
             * 设置输入控件的值
             *
             * @param {string} value 输入控件的值
             */
            setValue: function (value) {
                var rawValue = this.parseValue(value);
                this.setRawValue(rawValue);
            },

            /**
             * 获取输入控件的原始值，原始值的格式由控件自身决定
             *
             * @return {Mixed}
             */
            getRawValue: function () {
                /**
                 * @property {Mixed} rawValue
                 *
                 * 输入控件的原始值，其格式由控件自身决定
                 */
                return this.rawValue;
            },

            /**
             * 设置输入控件的原始值，原始值的格式由控件自身决定
             *
             * @param {Mixed} rawValue 输入控件的原始值
             */
            setRawValue: function (rawValue) {
                this.setProperties({ rawValue: rawValue });
            },

            /**
             * 批量设置控件的属性值
             *
             * @param {Object} properties 属性值集合
             * @override
             */
            setProperties: function (properties) {
                // 当value和rawValue同时存在时，以rawValue为准
                // 否则，将value解析成rawValue
                var value = properties.value;
                delete properties.value;
                if (value != null && properties.rawValue == null) {
                    properties.rawValue = this.parseValue(value);
                }

                if (this.hasOwnProperty('readOnly')) {
                    this.readOnly = !!this.readOnly;
                }

                return Control.prototype.setProperties.call(this, properties);
            },

            /**
             * 重渲染
             *
             * @method repaint
             * @protected
             * @override
             */
            repaint: helper.createRepaint(
                Control.prototype.repaint,
                {
                    name: 'disabled',
                    paint: function (control, value) {
                        var nodeName = control.main.nodeName.toLowerCase();
                        if (nodeName === 'input'
                            || nodeName === 'select'
                            || nodeName === 'textarea'
                        ) {
                            control.main.disabled = value;
                        }
                    }
                },
                {
                    /**
                     * @property {boolean} readOnly
                     *
                     * 是否只读
                     *
                     * 只读状态下，控件通过用户操作不能修改值，但值随表单提交
                     */
                    name: 'readOnly',
                    paint: function (control, value) {
                        var method = value ? 'addState' : 'removeState';
                        control[method]('read-only');
                        var nodeName = control.main.nodeName.toLowerCase();
                        if (nodeName === 'input'
                            || nodeName === 'select'
                            || nodeName === 'textarea'
                        ) {
                            control.main.readOnly = value;
                        }
                    }
                },
                {
                    name: 'hidden',
                    paint: function (control, hidden) {
                        // 需要同步验证信息的样式
                        var validityLabel = control.getValidityLabel(true);
                        if (validityLabel) {
                            var classPrefix = main.getConfig('uiClassPrefix');
                            var classes = [].concat(
                                classPrefix + '-hidden',
                                classPrefix + '-validity-hidden',
                                helper.getPartClasses(
                                    control, 'validity-hidden')
                            );
                            var method = control.isHidden()
                                ? 'addClasses'
                                : 'removeClasses';
                            lib[method](validityLabel, classes);
                        }
                    }

                }
            ),

            /**
             * 将值从原始格式转换成字符串，复杂类型的输入控件需要重写此接口
             *
             * @param {Mixed} rawValue 原始值
             * @return {string}
             * @protected
             */
            stringifyValue: function (rawValue) {
                return rawValue != null ? (rawValue + '') : '';
            },

            /**
             * 将字符串类型的值转换成原始格式，复杂类型的输入控件需要重写此接口
             *
             * @param {string} value 字符串值
             * @return {Mixed}
             * @protected
             */
            parseValue: function (value) {
                return value;
            },

            /**
             * 设置控件的只读状态
             *
             * @param {boolean} readOnly 是否只读
             */
            setReadOnly: function (readOnly) {
                readOnly = !!readOnly;
                this[readOnly ? 'addState' : 'removeState']('read-only');
            },

            /**
             * 判读控件是否处于只读状态
             *
             * @return {boolean}
             */
            isReadOnly: function () {
                return this.hasState('read-only');
            },

            /**
             * 获取验证结果的{@link validator.Validity}对象
             *
             * @return {validator.Validity}
             * @fires beforevalidate
             * @fires aftervalidate
             * @fires invalid
             */
            getValidationResult: function () {
                var validity = new Validity();
                var eventArg = {
                    validity: validity
                };

                /**
                 * @event beforevalidate
                 *
                 * 在验证前触发
                 *
                 * @param {validator.Validity} validity 验证结果
                 * @member InputControl
                 */
                eventArg = this.fire('beforevalidate', eventArg);

                // 验证合法性
                var rules = main.createRulesByControl(this);
                for (var i = 0, len = rules.length; i < len; i++) {
                    var rule = rules[i];
                    validity.addState(
                        rule.getName(),
                        rule.check(this.getValue(), this)
                    );
                }

                // 触发invalid和aftervalidate事件
                // 这两个事件中用户可能会对validity进行修改操作
                // 所以validity.isValid()结果不能缓存
                if (!validity.isValid()) {
                    /**
                     * @event invalid
                     *
                     * 在验证结果为错误时触发
                     *
                     * @param {validator.Validity} validity 验证结果
                     * @member InputControl
                     */
                    eventArg = this.fire('invalid', eventArg);
                }

                /**
                 * @event aftervalidate
                 *
                 * 在验证后触发
                 *
                 * @param {validator.Validity} validity 验证结果
                 * @member InputControl
                 */
                this.fire('aftervalidate', eventArg);

                return validity;
            },

            /**
             * 验证控件，仅返回`true`或`false`
             *
             * @return {boolean}
             * @fires beforevalidate
             * @fires aftervalidate
             * @fires invalid
             */
            checkValidity: function () {
                var validity = this.getValidationResult();
                return validity.isValid();
            },

            /**
             * 验证控件，当值不合法时显示错误信息
             *
             * @return {boolean}
             * @fires beforevalidate
             * @fires aftervalidate
             * @fires invalid
             */
            validate: function () {
                var validity = this.getValidationResult();
                this.showValidity(validity);
                return validity.isValid();
            },

            /**
             * 获取显示验证信息用的元素
             *
             * @param {boolean} [dontCreate=false]
             * 指定在没有找到已经存在的元素的情况下，不要额外创建
             * @return {Validity}
             * 返回一个已经放在DOM正确位置的{@link validator.Validity}控件
             */
            getValidityLabel: function (dontCreate) {
                if (!helper.isInStage(this, 'RENDERED')) {
                    return null;
                }

                var label = this.validityLabel
                    && this.viewContext.get(this.validityLabel);

                if (!label && !dontCreate) {
                    var options = {
                        id: this.id + '-validity',
                        viewContext: this.viewContext
                    };
                    label = new ValidityLabel(options);
                    if (this.main.nextSibling) {
                        label.insertBefore(this.main.nextSibling);
                    }
                    else {
                        label.appendTo(this.main.parentNode);
                    }

                    this.validityLabel = label.id;
                }

                return label;
            },

            /**
             * 显示验证信息
             *
             * @param {validator.Validity} validity 验证结果
             */
            showValidity: function (validity) {
                if (this.validity) {
                    this.removeState(
                        'validity-' + this.validity.getValidState());
                }
                this.validity = validity;
                this.addState('validity-' + validity.getValidState());

                var label = this.getValidityLabel();

                if (!label) {
                    return;
                }

                var properties = {
                    target: this,
                    focusTarget: this.getFocusTarget(),
                    validity: validity
                };
                label.setProperties(properties);
            },

            /**
             * 直接显示验证消息
             *
             * @param {string} validState 验证状态，通常未通过验证为`"invalid"`
             * @param {string} message 待显示的信息
             */
            showValidationMessage: function (validState, message) {
                message = message || '';
                var validity = new Validity();
                validity.setCustomValidState(validState);
                validity.setCustomMessage(message);
                this.showValidity(validity);
            },

            /**
             * 销毁控件
             *
             * @override
             */
            dispose: function () {
                if (helper.isInStage(this, 'DISPOSED')) {
                    return;
                }

                var validityLabel = this.getValidityLabel(true);
                if (validityLabel) {
                    validityLabel.dispose();
                }
                Control.prototype.dispose.apply(this, arguments);
            }
        };

        lib.inherits(InputControl, Control);
        return InputControl;
    }
);
