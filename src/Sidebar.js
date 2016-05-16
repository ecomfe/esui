/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file Sidebar控件
 * @author miaojian
 */

define(
    function (require) {
        var eoo = require('eoo');
        var lib = require('./lib');
        var Control = require('./Control');
        var esui = require('./main');
        var Panel = require('./Panel');
        var $ = require('jquery');
        var u = require('underscore');
        var painters = require('./painters');

        /**
         * Sidebar控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        var Sidebar = eoo.create(
            Control,
            {

                type: 'Sidebar',

                /**
                 * 初始化参数
                 *
                 * @param {Object=} options 构造函数传入的参数
                 * @override
                 * @protected
                 */
                initOptions: function (options) {
                    var properties = {
                        // 离页面顶部的空隙
                        marginTop: 10,
                        // 离页面左边的空隙
                        marginleft: 10,
                        // 离页面右边的空隙
                        marginRight: 10,
                        // 离页面底部的空隙
                        marginBottom: 10,
                        // 自动隐藏和自动显示的延迟
                        autoDelay: 100,
                        // 初始化状态
                        mode: 'fixed',
                        // 默认左浮动
                        float: 'left'
                    };

                    u.extend(properties, options);

                    var pos = $(this.main).offset();
                    properties.top  = pos.top;
                    properties.left = pos.left;

                    this.setProperties(properties);
                },

                /**
                 * 初始化DOM结构
                 *
                 * @protected
                 */
                initStructure: function () {
                    // 初始化控制按钮，内容区域，minibar
                    initContent(this);
                    renderMiniBar(this);
                    initCtrlBtn(this);

                    // 初始化位置
                    initPosition(this);
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                initEvents: function () {
                    var helper = this.helper;
                    helper.addDOMEvent(window, 'scroll', u.bind(resetTop, null, this));
                    // 给主元素添加over和out的事件handler
                    helper.addDOMEvent(this.main, 'mouseenter', u.bind(mainOverHandler, null, this));
                    helper.addDOMEvent(this.main, 'mouseleave', u.bind(mainOutHandler, null, this));

                    // minibar的绑定事件
                    var minibar = getMiniBar(this);
                    helper.addDOMEvent(minibar, 'mouseenter',
                        u.bind(miniOverHandler, null, this, minibar));
                    helper.addDOMEvent(minibar, 'mouseleave',
                        u.bind(miniOutHandler, null, this, minibar));

                    // fixBtn的绑定事件
                    var fixBtn = $('#' + helper.getId('fixBtn'));
                    helper.addDOMEvent(fixBtn, 'click',
                        u.bind(fixBtnClickHandler, null, this, fixBtn));
                },

                /**
                 * 渲染自身
                 *
                 * @override
                 * @protected
                 */
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    {
                        name: 'mode',
                        paint: function (sidebar, mode) {
                            sidebar.mode = mode;

                            if (sidebar.isAutoHide()) {
                                hide(sidebar);
                            }
                            else {
                                show(sidebar);
                            }

                            // 初始化的时候不会执行onmodechange方法
                            if (sidebar.helper.isInStage('RENDERED')) {
                                sidebar.fire('modechange', {mode: mode});
                            }
                        }
                    }
                ),


                /**
                 * 设置当前模式
                 *
                 * @param {string} mode 模式（fixed autohide）
                 */
                setMode: function (mode) {
                    this.setProperties({mode: mode});
                },

                /**
                 * 获取当前模式
                 *
                 * @return {string}
                 *
                 */
                getMode: function () {
                    return this.mode;
                },

                /**
                 * 获取当前panel
                 *
                 * @return {ui.Panle} 当前panel
                 */
                getPanel: function () {
                    return this.getChild('content');
                },

                /**
                 * 更新sidebar内容
                 *
                 * @param  {string} content html内容
                 */
                setContent: function (content) {
                    var panel = this.getPanel();

                    if (panel) {
                        panel.setProperties({content: content});
                    }
                },

                /**
                 * 判断当前模式
                 *
                 * @return {boolean}
                 */
                isAutoHide: function () {
                    return this.mode === 'autohide';
                },

                /**
                 * 销毁释放控件
                 *
                 * @override
                 */
                dispose: function () {
                    var helper = this.helper;
                    if (helper.isInStage('DISPOSED')) {
                        return;
                    }

                    helper.beforeDispose();
                    var miniBar = getMiniBar(this);
                    document.body.removeChild(miniBar);

                    // 释放dom引用
                    this.headEl  = null;
                    this.bodyEl  = null;

                    helper.dispose();
                    helper.afterDispose();
                }
            }
        );

        /**
         * 获取miniBar元素
         *
         * @param {ui.Sidebar} sidebar Sidebar控件实例
         * @return {Element}
         */
        function getMiniBar(sidebar) {
            var minibarId = sidebar.helper.getId('minibar');
            return document.getElementById(minibarId);
        }

        /**
         * 初始化内容区域head和body
         *
         * @inner
         * @param {ui.Sidebar} sidebar Sidebar控件实例
         */
        function initContent(sidebar) {
            var jqMain = $(sidebar.main);
            var helper = sidebar.helper;
            var head = jqMain.find('[data-role=head]')[0];
            if (head) {
                $(head).addClass(helper.getPartClassName('head'));
                sidebar.headEl = head;
            }

            var body = jqMain.find('[data-role=body]')[0];

            if (body) {
                $(body).addClass(helper.getPartClassName('body'));
                sidebar.bodyEl = body;
                // 添加panel，以便控制子元素
                var panel = new Panel({
                    main: body,
                    renderOptions: sidebar.renderOptions
                });

                // 将面板添加到sidebar
                sidebar.addChild(panel, 'content');
                if (sidebar.float === 'right') {
                    $(panel.main).addClass(helper.getPartClassName('body-padding'));
                }

                // 渲染面板
                panel.render();

                var bodyWrapper = $('<div>');
                bodyWrapper.addClass(helper.getPartClassName('bodyWrapper'));
                $(sidebar.getPanel().main).wrapInner(bodyWrapper);
            }
        }

        /**
         * 绘制minibar
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function renderMiniBar(sidebar) {
            var me = sidebar;
            var helper = me.helper;

            var minibarHtml = [
                '<div class="${minibarClass}" id="${minibarId}">',
                    '<span class="${minibarArrow}"></span>',
                '</div>'
            ].join('');

            var minibarIconLeft = helper.getIconClass('caret-left');
            var minibarIconRight = helper.getIconClass('caret-right');
            var minibar = lib.format(
                minibarHtml,
                {
                    minibarClass: helper.getPartClasses('minibar').join(' '),
                    minibarId: helper.getId('minibar'),
                    minibarArrow: me.float === 'left' ? minibarIconRight : minibarIconLeft
                }
            );
            var $minibar = $(minibar);
            $('body').append($minibar)
        }

        /**
         * 初始化控制按钮
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function initCtrlBtn(sidebar) {
            var me = sidebar;
            var helper = me.helper;

            var fixBtnIconRight = helper.getIconClass('caret-right');
            var fixBtnIconLeft = helper.getIconClass('caret-left');

            var fixBtnHtml = lib.format(
                '<a class="${fixBtnClass}" id="${fixBtnId}"><span class="${fixBtnIcon}"></span></a>',
                {
                    fixBtnClass: helper.getPartClasses('fixBtn'),
                    fixBtnIcon: me.float === 'left' ? fixBtnIconRight : fixBtnIconLeft,
                    fixBtnId: helper.getId('fixBtn')
                }
            );
            var fixBtn = $(fixBtnHtml);
            var fixBtnIcon = fixBtn.find('span');
            $(me.getChild('content').main).append(fixBtn);

            // 位于页面的左侧或者右侧
            if (me.float === 'right') {
                fixBtn.css('left', 0);
            }
            else {
                fixBtn.css('right', 0);
            }
        }

        /**
         * 重设控件位置
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function resetTop(sidebar) {
            var me = sidebar;
            var scrollTop = $(document).scrollTop();

            var marginTop = me.marginTop || 0;
            var curTop = Math.max(me.top + marginTop - scrollTop, marginTop);

            $(me.main).css('top', curTop);
            $(getMiniBar(me)).css('top', curTop);
        }

        /**
         * 初始化控件位置
         *
         * @param  {ui.Sidebar} sidebar Sidebar控件实例
         */
        function initPosition(sidebar) {
            var me = sidebar;

            // 计算body位置
            var body = me.bodyEl;
            var head = me.headEl;
            $(body).css('top', $(head).outerHeight());

            // 计算main, minibar的位置
            u.each([me.main, getMiniBar(me)], function (ele) {
                var float = me.float;
                var eleStyle = {
                    bottom: sidebar.marginBottom ? sidebar.marginBottom : 0
                };
                if (float === 'left') {
                    eleStyle.left = sidebar.marginLeft ? sidebar.marginLeft : 0;
                }
                else {
                    eleStyle.right = sidebar.marginRight ? sidebar.marginRight : 0;
                }
                $(ele).css(eleStyle);
            });

            // 初始化top
            resetTop(me);
        }

        /**
         * 显示侧边导航
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function show(sidebar) {
            sidebar.main.style.display = 'block';
            getMiniBar(sidebar).style.display = 'none';
        }

        /**
         * 隐藏侧边导航
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function hide(sidebar) {

            // 隐藏主区域
            sidebar.main.style.display = 'none';

            // minibar
            getMiniBar(sidebar).style.display = 'block';
        }

        /**
         * fixBtn的点击事件
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @param  {HTMLElement} element 触发事件的元素
         * @inner
         */
        function fixBtnClickHandler(sidebar, ele) {
            var me = sidebar;
            var helper = me.helper;
            var fixBtnIcon = $('#' + helper.getId('fixBtn')).find('span');
            if (me.mode === 'fixed') {
                me.setMode('autohide');
            }
            else {
                me.setMode('fixed');
            }
            var fixArrowLeft = helper.getIconClass('caret-left');
            var fixArrowRight = helper.getIconClass('caret-right');
            $(fixBtnIcon).toggleClass(fixArrowLeft);
            $(fixBtnIcon).toggleClass(fixArrowRight);
        }

        /**
         * minibar的mouseover句柄
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @param  {HTMLElement} element 触发事件的元素
         * @inner
         */
        function miniOverHandler(sidebar, element) {
            var me = sidebar;
            var $ele = $(element);
            var hoverClass = me.helper.getPartClassName('minibar-hover');

            if (!$ele.hasClass(hoverClass)) {

                $ele.addClass(hoverClass);
                me.minibarDisplayTick = setTimeout(
                    function () {
                        show(me);
                    },
                    me.autoDelay
                );
            }
        }

        /**
         * minibar的mouseout句柄
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @param  {HTMLElement} element 触发事件的元素
         * @inner
         */
        function miniOutHandler(sidebar, element) {
            var me = sidebar;
            var hoverClass = me.helper.getPartClassName('minibar-hover');

            $(element).removeClass(hoverClass);
            clearTimeout(me.minibarDisplayTick);
        }


        /**
         * 主元素鼠标移入的handler
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function mainOverHandler(sidebar) {
            clearTimeout(sidebar.minibarDisplayTick);
        }

        /**
         * 主元素鼠标移出的handler
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @param  {Event} event 事件对象
         * @inner
         */
        function mainOutHandler(sidebar, event) {
            var me = sidebar;

            if (sidebar.isAutoHide()) {
                event = event || window.event;
                var tar = event.relatedTarget || event.toElement;

                if (!$.contains(sidebar.main, tar)) {
                    me.minibarDisplayTick = setTimeout(
                        function () {
                            hide(me);
                        },
                        me.autoDelay
                    );
                }
            }
        }

        esui.register(Sidebar);
        return Sidebar;
    }
);
