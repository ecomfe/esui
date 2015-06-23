/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 字段最大长度验证规则
 * @author otakustay
 */
define(
    function (require) {
        var Rule = require('./Rule');
        var ValidityState = require('./ValidityState');
        var eoo = require('eoo');
        var esui = require('../main');
        var lib = require('../lib');

        /**
         * 最大字符长度的验证规则
         *
         * @extends validator.Rule
         * @class validator.MaxLengthRule
         * @constructor
         */
        var MaxLengthRule = eoo.create(
            Rule,
            {
                /**
                 * 规则类型，始终为`"maxLength"`
                 *
                 * @type {string}
                 * @override
                 */
                type: 'maxLength',

                /**
                 * 错误提示信息
                 *
                 * @type {string}
                 * @override
                 */
                errorMessage:
                    '${title}不能超过${maxLength}个字符',

                /**
                 * 验证控件的验证状态
                 *
                 * @param {string} value 校验值
                 * @param {Control} control 待校验控件
                 * @return {validator.ValidityState}
                 * @override
                 */
                check: function (value, control) {
                    return new ValidityState(
                        value.length <= this.getLimitCondition(control),
                        this.getErrorMessage(control)
                    );
                },

                /**
                 * 获取错误信息
                 *
                 * @param {Control} control 待验证的控件
                 * @return {string}
                 * @override
                 */
                getErrorMessage: function (control) {
                    var errorMessage
                        = control.get(this.type + 'ErrorMessage') || this.errorMessage;
                    var maxLength = this.getLimitCondition(control);
                    var data = {
                        title: control.get('title'),
                        maxLength: maxLength,
                        length: maxLength
                    };
                    return lib.format(errorMessage, data);
                },

                /**
                 * 获取验证条件
                 *
                 * @param {Control} control 待验证的控件
                 * @return {Mixed}
                 * @override
                 */
                getLimitCondition: function (control) {
                    return control.get('length') || control.get('maxLength');
                }
            }
        );

        esui.registerRule(MaxLengthRule, 100);
        return MaxLengthRule;
    }
);
