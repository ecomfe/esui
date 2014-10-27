/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 控件基类模块
 * @author erik, otakustay
 */
define(
    function (require) {
        var lib = require('./lib');
        var u = require('underscore');
        var ui = require('./main');
        var Helper = require('./Helper');

        /**
         * 控件基类
         *
         * @constructor
         * @extends {mini-event.EventTarget}
         * @param {Object} [options] 初始化参数
         * @fires init
         */
        function Control(options) {
            options = options || {};

            /**
             * 控件关联的{@link Helper}对象
             *
             * @type {Helper}
             * @protected
             */
            this.helper = new Helper(this);

            this.helper.changeStage('NEW');

            /**
             * 子控件数组
             *
             * @type {Control[]}
             * @protected
             * @readonly
             */
            this.children = [];
            this.childrenIndex = {};
            this.currentStates = {};
            this.domEvents = {};

            /**
             * 控件的主元素
             *
             * @type {HTMLElement}
             * @protected
             * @readonly
             */
            this.main = options.main ? options.main : this.createMain(options);

            // 如果没给id，自己创建一个，
            // 这个有可能在后续的`initOptions`中被重写，则会在`setProperties`中处理，
            // 这个不能放到`initOptions`的后面，
            // 不然会导致很多个没有id的控件放到一个`ViewContext`中，
            // 会把其它控件的`ViewContext`给冲掉导致各种错误

            /**
             * 控件的id，在一个{@link ViewContext}中不能重复
             *
             * @property {string} id
             * @readonly
             */
            if (!this.id && !options.id) {
                this.id = lib.getGUID();
            }

            this.initOptions(options);

            // 初始化视图环境
            this.helper.initViewContext();

            // 初始化扩展
            this.helper.initExtensions();

            // 切换控件所属生命周期阶段
            this.helper.changeStage('INITED');

            /**
             * @event init
             *
             * 完成初始化
             */
            this.fire('init');
        }

        /**
         * @property {string} type
         *
         * 控件的类型
         * @readonly
         */

        /**
         * @property {string} skin
         *
         * 控件皮肤，仅在初始化时设置有效，运行时不得变更
         *
         * @protected
         * @readonly
         */

        /**
         * @property {string} styleType
         *
         * 控件的样式类型，用于生成各class使用
         *
         * 如无此属性，则使用{@link Control#type}属性代替
         *
         * @readonly
         */

        Control.prototype = {
            constructor: Control,

            /**
             * 指定在哪些状态下该元素不处理相关的DOM事件
             *
             * @type {string[]}
             * @protected
             */
            ignoreStates: ['disabled'],

            /**
             * 获取控件的分类
             *
             * 控件分类的作用如下：
             *
             * - `control`表示普通控件，没有任何特征
             * - `input`表示输入控件，在表单中使用`getRawValue()`获取其值
             * - `check`表示复选控件，在表单中通过`isChecked()`判断其值是否加入结果中
             *
             * @return {string} 可以为`control`、`input`或`check`
             */
            getCategory: function () {
                return 'control';
            },

            /**
             * 初始化控件需要使用的选项
             *
             * @param {Object} [options] 构造函数传入的选项
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
                if (!this.type) {
                    return document.createElement('div');
                }

                var name = this.type.replace(
                    /([A-Z])/g,
                    function (match, ch) { return '-' + ch.toLowerCase(); }
                );
                return document.createElement(ui.getConfig('customElementPrefix') + '-' + name.slice(1));
            },

            /**
             * 初始化DOM结构，仅在第一次渲染时调用
             *
             * @protected
             * @abstract
             */
            initStructure: function () {
            },

            /**
             * 初始化与DOM元素、子控件等的事件交互，仅在第一次渲染时调用
             *
             * @protected
             * @abstract
             */
            initEvents: function () {
            },

            /**
             * 渲染控件
             *
             * @fires beforerender
             * @fires afterrender
             */
            render: function () {
                if (this.helper.isInStage('INITED')) {
                    /**
                     * @event beforerender
                     *
                     * 开始初次渲染
                     */
                    this.fire('beforerender');

                    this.domIDPrefix = this.viewContext.id;

                    this.initStructure();
                    this.initEvents();

                    // 为控件主元素添加id
                    if (!this.main.id) {
                        this.main.id = this.helper.getId();
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

                    this.helper.addPartClasses();

                    if (this.states) {
                        this.states = typeof this.states === 'string'
                            ? this.states.split(' ')
                            : this.states;

                        u.each(this.states, this.addState, this);
                    }
                }

                // 由子控件实现
                this.repaint();

                if (this.helper.isInStage('INITED')) {
                    // 切换控件所属生命周期阶段
                    this.helper.changeStage('RENDERED');

                    /**
                     * @event afterrender
                     *
                     * 结束初次渲染
                     */
                    this.fire('afterrender');
                }
            },

            /**
             * 重新渲染视图
             *
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * 本方法的2个参数中的值均为 **属性变更对象** ，一个该对象包含以下属性：
             *
             * - `name`：属性名
             * - `oldValue`：变更前的值
             * - `newValue`：变更后的值
             *
             * @param {Object[]} [changes] 变更过的属性的集合
             * @param {Object} [changesIndex] 变更过的属性的索引
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
             * @param {HTMLElement | Control} wrap 控件要添加到的目标元素
             */
            appendTo: function (wrap) {
                if (wrap instanceof Control) {
                    wrap = wrap.main;
                }

                wrap.appendChild(this.main);
                if (this.helper.isInStage('NEW')
                    || this.helper.isInStage('INITED')
                    ) {
                    this.render();
                }
            },

            /**
             * 将控件添加到页面的某个元素之前
             *
             * @param {HTMLElement | Control} reference 控件要添加到之前的目标元素
             */
            insertBefore: function (reference) {
                if (reference instanceof Control) {
                    reference = reference.main;
                }

                reference.parentNode.insertBefore(this.main, reference);
                if (this.helper.isInStage('NEW')
                    || this.helper.isInStage('INITED')
                    ) {
                    this.render();
                }
            },

            /**
             * 销毁释放控件
             *
             * @fires beforedispose
             * @fires afterdispose
             */
            dispose: function () {
                if (!this.helper.isInStage('DISPOSED')) {
                    this.helper.beforeDispose();
                    this.helper.dispose();
                    this.helper.afterDispose();
                }
            },

            /**
             * 销毁控件并移除所有DOM元素
             *
             * @fires beforedispose
             * @fires afterdispose
             */
            destroy: function () {
                // 为了避免`dispose()`的时候把`main`置空了，这里先留存一个
                var main = this.main;
                this.dispose();
                lib.removeNode(main);
            },

            /**
             * 获取控件的属性值
             *
             * @param {string} name 属性名
             * @return {Mixed}
             */
            get: function (name) {
                var method = this['get' + lib.pascalize(name)];

                if (typeof method === 'function') {
                    return method.call(this);
                }

                return this[name];
            },

            /**
             * 设置控件的属性值
             *
             * @param {string} name 属性名
             * @param {Mixed} value 属性值
             */
            set: function (name, value) {
                var method = this['set' + lib.pascalize(name)];

                if (typeof method === 'function') {
                    return method.call(this, value);
                }

                var property = {};
                property[name] = value;
                this.setProperties(property);
            },

            /**
             * 判断属性新值是否有变化，内部用于`setProperties`方法
             *
             * @param {string} propertyName 属性名称
             * @param {Mixed} newValue 新值
             * @param {Mixed} oldValue 旧值
             * @return {boolean}
             * @protected
             */
            isPropertyChanged: function (propertyName, newValue, oldValue) {
                // 默认实现将值和当前新值进行简单比对
                return oldValue !== newValue;
            },

            /**
             * 批量设置控件的属性值
             *
             * @param {Object} properties 属性值集合
             * @return {Object} `properties`参数中确实变更了的那些属性
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
                        var newValue = properties[key];
                        var getterMethodName =
                            'get' + lib.pascalize(key) + 'Property';
                        var oldValue = this[getterMethodName]
                            ? this[getterMethodName]()
                            : this[key];

                        var isChanged =
                            this.isPropertyChanged(key, newValue, oldValue);
                        if (isChanged) {
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

                if (changes.length && this.helper.isInStage('RENDERED')) {
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
                if (oldViewContext === viewContext) {
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
                if (this.viewContext && this.helper.isInStage('RENDERED')) {
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
             * 调用该方法同时会让状态对应的属性变为`true`，
             * 从而引起该属性对应的`painter`的执行
             *
             * 状态对应的属性名是指将状态名去除横线并以`camelCase`形式书写的名称，
             * 如`align-left`对应的属性名为`alignLeft`
             *
             * @param {string} state 状态名
             */
            addState: function (state) {
                if (!this.hasState(state)) {
                    this.currentStates[state] = true;
                    this.helper.addStateClasses(state);
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
             * 调用该方法同时会让状态对应的属性变为`false`，
             * 从而引起该属性对应的`painter`的执行
             *
             * 状态对应的属性名是指将状态名去除横线并以`camelCase`形式书写的名称，
             * 如`align-left`对应的属性名为`alignLeft`
             *
             * @param {string} state 状态名
             */
            removeState: function (state) {
                if (this.hasState(state)) {
                    this.currentStates[state] = false;
                    this.helper.removeStateClasses(state);
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
             * 该方法根据当前状态调用{@link Control#addState}或
             * {@link Control#removeState}方法，因此同样会对状态对应的属性进行修改
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
                return !!this.currentStates[state];
            },

            /**
             * 添加子控件
             *
             * @param {Control} control 子控件实例
             * @param {string} [childName] 子控件名
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
                if (this.viewContext !== control.viewContext) {
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
             *
             * @deprecated 将在4.0中移除，使用{@link Helper#disposeChildren}代替
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
             * 获取子控件，无相关子控件则返回{@link SafeWrapper}
             *
             * @param {string} childName 子控件名
             * @return {Control}
             */
            getChildSafely: function (childName) {
                var child = this.getChild(childName);

                if (!child) {
                    var SafeWrapper = require('./SafeWrapper');
                    child = new SafeWrapper();
                    child.childName = childName;
                    child.parent = this;
                    if (this.viewContext) {
                        child.viewContext = this.viewContext;
                    }
                }

                return child;
            },

            /**
             * 批量初始化子控件
             *
             * @param {HTMLElement} [wrap] 容器DOM元素，默认为主元素
             * @param {Object} [options] 初始化的配置参数
             * @param {Object} [options.properties] 属性集合，通过id映射
             * @deprecated 将在4.0中移除，使用{@link Helper#initChildren}代替
             */
            initChildren: function (wrap, options) {
                this.helper.initChildren(wrap, options);
            }
        };

        var EventTarget = require('mini-event/EventTarget');
        lib.inherits(Control, EventTarget);

        return Control;
    }
);
