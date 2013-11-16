/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 生命周期相关辅助方法
 * @author otakustay
 */
define(
    function (require) {
        /**
         * LifeCycle枚举
         * 
         * @type {Object} 
         * @inner
         */
        var LifeCycle = {
            NEW: 0,
            INITED: 1,
            RENDERED: 2,
            DISPOSED: 4
        };
        
        var lib = require('../lib');
        var ui = require('../main');
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

        /**
         * 通过`painter`对象创建`repaint`方法
         *
         * @param {...Object | function} args `painter`对象
         * @return {function} `repaint`方法的实现
         */
        helper.createRepaint = function () {
            var painters = [].concat.apply([], [].slice.call(arguments));

            return function (changes, changesIndex) {
                // 临时索引，不能直接修改`changesIndex`，会导致子类的逻辑错误
                var index = lib.extend({}, changesIndex);
                for (var i = 0; i < painters.length; i++) {
                    var painter = painters[i];

                    // 如果是一个函数，就认为这个函数处理所有的变化，直接调用一下
                    if (typeof painter === 'function') {
                        painter.apply(this, arguments);
                        continue;
                    }

                    // 其它情况下，走的是`painter`的自动化属性->函数映射机制
                    var propertyNames = [].concat(painter.name);

                    // 以下2种情况下要调用：
                    // 
                    // - 第一次重会（没有`changes`）
                    // - `changesIndex`有任何一个负责的属性的变化
                    var shouldPaint = !changes;
                    if (!shouldPaint) {
                        for (var j = 0; j < propertyNames.length; j++) {
                            var name = propertyNames[j];
                            if (changesIndex.hasOwnProperty(name)) {
                                shouldPaint = true;
                                break;
                            }
                        }
                    }
                    if (!shouldPaint) {
                        continue;
                    }

                    // 收集所有属性的值
                    var properties = [this];
                    for (var j = 0; j < propertyNames.length; j++) {
                        var name = propertyNames[j];
                        properties.push(this[name]);
                        // 从索引中删除，为了后续构建`unpainted`数组
                        delete index[name]; 
                    }
                    // 绘制
                    painter.paint.apply(painter, properties);
                }

                // 构建出未渲染的属性集合
                var unpainted = [];
                for (var key in index) {
                    if (index.hasOwnProperty(key)) {
                        unpainted.push(index[key]);
                    }
                }

                return unpainted;
            };
        };

        return helper;
    }
);