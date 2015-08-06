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

        var $ = require('jquery');
        require('./behavior/position');
        var eoo = require('eoo');
        var esui = require('./main');
        var u = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');
        var painters = require('./painters');
        var Layer = require('./Layer');

        /**
         * 提示层控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        var TipLayer = eoo.create(
            Control,
            {
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
                    parseMain(options);
                    /**
                     * 默认TipLayer选项配置
                     */
                    var properties = {
                        roles: {},
                        showMode: 'manual'
                    };

                    u.extend(properties, TipLayer.defaultProperties, options);
                    this.setProperties(properties);
                },

                /**
                 * 初始化DOM结构，仅在第一次渲染时调用
                 */
                initStructure: function () {
                    $(this.main).appendTo(this.appendToElement);
                    this.addState('hidden');
                    // 不是所有的提示层都需要title
                    if (this.title || this.roles.title) {
                        createHead(this, this.roles.title);
                    }
                    createBF(this, 'body', this.roles.content);

                    // 不是所有的提示层都需要foot
                    if (this.foot || this.roles.foot) {
                        createBF(this, 'foot', this.roles.foot);
                    }
                },

                /**
                 * 重新渲染视图
                 * 仅当生命周期处于RENDER时，该方法才重新渲染
                 *
                 * @param {Array=} 变更过的属性的集合
                 * @override
                 */
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    painters.style('width'),
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
                            var bodyId = tipLayer.helper.getId('body');
                            var bodyClass = tipLayer.helper.getPartClasses('body');
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
                            var footId = tipLayer.helper.getId('foot');
                            var footClass = tipLayer.helper.getPartClasses('foot');
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
                            'showMode', 'positionOpt', 'targetPositionOpt', 'delayTime',
                            'showDuration'
                        ],
                        paint: function (tipLayer, targetDOM, targetControl,
                                showMode, positionOpt, targetPositionOpt) {
                            // 为了绕过函数最多7个参数的fecs要求
                            var delayTime = arguments[6];
                            var showDuration = arguments[7];
                            var options = {
                                targetDOM: targetDOM,
                                targetControl: targetControl,
                                showMode: showMode,
                                delayTime: delayTime != null ? delayTime : tipLayer.delayTime,
                                showDuration: showDuration != null ? showDuration : tipLayer.showDuration
                            };
                            if (positionOpt) {
                                positionOpt = positionOpt.split('|');
                                options.positionOpt = {
                                    top: positionOpt[0] || 'top',
                                    right: positionOpt[1] || 'left'
                                };
                            }
                            if (showMode !== 'manual') {
                                tipLayer.attachTo(options);
                            }
                        }
                    }
                ),

                /**
                 * 将提示层捆绑到一个DOM元素或控件上
                 *
                 * @param {Object=} options 绑定参数
                 *    {string} showMode 展示触发模式
                 *    {string} targetDOM 绑定元素的id
                 *    {ui.Control | string} targetControl 绑定控件的实例或id
                 *    {number} delayTime 延迟展示时间
                 *    {Object=} positionOpt 层布局参数
                 *    {Object=} targetPositionOpt 参照物对象的层布局参数
                 */
                attachTo: function (options) {
                    // 根据参数获取行为处理器
                    var handler = this.getInitHandler(options);

                    if (!handler) {
                        return;
                    }

                    options.handler = handler;

                    switch (options.showMode) {
                        case 'auto':
                            this.initAutoMode(options);
                            break;
                        case 'over':
                            this.initOverMode(options);
                            break;
                        case 'click':
                            this.initClickMode(options);
                            break;
                        case 'manual':
                            break;
                    }
                },

                /**
                 * 监听一个区域 为这个区域内带有data-role属性的节点添加tip
                 * 在该区域内部所有的DOM节点里 若要添加tip提示 需配置以下属性
                 * 1. data-role='tip' 所有具有该属性的节点都会增加tip提示
                 * 2. data-title='提示标题' 该节点所要显示的提示的标题内容
                 * 3. data-content='提示内容' 该节点所要显示的提示的内容
                 * 一旦配置过以上属性 就可以自动为该区域内所有类似的节点添加相应的tip
                 *
                 * @param {string} selector JQuery选择器
                 * @param {Object=} options 绑定参数
                 *    {string} showMode 展示触发模式
                 *    {number} delayTime 延迟展示时间
                 *    {number} showDuration 展示后自动隐藏的延迟时间
                 */
                monitor: function (selector, options) {
                    var showMode = options.showMode || 'over';
                    var delayTime = options.delayTime || 0;
                    var containerElement = $(selector);
                    var me = this;

                    // 为防止delayTime时出现 tip还未hide就更改内容的情况 监听beforeshow事件 在此刻再进行更改
                    me.on('beforeshow', function (e) {
                        var targetElement = e.targetElement;
                        if (targetElement) {
                            var content = $(targetElement).attr('data-content') || this.content;
                            var title = $(targetElement).attr('data-title') || this.title;
                            me.setContent(content);
                            me.setTitle(title);
                        }
                    });

                    function showTip(event) {
                        var targetDOM = event.target;
                        // 检查是否具有data-attached的属性 有的话直接忽略就可以
                        if (!$(targetDOM).attr('data-attached')) {
                            me.attachTo({
                                targetDOM: targetDOM,
                                showMode: showMode,
                                delayTime: delayTime,
                                positionOpt: {top: 'top', right: 'left'}
                            });
                            // 凡是已经attachTo过之后的节点 都自动添加一个data-attached的属性 防止重复绑定
                            $(targetDOM).attr('data-attached', '1');
                            // 第一次绑定的时候需要手动触发一次类似事件才可以显示tip
                            $(targetDOM).trigger(event.type);
                        }
                        // 阻止冒泡到父节点 以防止tipLayer自动hide掉
                        event.stopPropagation();
                    }

                    if (!containerElement) {
                        return;
                    }

                    if (showMode === 'over') {
                        this.helper.addDOMEvent(containerElement, 'mouseover', '[data-role="tip"]', showTip);
                    }
                    else if (showMode === 'click') {
                        this.helper.addDOMEvent(containerElement, 'mouseup', '[data-role="tip"]', showTip);
                    }
                },

                /**
                 * 获取初始化时的行为处理器
                 *
                 * @param {Object=} options 绑定参数
                 *    {string} showMode 展示触发模式
                 *    {string} targetDOM 绑定元素的id
                 *    {ui.Control | string} targetControl 绑定控件的实例或id
                 *    {number} delayTime 延迟展示时间
                 *    {number} showDuration 展示后自动隐藏的延迟时间
                 *    {Object=} positionOpt 层布局参数
                 *    {Object=} targetPositionOpt 参照物对象的层布局参数
                 * @return {Object}
                 */
                getInitHandler: function (options) {
                    var me = this;
                    var positionOpt = options.positionOpt || {
                        top: 'top',
                        right: 'left'
                    };
                    var targetPositionOpt = options.targetPositionOpt || {
                        top: 'top',
                        right: 'right'
                    };
                    // 获取绑定的目标
                    var targetElement;
                    if (options.targetDOM) {
                        targetElement = lib.g(options.targetDOM);
                    }
                    else if (options.targetControl) {
                        targetElement
                            = getElementByControl(this, options.targetControl);
                    }

                    if (!targetElement) {
                        return null;
                    }

                    // 创建行为处理器
                    // 无论是何种模式的绑定，都需要三种元素
                    // 1. 目标元素
                    // 2. 浮层处理
                    var handler = {
                        targetElement: targetElement,
                        // 浮层相关方法
                        layer: {
                            show: function () {
                                // 如果tiplayer是over模式
                                if (options.showMode === 'over') {
                                    // 不管有没有，移除老的绑在layer身上的事件
                                    me.helper.removeDOMEvent(me.main, 'mouseover');
                                    me.helper.removeDOMEvent(me.main, 'mouseout');

                                    // 然后加上新的
                                    // 配置main的mouseover事件，否则浮层会自动隐藏
                                    me.helper.addDOMEvent(
                                        me.main,
                                        'mouseover',
                                        u.bind(me.show, me, targetElement, {
                                            targetPositionOpt: targetPositionOpt,
                                            positionOpt: positionOpt
                                        })
                                    );

                                    // 鼠标划出弹层元素，隐藏
                                    me.helper.addDOMEvent(
                                        me.main,
                                        'mouseout',
                                        function () {
                                            handler.layer.hide();
                                        }
                                    );
                                }

                                delayShow(me, options.delayTime, targetElement, {
                                    targetPositionOpt: targetPositionOpt,
                                    positionOpt: positionOpt
                                });
                            },

                            /**
                             * 隐藏浮层
                             */
                            hide: u.partial(delayHide, me, options.delayTime),

                            /**
                             * 绑定浮层展现的默认事件，针对于targetDOM
                             * @param {string=} showEvent 事件名称，例如click、mouseup
                             * @param {Function=} callback 回调方法
                             */
                            bind: function (showEvent, callback) {
                                showEvent = showEvent || 'mouseup';
                                // 配置展现的触发事件
                                me.helper.addDOMEvent(
                                    targetElement,
                                    showEvent,
                                    function (e) {
                                        handler.layer.show();
                                        // 点击其他区域隐藏事件绑定
                                        // handler.layer.clickOutsideHideHandler();
                                        if (typeof callback === 'function') {
                                            callback();
                                        }
                                        // 阻止冒泡，防止触发document的行为事件
                                        if (showEvent === 'mouseup') {
                                            e.stopPropagation();
                                        }
                                    }
                                );
                            },

                            /**
                             * 绑定于浮层元素上的阻止冒泡的方法
                             * @param {Event} e 事件对象
                             */
                            preventPopMethod: function (e) {
                                e.stopPropagation();
                            },

                            /**
                             * 绑定于body主体上面的隐藏layer的方法
                             * @param {Event} e 事件对象
                             */
                            clickOutsideHideHandler: function (e) {
                                handler.layer.hide();
                                // handler.disableOutsideClickHide();
                            },

                            /**
                             * 启动外部点击隐藏
                             */
                            enableOutsideClickHide: function () {
                                enableOutsideClickHide.call(me, handler);
                            },


                            /**
                             * 取消外部点击隐藏
                             */
                            disableOutsideClickHide: function () {
                                disableOutsideClickHide.call(me, handler);
                            }

                        }
                    };

                    return handler;
                },

                /**
                 * 初始化自动展现（showMode为auto）的相应行为
                 *
                 * 设置为auto，表示弹层一旦绑定后就会自动展现，
                 * 并根据用户配置的showDuration决定：
                 * 1. 经过showDuration的时间后自动关闭
                 * 2. 点击外部执行关闭
                 *
                 * @param {Object=} options 绑定参数
                 *    {string} showMode 展示触发模式
                 *    {string} targetDOM 绑定元素的id
                 *    {ui.Control | string} targetControl 绑定控件的实例或id
                 *    {number} delayTime 延迟展示时间
                 *    {number} showDuration 展示后自动隐藏的延迟时间
                 *    {Object=} positionOpt 层布局参数
                 *    {Object=} targetPositionOpt 参照物对象的层布局参数
                 */
                initAutoMode: function (options) {
                    var handler = options.handler;

                    // 直接展现浮层
                    handler.layer.show();

                    // 如果不是自动隐藏，则配置点击其他位置关闭
                    if (!options.showDuration) {
                        // 点击其他区域隐藏事件绑定
                        handler.layer.enableOutsideClickHide();
                    }
                    // 自动隐藏
                    else {
                        handler.layer.hide(options.showDuration);
                    }

                    // 之后行为变为click行为
                    handler.layer.bind('mouseup');
                },

                /**
                 * 初始化点击展现（showMode为click）的相应行为
                 *
                 * 设置为click，表示弹层绑定后，通过目标节点的点击来执行展现和隐藏
                 *
                 * @param {Object=} options 绑定参数
                 *    {string} showMode 展示触发模式
                 *    {string} targetDOM 绑定元素的id
                 *    {ui.Control | string} targetControl 绑定控件的实例或id
                 *    {number} delayTime 延迟展示时间
                 *    {number} showDuration 展示后自动隐藏的延迟时间
                 *    {Object=} positionOpt 层布局参数
                 *    {Object=} targetPositionOpt 参照物对象的层布局参数
                 */
                initClickMode: function (options) {
                    var handler = options.handler;

                    // 鼠标点击在目标DOM上展现提示层
                    handler.layer.bind('mouseup');

                    // 点击其他区域隐藏
                    handler.layer.enableOutsideClickHide();
                },

                /**
                 * 初始化悬浮触发展现（showMode为over）的相应行为
                 *
                 * 设置为over，表示弹层绑定后，
                 * mouseover目标节点，展现浮层
                 * mouseout layer和mouseout目标节点，隐藏浮层
                 *
                 * @param {Object=} options 绑定参数
                 *    {string} showMode 展示触发模式
                 *    {string} targetDOM 绑定元素的id
                 *    {ui.Control | string} targetControl 绑定控件的实例或id
                 *    {number} delayTime 延迟展示时间
                 *    {number} showDuration 展示后自动隐藏的延迟时间
                 *    {Object=} positionOpt 层布局参数
                 *    {Object=} targetPositionOpt 参照物对象的层布局参数
                 */
                initOverMode: function (options) {
                    var handler = options.handler;

                    // 鼠标悬浮在目标DOM上展现提示层
                    handler.layer.bind('mouseover');

                    // 鼠标划出目标元素，隐藏
                    this.helper.addDOMEvent(
                        handler.targetElement,
                        'mouseout',
                        function () {
                            handler.layer.hide();
                        }
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
                 * @param {Object} options 参数
                 *
                 */
                show: function (targetElement, options) {
                    var helper = this.helper;
                    if (helper.isInStage('INITED')) {
                        this.render();
                    }
                    else if (helper.isInStage('DISPOSED')) {
                        return;
                    }

                    clearTimeout(this.hideTimeout);

                    helper.addDOMEvent(
                        window,
                        'resize',
                        u.partial(resizeHandler, this, targetElement, options)
                    );

                    // 动态计算layer的zIndex
                    this.main.style.zIndex = Layer.getZIndex(targetElement);

                    this.fire('beforeshow', {targetElement: targetElement});

                    this.removeState('hidden');

                    $(this.main).position({
                        of: $(targetElement),
                        at: options.targetPositionOpt.right + ' ' + options.targetPositionOpt.top,
                        my: options.positionOpt.right + ' ' + options.positionOpt.top
                    });

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
                    this.setProperties({title: html});
                },

                /**
                 * 设置内容
                 *
                 * @param {string} content 要设置的内容，支持html.
                 */
                setContent: function (content) {
                    this.setProperties({content: content});
                },

                /**
                 * 设置腿部内容
                 *
                 * @param {string} foot 要设置的内容，支持html.
                 */
                setFoot: function (foot) {
                    this.setProperties({foot: foot});
                },

                /**
                 * 销毁控件
                 */
                dispose: function () {
                    if (this.helper.isInStage('DISPOSED')) {
                        return;
                    }
                    this.hide();
                    // 移除dom
                    this.roles = null;
                    $(this.main).remove();
                    this.$super(arguments);
                }
            }
        );

        TipLayer.defaultProperties = {
            /**
             * 默认延迟展现时间
             * @type {number}
             */
            delayTime: 0,

            /**
             * 默认延迟隐藏时间
             * @type {number}
             */
            showDuration: 150,

            /**
             * append到哪个元素下
             * @type {string}
             */
            appendToElement: 'body'
        };

        /**
         * 渲染控件前重绘控件
         *
         * @param {Object} options 初始化参数
         */
        function parseMain(options) {
            var main = options.main;
            // 如果main未定义，则不作解析
            if (!main) {
                return;
            }
            var $els = $(main).children('[data-role]');
            var roles = {};

            $els.each(function (idx, element) {
                var roleName = $(element).attr('data-role');
                roles[roleName] = element;
            });

            options.roles = roles;
        }

        /**
         * 构建提示层标题栏
         *
         * @param {ui.TipLayer} tipLayer 控件对象
         * @param {HTMLElement} mainDOM head主元素
         * @return {ui.Label} Label控件
         * @inner
         */
        function createHead(tipLayer, mainDOM) {
            if (mainDOM) {
                tipLayer.title = mainDOM.innerHTML;
            }
            else {
                mainDOM = document.createElement('h3');
                if (tipLayer.main.firstChild) {
                    lib.insertBefore(mainDOM, tipLayer.main.firstChild);
                }
                else {
                    tipLayer.main.appendChild(mainDOM);
                }
            }
            var headClass
                = tipLayer.helper.getPartClassName('title');
            $(mainDOM).addClass(headClass);
            var properties = {
                main: mainDOM,
                childName: 'title',
                title: ''
            };
            var label = esui.create('Label', properties);
            label.render();
            tipLayer.addChild(label);
            return label;
        }

        /**
         * 构建提示层主内容和底部内容
         *
         * @param {ui.TipLayer} tipLayer 控件
         * @param {string} type foot | body
         * @param {HTMLElement} mainDOM body或foot主元素
         * @inner
         * @return {ui.Panel} Panel
         */
        function createBF(tipLayer, type, mainDOM) {
            if (mainDOM) {
                tipLayer.content = mainDOM.innerHTML;
            }
            else {
                mainDOM = document.createElement('div');
                if (type === 'body') {
                    // 找到head
                    var head = tipLayer.getChild('title');
                    if (head) {
                        lib.insertAfter(mainDOM, head.main);
                    }
                    // 放到第一个
                    else if (tipLayer.main.firstChild) {
                        lib.insertBefore(
                            mainDOM, head, tipLayer.main.firstChild
                        );
                    }
                    else {
                        tipLayer.main.appendChild(mainDOM);
                    }
                }
                else {
                    tipLayer.main.appendChild(mainDOM);
                }
            }

            $(mainDOM).addClass(
                tipLayer.helper.getPartClassName(type + '-panel')
            );
            var properties = {
                main: mainDOM,
                renderOptions: tipLayer.renderOptions
            };

            var panel = esui.create('Panel', properties);
            panel.render();
            tipLayer.addChild(panel, type);
            return panel;
        }

        /**
         * 页面resize时事件的处理函数
         *
         * @param {ui.TipLayer} tipLayer 控件
         * @param {HTMLElement} targetElement 提示层绑定元素
         * @param {Object} options 定位参数
         * @inner
         */
        function resizeHandler(tipLayer, targetElement, options) {
            // 隐藏状态不触发
            if (!tipLayer.isShow) {
                return;
            }

            $(this.main).position({
                of: $(targetElement),
                at: options.targetPositionOpt.right + ' ' + options.targetPositionOpt.top,
                my: options.positionOpt.right + ' ' + options.positionOpt.top
            });
        }

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
            if (delayTime) {
                clearTimeout(tipLayer.showTimeout);
                clearTimeout(tipLayer.hideTimeout);
                tipLayer.showTimeout = setTimeout(
                    u.bind(tipLayer.show, tipLayer, targetElement, options),
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
         * @param {number} delayTime 延迟时间
         * @inner
         */
        function delayHide(tipLayer, delayTime) {
            clearTimeout(tipLayer.showTimeout);
            clearTimeout(tipLayer.hideTimeout);
            tipLayer.hideTimeout
                = setTimeout(u.bind(tipLayer.hide, tipLayer), delayTime);
        }

        function getElementByControl(tipLayer, control) {
            if (typeof control === 'string') {
                control = tipLayer.viewContext.get(control);
            }
            return control.main;
        }

        function enableOutsideClickHide(handler) {
            this.helper.addDOMEvent(
                document.documentElement,
                'mouseup',
                handler.layer.clickOutsideHideHandler
            );

            // 为主体layer元素配置阻止冒泡，防止点击关闭
            this.helper.addDOMEvent(
                this.main,
                'mouseup',
                handler.layer.preventPopMethod
            );
        }

        function disableOutsideClickHide(handler) {
            this.helper.removeDOMEvent(
                document.documentElement,
                'mouseup',
                handler.layer.clickOutsideHideHandler
            );
            this.helper.removeDOMEvent(
                this.main,
                'mouseup',
                handler.layer.clickOutsideHideHandler
            );
        }

        /**
         * 一次提醒提示
         * @param {Object=} args 参数 支持如下字段
         * {string} content 提示内容
         * {HTMLElement} attachedNode 绑定提示的节点
         * {Function} onok 点击底部按钮触发事件
         * {string} okText 按钮显示文字
         *
         * @return {ui.TipLayer}
         */
        TipLayer.onceNotice = function (args) {
            var tipLayerPrefix = 'tipLayer-once-notice';
            var okPrefix = 'tipLayer-notice-ok';

            /**
             * 获取按钮点击的处理函数
             *
             * @private
             * @param {ui.TipLayer} tipLayer 控件对象
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

            var content = u.escape(args.content) || '';

            var properties = {
                type: 'onceNotice',
                skin: 'onceNotice'
            };

            u.extend(properties, args);

            // 创建main
            var main = document.createElement('div');
            document.body.appendChild(main);

            var tipLayerId = lib.getGUID(tipLayerPrefix);
            properties.id = tipLayerId;
            properties.main = main;

            properties.type = null;

            var tipLayer = esui.create('TipLayer', properties);

            tipLayer.setContent(content);

            var okText = args.okText || '知道了';
            tipLayer.setFoot(
                lib.format(
                    '<div data-ui="type:Button;childName:okBtn;id:${id}" class="${classes}">'
                    + '${oktext}'
                    + '</div>',
                    {
                        id: tipLayerId + '-' + okPrefix,
                        classes: tipLayer.helper.getPartClasses('once-notice'),
                        okText: okText
                    }
                )
            );

            tipLayer.render();

            var okBtn = tipLayer.getFoot().getChild('okBtn');
            okBtn.on(
                'click',
                u.partial(btnClickHandler, tipLayer, 'ok')
            );

            // 获取目标节点
            var targetDOM = lib.g(args.targetDOM) || tipLayer.viewContext.get(args.targetControl);
            // 直接展示
            tipLayer.show(targetDOM, {top: 'top', right: 'left'});

            return tipLayer;
        };

        esui.register(TipLayer);
        return TipLayer;
    }
);
