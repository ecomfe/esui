/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 默认验证规则类
 * @author DBear
 */
define(
    function (require) {
        /**
         * Rule类声明
         *
         * @constructor
         */
        function Rule() {
        }

        /**
         * 规则类型
         * 
         * @type {string}
         */
        Rule.prototype.type = null;


        /**
         * 错误提示信息
         *
         * @type {string}
         */
        Rule.prototype.errorMessage = '${title}验证失败';

        /**
         * 验证控件的验证状态
         *
         * @param {string} value 校验值
         * @param {Control} control 待校验控件
         *
         * @return {validator/ValidityState}
         */
        Rule.prototype.check = function (value, control) {

            var ValidityState = require('ValidityState');
            return new ValidityState(true, '');

        };

        /**
         * 获取验证对应的错误提示信息。
         *
         * @param {Control} control 待校验控件
         * @return {string}
         */
        Rule.prototype.getErrorMessage = function (control) {
            
            var lib = require('./lib');
            return lib.format(this.errorMessage, control);

        };

        /**
         * 获取验证限制条件的值 
         *
         * @param {Control} control 待校验控件
         * @return {*}
         */
        Rule.prototype.getLimitCondition = function (control) {

            return control.get(this.type);

        };

        return Rule;
    }
);