/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 字段最大值验证规则
 * @author otakustay
 */
define(
    function (require) {
        var Rule = require('./Rule');
        var ValidityState = require('./ValidityState');
        var eoo = require('eoo');
        var esui = require('../main');

        /**
         * 最大值验证规则
         *
         * @extends validator.Rule
         * @class validator.MaxRule
         * @constructor
         */
        var MaxRule = eoo.create(
            Rule,
            {
                /**
                 * 规则类型，始终为`"max"`
                 *
                 * @type {string}
                 * @override
                 */
                type: 'max',

                /**
                 * 错误提示信息
                 *
                 * @type {string}
                 * @override
                 */
                errorMessage:
                    '${title}不能大于${max}',

                /**
                 * 验证控件的验证状态
                 *
                 * @param {string} value 校验值
                 * @param {Control} control 待校验控件
                 * @return {validator.ValidityState}
                 * @override
                 */
                check: function (value, control) {
                    var valueOfNumber = +value;
                    var isValidNumber = !isNaN(valueOfNumber)
                        && valueOfNumber <= this.getLimitCondition(control);
                    return new ValidityState(
                        !value || isValidNumber,
                        this.getErrorMessage(control)
                    );
                }
            }
        );

        esui.registerRule(MaxRule, 301);
        return MaxRule;
    }
);
