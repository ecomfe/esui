/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 规则验证状态类
 * @author DBear
 */
 define(
    function () {
        /**
         * ValidityState类声明
         * 
         * @param {boolean} state 验证状态
         * @param {string} message 验证信息
         * @constructor
         */
        function ValidityState(state, message) {
            /**
             * 验证信息
             * @type {string} 
             */
            this.message = message || '';

            /**
             * 验证状态
             * @type {boolean} 
             */
            this.state = state;

        }


        /**
         * 获取验证信息
         *
         * @return {string} 
         */
        ValidityState.prototype.getMessage = function () {

        	return this.message;

        }


        /**
         * 获取验证状态
         *
         * @return {boolean} true为值合法，false为值非法
         */
        ValidityState.prototype.getState = function () {

        	return this.state;

        }



        /**
         * 设置验证信息
         *
         * @param {string} message 
         */
        ValidityState.prototype.setMessage = function (message) {

        	this.message = message;
        }


        /**
         * 设置验证状态，true为值合法，false为值非法。
         *
         * @param {boolean} state
         */
        ValidityState.prototype.setState = function (state) {

            this.state = state;

        }

        return ValidityState;
    }
);