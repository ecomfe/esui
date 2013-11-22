/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @ignore
 * @file 生命周期相关辅助方法
 * @author otakustay
 */
define(
    function (require) {
        /**
         * LifeCycle枚举
         * 
         * @type {Object}
         * @ignore
         */
        var LifeCycle = {
            NEW: 0,
            INITED: 1,
            RENDERED: 2,
            DISPOSED: 4
        };
        
        var ui = require('../main');

        /**
         * @override Helper
         */
        var helper = {};

        /**
         * 初始化控件视图环境
         */
        helper.initViewContext = function () {
            var viewContext = this.control.viewContext || ui.getViewContext();

            // 因为`setViewContext`里有判断传入的`viewContext`和自身的是否相等，
            // 这里必须制造出**不相等**的情况，再调用`setViewContext`
            this.control.viewContext = null;
            this.control.setViewContext(viewContext);
        };

        /**
         * 初始化控件扩展
         */
        helper.initExtensions = function () {
            // 附加全局扩展
            var extensions = this.control.extensions;
            if (!(extensions instanceof Array)) {
                extensions = this.control.extensions = [];
            }
            Array.prototype.push.apply(
                extensions, 
                ui.createGlobalExtensions()
            );

            // 同类型扩展去重
            var registeredExtensions = {};
            for (var i = 0, len = extensions.length; i < len; i++) {
                var extension = extensions[i];
                if (!registeredExtensions[extension.type]) {
                    extension.attachTo(this.control);
                    registeredExtensions[extension.type] = true;
                }
            }
        };

        /**
         * 判断控件是否处于相应的生命周期阶段
         * 
         * @param {string} stage 生命周期阶段
         * @return {boolean}
         */
        helper.isInStage = function (stage) {
            if (LifeCycle[stage] == null) {
                throw new Error('Invalid life cycle stage: ' + stage);
            }

            return this.control.stage == LifeCycle[stage];
        };

        /**
         * 改变控件的生命周期阶段
         * 
         * @param {string} stage 生命周期阶段
         */
        helper.changeStage = function (stage) {
            if (LifeCycle[stage] == null) {
                throw new Error('Invalid life cycle stage: ' + stage);
            }

            this.control.stage = LifeCycle[stage];
        };

        /**
         * 销毁控件
         */
        helper.dispose = function () {
            // 清理子控件
            this.control.disposeChildren();
            this.control.children = null;
            this.control.childrenIndex = null;

            // 移除自身行为
            this.clearDOMEvents();

            // 移除所有扩展
            if (this.control.extensions) {
                for (var i = 0; i < this.control.extensions.length; i++) {
                    var extension = this.control.extensions[i];
                    extension.dispose();
                }
            }

            // 从控件树中移除
            if (this.control.parent) {
                this.control.parent.removeChild(this.control);
            }


            // 从视图环境移除
            if (this.control.viewContext) {
                this.control.viewContext.remove(this.control);
            }

            this.control.renderOptions = null;
        };

        /**
         * 执行控件销毁前动作
         */
        helper.beforeDispose = function () {
            this.control.fire('beforedispose');
        };

        /**
         * 执行控件销毁后动作
         */
        helper.afterDispose = function () {
            this.changeStage('DISPOSED');
            this.control.fire('afterdispose');
        };

        return helper;
    }
);
