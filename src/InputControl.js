/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 输入控件基类模块
 * @author erik, otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        /**
         * 校验
         *
         * @param {InputControl} control 目标控件
         * @return {Validity}
         * @inner
         */
        function checkValidity(control) {
            var Validity = require('./validator/Validity');
            var validity = new Validity();
            var eventArg = {
                validity: validity
            };
            control.fire('beforevalidate', eventArg);

            // 验证合法性
            var rules = ui.createRulesByControl(control);
            for (var i = 0, len = rules.length; i < len; i++) {
                var rule = rules[i];
                validity.addState( 
                    rule.getName(), 
                    rule.check(control.getValue(), control)
                );
            }

            // 触发invalid和aftervalidate事件
            // 这两个事件中用户可能会对validity进行修改操作
            // 所以validity.isValid()结果不能缓存
            if (!validity.isValid()) {
                control.fire('invalid', eventArg);
            }
            control.fire('aftervalidate', eventArg);

            return validity;
        }
        
        /**
         * 输入控件基类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function InputControl(options) {
            options = options ? lib.extend({}, options) : {};
            if (options.main && !options.name) {
                options.name = options.main.getAttribute('name');
            }
            Control.call(this, options);
        }

        InputControl.prototype = {
            constructor: InputControl,

            /**
             * 指定在哪些状态下该元素不处理相关的DOM事件
             *
             * @type {Array.<string>}
             * @protected
             */
            ignoreStates: Control.prototype.ignoreStates.concat('readOnly'),

            /**
             * 渲染控件
             * 
             * @override
             */
            initStructure: function () {
            },

            // repaint: function () {
                // TODO: 修改为painter实现
                // this.setRawValue(this.rawValue);
                // this.setReadOnly(this.readOnly);
            // },

            /**
             * 获取输入控件的值
             * 
             * @return {string} 
             */
            getValue: function () {
                return this.stringifyValue(this.rawValue);
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
             * 获取输入控件的原始值
             * 
             * @return {string} 
             */
            getRawValue: function () {
                return this.rawValue;
            },

            /**
             * 设置输入控件的原始值
             * 
             * @param {string} rawValue 输入控件的原始值
             */
            setRawValue: function (rawValue) {
                this.setProperties({ rawValue: rawValue });
            },

            /**
             * 批量设置控件的属性值
             * 
             * @override
             * @param {Object} properties 属性值集合
             */
            setProperties: function (properties) {
                // 当value和rawValue同时存在时，以rawValue为准
                // 否则，将value解析成rawValue
                var value = properties.value;
                delete properties.value;
                if (value != null && properties.rawValue == null) {
                    properties.rawValue = this.parseValue(value);
                }

                return Control.prototype.setProperties.call(this, properties);
            },

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
                    name: 'readOnly',
                    paint: function (control, value) {
                        var method = value ? 'addState' : 'removeState';
                        control[method]('readOnly');
                        var nodeName = control.main.nodeName.toLowerCase();
                        if (nodeName === 'input'
                            || nodeName === 'select'
                            || nodeName === 'textarea'
                        ) {
                            control.main.readOnly = value;
                        }
                    }
                }
            ),

            /**
             * 将value从原始格式转换成string
             * 复杂类型的输入控件需要override此接口
             * 
             * @param {*} rawValue 原始值
             * @return {string}
             */
            stringifyValue: function (rawValue) {
                return rawValue ? (rawValue + '') : '';
            },

            /**
             * 将string类型的value转换成原始格式
             * 复杂类型的输入控件需要override此接口
             * 
             * @param {string} value 字符串值
             * @return {*}
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
                this[readOnly ? 'addState' : 'removeState']('readOnly');
            },

            /**
             * 判读控件是否处于只读状态
             * 
             * @return {boolean}
             */
            isReadOnly: function () {
                return this.hasState('readOnly');
            },

            /**
             * 验证控件，仅返回true/false
             * 
             * @return {boolean}
             */
            checkValidity: function () {
                var validity = checkValidity(this);
                return validity.isValid();
            },

            /**
             * 验证控件，当值不合法时显示错误信息
             * 
             * @return {boolean}
             */
            validate: function () {
                var validity = checkValidity(this);
                this.showValidity(validity);
                return validity.isValid();
            },

            /**
             * 获取显示验证信息用的元素
             *
             * @return {HTMLElement}
             * @public
             */
            getValidityLabel: function () {
                if (!helper.isInStage(this, 'RENDERED')) {
                    return null;
                }

                var label = lib.g(this.validityLabel);
                if (!label) {
                    label = document.createElement('label');
                    label.id = helper.getId(this, 'validity');
                    if (lib.isInput(this.main)) {
                        lib.setAttribute(label, 'for', this.main.id);
                    }
                    else {
                        var nestedInput = 
                            this.main.getElementsByTagName('input')[0]
                            || this.main.getElementsByTagName('textarea')[0]
                            || this.main.getElementsByTagName('select')[0];
                        if (nestedInput && nestedInput.type !== 'hidden') {
                            lib.setAttribute(label, 'for', nestedInput.id);
                        }
                    }
                    lib.insertAfter(label, this.main);
                }
            },

            /**
             * 显示验证信息
             *
             * @param {Validity} 验证结果
             * @public
             */
            showValidity: function (validity) {
                var label = this.getValidityLabel();

                if (!label) {
                    return;
                }

                if (validity.isValid()) {
                    label.innerHTML = '';
                    helper.removePartClasses(this, 'validity-invalid', label);
                    helper.addPartClasses(this, 'validity-valid', label);
                }
                else {
                    var message = '';
                    var states = validity.getStates();
                    for (var i = 0; i < states.length; i++) {
                        var state = states[i];
                        if (!state.getState()) {
                            message = state.getMessage();
                            break;
                        }
                    }
                    label.innerHTML = message;
                    helper.removePartClasses(this, 'validity-valid', label);
                    helper.addPartClasses(this, 'validity-invalid', label);
                }
            }
        };

        require('./lib').inherits(InputControl, Control);
        return InputControl;
    }
);
