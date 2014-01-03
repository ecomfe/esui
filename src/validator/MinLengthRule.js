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

        /**
         * 最小字符长度的验证规则
         *
         * @extends validator.Rule
         * @class validator.MinLengthRule
         * @constructor
         */
        function MinLengthRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型，始终为`"minLength"`
         * 
         * @type {string}
         * @override
         */
        MinLengthRule.prototype.type = 'minLength';


        /**
         * 错误提示信息
         *
         * @type {string}
         * @override
         */
        MinLengthRule.prototype.errorMessage = 
            '${title}不能小于${minLength}个字符';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         * @return {validator.ValidityState}
         * @override
         */
        MinLengthRule.prototype.check = function (value, control) {
            return new ValidityState(
                value.length >= this.getLimitCondition(control), 
                this.getErrorMessage(control)
            );
        };

        require('../lib').inherits(MinLengthRule, Rule);
        require('../main').registerRule(MinLengthRule, 100);
        return MinLengthRule;
    }
);
