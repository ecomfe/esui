/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 提示层
 * @author dbear
 */

define(
    function (require) {
        require('./Button');
        require('./Label');
        require('./Panel');

        var u = require('underscore');
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var ui = require('./main');
        var paint = require('./painters');

        /**
         * 提示层控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function TipLayer(options) {
            Control.apply(this, arguments);
        }

        /**
         * 渲染控件前重绘控件
         *
         */
        function parseMain(options) {
            var main = options.main;
            // 如果main未定义，则不作解析
            if (!main) {
                return;
            }
            var els = lib.getChildren(main);
            var len = els.length;
            var roleName;
            var roles = {};

            while (len--) {
                roleName = els[len].getAttribute('data-role');
                if (roleName) {
                    // 不再校验，如果设置了相同的data-role，
                    // 直接覆盖
                    roles[roleName] = els[len];
                }
            }

            options.roles = roles;

        }

        /**
         * 构建提示层标题栏
         *
         * @param {ui.TipLayer} 控件对象
         * @param {HTMLElement} mainDOM head主元素
         * @inner
         */
        function createHead(control, mainDOM) {
            if (mainDOM) {
                control.title = mainDOM.innerHTML;
            }
            else {
                mainDOM = document.createElement('h3');
                if (control.main.firstChild) {
                    lib.insertBefore(mainDOM, control.main.firstChild);
                }
                else {
                    control.main.appendChild(mainDOM);
                }
            }
            var headClasses = [].concat(
                helper.getPartClasses(control, 'title')
            );
            lib.addClasses(mainDOM, headClasses);
            var properties = {
                main: mainDOM,
                childName: 'title'
            };
            var label = ui.create('Label', properties);
            label.render();
            control.addChild(label);
            return label;

        }

        /**
         * 构建提示层主内容和底部内容
         *
         * @param {ui.TipLayer} control 控件
         * @param {string} type foot | body
         * @param {HTMLElement} mainDOM body或foot主元素
         * @inner
         */
        function createBF(control, type, mainDOM) {
            if (mainDOM) {
                control.content = mainDOM.innerHTML;
            }
            else {
                mainDOM = document.createElement('div');
                if (type === 'body') {
                    // 找到head
                    var head = control.getChild('title');
                    if (head) {
                        lib.insertAfter(mainDOM, head.main);
                    }
                    // 放到第一个
                    else if (control.main.firstChild) {
                        lib.insertBefore(
                            mainDOM, head, control.main.firstChild
                        );
                    }
                    else {
                        control.main.appendChild(mainDOM);
                    }
                }
                else {
                    control.main.appendChild(mainDOM);
                }
            }

            lib.addClasses(
                mainDOM,
                helper.getPartClasses(control, type + '-panel')
            );
            var properties = {
                main: mainDOM,
                renderOptions: control.renderOptions
            };

            var panel = ui.create('Panel', properties);
            panel.render();
            control.addChild(panel, type);
            return panel;
        }

        /**
         * 页面resize时事件的处理函数
         *
         * @param {ui.TipLayer} tipLayer 控件
         * @param {HTMLElement} targetElement 提示层绑定元素
         * @param {object} 定位参数
         * @inner
         */
        function resizeHandler(tipLayer, targetElement, options) {
            // 隐藏状态不触发
            if (!tipLayer.isShow) {
                return;
            }
            tipLayer.autoPosition(
                targetElement,
                options
            );
        }

        /**
         * 默认延迟展现时间
         * @type {number}
         */
        var DEFAULT_DELAY_SHOW = 0;

        /**
         * 默认延迟隐藏时间
         * @type {number}
         */
        var DEFAULT_DELAY_HIDE = 150;

        /**
         * 延迟展现
         *
         * @param {ui.TipLayer} tipLayer 控件
         * @param {number} delayTime 延迟时间
         * @param {HTMLElement} targetElement 绑定元素
         * @param {Object=} options 构造函数传入的参数
         * @inner
         */
        function delayShow(tipLayer, delayTime, targetElement, options) {
            delayTime = delayTime || DEFAULT_DELAY_SHOW;
            if (delayTime) {
                clearTimeout(tipLayer.showTimeout);
                clearTimeout(tipLayer.hideTimeout);
                tipLayer.showTimeout = setTimeout(
                    lib.bind(tipLayer.show, tipLayer, targetElement, options),
                    delayTime
                );
            }
            else {
                tipLayer.show(targetElement, options);
            }
        }

        /**
         * 延迟隐藏
         *
         * @param {ui.TipLayer} tipLayer 控件
         * @param {number=} delayTime 延迟时间
         * @inner
         */
        function delayHide(tipLayer, delayTime) {
            delayTime = delayTime || DEFAULT_DELAY_HIDE;
            clearTimeout(tipLayer.showTimeout);
            clearTimeout(tipLayer.hideTimeout);
            tipLayer.hideTimeout =
                setTimeout(lib.bind(tipLayer.hide, tipLayer), delayTime);
        }

        function getElementByControl(tipLayer, control) {
            if (typeof control === 'string') {
                control = tipLayer.viewContext.get(control);
            }
            return control.main;
        }

        TipLayer.prototype = {
            /**
             * 控件类型
             *
             * @type {string}
             */
            type: 'TipLayer',

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                //由main解析
                parseMain(options);
                /**
                 * 默认TipLayer选项配置
                 */
                var properties = {
                    roles: {}
                };

                lib.extend(properties, options);
                this.setProperties(properties);
            },

            /**
             * 初始化DOM结构，仅在第一次渲染时调用
             */
            initStructure: function () {
                var main = this.main;
                // 判断main是否在body下，如果不在，要移到body下
                if (main.parentNode
                    && main.parentNode.nodeName.toLowerCase() !== 'body') {
                    document.body.appendChild(main);
                }

                // 设置样式
                this.main.style.left = '-10000px';

                // 不是所有的提示层都需要title
                if (this.title || this.roles.title) {
                    createHead(this, this.roles.title);
                }
                createBF(this, 'body', this.roles.content);

                // 不是所有的提示层都需要foot
                if (this.foot || this.roles.foot) {
                    createBF(this, 'foot', this.roles.foot);
                }


                if (this.arrow) {
                    var arrow = document.createElement('div');
                    // 初始化箭头
                    arrow.id = helper.getId(this, 'arrow');
                    arrow.className =
                        helper.getPartClasses(this, 'arrow').join(' ');
                    this.main.appendChild(arrow);
                }
            },



            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: helper.createRepaint(
                Control.prototype.repaint,
                paint.style('width'),
                {
                    name: 'title',
                    paint: function (tipLayer, value) {
                        // 取消了title
                        var head = tipLayer.getHead();
                        if (value == null) {
                            if (head) {
                                tipLayer.removeChild(head);
                            }
                        }
                        else {
                            if (!head) {
                                head = createHead(tipLayer);
                            }
                            head.setText(value);
                        }
                    }
                },
                {
                    name: 'content',
                    paint: function (tipLayer, value) {
                        var bfTpl = ''
                            + '<div class="${class}" id="${id}">'
                            + '${content}'
                            + '</div>';
                        // 获取body panel
                        var body = tipLayer.getBody();
                        var bodyId = helper.getId(tipLayer, 'body');
                        var bodyClass = helper.getPartClasses(tipLayer, 'body');
                        var data = {
                            'class': bodyClass.join(' '),
                            'id': bodyId,
                            'content': value
                        };
                        body.setContent(
                            lib.format(bfTpl, data)
                        );
                    }
                },
                {
                    name: 'foot',
                    paint: function (tipLayer, value) {
                        var bfTpl = ''
                            + '<div class="${class}" id="${id}">'
                            + '${content}'
                            + '</div>';
                        var footId = helper.getId(tipLayer, 'foot');
                        var footClass = helper.getPartClasses(tipLayer, 'foot');
                        // 取消了foot
                        var foot = tipLayer.getFoot();
                        if (value == null) {
                            if (foot) {
                                tipLayer.removeChild(foot);
                            }
                        }
                        else {
                            var data = {
                                'class': footClass.join(' '),
                                'id': footId,
                                'content': value
                            };
                            if (!foot) {
                                foot = createBF(tipLayer, 'foot');
                            }
                            foot.setContent(
                                lib.format(bfTpl, data)
                            );
                        }
                    }
                },
                {
                    name: [
                        'targetDOM', 'targetControl',
                        'showMode', 'positionOpt', 'delayTime', 'showDuration'
                    ],
                    paint:
                        function (tipLayer, targetDOM, targetControl,
                            showMode, positionOpt, delayTime, showDuration) {
                        var options = {
                            targetDOM: targetDOM,
                            targetControl: targetControl,
                            showMode: showMode,
                            delayTime: delayTime || DEFAULT_DELAY_SHOW,
                            showDuration: showDuration || DEFAULT_DELAY_HIDE
                        };
                        if (positionOpt) {
                            positionOpt = positionOpt.split('|');
                            options.positionOpt = {
                                top: positionOpt[0] || 'top',
                                right: positionOpt[1] || 'left'
                            };
                        }
                        tipLayer.attachTo(options);
                    }
                }
            ),

            /**
             * 让当前层靠住一个元素
             *
             * @param {HTMLElement} target 目标元素
             * @param {Object=} options 停靠相关的选项
             * @param {string=} options.top 指示目标的上边缘靠住当前层的哪个边，
             * 可选值为**top**或**bottom**
             * @param {string=} options.bottom 指示目标的下边缘靠住当前层的哪个边，
             * 可选值为**top**或**bottom**，* 当`top`值为**bottom**时，该值无效
             * @param {string=} options.left 指示目标的左边缘靠住当前层的哪个边，
             * 可选值为**left**或**right**
             * @param {string=} options.right 指示目标的右边缘靠住当前层的哪个边，
             * 可选值为**left**或**right**，* 当`left`值为**right**时，该值无效
             * @param {number=} options.width 指定层的宽度
             * @param {number=} options.height 指定层的高度
             * @public
             */
            autoPosition: function (target, options) {
                var tipLayer = this;
                var element = this.main;
                options = options || { left: 'right', top: 'top' };

                var rect = target.getBoundingClientRect();
                var offset = lib.getOffset(target);
                var targetPosition = {
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    left: rect.left,
                    width: rect.right - rect.left,
                    height: rect.bottom - rect.top
                };

                // 浮层的存在会影响页面高度计算，必须先让它消失，
                // 但在消失前，又必须先计算到浮层的正确高度
                var previousDisplayValue = element.style.display;
                element.style.display = 'block';
                var elementHeight = element.offsetHeight;
                var elementWidth = element.offsetWidth;
                element.style.display = 'none';

                var config = u.omit(options, 'targetControl');

                var viewWidth = lib.page.getViewWidth();
                var viewHeight = lib.page.getViewHeight();

                // 计算出所有的位置
                // 目标元素 —— 层元素
                // left —— right
                var gapLR = targetPosition.left - elementWidth;
                // right —— left
                var gapRL = viewWidth - targetPosition.right - elementWidth;

                // top —— top
                var gapTT = viewHeight - targetPosition.top - elementHeight;
                // bottom —— bottom
                var gapBB = targetPosition.bottom - elementHeight;


                if (gapLR >= 0) {
                    if (gapRL >= 0){
                        // 如果没有设置，哪边大放哪边
                        if (!config.right && !config.left) {
                            if (gapRL < gapLR) {
                                config.left = 'right';
                                config.right = null;
                            }
                            else {
                                config.right = 'left';
                                config.left = null;
                            }
                        }
                    }
                    else {
                        config.left = 'right';
                        config.right = null;
                    }
                }
                else {
                    config.right = 'left';
                    config.left = null;
                }

                if (gapTT >= 0) {
                    if (gapBB >= 0){
                        // 如果没有设置，哪边大放哪边
                        if (!config.bottom && !config.top) {
                            if (gapBB < gapTT) {
                                config.top = 'top';
                                config.bottom = null;
                            }
                            else {
                                config.bottom = 'bottom';
                                config.top = null;
                            }
                        }
                    }
                    else {
                        config.top = 'top';
                        config.bottom = null;
                    }
                }
                else {
                    config.bottom = 'bottom';
                    config.top = null;
                }

                var properties = {};
                var arrowClass;
                if (config.right) {
                    properties.left = offset.right;
                    if (config.top) {
                        arrowClass = 'lt';
                    }
                    else {
                        arrowClass = 'lb';
                    }
                }
                else if (config.left) {
                    properties.left = offset.left - elementWidth;
                    if (config.top) {
                        arrowClass = 'rt';
                    }
                    else {
                        arrowClass = 'rb';
                    }
                }

                if (config.top) {
                    properties.top = offset.top;
                }
                else if (config.bottom) {
                    properties.top = offset.bottom - elementHeight;
                }

                element.style.display = previousDisplayValue;

                element.className = ''
                    + helper.getPartClasses(tipLayer).join(' ')
                    + ' '
                    + helper.getPartClasses(tipLayer, arrowClass).join(' ');

                var arrow = lib.g(helper.getId(tipLayer, 'arrow'));
                if (arrow) {
                    arrow.className = ''
                        + helper.getPartClasses(tipLayer, 'arrow').join(' ')
                        + ' '
                        + helper.getPartClasses(
                            tipLayer, 'arrow' + '-' + arrowClass
                        ).join(' ');
                }
                tipLayer.renderLayer(element, properties);
            },

            /**
             * 渲染层样式
             *
             * @param {HTMLElement} element 提示层元素
             * @param {object} 定位参数
             * @inner
             */
            renderLayer: function (element, options) {
                var properties = lib.clone(options || {});

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
            },
            /**
             * 将提示层捆绑到一个DOM元素或控件上
             *
             * @param {Object=} options 绑定参数
             *    {string} showMode 展示触发模式
             *    {string} targetDOM 绑定元素的id
             *    {ui.Control | string} targetControl 绑定控件的实例或id
             *    {number} delayTime 延迟展示时间
             *    {number} showDuration 展示后自动隐藏的延迟时间
             *    {Object=} positionOpt 层布局参数
             */
            attachTo: function (options) {
                var showMode = options.showMode || 'over';

                var targetElement;
                if (options.targetDOM) {
                    targetElement = lib.g(options.targetDOM);
                }
                else if (options.targetControl) {
                    targetElement =
                        getElementByControl(this, options.targetControl);
                }

                if (!targetElement) {
                    return;
                }

                switch (showMode) {
                    case 'auto':
                        this.initAutoMode(options);
                        break;
                    case 'over':
                        this.initOverMode(options);
                        break;
                    case 'click':
                        this.initClickMode(options);
                        break;
                }
            },

            /**
             * 获取初始化时的事件方法集
             *
             * @param {Object=} options 绑定参数
             *    {string} showMode 展示触发模式
             *    {string} targetDOM 绑定元素的id
             *    {ui.Control | string} targetControl 绑定控件的实例或id
             *    {number} delayTime 延迟展示时间
             *    {number} showDuration 展示后自动隐藏的延迟时间
             *    {Object=} positionOpt 层布局参数
             * @returns {Object}
             */
            getInitHandlers: function (options) {
                var me = this;

                var targetElement;
                if (options.targetDOM) {
                    targetElement = lib.g(options.targetDOM);
                }
                else if (options.targetControl) {
                    targetElement =
                        getElementByControl(this, options.targetControl);
                }

                if (!targetElement) {
                    return;
                }

                // 处理方法集
                var handler = {
                    targetElement: targetElement,
                    // 浮层相关方法
                    layer: {
                        /**
                         * 展现浮层
                         */
                        show: lib.curry(
                            delayShow, me, options.delayTime,
                            targetElement, options.positionOpt
                        ),

                        /**
                         * 隐藏浮层
                         */
                        hide: lib.curry(delayHide, me),

                        /**
                         * 绑定浮层展现的默认事件，针对于targetDOM
                         * @param {string=} showEvent 事件名称，例如click、mouseup
                         * @param {Function=} callback 回调方法
                         */
                        bind: function (showEvent, callback) {
                            showEvent = showEvent || 'mouseup';
                            // 配置展现的触发事件
                            helper.addDOMEvent(
                                me, targetElement, showEvent, function (e) {
                                    handler.layer.show();
                                    // 点击其他区域隐藏事件绑定
                                    handler.clickOutsideHide.bind();
                                    if (typeof callback == 'function') {
                                        callback();
                                    }
                                    e.stopPropagation();
                                }
                            );
                        }
                    },

                    /**
                     * 点击外部隐藏浮层的相应处理
                     */
                    clickOutsideHide: {
                        /**
                         * 绑定于浮层元素上的阻止冒泡的方法
                         */
                        preventPopMethod: function (e) {
                            e.stopPropagation();
                        },

                        /**
                         * 绑定于body主体上面的隐藏layer的方法
                         */
                        method: function () {
                            handler.layer.hide();
                            handler.clickOutsideHide.unbind();
                        },

                        /**
                         * 绑定
                         */
                        bind: function () {
                            helper.addDOMEvent(
                                me, document.documentElement,
                                'mouseup',
                                handler.clickOutsideHide.method
                            );

                            // 为主体layer元素配置阻止冒泡，防止点击关闭
                            helper.addDOMEvent(
                                me, me.main, 'mouseup',
                                handler.clickOutsideHide.preventPopMethod
                            );
                        },

                        /**
                         * 解除绑定
                         */
                        unbind: function () {
                            helper.removeDOMEvent(
                                me, document.documentElement,
                                'mouseup',
                                handler.clickOutsideHide.method
                            );
                            helper.removeDOMEvent(
                                me, me.main, 'mouseup',
                                handler.clickOutsideHide.preventPopMethod
                            );
                        }
                    }
                };

                return handler;
            },

            /**
             * 在绑定提示层至目标DOM时，初始化自动展现（showMode为auto）的相应行为
             *
             * @param {Object=} options 绑定参数
             *    {string} showMode 展示触发模式
             *    {string} targetDOM 绑定元素的id
             *    {ui.Control | string} targetControl 绑定控件的实例或id
             *    {number} delayTime 延迟展示时间
             *    {number} showDuration 展示后自动隐藏的延迟时间
             *    {Object=} positionOpt 层布局参数
             */
            initAutoMode: function (options) {
                var handler = this.getInitHandlers(options);

                // 直接展现浮层
                handler.layer.show();

                // 如果不是自动隐藏，则配置点击其他位置关闭
                if (!options.showDuration) {
                    // 点击其他区域隐藏事件绑定
                    handler.clickOutsideHide.bind();
                    // 之后行为变为click隐藏行为
                    handler.layer.bind('mouseup');
                }
                else {
                    // 自动隐藏
                    setTimeout(function () {
                        // 执行隐藏
                        handler.layer.hide(options.showDuration);
                        // 之后行为变为click隐藏行为
                        handler.layer.bind('mouseup');

                    }, options.delayTime);
                }
            },

            /**
             * 在绑定提示层至目标DOM时，初始化点击展现（showMode为click）的相应行为
             *
             * @param {Object=} options 绑定参数
             *    {string} showMode 展示触发模式
             *    {string} targetDOM 绑定元素的id
             *    {ui.Control | string} targetControl 绑定控件的实例或id
             *    {number} delayTime 延迟展示时间
             *    {number} showDuration 展示后自动隐藏的延迟时间
             *    {Object=} positionOpt 层布局参数
             */
            initClickMode: function (options) {
                var handler = this.getInitHandlers(options);

                // 鼠标点击在目标DOM上展现提示层
                handler.layer.bind('mouseup');
            },

            /**
             * 在绑定提示层至目标DOM时，初始化悬浮触发展现（showMode为over）的相应行为
             *
             * @param {HtmlElement} 目标DOM
             * @param {Object=} options 绑定参数
             *    {string} showMode 展示触发模式
             *    {string} targetDOM 绑定元素的id
             *    {ui.Control | string} targetControl 绑定控件的实例或id
             *    {number} delayTime 延迟展示时间
             *    {number} showDuration 展示后自动隐藏的延迟时间
             *    {Object=} positionOpt 层布局参数
             */
            initOverMode: function (options) {
                var handler = this.getInitHandlers(options);

                // 鼠标悬浮在目标DOM上展现提示层
                handler.layer.bind('mouseover');

                // 防止点击targetElement导致浮层关闭
                helper.addDOMEvent(
                    this, handler.targetElement, 'mouseup', function (e) {
                        e.stopPropagation();
                    }
                );

                // 如果是mouseover，还要配置main的mouseover事件
                // 否则浮层会自动隐藏
                helper.addDOMEvent(
                    this, this.main, 'mouseover',
                    lib.bind(
                        this.show, this, handler.targetElement,
                        options.positionOpt
                    )
                );
            },

            /**
             * 获取提示层腿部的控件对象
             *
             *
             * @return {ui.Panel}
             */
            getHead: function () {
                return this.getChild('title');
            },

            /**
             * 获取提示层主体的控件对象
             *
             *
             * @return {ui.Panel}
             */
            getBody: function () {
                return this.getChild('body');
            },


            /**
             * 获取提示层腿部的控件对象
             *
             *
             * @return {ui.Panel}
             */
            getFoot: function () {
                return this.getChild('foot');
            },

            /**
             * 显示提示层
             * @param {HTMLElement} targetElement 提示层的捆绑元素
             *
             */
            show: function (targetElement, options) {
                if (helper.isInStage(this, 'INITED')) {
                    this.render();
                }
                else if (helper.isInStage(this, 'DISPOSED')) {
                    return;
                }

                clearTimeout(this.hideTimeout);

                helper.addDOMEvent(
                    this, window, 'resize',
                    lib.curry(resizeHandler, this, targetElement, options)
                );

                // 动态计算layer的zIndex
                this.main.style.zIndex = helper.layer.getZIndex(targetElement);

                this.removeState('hidden');

                // 定位，八种。。
                this.autoPosition(
                    targetElement,
                    options
                );

                if (this.isShow) {
                    return;
                }

                this.isShow = true;
                this.fire('show');
            },

            /**
             * 隐藏提示层
             *
             */
            hide: function () {
                if (!this.isShow) {
                    return;
                }

                this.isShow = false;
                this.addState('hidden');
                this.fire('hide');
            },


            /**
             * 设置标题文字
             *
             * @param {string} html 要设置的文字，支持html
             */
            setTitle: function (html) {
                this.setProperties({'title': html});
            },

            /**
             * 设置内容
             *
             * @param {string} content 要设置的内容，支持html.
             */
            setContent: function (content) {
                this.setProperties({'content': content});
            },

            /**
             * 设置腿部内容
             *
             * @param {string} foot 要设置的内容，支持html.
             */
            setFoot: function (foot) {
                this.setProperties({'foot': foot});
            },


            /**
             * 销毁控件
             */
            dispose: function () {
                if (helper.isInStage(this, 'DISPOSED')) {
                    return;
                }
                this.hide();
                //移除dom
                var domId = this.main.id;
                lib.removeNode(domId);
                Control.prototype.dispose.apply(this, arguments);
            }

        };


        /**
         * 一次提醒提示
         * @param {Object=} args 参数 支持如下字段
         * {string} content 提示内容
         * {HTMLElement} attachedNode 绑定提示的节点
         * {Function} onok 点击底部按钮触发事件
         * {string} okText 按钮显示文字
         */
        TipLayer.onceNotice = function (args) {
            var tipLayerPrefix = 'tipLayer-once-notice';
            var okPrefix = 'tipLayer-notice-ok';

            /**
             * 获取按钮点击的处理函数
             *
             * @private
             * @param {ui.TipLayer} tipLayer 控件对象
             * @param {string} 事件类型
             */
            function btnClickHandler(tipLayer) {
                // 有可能在参数里设置了处理函数
                var handler = tipLayer.onok;
                var isFunc = (typeof handler === 'function');
                if (isFunc) {
                    handler(tipLayer);
                }
                tipLayer.fire('ok');
                tipLayer.dispose();
            }

            var content = lib.encodeHTML(args.content) || '';

            var properties = {
                type: 'onceNotice',
                skin: 'onceNotice',
                arrow: true
            };

            lib.extend(properties, args);

            //创建main
            var main = document.createElement('div');
            document.body.appendChild(main);

            var tipLayerId = helper.getGUID(tipLayerPrefix);
            properties.id = tipLayerId;
            properties.main = main;

            properties.type = null;

            var tipLayer = ui.create('TipLayer', properties);

            tipLayer.setContent(content);

            var okText = args.okText || '知道了';
            tipLayer.setFoot(''
                + '<div data-ui="type:Button;childName:okBtn;id:'
                + tipLayerId + '-' + okPrefix + ';width:50;"'
                + 'class="'
                + helper.getPartClasses(tipLayer, 'once-notice')
                + '">'
                + okText
                + '</div>'
            );

            tipLayer.render();

            var okBtn = tipLayer.getFoot().getChild('okBtn');
            okBtn.on(
                'click',
                lib.curry(btnClickHandler, tipLayer, 'ok')
            );
            tipLayer.attachTo({
                targetDOM: args.targetDOM,
                targetControl: args.targetControl,
                showMode: 'auto',
                positionOpt: { top: 'top', right: 'left' }
            });
            return tipLayer;

        };


        lib.inherits(TipLayer, Control);
        ui.register(TipLayer);

        return TipLayer;
    }
);
