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
                 * 创建控件主元素
                 *
                 * @return {HTMLElement}
                 * @override
                 * @protected
                 */
                createMain: function (options) {
                    if (!options.tagName) {
                        return this.$super([options]);
                    }
                    return document.createElement(options.tagName);
                },

                /**
                 * 初始化参数
                 *
                 * @param {Object=} options 构造函数传入的参数
                 * @override
                 * @protected
                 */
                initOptions: function (options) {
                    var properties = {
                        // head的高度
                        headHeight: 37,
                        // 离页面顶部的空隙
                        marginTop: 10,
                        // 离页面左边的空隙
                        marginLeft: 10,
                        // 离页面底部的空隙
                        marginBottom: 10,
                        // 自动隐藏和自动显示的延迟
                        autoDelay: 300,
                        // 初始化状态
                        mode: 'fixed'
                    };

                    u.extend(properties, options);

                    var main = this.main;
                    var parent = main.parentNode;
                    var parentPos = lib.getOffset(parent);
                    var pos = lib.getOffset(main);

                    // 记录开始初始化时的位置
                    if (this.initialOffsetTop == null) {
                        this.initialOffsetTop = pos.top - parentPos.top;
                        properties.top  = pos.top;
                        properties.left = pos.left;

                    }
                    else {
                        properties.top = parentPos.top + this.initialOffsetTop;
                    }

                    u.extend(this, properties);
                },

                /**
                 * 初始化DOM结构
                 *
                 * @protected
                 */
                initStructure: function () {

                    // 初始化控制按钮，内容区域，mat和minibar
                    initContent(this);
                    renderMat(this);
                    renderMiniBar(this);
                    initCtrlBtn(this);

                    // 挂载scorll的listener
                    // ie6下不做滚动
                    if (!lib.ie || lib.ie >= 7) {
                        this.topReset    = u.partial(resetTop, this);
                        lib.on(window, 'scroll', this.topReset);
                    }

                    // 初始化位置
                    initPosition(this);

                    // 初始化显示状态
                    if (this.isAutoHide()) {
                        hide(this);
                    }
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                initEvents: function () {
                    // 给主元素添加over和out的事件handler
                    this.helper.addDOMEvent(this.main, 'mouseover', u.bind(mainOverHandler, null, this));
                    this.helper.addDOMEvent(this.main, 'mouseout', u.bind(mainOutHandler, null, this));
                },

                /**
                 * 渲染自身
                 *
                 * @override
                 * @protected
                 */
                repaint: require('./painters').createRepaint(
                    Control.prototype.repaint,
                    {
                        name: 'mode',
                        paint: function (sidebar, mode) {

                            changeMode(sidebar, mode);

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
                 * @param {string} mode 模式（fixed autohide）
                 */
                setMode: function (mode) {
                    this.setProperties({mode: mode});
                },

                /**
                 * 获取当前模式
                 * @return {string}
                 *
                 */
                getMode: function () {
                    return this.mode;
                },

                /**
                 * 获取当前panel
                 * @return {ui.Panle} 当前panel
                 */
                getPanel: function () {
                    return this.getChild('content');
                },

                /**
                 * 更新sidebar内容
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

                    // remove scroll事件listener
                    if (this.topReset) {
                        lib.un(window, 'scroll', this.topReset);
                        this.topReseter = null;
                    }

                    var mat = getMat(this);
                    var miniBar = getMiniBar(this);
                    document.body.removeChild(miniBar);
                    document.body.removeChild(mat);

                    // 释放dom引用
                    this.headEl  = null;
                    this.bodyEl  = null;

                    helper.dispose();
                    helper.afterDispose();
                }
            }
        );


        /**
         * 获取mat元素
         *
         * @param {ui.Sidebar} sidebar Sidebar控件实例
         * @return {Element}
         */
        function getMat(sidebar) {
            return lib.g(sidebar.helper.getId('mat'));
        }

        /**
         * 获取miniBar元素
         *
         * @param {ui.Sidebar} sidebar Sidebar控件实例
         * @return {Element}
         */
        function getMiniBar(sidebar) {
            return lib.g(sidebar.helper.getId('minibar'));
        }

        /**
         * 初始化内容区域head和body
         * @inner
         * @param {ui.Sidebar} sidebar Sidebar控件实例
         */
        function initContent(sidebar) {
            var $head = $(sidebar.main).children(':first');

            if ($head.size() > 0) {

                $head.addClass(sidebar.helper.getPartClassName('head'));
                sidebar.headEl = $head.get(0);

                var $body = $head.next();
                var body = $body.get(0);

                if (body) {
                    sidebar.bodyEl = body;
                    $body.addClass(
                        sidebar.helper.getPartClassName('body')
                    );

                    // 添加panel，以便控制子元素
                    var panel = new Panel({
                        main: body,
                        renderOptions: sidebar.renderOptions
                    });

                    // 将面板添加到sidebar
                    sidebar.addChild(panel, 'content');

                    // 渲染面板
                    panel.render();
                }
            }
        }

        /**
         * 绘制mat区域
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function renderMat(sidebar) {
            var me = sidebar;
            var mat = document.createElement('div');

            var classes = me.helper.getPartClasses('mat');

            mat.id          = me.helper.getId('mat');
            mat.className   = classes.join(' ');
            document.body.appendChild(mat);
        }

        /**
         * 绘制minibar
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function renderMiniBar(sidebar) {
            var me   = sidebar;
            var helper = me.helper;
            var div  = document.createElement('div');
            var html = [];

            // 构建minibar的html
            // 以主sidebar的标题为标题
            var textClasses = helper.getPartClasses('minibar-text');
            me.headEl && html.push(''
                + '<div class="' + textClasses.join(' ') + '">'
                     + me.headEl.innerHTML
                + '</div>');

            var arrowClasses = helper.getPartClasses('minibar-arrow');
            html.push(''
                + '<div class="'
                    + arrowClasses.join(' ') + '">'
                + '</div>'
            );

            // 初始化minibar
            div.innerHTML   = html.join('');
            div.id          = helper.getId('minibar');
            div.className   = helper.getPartClasses('minibar').join(' ');

            // 挂载行为
            helper.addDOMEvent(div, 'mouseover',
                u.bind(miniOverHandler, null, me, div));
            helper.addDOMEvent(div, 'mouseout',
                u.bind(miniOutHandler, null, me, div));

            document.body.appendChild(div);
        }

        /**
         * 初始化控制按钮
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function initCtrlBtn(sidebar) {
            var me          = sidebar;
            var main        = me.main;

            require('./Button');
            var btnAutoHide = esui.create('Button', {
                id: me.helper.getId('autohide'),
                skin: 'autohide'
            });
            var btnFixed    = esui.create('Button', {
                id: me.helper.getId('fixed'),
                skin: 'fixed'
            });

            // 将按钮append到sidebarbar
            btnAutoHide.appendTo(main);
            btnFixed.appendTo(main);

            // 持有控件引用
            me.addChild(btnAutoHide, 'btnAutoHide');
            me.addChild(btnFixed, 'btnFixed');

            // 挂载行为
            btnAutoHide.onclick = u.partial(autoHideClickHandler, me);
            btnFixed.onclick    = u.partial(fixedClickHandler, me);
        }

        /**
         * 重设控件位置
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function resetTop(sidebar) {
            var me          = sidebar;
            var scrollTop   = lib.page.getScrollTop();

            var marginTop = me.marginTop || 0;
            var curTop = Math.max(me.top + marginTop - scrollTop, marginTop);

            var main        = me.main;
            var mat         = getMat(me);
            var mini        = getMiniBar(me);

            main.style.top  = curTop + 'px';
            mini.style.top  = curTop + 'px';
            mat.style.top   = curTop - marginTop + 'px';
        }

        /**
         * 初始化控件位置
         * @param  {ui.Sidebar} sidebar Sidebar控件实例
         */
        function initPosition(sidebar) {
            var me   = sidebar;

            // ie7不支持box-sizing，由于border,这里先去掉，用户在css里自定义吧
            // 设置head的高度
            // var head = me.headEl;
            // head.style.height = me.headHeight ? me.headHeight + 'px' : 0;

            // 计算main位置
            var main = me.main;
            main.style.cssText += ';'
                + 'left: '
                    + (me.marginLeft ? me.marginLeft + 'px' : 0) + ';'
                + 'bottom:'
                    + (me.marginBottom ? me.marginBottom + 'px' : 0) + ';';

            // 计算body位置
            var body = me.bodyEl;
            body.style.top = me.headHeight ? me.headHeight + 'px' : 0;

            // 计算minibar的位置
            var minibar = getMiniBar(me);
            minibar.style.bottom = me.marginBottom ? me.marginBottom + 'px' : 0;


            // 初始化top
            resetTop(me);
        }

        /**
         * 隐藏mat区域
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function hideMat(sidebar) {
            getMat(sidebar).style.display = 'none';
        }

        /**
         * 显示侧边导航
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function show(sidebar) {
            getMat(sidebar).style.display = 'block';
            sidebar.main.style.display = 'block';

            getMiniBar(sidebar).style.display = 'none';

            if (!sidebar.isAutoHide()) {
                hideMat(sidebar);
            }
        }

        /**
         * 隐藏侧边导航
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function hide(sidebar) {

            hideMat(sidebar);

            // 隐藏主区域
            sidebar.main.style.display = 'none';

            // minibar
            getMiniBar(sidebar).style.display = 'block';
        }

        /**
         * minibar的mouseover句柄
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
         * “固定”按钮的clickhandler
         *
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function fixedClickHandler(sidebar) {
            sidebar.setMode('fixed');
        }

        /**
         * “自动隐藏”按钮的clickhandler
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function autoHideClickHandler(sidebar) {
            sidebar.setMode('autohide');
        }

        /**
         * 设置sidebar的显示模式，autohide|fixed
         *
         * @private
         * @param {ui.Sidebar} sidebar Sidebar控件实例
         * @param {string} mode sidebar显示模式
         */
        function changeMode(sidebar, mode) {
            var me = sidebar;
            mode = mode.toLowerCase();

            if (mode === 'fixed') {
                me.getChild('btnAutoHide').show();
                me.getChild('btnFixed').hide();
            }
            else {
                me.getChild('btnAutoHide').hide();
                me.getChild('btnFixed').show();
            }

            me.mode = mode;
        }

        /**
         * 主元素鼠标移入的handler
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @inner
         */
        function mainOverHandler(sidebar) {
            clearTimeout(sidebar.minibarDisplayTick);
        }

        /**
         * 主元素鼠标移出的handler
         * @param  {ui.Sidebar} sidebar Sidebar实例
         * @param  {Event} event 事件对象
         * @inner
         */
        function mainOutHandler(sidebar, event) {
            var me = sidebar;

            if (sidebar.isAutoHide()) {
                event = event || window.event;
                var tar = event.relatedTarget || event.toElement;

                if (!lib.dom.contains(sidebar.main, tar)) {
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
