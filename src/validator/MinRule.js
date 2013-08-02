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
         * MinRule类声明
         *
         * @constructor
         */
        function MinRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型
         * 
         * @type {string}
         */
        MinRule.prototype.type = 'min';


        /**
         * 错误提示信息
         *
         * @type {string}
         */
        MinRule.prototype.errorMessage = 
            '${title}不能小于${min}';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         *
         * @return {validator/ValidityState}
         */
        MinRule.prototype.check = function (value, control) {
            value = parseInt(value, 10);
            return new ValidityState(
                !isNaN(value) && value >= this.getLimitCondition(control), 
                this.getErrorMessage(control)
            );
        };

        require('../lib').inherits(MinRule, Rule);
        require('../main').registerRule(MinRule, 300);
        return MinRule;
    }
);