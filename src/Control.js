/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件基类模块
 * @author erik, otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Helper = require('./Helper');
        var ui = require('./main');

        /**
         * 控件基类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Control(options) {
            helper.changeStage(this, 'NEW');
            this.children = [];
            this.childrenIndex = {};
            this.states = {};
            this.events = {};
            this.domEvents = {};
            this.helper = new Helper(this);
            options = options || {};

            this.main = options.main ? options.main : this.createMain(options);

            // 如果没给id，自己创建一个，
            // 这个有可能在后续的`initOptions`中被重写，则会在`setProperties`中处理，
            // 这个不能放到`initOptions`的后面，
            // 不然会导致很多个没有id的控件放到一个`ViewContext`中，
            // 会把其它控件的`ViewContext`给冲掉导致各种错误
            if (!this.id && !options.id) {
                this.id = helper.getGUID();
            }

            this.initOptions(options);

            // 初始化视图环境
            helper.initViewContext(this);

            // 初始化扩展
            helper.initExtensions(this);

            // 切换控件所属生命周期阶段
            helper.changeStage(this, 'INITED');

            this.fire('init');
        }

        Control.prototype = {
            constructor: Control,

            /**
             * 指定在哪些状态下该元素不处理相关的DOM事件
             *
             * @type {Array.<string>}
             * @protected
             */
            ignoreStates: ['disabled'],

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
                if (helper.isInStage(this, 'INITED')) {
                    this.fire('beforerender');

                    this.domIDPrefix = this.viewContext.id;

                    this.initStructure();

                    // 为控件主元素添加id
                    if (!this.main.id) {
                        this.main.id = helper.getId(this);
                    }

                    // 为控件主元素添加控件实例标识属性
                    this.main.setAttribute( 
                        ui.getConfig('instanceAttr'), 
                        this.id 
                    );
                    this.main.setAttribute( 
                        ui.getConfig('viewContextAttr'), 
                        this.viewContext.id 
                    );

                    helper.addPartClasses(this);
                }

                // 由子控件实现
                this.repaint();

                if (helper.isInStage(this, 'INITED')) {
                    this.fire('afterrender');
                }

                // 切换控件所属生命周期阶段
                helper.changeStage(this, 'RENDERED');
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
                if (!changesIndex
                    || changesIndex.hasOwnProperty('disabled')
                ) {
                    var method = this.disabled ? 'addState' : 'removeState';
                    this[method]('disabled');
                }
                if (!changesIndex || changesIndex.hasOwnProperty('hidden')) {
                    var method = this.hidden ? 'addState' : 'removeState';
                    this[method]('hidden');
                }
            },

            /**
             * 将控件添加到页面的某个元素中
             * 
             * @param {HTMLElement} wrap 控件要添加到的目标元素
             * @public
             */
            appendTo: function (wrap) {
                wrap.appendChild(this.main);
                if (helper.isInStage(this, 'NEW')
                    || helper.isInStage(this, 'INITED')
                ) {
                    this.render();
                }
            },

            /**
             * 将控件添加到页面的某个元素之前
             * 
             * @param {HTMLElement} reference 控件要添加到之前的目标元素
             * @public
             */
            insertBefore: function (reference) {
                reference.parentNode.insertBefore(this.main, reference);
                if (helper.isInStage(this, 'NEW')
                    || helper.isInStage(this, 'INITED')
                ) {
                    this.render();
                }
            },

            /**
             * 销毁释放控件
             * @public
             */
            dispose: function () {
                if (!helper.isInStage(this, 'DISPOSED')) {
                    helper.beforeDispose(this);
                    helper.dispose(this);
                    helper.afterDispose(this);
                }
            },

            /**
             * 获取控件的属性值
             * 
             * @param {string} name 属性名
             * @return {*}
             * @public
             */
            get: function (name) {
                var method = this['get' + lib.pascalize(name)];

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
                var method = this['set' + lib.pascalize(name)];

                if (typeof method == 'function') {
                    return method.call(this, value);
                }

                var property = {};
                property[name] = value;
                this.setProperties(property);
            },

            /**
             * 批量设置控件的属性值
             * 
             * @param {Object} properties 属性值集合
             */
            setProperties: function (properties) {
                // 只有在渲染以前（就是`initOptions`调用的那次）才允许设置id
                if (!this.stage) {
                    if (properties.hasOwnProperty('id')) {
                        this.id = properties.id;
                    }

                    if (properties.hasOwnProperty('group')) {
                        this.group = properties.group;
                    }

                    if (properties.hasOwnProperty('skin')) {
                        this.skin = properties.skin;
                    }
                }

                delete properties.id;
                delete properties.group;
                delete properties.skin;

                // 吞掉`viewContext`的设置，逻辑都在`setViewContext`中
                if (properties.hasOwnProperty('viewContext')) {
                    this.setViewContext(properties.viewContext);
                    delete properties.viewContext;
                }

                // 几个状态选项是要转为`boolean`的
                if (this.hasOwnProperty('disabled')) {
                    this.disabled = !!this.disabled;
                }
                if (this.hasOwnProperty('hidden')) {
                    this.hidden = !!this.hidden;
                }

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

                if (changes.length && helper.isInStage(this, 'RENDERED')) {
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

                // 在主元素上加个属性，以便找到`ViewContext`
                if (this.viewContext && helper.isInStage(this, 'RENDERED')) {
                    this.main.setAttribute( 
                        ui.getConfig('viewContextAttr'), 
                        this.viewContext.id 
                    );
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
                this.addState('disabled');
            },

            /**
             * 设置控件状态为启用
             */
            enable: function () {
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
                    helper.addStateClasses(this, state);
                    var properties = {};
                    var statePropertyName = state.replace(
                        /-(\w)/, 
                        function (m, c) { return c.toUpperCase(); }
                    );
                    properties[statePropertyName] = true;
                    this.setProperties(properties);
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
                    helper.removeStateClasses(this, state);
                    var properties = {};
                    var statePropertyName = state.replace(
                        /-(\w)/, 
                        function (m, c) { return c.toUpperCase(); }
                    );
                    properties[statePropertyName] = false;
                    this.setProperties(properties);
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
                return !!this.states[state];
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
                var children = this.children.slice();
                for (var i = 0; i < children.length; i++) {
                    children[i].dispose();
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
             * @param {HTMLElement=} wrap 容器DOM元素，默认为主元素
             * @param {Object=} options init参数
             * @param {Object=} options.properties 属性集合，通过id映射
             */
            initChildren: function (wrap, options) {
                wrap = wrap || this.main;
                options = lib.extend({}, this.renderOptions, options);
                options.viewContext = this.viewContext;
                options.parent = this;

                ui.init(wrap, options);
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
                // 构造函数阶段不发送任何事件
                if (helper.isInStage(this, 'NEW')) {
                    return;
                }

                // 构造event argument
                var eventArg = arg || {};
                eventArg.type = type;
                eventArg.target = this;

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
                        listeners = listeners.slice();
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