/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 最小值验证规则
 * @author otakustay
 */
define(
    function (require) {
        var Rule = require('./Rule');
        var ValidityState = require('./ValidityState');

        /**
         * 最小值验证规则
         *
         * @extends validator.Rule
         * @class validator.MinRule
         * @constructor
         */
        function MinRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型，始终为`"min"`
         * 
         * @type {string}
         * @override
         */
        MinRule.prototype.type = 'min';


        /**
         * 错误提示信息
         *
         * @type {string}
         * @override
         */
        MinRule.prototype.errorMessage = 
            '${title}不能小于${min}';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         * @return {validator.ValidityState}
         * @override
         */
        MinRule.prototype.check = function (value, control) {
            var valueOfNumber = +value;
            var isValidNumber = !isNaN(valueOfNumber)
                && valueOfNumber >= this.getLimitCondition(control);
            return new ValidityState(
                !value || isValidNumber, 
                this.getErrorMessage(control)
            );
        };

        require('../lib').inherits(MinRule, Rule);
        require('../main').registerRule(MinRule, 300);
        return MinRule;
    }
);
