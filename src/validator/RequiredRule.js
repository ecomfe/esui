/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 必填项验证规则
 * @author otakustay
 */
define(
    function (require) {
        var Rule = require('./Rule');

        /**
         * RequiredRule类声明
         *
         * @constructor
         */
        function RequiredRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型
         * 
         * @type {string}
         */
        RequiredRule.prototype.type = 'required';


        /**
         * 错误提示信息
         *
         * @type {string}
         */
        RequiredRule.prototype.errorMessage = '${title}不能为空';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         *
         * @return {validator/ValidityState}
         */
        RequiredRule.prototype.check = function (value, control) {
            return new ValidityState(!!value, this.getErrorMessage(control));
        };

        require('./lib').inherits(RequiredRule, Rule);
        require('./main').registerRule(RequiredRule, 0);
        return RequiredRule;
    }
);