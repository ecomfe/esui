/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 字段最大长度验证规则
 * @author otakustay
 */
define(
    function (require) {
        var Rule = require('./Rule');
        var ValidityState = require('./ValidityState');

        /**
         * PatternRule类声明
         *
         * @constructor
         */
        function PatternRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型
         * 
         * @type {string}
         */
        PatternRule.prototype.type = 'pattern';


        /**
         * 错误提示信息
         *
         * @type {string}
         */
        PatternRule.prototype.errorMessage = 
            '${title}格式不符合要求';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         *
         * @return {validator/ValidityState}
         */
        PatternRule.prototype.check = function (value, control) {
            return new ValidityState(
                new RegExp(this.getLimitCondition(control)).test(value),
                this.getErrorMessage(control)
            );
        };

        require('../lib').inherits(PatternRule, Rule);
        require('../main').registerRule(PatternRule, 200);
        return PatternRule;
    }
);