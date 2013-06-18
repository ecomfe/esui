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
            return document.createElement(options.tagName || 'aside');
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

                headHeight:   37,
                marginTop:    10,
                marginLeft:   10,
                marginBottom: 10,
                autoDelay:    300, //自动隐藏和自动显示的延迟
                mode:         'fixed', //初始化状态
                _autoTimer:    0
            };

            lib.extend(properties, options);

            var main        = this.main;
            var parent      = main.parentNode;
            var parentPos   = lib.getOffset(parent);
            var pos         = lib.getOffset(main);

            //记录开始初始化时的位置
            if (this._mOffsetTop == null) {
                this._mOffsetTop = pos.top - parentPos.top;
                properties.top  = pos.top;
                properties.left = pos.left; 

            } else {
                properties.top = parentPos.top + this._mOffsetTop;
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
                sidebar._headEl = head;

                var body = lib.dom.next(head);
                
                if (body) {
                    sidebar._bodyEl = body;
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
            me._headEl && html.push(''
                + '<div class="' + textClasses.join(' ') + '">'
                     + me._headEl.innerHTML 
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
            div.style.left  = '-10000px';
            div.style.top   = me.top + 'px';
            
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
            var marginTop   = me.marginTop;
            var scrollTop   = lib.page.getScrollTop();
            var top         = me.top; 
            var curPos      = 'absolute';
            var curTop;
            
            //好想要删掉的冲动
            if (lib.ie && lib.ie < 7) {

                if (scrollTop > top - marginTop) {
                    curTop = scrollTop + marginTop;

                }
                else {
                    curTop = top;
                    resetHeight(me);
                }
            } 
            else {

                if (scrollTop > top - marginTop) {
                    curPos = 'fixed';
                    curTop = marginTop;    
                } 
                else {
                    curTop = top;
                    resetHeight(me);
                }
            }

            var main        = me.main;
            var mat         = getMat(me);
            var mini        = getMiniBar(me);

            mat.style.top       = curTop - marginTop + 'px';
            main.style.top      = curTop + 'px';
            mat.style.position  = curPos;
            main.style.position = curPos;
            mini.style.top      = curTop + 'px';
            mini.style.position = curPos;
            setTimeout(function () {
                //移动过快时修补最后一次调整
                resetHeight(me);
            }, 200);            
        }


        /**
         * 重设控件高度
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function resetHeight(sidebar) {
            var me          = sidebar;
            var bodyHeight;

            var page        = lib.page;
            var height      = page.getViewHeight();

            if (height) {

                var scrollTop = page.getScrollTop();
                var pos       = lib.getOffset(me.main);

                height = height - pos.top + scrollTop - me.marginBottom;

            } 
            else {
                height = 300;
            }

            if (height < 0) {
                height = 300;
            }
            
            bodyHeight    = height - me.headHeight;
            me.bodyHeight = bodyHeight;
            me.height     = height;

            var main        = me.main;
            var mat         = getMat(me);
            var mini        = getMiniBar(me);

            mat.style.height  = height + me.marginTop + me.marginBottom + 'px';
            main.style.height = height + 'px';
            mini.style.height = height + 'px';

            me._bodyEl && (me._bodyEl.style.height = bodyHeight + 'px');

            me.fire('resize');
        }
        
        /**
         * 隐藏mat区域
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function hideMat(sidebar) {
            getMat(sidebar).style.left = '-10000px';
        }

        /**
         * 显示侧边导航
         * @param  {Sidebar} sidebar Sidebar实例
         * @inner
         */
        function show(sidebar) {
                    
            getMat(sidebar).style.left = 0;
            sidebar.main.style.left = 10 + 'px';

            getMiniBar(sidebar).style.left = -30 + 'px';

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
            sidebar.main.style.left = -220 + 'px';

            getMiniBar(sidebar).style.left = 0 + 'px';
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
                me._autoTimer = setTimeout(
                    function () {
                        show(me);
                    }, me.autoDelay);
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
            clearTimeout(me._autoTimer);
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

            clearTimeout(sidebar._autoTimer);
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
                    me._autoTimer = setTimeout(
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
            
            // 挂载resize和scorll的listener
            this.heightReset = lib.curry(resetHeight, this);
            this.topReset    = lib.curry(resetTop, this);
            lib.on(window, 'resize', this.heightReset);
            lib.on(window, 'scroll', this.topReset);

            // 给主元素添加over和out的事件handler
            helper.addDOMEvent(
                this, this.main, 'mouseover', 
                lib.bind(mainOverHandler, null, this)
            );
            helper.addDOMEvent(
                this, this.main, 'mouseout', 
                lib.bind(mainOutHandler, null, this)
            );

            // 初始化高度和位置
            resetTop(this);
            resetHeight(this); 
            
            // 初始化显示状态
            if (this.isAutoHide()) {
                hide(this);
            }
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

            // remove resize事件listener
            if (this.heightReset) {
                lib.un(window, 'resize', this.heightReset);
                this.heightReset = null;
            }

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
            this._headEl  = null;
            this._bodyEl  = null;

            helper.dispose(this);
            helper.afterDispose(this);
        };

        require('./lib').inherits(Sidebar, Control);
        require('./main').register(Sidebar);
        return Sidebar;
    }
);