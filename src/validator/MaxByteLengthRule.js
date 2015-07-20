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

        /**
         * 验证最大字节长度的规则
         *
         * 该规则将除标准ASCII码外的其它字符视为2个字节
         *
         * @extends validator.Rule
         * @class validator.MaxByteLengthRule
         * @constructor
         */
        var MaxByteLengthRule = eoo.create(
            Rule,
            {
                /**
                 * 规则类型，强制为`"maxByteLength"`
                 *
                 * @type {string}
                 * @override
                 */
                type: 'maxByteLength',

                /**
                 * 错误提示信息
                 *
                 * @type {string}
                 * @override
                 */
                errorMessage:
                    '${title}不能超过${maxByteLength}个字符',

                /**
                 * 验证控件的验证状态
                 *
                 * @param {string} value 校验值
                 * @param {Control} control 待校验控件
                 * @return {validator.ValidityState}
                 * @override
                 */
                check: function (value, control) {
                    var byteLength = value.replace(/[^\x00-\xff]/g, 'xx').length;
                    return new ValidityState(
                        byteLength <= this.getLimitCondition(control),
                        this.getErrorMessage(control)
                    );
                }
            }
        );

        esui.registerRule(MaxByteLengthRule, 100);
        return MaxByteLengthRule;
    }
);
