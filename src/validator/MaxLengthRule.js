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
         * MaxLengthRule类声明
         *
         * @constructor
         */
        function MaxLengthRule() {
            Rule.apply(this, arguments);
        }

        /**
         * 规则类型
         * 
         * @type {string}
         */
        MaxLengthRule.prototype.type = 'maxLength';


        /**
         * 错误提示信息
         *
         * @type {string}
         */
        MaxLengthRule.prototype.errorMessage = 
            '${title}不能超过${maxLength}个字符';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         *
         * @return {validator/ValidityState}
         */
        MaxLengthRule.prototype.check = function (value, control) {
            return new ValidityState(
                value.length <= this.getLimitCondition(control), 
                this.getErrorMessage(control)
            );
        };

        MaxLengthRule.prototype.getErrorMessage = function (control) {
            var lib = require('../lib');
            var errorMessage =
                control.get(this.type + 'ErrorMessage') || this.errorMessage;
            var maxLength = this.getLimitCondition(control);
            var data = {
                title: control.get('title'),
                maxLength: maxLength,
                length: maxLength
            };
            return lib.format(errorMessage, data);
        };

        MaxLengthRule.prototype.getLimitCondition = function (control) {
            return control.get('length') || control.get('maxLength');
        };

        require('../lib').inherits(MaxLengthRule, Rule);
        require('../main').registerRule(MaxLengthRule, 100);
        return MaxLengthRule;
    }
);