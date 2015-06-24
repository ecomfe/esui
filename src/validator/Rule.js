/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 默认验证规则类
 * @author DBear, otakustay
 */
define(
    function (require) {
        var ValidityState = require('./ValidityState');
        var lib = require('../lib');
        var eoo = require('eoo');

        /**
         * 验证规则基类
         *
         * 验证规则是对{@link InputControl}的值的验证逻辑的抽象
         *
         * 每一个验证规则都包含一个`check(value, control)`方法，
         * 该方法返回一个{@link validator.ValidityState}以表示验证结果
         *
         * 验证规则必须通过{@link main#registerRule}进行注册后才可生效，
         * 每一个验证规则包含`prototype.type`属性来确定规则的类型
         *
         * 验证规则并不会显式地附加到控件上，而是通过控件自身的属性决定哪些规则生效，
         * 当控件本身具有与规则的`type`属性相同的属性时，此规则即会生效，例如：
         *
         *     var textbox = main.create('TextBox', { maxLength: 30 });
         *     textbox.validate();
         *
         * 由于`textbox`上存在`maxLength`属性，因此`MaxLengthRule`会对其进行验证
         *
         * @class validator.Rule
         * @constructor
         */
        var Rule = eoo.create(
            {
                /**
                 * 规则类型
                 *
                 * @type {string}
                 */
                type: null,

                /**
                 * 错误提示信息，可以使用`${xxx}`作为占位符输出控件的属性值
                 *
                 * @type {string}
                 */
                errorMessage: '${title}验证失败',

                /**
                 * 验证控件的验证状态
                 *
                 * @param {string} value 校验值
                 * @param {Control} control 待校验控件
                 * @return {validator.ValidityState}
                 * @abstract
                 */
                check: function (value, control) {
                    return new ValidityState(true, '');
                },

                /**
                 * 获取验证对应的错误提示信息。
                 *
                 * @param {Control} control 待校验控件
                 * @return {string}
                 */
                getErrorMessage: function (control) {
                    var errorMessage
                        = control.get(this.type + 'ErrorMessage') || this.errorMessage;
                    return lib.format(errorMessage, control);
                },

                /**
                 * 获取验证限制条件的值
                 *
                 * @param {Control} control 待校验控件
                 * @return {Mixed}
                 */
                getLimitCondition: function (control) {
                    return control.get(this.type);
                },

                /**
                 * 获取规则类型
                 *
                 * @return {string}
                 */
                getName: function () {
                    return this.type;
                }
            }
        );

        return Rule;
    }
);
