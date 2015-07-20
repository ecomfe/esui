/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 字段最小长度验证规则
 * @author otakustay
 */
define(
    function (require) {
        var Rule = require('./Rule');
        var ValidityState = require('./ValidityState');
        var eoo = require('eoo');
        var esui = require('../main');

        /**
         * 最小字符长度的验证规则
         *
         * @extends validator.Rule
         * @class validator.MinLengthRule
         * @constructor
         */
        var MinLengthRule = eoo.create(
            Rule,
            {
                /**
                 * 规则类型，始终为`"minLength"`
                 *
                 * @type {string}
                 * @override
                 */
                type: 'minLength',

                /**
                 * 错误提示信息
                 *
                 * @type {string}
                 * @override
                 */
                errorMessage:
                    '${title}不能小于${minLength}个字符',

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
                        value.length >= this.getLimitCondition(control),
                        this.getErrorMessage(control)
                    );
                }
            }
        );

        esui.registerRule(MinLengthRule, 100);
        return MinLengthRule;
    }
);
