/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file Sidebar控件
 * @author miaojian
 */

define(
    function (require) {
        var lib     = require('./lib');
        var Control = require('./Control');
        var ui      = require('./main');
        var Panel   = require('./Panel');
        var helper  = require('./controlHelper');

        /**
         * Sidebar控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Sidebar() {
            Control.apply(this, arguments);
        }

        Sidebar.prototype.type = 'Sidebar';

        /**
         * 创建控件主元素
         *
         * @return {HTMLElement}
         * @override
         * @protected
         */
        Sidebar.prototype.createMain = function (options) {
            if (!options.tagName) {
               return Control.prototype.createMain.call(this);
            }
            return document.createElement(options.tagName);
        };

        /**
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Sidebar.prototype.initOptions = function (options) {
            var properties = {

                headHeight:   37, //head的高度
                marginTop:    10, //离页面顶部的空隙
                marginLeft:   10, //离页面左边的空隙
                marginBottom: 10, //离页面底部的空隙
                autoDelay:    300, //自动隐藏和自动显示的延迟
                mode:         'fixed' //初始化状态
            };

            lib.extend(properties, options);

            var main        = this.main;
            var parent      = main.parentNode;
            var parentPos   = lib.getOffset(parent);
            var pos         = lib.getOffset(main);

            // 记录开始初始化时的位置
            if (this.initialOffsetTop == null) {
                this.initialOffsetTop = pos.top - parentPos.top;
                properties.top  = pos.top;
                properties.left = pos.left;

            } else {
                properties.top = parentPos.top + this.initialOffsetTop;
            }

            lib.extend(this, properties);
        };

        /**
         * 获取mat元素
         *
         */
        function getMat(sidebar) {
            return lib.g(helper.getId(sidebar, 'mat'));
        }

        /**
         * 获取miniBar元素
         *
         */
        function getMiniBar(sidebar) {
            return lib.g(helper.getId(sidebar, 'minibar'));
        }

        /**
         * 初始化内容区域head和body
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function initContent(sidebar) {
            var head = lib.dom.first(sidebar.main);

            if (head) {

                lib.addClasses(head, helper.getPartClasses(sidebar, 'head'));
                sidebar.headEl = head;

                var body = lib.dom.next(head);

                if (body) {
                    sidebar.bodyEl = body;
                    lib.addClasses(
                        body,
                        helper.getPartClasses(sidebar, 'body')
                    );

                    //添加panel，以便控制子元素
                    var panel = new Panel({
                        main: body,
                        renderOptions: sidebar.renderOptions
                    });

                    //将面板添加到sidebar
                    sidebar.addChild(panel, 'content');

                    //渲染面板
                    panel.render();
                }
            }
        }

        /**
         * 绘制mat区域
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function renderMat(sidebar) {
            var me = sidebar;
            var mat = document.createElement('div');

            var classes = helper.getPartClasses(me, 'mat');

            mat.id          = helper.getId(me, 'mat');
            mat.className   = classes.join(' ');
            document.body.appendChild(mat);
        }

        /**
         * 绘制minibar
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function renderMiniBar(sidebar) {
            var me   = sidebar;
            var div  = document.createElement('div');
            var html = [];

            // 构建minibar的html
            // 以主sidebar的标题为标题
            var textClasses = helper.getPartClasses(me, 'minibar-text');
            me.headEl && html.push(''
                + '<div class="' + textClasses.join(' ') + '">'
                     + me.headEl.innerHTML
                + '</div>');

            var arrowClasses = helper.getPartClasses(me, 'minibar-arrow');
            html.push(''
                + '<div class="'
                    + arrowClasses.join(' ') + '">'
                + '</div>'
            );

            // 初始化minibar
            div.innerHTML   = html.join('');
            div.id          = helper.getId(me, 'minibar');
            div.className   = helper.getPartClasses(me, 'minibar').join(' ');

            // 挂载行为
            helper.addDOMEvent(me, div, 'mouseover',
                lib.bind(miniOverHandler, null, me, div));
            helper.addDOMEvent(me, div, 'mouseout',
                lib.bind(miniOutHandler, null, me, div));

            document.body.appendChild(div);
        }

        /**
         * 初始化控制按钮
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function initCtrlBtn(sidebar) {
            var me          = sidebar;
            var main        = me.main;

            require('./Button');
            var btnAutoHide = ui.create('Button', {
                id      : helper.getId(me, 'autohide'),
                skin    : 'autohide'
            });
            var btnFixed    = ui.create('Button', {
                id      : helper.getId(me, 'fixed'),
                skin    : 'fixed'
            });

            // 将按钮append到sidebarbar
            btnAutoHide.appendTo(main);
            btnFixed.appendTo(main);

            // 持有控件引用
            me.addChild(btnAutoHide, 'btnAutoHide');
            me.addChild(btnFixed, 'btnFixed');

            // 挂载行为
            btnAutoHide.onclick = lib.curry(autoHideClickHandler, me);
            btnFixed.onclick    = lib.curry(fixedClickHandler, me);
        }

        /**
         * 重设控件位置
         * @param  {Sidebar} sidebar Sidebar实例
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
         * @param  {ui.Sidebar} sidebar
         */
        function initPosition(sidebar) {
            var me   = sidebar;

            //ie7不支持box-sizing，由于border,这里先去掉，用户在css里自定义吧
            //设置head的高度
            //var head = me.headEl;
            //head.style.height = me.headHeight ? me.headHeight + 'px' : 0;

            //计算main位置
            var main = me.main;
            main.style.cssText += ';'
                + 'left: '
                    + (me.marginLeft ? me.marginLeft + 'px' : 0) + ';'
                + 'bottom:'
                    + (me.marginBottom ? me.marginBottom + 'px' : 0) + ';';

            //计算body位置
            var body = me.bodyEl;
            body.style.top = me.headHeight ? me.headHeight + 'px' : 0;

            //计算minibar的位置
            var minibar = getMiniBar(me);
            minibar.style.bottom = me.marginBottom ? me.marginBottom + 'px' : 0;


            //初始化top
            resetTop(me);
        }

        /**
         * 隐藏mat区域
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function hideMat(sidebar) {
            getMat(sidebar).style.display = 'none';
        }

        /**
         * 显示侧边导航
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function show(sidebar) {

            //
            getMat(sidebar).style.display = 'block';
            sidebar.main.style.display = 'block';

            getMiniBar(sidebar).style.display = 'none';

            if (!sidebar.isAutoHide()) {
                hideMat(sidebar);
            }
        }

        /**
         * 隐藏侧边导航
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function hide(sidebar) {

            hideMat(sidebar);

            //隐藏主区域
            sidebar.main.style.display = 'none';

            //minibar
            getMiniBar(sidebar).style.display = 'block';
        }

        /**
         * minibar的mouseover句柄
         * @param  {Sidebar} sidebar Sidebar实例
         * @param  {HTMLElement} element 触发事件的元素
         * @inner
         */
        function miniOverHandler(sidebar, element) {
            var me = sidebar;
            var hoverClass = helper.getPartClasses(me, 'minibar-hover');

            if (!lib.hasClass(element, hoverClass[0])) {

                lib.addClasses(element, hoverClass);
                me.minibarDisplayTick = setTimeout(
                    function () { show(me); },
                    me.autoDelay
                );
            }
        }

        /**
         * minibar的mouseout句柄
         * @param  {Sidebar} sidebar Sidebar实例
         * @param  {HTMLElement} element 触发事件的元素
         * @inner
         */
        function miniOutHandler(sidebar, element) {
            var me = sidebar;
            var hoverClass = helper.getPartClasses(me, 'minibar-hover');

            lib.removeClasses(element, hoverClass);
            clearTimeout(me.minibarDisplayTick);
        }

        /**
         * “固定”按钮的clickhandler
         *
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function fixedClickHandler(sidebar) {

            sidebar.setMode('fixed');
        }

        /**
         * “自动隐藏”按钮的clickhandler
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function autoHideClickHandler(sidebar) {

            sidebar.setMode('autohide');
        }

        /**
         * 设置sidebar的显示模式，autohide|fixed
         *
         * @private
         * @param {string} mode
         */
        function changeMode(sidebar, mode) {
            var me = sidebar;
            mode = mode.toLowerCase();

            if (mode == 'fixed') {

                me.getChild('btnAutoHide').show();
                me.getChild('btnFixed').hide();
            } else {

                me.getChild('btnAutoHide').hide();
                me.getChild('btnFixed').show();
            }

            me.mode = mode;
        }

        /**
         * 主元素鼠标移入的handler
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function mainOverHandler(sidebar) {

            clearTimeout(sidebar.minibarDisplayTick);
        }

        /**
         * 主元素鼠标移出的handler
         * @param  {Sidebar} sidebar Sidebar实例
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

        /**
         * 初始化DOM结构
         *
         * @protected
         */
        Sidebar.prototype.initStructure = function () {

            // 初始化控制按钮，内容区域，mat和minibar
            initContent(this);
            renderMat(this);
            renderMiniBar(this);
            initCtrlBtn(this);

            // 挂载scorll的listener
            // ie6下不做滚动
            if (!lib.ie || lib.ie >= 7) {
                this.topReset    = lib.curry(resetTop, this);
                lib.on(window, 'scroll', this.topReset);
            }

            // 初始化位置
            initPosition(this);

            // 初始化显示状态
            if (this.isAutoHide()) {
                hide(this);
            }
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        Sidebar.prototype.initEvents = function () {
            // 给主元素添加over和out的事件handler
            this.helper.addDOMEvent(this.main, 'mouseover', lib.bind(mainOverHandler, null, this));
            this.helper.addDOMEvent(this.main, 'mouseout', lib.bind(mainOutHandler, null, this));
        };

        /**
         * 渲染自身
         *
         * @override
         * @protected
         */
        Sidebar.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            {
                name: 'mode',
                paint: function (sidebar, mode) {

                    changeMode(sidebar, mode);

                    if (sidebar.isAutoHide()) {

                        hide(sidebar);
                    } else {

                        show(sidebar);
                    }

                    //初始化的时候不会执行onmodechange方法
                    if (helper.isInStage(sidebar, 'RENDERED')) {

                        sidebar.fire('modechange', { mode: mode });
                    }
                }
            }
        );


        /**
         * 设置当前模式
         * @param {string} mode 模式（fixed autohide）
         */
        Sidebar.prototype.setMode = function (mode) {
            this.setProperties({ mode: mode });
        };

        /**
         * 获取当前模式
         *
         */
        Sidebar.prototype.getMode = function () {
            return this.mode;
        };

        /**
         * 获取当前panel
         * @return {ui.Panle} 当前panel
         */
        Sidebar.prototype.getPanel = function () {
            return this.getChild('content');
        };

        /**
         * 更新sidebar内容
         * @param  {string} content html内容
         */
        Sidebar.prototype.setContent = function (content) {

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
        Sidebar.prototype.isAutoHide = function () {
            return this.mode == 'autohide';
        };

        /**
         * 销毁释放控件
         *
         * @override
         */
        Sidebar.prototype.dispose = function () {
            if (helper.isInStage(this, 'DISPOSED')) {
                return;
            }

            helper.beforeDispose(this);

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

            helper.dispose(this);
            helper.afterDispose(this);
        };

        lib.inherits(Sidebar, Control);
        ui.register(Sidebar);
        return Sidebar;
    }
);