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
         * 处理控件相关dom元素的class操作
         * 
         * @inner
         * @param {string} type 操作类型，add|remove
         * @param {HTMLElement} element dom元素
         * @param {Control} control 控件实例
         * @param {string=} part 部件名称
         */
        function processClass(type, element, control, part) {
            var classes = helper.getClasses(control, part);

            for (var i = 0; i < classes.length; i++) {
                lib[type + 'Class'](element, classes[i]);
            }
        }

        /**
         * 为控件相关dom元素添加class
         * 
         * @param {Control} control 控件实例
         * @param {HTMLElement} element dom元素
         * @param {string=} part 部件名称
         */
        helper.addClass = function (control, element, part) {
            processClass('add', element, control, part);
        };

        /**
         * 为控件相关dom元素移除class
         * 
         * @param {Control} control 控件实例
         * @param {HTMLElement} element dom元素
         * @param {string=} part 部件名称
         */
        helper.removeClass = function (control, element, part) {
            processClass('remove', element, control, part);
        };

        /**
         * 获取用于控件dom元素的class
         * 如果控件设置了skin则返回数组中包含皮肤className
         * 
         * @param {Control} control 控件实例
         * @param {string=} part 部件名称
         * @return {Array} 
         */
        helper.getClasses = function (control, part) {
            part = part ? '-' + part : '';

            var uiPrefix = ui.getConfig('uiClassPrefix');
            var skinPrefix = ui.getConfig('skinClassPrefix');

            var type = control.type.toLowerCase();
            var classes = [ uiPrefix + '-' + type + part ];
            //part && classes.push(uiPrefix + part);

            var skin = control.skin;
            if (skin) {
                classes.push(skinPrefix + '-' + type + '-' + skin + part);
            }

            return classes;
        };

        /**
         * 获取控件组件的class数组
         *
         * @param {Control} control 控件实例
         * @param {string} part 组件名称
         * @return {Array.<string>}
         */
        helper.getPartClasses = function (control, part) {
            var type = control.type.replace(
                /[A-Z]/g,
                function (alpha) {
                    return '-' + alpha.toLowerCase();
                }
            );
            if (type.charAt(0) === '-') {
                type = type.substring(1);
            }
            return [
                'ui-' + type + '-' + part,
                'skin-' + control.skin + '-' + type + '-' + part
            ];
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
         * 判断控件是否处于inited生命周期
         * 
         * @param {Control} control 控件实例
         * @return {boolean}
         */
        helper.isInited = function (control) {
            return control.lifeCycle == getLifeCycle().INITED;
        };

        /**
         * 判断控件是否处于rendered生命周期
         * 
         * @param {Control} control 控件实例
         * @return {boolean}
         */
        helper.isRendered = function (control) {
            return control.lifeCycle == getLifeCycle().RENDERED;
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
            control.lifeCycle = getLifeCycle().DISPOSED;
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

        return helper;
    }
);
