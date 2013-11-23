/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 正则检验规则
 * @author otakustay
 */
define(
    function (require) {
        var Rule = require('./Rule');
        var ValidityState = require('./ValidityState');

        /**
         * 正则检验规则
         *
         * 需要注意的是，当值为空时，此规则默认为通过。
         * 对于非空检验请使用{@link validator.RequiredRule}
         *
         * @extends validator.Rule
         * @class validator.PatternRule
         * @constructor
         */
        function PatternRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型，始终为`"pattern"`
         * 
         * @type {string}
         * @override
         */
        PatternRule.prototype.type = 'pattern';


        /**
         * 错误提示信息
         *
         * @type {string}
         * @override
         */
        PatternRule.prototype.errorMessage = 
            '${title}格式不符合要求';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         * @return {validator.ValidityState}
         * @override
         */
        PatternRule.prototype.check = function (value, control) {
            var regex = new RegExp(this.getLimitCondition(control));
            return new ValidityState(
                !value || regex.test(value),
                this.getErrorMessage(control)
            );
        };

        require('../lib').inherits(PatternRule, Rule);
        require('../main').registerRule(PatternRule, 200);
        return PatternRule;
    }
);
