/**
 * ESUI (Enterprise UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 验证信息类
 * @author DBear
 */
define(
    function (require) {
        var u = require('underscore');

        /**
         * 验证结果类
         *
         * 一个`Validity`是对一个控件的验证结果的表达，
         * 是一系列{@link validator.ValidityState}的组合
         *
         * 当有至少一个{@link validator.ValidityState}处于错误状态时，
         * 该`Validity`对象将处于错误状态
         *
         * @class validator.Validity
         * @constructor
         */
        function Validity() {
            this.states = [];
            this.stateIndex = {};
            this.customMessage = '';
            this.customValidState = null;
        }

        /**
         * 添加验证状态
         *
         * @param {string} name 状态名
         * @param {validator.ValidityState} state 规则验证状态对象
         */
        Validity.prototype.addState = function (name, state) {
            //如果状态名已存在
            if (this.stateIndex[name]) {
                // 同样的状态对象，不处理
                if (this.stateIndex[name] === state) {
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
         * @return {validator.ValidityState} 规则验证状态对象
         */
        Validity.prototype.getState = function (name) {
            return this.stateIndex[name] || null;
        };

        /**
         * 获取验证状态集合
         *
         * @return {validator.ValidityState[]}
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
         * @param {string} message 自定义验证信息
         */
        Validity.prototype.setCustomMessage = function (message) {
            this.customMessage = message;
        };

        /**
         * 设置自定义验证结果
         *
         * @param {string} validState 验证结果字符串
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
            return u.all(
                this.getStates(),
                function (state) {
                    return state.getState();
                }
            );
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
