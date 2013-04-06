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

            return this.statesMap[name];

        };

        /**
         * 获取验证状态集合
         *
         * @return {Array}
         */
        Validity.prototype.getStates = function () {

            return this.states.slice();

        };

        /**
         * 获取自定义验证信息
         *
         * @return {string} 
         */
        Validity.prototype.getCustomMessage = function () {

            return this.customMessage;

        };


        /**
         * 设置自定义验证信息
         *
         */
        Validity.prototype.setCustomMessage = function (message) {

            this.customMessage = message;

        };


        /**
         * 获取整体是否验证通过
         *
         * @return {boolean} 
         */
        Validity.prototype.isValid = function () {

            var states = this.getstates();

            for (var i = 0; i < states.length; i ++) {
                if (!states[i].getState()) {
                    return false;
                }
            }

            return true;

        };

        return Validity;

    }
);