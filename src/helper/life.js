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

        var u = require('underscore');
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
            if (!u.isArray(extensions)) {
                extensions = this.control.extensions = [];
            }
            Array.prototype.push.apply(
                extensions,
                ui.createGlobalExtensions()
            );

            // 同类型扩展去重
            var registeredExtensions = {};
            for (var i = 0; i < extensions.length; i++) {
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

            return this.control.stage === LifeCycle[stage];
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
            var me = this;
            var ctrl = me.control;

            // 清理子控件
            ctrl.disposeChildren();
            ctrl.children = null;
            ctrl.childrenIndex = null;

            // 移除自身行为
            u.each(ctrl.domEvents, function ($ele) {
                me.removeDOMEvent($ele, '.' + ctrl.type);
            });
            ctrl.domEvents = [];

            // 移除所有扩展
            u.invoke(ctrl.extensions, 'dispose');
            ctrl.extensions = null;

            // 从控件树中移除
            if (ctrl.parent) {
                ctrl.parent.removeChild(ctrl);
            }

            // 从视图环境移除
            if (ctrl.viewContext) {
                ctrl.viewContext.remove(ctrl);
            }

            ctrl.renderOptions = null;
        };

        /**
         * 执行控件销毁前动作
         */
        helper.beforeDispose = function () {
            /**
             * @event beforedispose
             *
             * 在销毁前触发
             *
             * @member Control
             */
            this.control.fire('beforedispose');
        };

        /**
         * 执行控件销毁后动作
         */
        helper.afterDispose = function () {
            this.changeStage('DISPOSED');
            /**
             * @event afterdispose
             *
             * 在销毁后触发
             *
             * @member Control
             */
            this.control.fire('afterdispose');

            // 销毁所有事件，这个必须在`afterdispose`事件之后，不然事件等于没用
            this.control.destroyEvents();
        };

        return helper;
    }
);
