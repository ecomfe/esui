/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 输入控件基类模块
 * @author erik
 */

define(
    function (require) {
        var helper = require('./controlHelper');
        var Control = require('./Control');
        
        /**
         * 输入控件基类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function InputControl(options) {
            Control.apply(this, arguments);
        }

        InputControl.prototype = {
            constructor: InputControl,

            /**
             * 渲染控件
             * 
             * @override
             */
            initStructure: function () {
                helper.initName(control);
            },

            repaint: function () {
                // TODO: 修改为painter实现
                // this.setRawValue(this.rawValue);
                // this.setReadOnly(this.readOnly);
            },

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

                Control.prototype.setProperties.call(this, properties);
            },

            /**
             * 将value从原始格式转换成string
             * 复杂类型的输入控件需要override此接口
             * 
             * @param {*} rawValue 原始值
             * @return {string}
             */
            stringifyValue: function (rawValue) {
                if (typeof rawValue == 'string') {
                    return rawValue;
                }

                return String(rawValue);
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
             * 设置控件状态为禁用
             * 
             * @override
             */
            disable: function () {
                this.main.disabled = true;
                Control.prototype.disable.call(this);
            },

            /**
             * 设置控件状态为启用
             * 
             * @override
             */
            enable: function () {
                this.main.disabled = false;
                Control.prototype.enable.call(this);
            },

            /**
             * 设置控件的只读状态
             * 
             * @param {boolean} readOnly 是否只读
             */
            setReadOnly: function (readOnly) {
                readOnly = !!readOnly;

                var main = this.main;
                main && (main.readOnly = readOnly);

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
                return helper.checkValidity(this, true);
            },

            /**
             * 验证控件，当值不合法时显示错误信息
             * 
             * @return {boolean}
             */
            validate: function () {
                return helper.checkValidity(this);
            }
        };

        require('./lib').inherits(InputControl, Control);
        return InputControl;
    }
);
