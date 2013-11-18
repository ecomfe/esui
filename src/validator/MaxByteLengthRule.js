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
         * MaxByteLengthRule类声明
         *
         * @constructor
         */
        function MaxByteLengthRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型
         * 
         * @type {string}
         */
        MaxByteLengthRule.prototype.type = 'maxByteLength';


        /**
         * 错误提示信息
         *
         * @type {string}
         */
        MaxByteLengthRule.prototype.errorMessage = 
            '${title}不能超过${maxByteLength}个字符';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         *
         * @return {validator/ValidityState}
         */
        MaxByteLengthRule.prototype.check = function (value, control) {
            var byteLength = value.replace(/[^\x00-\xff]/g, 'xx').length;
            return new ValidityState(
                byteLength <= this.getLimitCondition(control), 
                this.getErrorMessage(control)
            );
        };

        require('../lib').inherits(MaxByteLengthRule, Rule);
        require('../main').registerRule(MaxByteLengthRule, 100);
        return MaxByteLengthRule;
    }
);
