/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 验证信息类
 * @author DBear
 */
define(
    function () {
        /**
         * Validity类声明
         *
         * @constructor
         */
        function Validity() {
            /**
             * 状态集合List
             * @type {Array} 
             */
            this.states = [];

            /**
             * 状态集合Map
             * @type {Object} 
             */
            this.stateIndex = {};

            /**
             * 自定义验证信息
             * @type {string} 
             */
            this.customMessage = '';
            
            /**
             * 自定义验证结果状态
             * @type {string=}
             */
            this.customValidState = null;
        }

        /**
         * 添加验证状态
         *
         * @param {string} name 状态名
         * @param {validator/ValidityState} state 规则验证状态对象
         */
        Validity.prototype.addState = function (name, state) {

            //如果状态名已存在
            if (this.stateIndex[name]) {
                // 同样的状态对象，不处理
                if (this.statesMap[name] === state) {
                    return;
                }

                // 不一样，删除原list中元素
                for (var i = 0; i < this.states.length; i++) {
                    if (this.states[i] === this.stateIndex[name]) {
                        this.states.splice(i, 1);
                        break;
                    }
                }
            }

            // 更新数据
            this.states.push(state);
            this.stateIndex[name] = state;

        };

        /**
         * 获取验证状态
         *
         * @param {string} name 状态名
         * @return {validator/ValidityState} 规则验证状态对象
         */
        Validity.prototype.getState = function (name) {

            return this.stateIndex[name] || null;

        };

        /**
         * 获取验证状态集合
         *
         * @return {Array}
         * @public
         */
        Validity.prototype.getStates = function () {

            return this.states.slice();

        };

        /**
         * 获取自定义验证信息
         *
         * @return {string}
         * @public
         */
        Validity.prototype.getCustomMessage = function () {

            return this.customMessage;

        };


        /**
         * 设置自定义验证信息
         *
         * @param {string} message 自定义验证信息
         * @public
         */
        Validity.prototype.setCustomMessage = function (message) {

            this.customMessage = message;

        };

        /**
         * 设置自定义验证结果
         *
         * @param {string} validState 验证结果字符串
         * @public
         */
        Validity.prototype.setCustomValidState = function (validState) {
            this.customValidState = validState;
        };


        /**
         * 获取整体是否验证通过
         *
         * @return {boolean} 
         */
        Validity.prototype.isValid = function () {

            var states = this.getStates();

            for (var i = 0; i < states.length; i ++) {
                if (!states[i].getState()) {
                    return false;
                }
            }

            return true;

        };

        /**
         * 获取验证状态的字符串
         *
         * @return {string}
         */
        Validity.prototype.getValidState = function () {
            return this.customValidState
                || (this.isValid() ? 'valid' : 'invalid');
        };

        return Validity;

    }
);