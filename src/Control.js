/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件基类模块
 * @author erik
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');

        /**
         * 控件基类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Control(options) {
            this.children = [];
            this.childrenIndex = {};
            this.states = {};
            this.events = {};
            this.domEvents = {};
            options = options || {};
            if (!options.skin) {
                options.skin = 'default';
            }

            this.main = options.main ? options.main : this.createMain(options);

            this.initOptions(options);

            // 自创建id
            if (!this.id) {
                this.id = helper.getGUID();
            }

            // 初始化视图环境
            helper.initViewContext(this);

            // 初始化扩展
            helper.initExtensions(this);

            this.lifeCycle = Control.LifeCycle.INITED;

            this.fire('init');
        }

        /**
         * 控件生命周期枚举
         * 
         * @static
         * @type {Object}
         */
        Control.LifeCycle = {
            INITED   : 1,
            RENDERED : 2,
            DISPOSED : 4
        };

        Control.prototype = {
            constructor: Control,

            /**
             * 初始化控件需要使用的选项
             *
             * @param {Object=} options 构造函数传入的选项
             * @protected
             */
            initOptions: function (options) {
                options = options || {};
                this.setProperties(options);
            },

            /**
             * 创建控件主元素
             * 
             * @return {HTMLElement}
             * @protected
             */
            createMain: function () {
                return document.createElement('div');
            },

            /**
             * 初始化DOM结构，仅在第一次渲染时调用
             */
            initStructure: function () {
            },

            /**
             * 渲染控件
             *
             * @public
             */
            render: function () {
                if (this.lifeCycle === Control.LifeCycle.INITED) {
                    this.fire('beforerender');

                    // 通用的渲染逻辑
                    if (!this.main.id) {
                        this.main.id = helper.getId(this);
                    }

                    this.initStructure();

                    helper.addClass(this, this.main);
                    this.setDisabled(this.disabled);
                }

                // 由子控件实现
                this.repaint();

                if (this.lifeCycle === Control.LifeCycle.INITED) {
                    this.fire('afterrender');
                }

                this.lifeCycle = Control.LifeCycle.RENDERED;
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @param {Object=} 变更过的属性的索引
             * @protected
             */
            repaint: function (changes, changesIndex) {
            },

            /**
             * 将控件添加到页面的某个元素中
             * 
             * @param {HTMLElement} wrap 控件要添加到的目标元素
             * @public
             */
            appendTo: function (wrap) {
                wrap.appendChild(this.main);
                this.render();
            },

            /**
             * 将控件添加到页面的某个元素之前
             * 
             * @param {HTMLElement} reference 控件要添加到之前的目标元素
             * @public
             */
            insertBefore: function (reference) {
                reference.parentNode.appendChild(this.main, reference);
                this.render();
            },

            /**
             * 销毁释放控件
             * @public
             */
            dispose: function () {
                helper.beforeDispose(this);
                helper.dispose(this);
                helper.afterDispose(this);
            },

            /**
             * 获取控件的属性值
             * 
             * @param {string} name 属性名
             * @return {*}
             * @public
             */
            get: function (name) {
                var method = this['get' + lib.toPascalCase(name)];

                if (typeof method == 'function') {
                    return method.call(this);
                }
                
                return this[name];
            },

            /**
             * 设置控件的属性值
             * 
             * @param {string} name 属性名
             * @param {*} value 属性值
             * @public
             */
            set: function (name, value) {
                var method = this['set' + lib.toPascalCase(name)];

                if (typeof method == 'function') {
                    return method.call(this, value);
                }

                var oldValue = this[name];
                if (oldValue !== value) {
                    this[name] = value;
                    var record = {
                        name: name,
                        oldValue: oldValue,
                        newValue: value
                    };
                    this.repaint([record]);
                }
            },

            /**
             * 批量设置控件的属性值
             * 
             * @param {Object} properties 属性值集合
             */
            setProperties: function (properties) {
                var changes = [];
                var changesIndex = {};
                for (var key in properties) {
                    if (properties.hasOwnProperty(key)) {
                        var oldValue = this[key];
                        var newValue = properties[key];
                        if (oldValue !== newValue) {
                            this[key] = newValue;
                            var record = {
                                name: key,
                                oldValue: oldValue,
                                newValue: newValue
                            };
                            changes.push(record);
                            changesIndex[key] = record;
                        }
                    }
                }

                if (changes.length 
                    && this.lifeCycle === Control.LifeCycle.RENDERED
                ) {
                    this.repaint(changes, changesIndex);
                }

                return changesIndex;
            },

            /**
             * 设置控件的所属视图环境
             * 
             * @param {ViewContext} viewContext 视图环境
             */
            setViewContext: function (viewContext) {
                // 为了避免程序流转，降低性能，以及死循环，做一次判断
                var oldViewContext = this.viewContext;
                if (oldViewContext == viewContext) {
                    return;
                }

                // 从老视图环境中清除
                if (oldViewContext) {
                    this.viewContext = null;
                    oldViewContext.remove(this);
                }

                // 注册到新视图环境
                this.viewContext = viewContext;
                viewContext && viewContext.add(this);

                // 切换子控件的视图环境
                var children = this.children;
                if (children) {
                    for (var i = 0, len = children.length; i < len; i++) {
                        children[i].setViewContext(viewContext);
                    }
                }
            },

            /**
             * 设置控件禁用状态
             */
            setDisabled: function (disabled) {
                this[disabled ? 'disable' : 'enable']();
            },

            /**
             * 设置控件状态为禁用
             */
            disable: function () {
                this.setProperties({ disabled: true });
                this.addState('disabled');
            },

            /**
             * 设置控件状态为启用
             */
            enable: function () {
                this.setProperties({ disabled: false });
                this.removeState('disabled');
            },

            /**
             * 判断控件是否不可用
             * 
             * @return {boolean}
             */
            isDisabled: function () {
                return this.hasState('disabled');
            },

            /**
             * 设置控件状态为可见
             */
            show: function () {
                this.removeState('hidden');
            },

            /**
             * 设置控件状态为不可见
             */
            hide: function () {
                this.addState('hidden');
            },

            /**
             * 切换控件可见状态
             */
            toggle: function () {
                this[this.isHidden() ? 'show' : 'hide']();
            },

            /**
             * 判断控件是否不可见
             * 
             * @return {boolean}
             */
            isHidden: function () {
                return this.hasState('hidden');
            },

            /**
             * 添加控件状态
             * 
             * @param {string} state 状态名
             */
            addState: function (state) {
                if (!this.hasState(state)) {
                    this.states[state] = 1;
                    helper.addClass(this, this.main, state);
                }
            },

            /**
             * 移除控件状态
             * 
             * @param {string} state 状态名
             */
            removeState: function (state) {
                if (this.hasState(state)) {
                    delete this.states[state];
                    helper.removeClass(this, this.main, state);
                }
            },

            /**
             * 切换控件指定状态
             * 
             * @param {string} state 状态名
             */
            toggleState: function (state) {
                var methodName = this.hasState(state)
                    ? 'removeState'
                    : 'addState';
                
                this[methodName](state);
            },

            /**
             * 判断控件是否处于指定状态
             * 
             * @param {string} state 状态名
             * @return {boolean}
             */
            hasState: function (state) {
                return this.states[state];
            },

            /**
             * 添加子控件
             * 
             * @param {Control} control 子控件实例
             * @param {string=} childName 子控件名
             */
            addChild: function (control, childName) {
                childName = childName || control.childName;

                if (control.parent) {
                    control.parent.removeChild(control);
                }

                this.children.push(control);
                control.parent = this;

                if (childName) {
                    control.childName = childName;
                    this.childrenIndex[childName] = control;
                }

                // 将子视图环境设置与父控件一致
                if (this.viewContext != control.viewContext) {
                    control.setViewContext(this.viewContext);
                }
            },

            /**
             * 移除子控件
             * 
             * @param {Control} control 子控件实例
             */
            removeChild: function (control) {
                // 从控件树容器中移除
                var children = this.children;
                var len = children.length;
                while (len--) {
                    if (children[len] === control) {
                        children.splice(len, 1);
                    }
                }

                // 从具名子控件索引中移除
                var childName = control.childName;
                if (childName) {
                    this.childrenIndex[childName] = null;
                }

                control.parent = null;
            },

            /**
             * 移除全部子控件
             */
            disposeChildren: function () {
                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].dispose();
                }
                this.children = [];
                this.childrenIndex = {};
            },

            /**
             * 获取子控件
             * 
             * @param {string} childName 子控件名
             * @return {Control}
             */
            getChild: function (childName) {
                return this.childrenIndex[childName] || null;
            },

            /**
             * 批量初始化子控件
             * 
             * @param {HTMLElement} wrap 容器DOM元素
             * @param {Object=} options init参数
             * @param {Object=} options.properties 属性集合，通过id映射
             */
            initChildren: function (wrap, options) {
                options = options || {};
                options.viewContext = this.viewContext;

                var children = require('./main').init(wrap, options);
                for (var i = 0, len = children.length; i < len; i++) {
                    this.addChild(children[i]);
                }
            },

            /**
             * 添加事件监听器
             * 
             * @param {string} type 事件类型，`*`为所有事件 
             * @param {Function} listener 事件监听器
             */
            on: function (type, listener) {
                var listeners = this.events[type];
                if (!listeners) {
                    listeners = this.events[type] = [];
                }

                listeners.push(listener);
            },

            /**
             * 移除事件监听器
             * 
             * @param {string} type 事件类型，`*`为所有事件 
             * @param {Function=} listener 事件监听器
             */
            un: function (type, listener) {
                var listeners = this.events[type];

                if (listeners instanceof Array) {
                    if (listener) {
                        var len = listeners.length;
                        while (len--) {
                            if (listeners[len] === listener) {
                                listeners.splice(len, 1);
                            }
                        }
                    }
                    else {
                        listeners.length = 0;
                    }
                }
            },

            /**
             * 派发事件
             * 
             * @param {string} type 事件类型
             * @param {Object=} arg 事件对象
             */
            fire: function (type, arg) {
                // 构造event argument
                var eventArg = {};
                lib.extend(eventArg, arg);
                eventArg.type = type;

                // 先调用直接写在实例上的"onxxx"
                var me = this;
                var handler = me['on' + type];
                if (typeof handler == 'function') {
                    handler.call(me, eventArg);
                }

                /**
                 * 调用listeners
                 * 
                 * @inner
                 * @param {Array.<Function>} listeners 监听器数组
                 */
                function callListeners(listeners) {
                    if (listeners instanceof Array) {
                        for (var i = 0, len = listeners.length; i < len; i++) {
                            var listener = listeners[i];
                            if (typeof listener == 'function') {
                                listener.call(me, eventArg);
                            }
                        }
                    }
                }

                // 调用listeners
                var events = me.events;
                
                callListeners(events[type]);
                callListeners(events['*']);
            }
        };

        return Control;
    }
);
