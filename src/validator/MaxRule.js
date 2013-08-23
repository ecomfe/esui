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
         * MaxRule类声明
         *
         * @constructor
         */
        function MaxRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型
         * 
         * @type {string}
         */
        MaxRule.prototype.type = 'max';


        /**
         * 错误提示信息
         *
         * @type {string}
         */
        MaxRule.prototype.errorMessage = 
            '${title}不能大于${max}';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         *
         * @return {validator/ValidityState}
         */
        MaxRule.prototype.check = function (value, control) {
            value = +value;
            return new ValidityState(
                !isNaN(value) && value <= this.getLimitCondition(control), 
                this.getErrorMessage(control)
            );
        };

        require('../lib').inherits(MaxRule, Rule);
        require('../main').registerRule(MaxRule, 301);
        return MaxRule;
    }
);