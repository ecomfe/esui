/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 规则验证状态类
 * @author DBear, otakustay
 */
define(
    function () {
        /**
         * 验证状态类
         *
         * 一个`ValidityState`表示一条规则的验证结果，其包含`state`和`message`两个属性
         * 
         * @class validator.ValidityState
         * @constructor
         * @param {boolean} state 验证状态
         * @param {string} [message=""] 验证信息
         */
        function ValidityState(state, message) {
            this.state = state;
            this.message = message || '';
        }

        /**
         * 获取验证信息
         *
         * @return {string} 
         */
        ValidityState.prototype.getMessage = function () {
            return this.message;
        };


        /**
         * 获取验证状态
         *
         * @return {boolean} `true`为值合法，`false`为值非法
         */
        ValidityState.prototype.getState = function () {
            return this.state;
        };



        /**
         * 设置验证信息
         *
         * @param {string} message 验证信息字符串
         */
        ValidityState.prototype.setMessage = function (message) {
            this.message = message;
        };


        /**
         * 设置验证状态
         *
         * @param {boolean} state `true`为值合法，`false`为值非法
         */
        ValidityState.prototype.setState = function (state) {
            this.state = state;
        };

        return ValidityState;
    }
);
