/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件类常用的helper方法模块
 * @author erik, otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var ui = require('./main');
        var counter = 0x861005;

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
         * @param {string} prefix 前缀
         * @return {string}
         */
        helper.getGUID = function (prefix) {
            prefix = prefix || 'esui';
            return prefix + counter++;
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
            //   ui-ctrl 为了定义有限全局的normalize
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
                classes.push('ui-ctrl');
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
            if (!control.domIDPrefix) {
                control.domIDPrefix = 
                    control.viewContext && control.viewContext.id;
            }
            var prefix = control.domIDPrefix
                ? control.domIDPrefix+ '-'
                : '';
            return 'ctrl-' + prefix + control.id +　part;
        };

        /**
         * 判断控件是否处于相应的生命周期阶段
         * 
         * @param {Control} control 控件实例
         * @param {string} stage 生命周期阶段
         * @return {boolean}
         */
        helper.isInStage = function (control, stage) {
            if (LifeCycle[stage] == null) {
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
            if (LifeCycle[stage] == null) {
                throw new Error('Invalid life cycle stage: ' + stage);
            }

            control.stage = LifeCycle[stage];
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
            helper.clearDOMEvents(control);

            // 从控件树中移除
            if (control.parent) {
                control.parent.removeChild(control);
            }

            // 从视图环境移除
            if (control.viewContext) {
                control.viewContext.remove(control);
            }

            control.renderOptions = null;
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

        var domEventsKey = '_esuiDOMEvent';
        var globalEvents = {
            window: {},
            document: {},
            documentElement: {},
            body: {}
        };

        function getGlobalEventPool(element) {
            if (element === window) {
                return globalEvents.window;
            }
            if (element === document) {
                return globalEvents.document;
            }
            if (element === document.documentElement) {
                return globalEvents.documentElement;
            }
            if (element === document.body) {
                return globalEvents.body;
            }

            return null;
        }

        function triggerGlobalDOMEvent(element, e) {
            var pool = getGlobalEventPool(element);
            if (!pool) {
                return;
            }

            var queue = pool[e.type];
            for (var i = 0; i < queue.length; i++) {
                var control = queue[i];
                triggerDOMEvent(control, element, e);
            }
        }

        function addGlobalDOMEvent(control, type, element) {
            var pool = getGlobalEventPool(element);

            if (!pool) {
                return false;
            }

            var controls = pool[type];
            if (!controls) {
                controls = pool[type] = [];
                controls.handler = lib.curry(triggerGlobalDOMEvent, element);
                lib.on(element, type, controls.handler);
            }

            for (var i = 0; i < controls.length; i++) {
                if (controls[i] === control) {
                    return true;
                }
            }

            controls.push(control);
            return true;
        }

        function removeGlobalDOMEvent(control, type, element) {
            var pool = getGlobalEventPool(element);

            if (!pool) {
                return false;
            }

            if (!pool[type]) {
                return true;
            }

            var controls = pool[type];
            for (var i = 0; i < controls.length; i++) {
                if (controls[i] === control) {
                    controls.splice(i, 1);
                    break;
                }
            }
            // 尽早移除事件
            if (!controls.length) {
                var handler = controls.handler;
                lib.un(element, type, handler);
                pool[type] = null;
            }

            return true;
        }

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

            var isGlobal = addGlobalDOMEvent(control, type, element);
            var queue = events[type];
            if (!queue) {
                queue = events[type] = [];
                // 非全局事件是需要自己管理一个处理函数的，以便到时候解除事件绑定
                if (!isGlobal) {
                    queue.handler = 
                        lib.curry(triggerDOMEvent, control, element);
                    lib.on(element, type, queue.handler);
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
                events[type].length = 0;
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

                // 全局元素上的事件很容易冒泡到后执行，
                // 在上面的又都是`mousemove`这种不停执行的，
                // 因此对全局事件做一下处理，尽早移除
                if (!queue.length) {
                    removeGlobalDOMEvent(control, type, element);
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
                    // 全局事件只要清掉在`globalEvents`那边的注册关系
                    var isGlobal = removeGlobalDOMEvent(control, type, element);
                    if (!isGlobal) {
                        var handler = events[type].handler;
                        events[type].handler = null; // 防内存泄露
                        lib.un(element, type, handler);
                    }
                }
            }
            delete control.domEvents[guid];
        };

        /**
         * 替换控件的主元素中提取信息(name value disabled readonly)
         *
         * @param {Control} control 控件实例
         * @param {Object} options 需要更新的参数
         * @return {Object} 提取到的value和name
         */
        helper.extractValueFromInput = function (control, options) {
            var main = control.main;
            // 如果是输入元素
            if (lib.isInput(main)) {
                if (main.value && !options.value) {
                    options.value = main.value;
                }
                if (main.name && !options.name) {
                    options.name = main.name;
                }
                if (main.disabled 
                    && (options.disabled === null
                        || options.disabled === undefined)) {
                    options.disabled = main.disabled;
                }
                if (main.readOnly 
                    && (options.readOnly === null
                        || options.readOnly === undefined)) {
                    options.readOnly = main.readonly || main.readOnly;
                }
            }
        };

        /**
         * 替换控件的主元素
         *
         * @param {Control} control 控件实例
         * @param {HTMLElement=} main 用于替换的主元素
         * @parma {HTMLElement=} 原来的主元素
         */
        helper.replaceMain = function (control, main) {
            main = main || control.createMain();
            var initialMain = control.main;

            // 欺骗一下`main`模块，让它别再次对原主元素进行控件创建
            initialMain.setAttribute(
                ui.getConfig('instanceAttr'),
                helper.getGUID()
            );
            
            lib.insertBefore(main, initialMain);
            initialMain.parentNode.removeChild(initialMain);
            control.main = main;

            return initialMain;
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
                var index = lib.extend({}, changesIndex);
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
         * 获取层应当使用的`z-index`的值
         *
         * @param {HTMLElement=} owner 层的所有者元素
         * @return {number}
         */
        layer.getZIndex = function (owner) {
            var zIndex = 0;
            while (!zIndex && owner && owner !== document) {
                zIndex = 
                    parseInt(lib.getComputedStyle(owner, 'z-index'), 10);
                owner = owner.parentNode;
            }
            zIndex = zIndex || 0;
            return zIndex + 1;
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

            // 浮层的存在会影响页面高度计算，必须先让它消失，
            // 但在消失前，又必须先计算到浮层的正确高度
            var previousDisplayValue = element.style.display;
            element.style.display = 'block';
            var elementHeight = element.offsetHeight;
            var elementWidth = element.offsetWidth;
            element.style.display = 'none';

            // 有2种特殊的情况：
            // 
            // -`{ top: 'top', bottom: 'bottom' }`
            // -`{ left: 'left', right: 'right' }`
            // 
            // 这两种情况下，要计算出宽和高来，且覆盖掉提供的宽高
            var config = lib.clone(options);

            // 如果要靠住某一边，且要检测剩余空间，则那个边空间不够，就要移到另一边
            if (config.spaceDetection === 'vertical'
                || config.spaceDetection === 'both') {
                // 对纵向的策略如下：
                // 
                // - 如果指定`top === 'bottm'`，则尝试放下面，放不了就放上面
                // - 如果指定`bottom === 'top'`，则尝试放上面，放不下就放下面
                // - 如果指定`top === 'top'`，则尝试上边对齐，不行就下边对齐
                // - 如果指定`bottom === 'bottom`'，则尝试下边对齐，不行就上边对齐
                if (config.top === 'bottom') {
                    var pageHeight = lib.page.getHeight();
                    if (pageHeight - offset.bottom <= elementHeight) {
                        config.top = null;
                        config.bottom = 'top';
                    }
                }
                else if (config.bottom === 'top') {
                    if (offset.top <= elementHeight) {
                        config.top = 'bottom';
                        config.bottom = null;
                    }
                }
                else if (config.top === 'top') {
                    var pageHeight = lib.page.getHeight();
                    if (pageHeight - offset.top <= elementHeight) {
                        config.top = null;
                        config.bottom = 'bottom';
                    }
                }
                else if (config.bottom === 'bottom') {
                    if (offset.bottom <= elementHeight) {
                        config.top = 'top';
                        config.bottom = null;
                    }
                }
            }
            if (config.spaceDetection === 'horizontal'
                || config.spaceDetection === 'both') {
                // 对横向的策略如下：
                // 
                // - 如果指定`left === 'right'`，则尝试放右边，放不了就放左边
                // - 如果指定`right === 'left'`，则尝试放左边，放不下就放右边
                // - 如果指定`left === 'left'`，则尝试左边对齐，不行就右边对齐
                // - 如果指定`right === 'right`'，则尝试右边对齐，不行就左边对齐
                if (config.left === 'right') {
                    var pageWidth = lib.page.getWidth();
                    if (pageWidth - offset.right <= elementWidth) {
                        config.left = null;
                        config.right = 'left';
                    }
                }
                else if (config.right === 'left') {
                    if (offset.left <= elementWidth) {
                        config.left = 'right';
                        config.right = null;
                    }
                }
                else if (config.left === 'left') {
                    var pageWidth = lib.page.getWidth();
                    if (pageWidth - offset.left <= elementWidth) {
                        config.left = null;
                        config.right = 'right';
                    }
                }
                else if (config.right === 'right') {
                    if (offset.right <= elementWidth) {
                        config.left = 'left';
                        config.right = null;
                    }
                }
            }

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
                properties.left = offset[config.right] - elementWidth;
            }

            if (config.top) {
                properties.top = offset[config.top];
            }
            else if (config.bottom) {
                properties.top = offset[config.bottom] - elementHeight;
            }

            element.style.display = previousDisplayValue;
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
