/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件类常用的helper方法模块
 * @author erik
 */

define(
    function (require) {
        var lib = require('./lib');
        var ui = require('./main');
        var now = (new Date()).getTime();

        /**
         * 获取LifeCycle枚举
         * 
         * @inner
         * @return {Object} 
         */
        function getLifeCycle() {
            return require('./Control').LifeCycle;
        }

        /**
         * 控件类常用的helper方法模块
         * 
         * @type {Object}
         */
        var helper = {};

        /**
         * 获取唯一id
         * 
         * @inner
         * @return {string}
         */
        helper.getGUID = function () {
            return 'esui' + now++;
        };

        /**
         * 初始化控件视图环境
         * 
         * @param {Control} control 控件实例
         */
        helper.initViewContext = function (control) {
            var viewContext = control.viewContext || ui.getViewContext();

            // 因为`setViewContext`里有判断传入的`viewContext`和自身的是否相等，
            // 这里必须制造出**不相等**的情况，再调用`setViewContext`
            control.viewContext = null;
            control.setViewContext(viewContext);
        };

        /**
         * 初始化控件扩展
         * 
         * @param {Control} control 控件实例
         */
        helper.initExtensions = function (control) {
            // 附加全局扩展
            var extensions = control.extensions;
            if (!(extensions instanceof Array)) {
                extensions = control.extensions = [];
            }
            Array.prototype.push.apply(
                extensions, 
                require('./main').createGlobalExtensions()
            );

            // 同类型扩展去重
            var registeredExtensions = {};
            for (var i = 0, len = extensions.length; i < len; i++) {
                var extension = extensions[i];
                if (!registeredExtensions[extension.type]) {
                    extension.attachTo(control);
                    registeredExtensions[extension.type] = true;
                }
            }
        };

        /**
         * 获取控件用于生成css class的类型
         * 
         * @inner
         * @param {Control} control 控件实例
         * @return {string}
         */
        function getControlClassType(control) {
            return control.type.toLowerCase();
        }

        /**
         * 将参数用`-`连接成字符串
         * 
         * @inner
         * @param {string} ...arg 
         * @return {string}
         */
        function joinByStrike() {
            return [].slice.call(arguments, 0).join('-');
        }

        /**
         * 获取控件部件相关的class数组
         *
         * @param {Control} control 控件实例
         * @param {string=} part 部件名称
         * @return {Array.<string>}
         */
        helper.getPartClasses = function (control, part) {
            // main:
            //   ui-{type}
            //   skin-{skinname}
            //   skin-{skinname}-{type}
            // part:
            //   ui-{type}-{part}
            //   skin-{skinname}-{type}-{part}

            var type = getControlClassType(control);
            var skin = control.skin;
            var prefix = ui.getConfig('uiClassPrefix');
            var skinPrefix = ui.getConfig('skinClassPrefix');
            var classes = [];

            if (part) {
                classes.push(joinByStrike(prefix, type, part));
                if (skin) {
                    classes.push(joinByStrike(skinPrefix, skin, type, part));
                }
            }
            else {
                classes.push(joinByStrike(prefix, type));
                if (skin) {
                    classes.push(
                        joinByStrike(skinPrefix, skin),
                        joinByStrike(skinPrefix, skin, type)
                    );
                }
            }

            return classes;
        };

        /**
         * 添加控件部件相关的class
         *
         * @param {Control} control 控件实例
         * @param {string=} part 部件名称
         * @param {HTMLElement=} element 部件元素
         */
        helper.addPartClasses = function (control, part, element) {
            element = element || control.main;
            if (element) {
                lib.addClasses(
                    element,
                    helper.getPartClasses(control, part)
                );
            }
        };

        /**
         * 移除控件部件相关的class
         *
         * @param {Control} control 控件实例
         * @param {string=} part 部件名称
         * @param {HTMLElement=} element 部件元素
         */
        helper.removePartClasses = function (control, part, element) {
            element = element || control.main;
            if (element) {
                lib.removeClasses(
                    element,
                    helper.getPartClasses(control, part)
                );
            }
        };

        /**
         * 获取控件状态相关的class数组
         *
         * @param {Control} control 控件实例
         * @param {string} state 状态名称
         * @return {Array.<string>}
         */
        helper.getStateClasses = function (control, state) {
            // ui-{type}-{statename}
            // state-{statename}
            // skin-{skinname}-{statename}
            // skin-{skinname}-{type}-{statename}
            
            var type = getControlClassType(control);
            var getConf = ui.getConfig;
            var classes = [
                joinByStrike(getConf('uiClassPrefix'), type, state),
                joinByStrike(getConf('stateClassPrefix'), state)
            ];

            var skin = control.skin;
            if (skin) {
                var skinPrefix = getConf('skinClassPrefix');
                classes.push(
                    joinByStrike(skinPrefix, skin, state),
                    joinByStrike(skinPrefix, skin, type, state)
                );
            }
            
            return classes;
        };

        /**
         * 添加控件状态相关的class
         *
         * @param {Control} control 控件实例
         * @param {string} state 状态名称
         */
        helper.addStateClasses = function (control, state) {
            var element = control.main;
            if (element) {
                lib.addClasses(
                    element, 
                    helper.getStateClasses(control, state)
                );
            }
        };

        /**
         * 移除控件状态相关的class
         *
         * @param {Control} control 控件实例
         * @param {string} state 状态名称
         */
        helper.removeStateClasses = function (control, state) {
            var element = control.main;
            if (element) {
                lib.removeClasses(
                    element, 
                    helper.getStateClasses(control, state)
                );
            }
        };

        /**
         * 获取用于控件dom元素的id
         * 
         * @param {Control} control 控件实例
         * @param {string=} part 部件名称
         * @return {string} 
         */
        helper.getId = function (control, part) {
            part = part ? '-' + part : '';
            return 'ctrl-' + control.id + part;
        };

        /**
         * 判断控件是否处于相应的生命周期阶段
         * 
         * @param {Control} control 控件实例
         * @param {string} stage 生命周期阶段
         * @return {boolean}
         */
        helper.isInStage = function (control, stage) {
            var LifeCycle = getLifeCycle();
            if (!LifeCycle[stage]) {
                throw new Error('Invalid life cycle stage: ' + stage);
            }

            return control.stage == LifeCycle[stage];
        };

        /**
         * 改变控件的生命周期阶段
         * 
         * @param {Control} control 控件实例
         * @param {string} stage 生命周期阶段
         */
        helper.changeStage = function (control, stage) {
            var LifeCycle = getLifeCycle();
            if (!LifeCycle[stage]) {
                throw new Error('Invalid life cycle stage: ' + stage);
            }

            control.stage = LifeCycle[stage];
        };

        /**
         * 控件主元素鼠标移入事件处理函数
         * 
         * @inner
         */
        function mainOverHandler() {
            if (!this.isDisabled()) {
                this.addState('hover');
            }
        }

        /**
         * 控件主元素鼠标移出事件处理函数
         * 
         * @inner
         */
        function mainOutHandler() {
            if (!this.isDisabled()) {
                this.removeState('hover');
                this.removeState('press');
            }
        }

        /**
         * 控件主元素鼠标点击按下事件处理函数
         * 
         * @inner
         */
        function mainDownHandler() {
            if (!this.isDisabled()) {
                this.addState('press');
            }
        }

        /**
         * 控件主元素鼠标点击释放事件处理函数
         * 
         * @inner
         */
        function mainUpHandler() {
            if (!this.isDisabled()) {
                this.removeState('press');
            }
        }

        /**
         * 初始化hover状态的行为
         * 
         * @param {Control} control 控件实例
         */
        helper.initMouseBehavior = function (control) {
            var main = control.main;
            if (main) {
                // TODO: 能搞成用addEventListener吗（需要一个DOM事件模块？）
                main.onmouseover = lib.bind(mainOverHandler, control);
                main.onmouseout = lib.bind(mainOutHandler, control);
                main.onmousedown = lib.bind(mainDownHandler, control);
                main.onmouseup = lib.bind(mainUpHandler, control);
            }
        };

        /**
         * 销毁控件
         * 
         * @param {Control} control 控件实例
         */
        helper.dispose = function (control) {
            // 清理子控件
            control.disposeChildren();
            control.children = null;
            control.childrenIndex = null;

            // 移除自身行为
            var main = control.main;
            control.main = null;
            if (main) {
                main.onmouseup = null;
                main.onmousedown = null;
                main.onmouseout = null;
                main.onmouseover = null;
            }
            helper.clearDOMEvents(control);

            // 从控件树中移除
            if (control.parent) {
                control.parent.removeChild(control);
            }

            // 从视图环境移除
            if (control.viewContext) {
                control.viewContext.remove(control);
            }
        };

        /**
         * 执行控件销毁前动作
         * 
         * @param {Control} control 控件实例
         */
        helper.beforeDispose = function (control) {
            control.fire('beforedispose');
        };

        /**
         * 执行控件销毁后动作
         * 
         * @param {Control} control 控件实例
         */
        helper.afterDispose = function (control) {
            helper.changeStage(control, 'DISPOSED');
            control.fire('afterdispose');
        };

        /**
         * 验证输入控件合法性
         * 
         * @param {InputControl} control 输入控件实例
         * @param {boolean} justCheck 是否仅验证，不显示错误信息
         * @return {boolean}
         */
        helper.validate = function (control, justCheck) {
            var Validity = require('./validator/Validity');
            var validity = new Validity();
            var eventArg = {
                validity: validity
            };
            control.fire('beforevalidate', eventArg);

            // 验证合法性
            var rules = ui.createRulesByControl(control);
            for (var i = 0, len = rules.length; i < len; i++) {
                var rule = rules[i];
                validity.addState( 
                    rule.getName(), 
                    rule.check(control.getValue(), control)
                );
            }

            // 触发invalid和aftervalidate事件
            // 这两个事件中用户可能会对validity进行修改操作
            // 所以validity.isValid()结果不能缓存
            if (!validity.isValid()) {
                control.fire('invalid', eventArg);
            }
            control.fire('aftervalidate', eventArg);

            // 提示验证错误信息
            if (!justCheck) {
                helper.showValidity(control, validity);
            }

            return validity.isValid();
        };

        /**
         * 显示控件错误信息
         * 
         * @param {InputControl} control 输入控件实例
         * @param {validate/Validity} validity 验证信息实例
         */
        helper.showValidity = function (control, validity) {
            // TODO: 简单实现了个alert版本，需要重新实现
            // 如果是展现到页面中的dom元素，
            // 需要考虑：当验证合法时，清除或隐藏该dom
            if (!validity.isValid()) {
                var message = [];
                var states = validity.getStates();
                for (var i = 0, len = states.length; i < len; i++) {
                    var state = states[i];
                    if (!state.getState()) {
                        message.push(state.getMessage());
                    }
                }

                alert(message.join('\n'));
            }
        };

        /**
         * 初始化输入控件的name属性
         * 
         * @param {InputControl} control 输入控件实例
         */
        helper.initName = function (control) {
            if (!control.name && control.main) {
                control.name = control.main.getAttribute('name');
            }
        };

        /**
         * 为输入控件创建input元素
         * 
         * @param {Object} options 创建参数
         * @param {string} options.type 输入控件类型
         */
        helper.createInput = function (options) {
            var tagName = 'input';
            var type = options.type;
            if (type == 'textarea') {
                tagName = type;
                type = null;
            }

            var name = options.name;
            var creater = name 
                ? tagName
                : '<' + tagName + ' name="' + name + '">';

            var input = document.createElement(creater); 

            // 非IE浏览器不认createElement( '<input name=...' )
            if (!input) {
                input = document.createElement(tagName);
                name && (input.name = name);
            }

            type && (input.type = type);
            return input;
        };

        var domEventsKey = '_esuiDOMEvent';

        function triggerDOMEvent(control, element, e) {
            e = e || window.event;

            // 每个控件都能在某些状态下不处理DOM事件
            if (control.ignoreStates) {
                for (var i = 0; i < control.ignoreStates.length; i++) {
                    if (control.hasState(control.ignoreStates[i])) {
                        return;
                    }
                }
            }

            if (!e.target) {
                e.target = e.srcElement;
            }
            if (!e.currentTarget) {
                e.currentTarget = element;
            }
            if (!e.preventDefault) {
                e.preventDefault = function () {
                    e.returnValue = false;
                };
            }
            if (!e.stopPropagation) {
                e.stopPropagation = function () {
                    e.cancelBubble = true;
                };
            }
            var queue = 
                control.domEvents[e.currentTarget[domEventsKey]][e.type];
            for (var i = 0; i < queue.length; i++) {
                queue[i].call(control, e);
            }
        }

        /**
         * 为控件管理的DOM元素添加DOM事件
         *
         * @param {Control} control 控件实例
         * @param {HTMLElement} element 需要添加事件的DOM元素
         * @param {string} type 事件的类型
         * @param {function} handler 事件处理函数
         */
        helper.addDOMEvent = function (control, element, type, handler) {
            if (!control.domEvents) {
                control.domEvents = {};
            }

            var guid = element[domEventsKey];
            if (!guid) {
                guid = element[domEventsKey] = helper.getGUID();
            }

            var events = control.domEvents[guid];
            if (!events) {
                // `events`中的键都是事件的名称，仅`element`除外，
                // 因为DOM上没有`element`这个事件，所以这里占用一下没关系
                events = control.domEvents[guid] = { element: element };
            }

            var queue = events[type];
            if (!queue) {
                queue = events[type] = [];
                queue.handler = lib.curry(triggerDOMEvent, control, element);
                if (element.addEventListener) {
                    element.addEventListener(type, queue.handler, false);
                }
                else {
                    element.attachEvent('on' + type, queue.handler);
                }
            }

            queue.push(handler);
        };

        /**
         * 为控件管理的DOM元素添加DOM事件
         *
         * @param {Control} control 控件实例
         * @param {HTMLElement} element 需要添加事件的DOM元素
         * @param {string} type 事件的类型
         * @param {function} handler 事件处理函数
         */
        helper.removeDOMEvent = function (control, element, type, handler) {
            if (!control.domEvents) {
                return;
            }
            
            var guid = element[domEventsKey];
            var events = control.domEvents[guid];

            if (!events || !events[type]) {
                return;
            }

            if (!handler) {
                events[type] = [];
            }
            else {
                var queue = events[type];
                for (var i = 0; i < queue.length; i++) {
                    if (queue[i] === handler) {
                        queue.splice(i, 1);
                        // 可能有重复注册的，所以要继续循环
                        i--;
                    }
                }
            }
        };

        /**
         * 清除控件管理的DOM元素上的事件
         *
         * @param {Control} control 控件实例
         * @param {HTMLElement=} element 控件管理的DOM元素，
         * 如果没有此参数则去除所有该控件管理的元素的DOM事件
         */
        helper.clearDOMEvents = function (control, element) {
            if (!control.domEvents) {
                return;
            }

            if (!element) {
                for (var guid in control.domEvents) {
                    if (control.domEvents.hasOwnProperty(guid)) {
                        var events = control.domEvents[guid];
                        helper.clearDOMEvents(control, events.element);
                    }
                }
                return;
            }

            var guid = element[domEventsKey];
            var events = control.domEvents[guid];
            // `events`中存放着各事件类型，只有`element`属性是一个DOM对象，
            // 因此要删除`element`这个键，
            // 以避免`for... in`的时候碰到一个不是数组类型的值
            delete events.element;
            for (var type in events) {
                if (events.hasOwnProperty(type)) {
                    var handler = events[type].handler;
                    if (element.removeEventListener) {
                        element.removeEventListener(type, handler, false);
                    }
                    else {
                        element.detachEvent('on' + type, handler);
                    }
                }
            }
            delete control.domEvents[guid];
        };

        /**
         * 通过`painter`对象创建`repaint`方法
         *
         * @param {function=} supterRepaint 父类的`repaint`方法
         * @param {...Object} args `painter`对象
         * @return {function} `repaint`方法的实现
         */
        helper.createRepaint = function (superRepaint) {
            var hasSuperRepaint = typeof superRepaint === 'function';
            var painters = [].concat.apply(
                [], [].slice.call(arguments, hasSuperRepaint ? 1 : 0));
            var map = {};
            for (var i = 0; i < painters.length; i++) {
                map[painters[i].name] = painters[i];
            }

            return function (changes, changesIndex) {
                if (hasSuperRepaint) {
                    superRepaint.apply(this, arguments);
                }

                // 临时索引，不能直接修改`changesIndex`，会导致子类的逻辑错误
                var index = changesIndex ? lib.clone(changesIndex) : {};
                for (var i = 0; i < painters.length; i++) {
                    var painter = painters[i];
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

        var layer = helper.layer = {};
        var zIndexStack = 1000;

        // 统一方法
        function render(element, options) {
            var properties = require('./lib').clone(options || {});

            // 如果同时有`top`和`bottom`，则计算出`height`来
            if (properties.hasOwnProperty('top')
                && properties.hasOwnProperty('bottom')
            ) {
                properties.height = properties.bottom - properties.top;
                delete properties.bottom;
            }
            // 同样处理`left`和`right`
            if (properties.hasOwnProperty('left')
                && properties.hasOwnProperty('right')
            ) {
                properties.width = properties.right - properties.left;
                delete properties.right;
            }

            // 避免原来的属性影响
            if (properties.hasOwnProperty('top')
                || properties.hasOwnProperty('bottom')
            ) {
                element.style.top = '';
                element.style.bottom = '';
            }

            if (properties.hasOwnProperty('left')
                || properties.hasOwnProperty('right')
            ) {
                element.style.left = '';
                element.style.right = '';
            }

            // 设置位置和大小
            for (var name in properties) {
                if (properties.hasOwnProperty(name)) {
                    element.style[name] = properties[name] + 'px';
                }
            }
        }

        /**
         * 创建层元素
         *
         * @param {string=} tagName 元素的标签名，默认为`div`
         * @return {HTMLElement}
         */
        layer.create = function (tagName) {
            var element = document.createElement(tagName || 'div');
            element.style.position = 'absolute';
            return element;
        };

        /**
         * 将当前层移到最前
         *
         * @param {HTMLElement} element 目标层元素
         * @public
         */
        layer.moveToTop = function (element) {
            element.style.zIndex = ++zIndexStack;
        };

        /**
         * 移动层的位置
         *
         * @param {HTMLElement} element 目标层元素
         * @param {number} top 上边界
         * @param {number} left 左边界
         * @public
         */
        layer.moveTo = function (element, top, left) {
            render(element, { top: top, left: left });
        };

        /**
         * 缩放层的大小
         *
         * @param {HTMLElement} element 目标层元素
         * @param {number} width 宽度
         * @param {number} height 高度
         * @public
         */
        layer.resize = function (element, width, height) {
            render(element, { width: width, height: height });
        };

        /**
         * 让当前层靠住一个元素
         *
         * @param {HTMLElement} element 目标层元素
         * @param {HTMLElement} target 目标元素
         * @param {Object=} options 停靠相关的选项
         * @param {string=} options.top 指示当前层的上边缘靠住元素的哪个边，
         * 可选值为**top**或**bottom**
         * @param {string=} options.bottom 指示当前层的下边缘靠住元素的哪个边，
         * 可选值为**top**或**bottom**，* 当`top`值为**bottom**时，该值无效
         * @param {string=} options.left 指示当前层的左边缘靠住元素的哪个边，
         * 可选值为**left**或**right**
         * @param {string=} options.right 指示当前层的下边缘靠住元素的哪个边，
         * 可选值为**left**或**right**，* 当`left`值为**right**时，该值无效
         * @param {number=} options.width 指定层的宽度
         * @param {number=} options.height 指定层的高度
         * @public
         */
        layer.attachTo = function (element, target, options) {
            options = options || { left: 'left', top: 'top' };
            var lib = require('./lib');
            var offset = lib.getOffset(target);
            // 有2种特殊的情况：
            // 
            // -`{ top: 'top', bottom: 'bottom' }`
            // -`{ left: 'left', right: 'right' }`
            // 
            // 这两种情况下，要计算出宽和高来，且覆盖掉提供的宽高
            var config = lib.clone(options);
            if (config.top === 'top' && config.bottom === 'bottom') {
                config.height = offset.height;
                config.bottom = null;
            }
            if (config.left === 'left' && config.right === 'right') {
                config.width = offset.width;
                config.right = null;
            }

            var properties = {};
            if (config.width) {
                properties.width = config.width;
            }
            if (config.height) {
                properties.height = config.height;
            }

            if (config.left) {
                properties.left = offset[config.left];
            }
            else if (config.right) {
                properties.right = offset[config.right];
            }

            if (config.top) {
                properties.top = offset[config.top];
            }
            else if (config.bottom) {
                properties.bottom = offset[config.bottom];
            }

            render(element, properties);
        };

        /**
         * 将层在视图中居中
         *
         * @param {HTMLElement} element 目标层元素
         * @param {Object=} options 相关配置项
         * @param {number=} options.width 指定层的宽度
         * @param {number=} options.height 指定层的高度
         * @param {number=} options.minTop 如果层高度超过视图高度，
         * 则留下该值的上边界保底
         * @param {number=} options.minLeft 如果层宽度超过视图高度，
         * 则留下该值的左边界保底
         * @public
         */
        layer.centerToView = function (element, options) {
            var lib = require('./lib');
            var properties = options ? lib.clone(options) : {};

            if (typeof properties.width !== 'number') {
                properties.width = this.width;
            }
            if (typeof properties.height !== 'number') {
                properties.height = this.height;
            }

            properties.left = (lib.page.getViewWidth() - properties.width) / 2;

            var viewHeight = lib.page.getViewHeight();
            if (properties.height >= viewHeight && 
                options.hasOwnProperty('minTop')
            ) {
                properties.top = options.minTop;
            }
            else {
                properties.top = 
                    Math.floor((viewHeight - properties.height) / 2);
            }

            var viewWidth = lib.page.getViewWidth();
            if (properties.height >= viewWidth && 
                options.hasOwnProperty('minLeft')
            ) {
                properties.left = options.minLeft;
            }
            else {
                properties.left = 
                    Math.floor((viewWidth - properties.width) / 2);
            }

            properties.top += lib.page.getScrollTop();
            this.setProperties(properties);
        };

        return helper;
    }
);
