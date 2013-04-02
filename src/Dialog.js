/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 弹出框
 * @author dbear
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var Main = require('./main');

        /**
         * 默认Dialog选项配置
         * 
         * @const
         * @inner
         * @type {Object}
         */
        var DEFAULT_OPTION = {
            autoPosition: false,  // 是否自动定位居中
            closeButton: true,    // 是否具有关闭按钮
            draggable: false,     // 是否可拖拽
            mask: true,           // 是否具有遮挡层。或者指定带有level和type属性的object，自定义遮挡层
            width: 600,           // 对话框的宽度
            height: 0,            // 对话框的高度
            top: 0,
            left: 0,
            title: '我是标题',    // 标题的显示文字
            content: '<p>我是内容</p>',   // 内容区域的显示内容
            foot: '' 
                + '<div data-ui-type="Button" data-ui-id="btnFootOk" >确定</div>'
                + '<div><a data-ui-type="Link" data-ui-id="btnFootCancel">取消</a></div>',
            needFoot: true
        };

        /**
         * 弹出框控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Dialog(options) {
            helper.init(this, options, DEFAULT_OPTION);

            if (!this.main) {
                this.main = document.createElement('div');
            }
            else {
                parseMain(this);
            }

            helper.afterInit(this);
        }
        
        /**
         * 渲染控件前重绘控件
         * 
         */
        function parseMain() {
            var main = this.main;
            var els = main.getElementsByTagName('*');
            var len = els.length;
            var roleName;
            var content;
            var roles = {};

            while (len--) {
                roleName = els[len].getAttribute('data-role');
                if (roleName) {
                    content = els[len].innerHTML;
                    // 不再校验，如果设置了相同的data-role，
                    // 直接覆盖
                    roles[roleName] = content;
                }
            }

            this.title = roles['title'] || this.title;
            this.content = roles['content'] || this.content;

            if (this.needFoot) {
                this.foot = roles['foot'] || this.foot;
            }
            else {
                this.foot = null;
            }

        },


        /**
         * 构建对话框标题栏
         * 
         * @inner
         */
        function getHeadHtml(control) {
            var me = control;
            var head = 'head';
            var title = 'title';
            var close = 'closeIcon';

            var closeTpl = '<div class="{clsClass}" id="{clsId}">&nbsp;</div>';
            var closeIcon = '';

            if (me.closeButton) {
                closeIcon = lib.format(
                    closeTpl,
                    {
                        'clsId': helper.getId(me, close),
                        'clsClass': helper.getClasses(me, close),
                    }
                );
            }

            var headTpl = ''
                + '<div id="{headId}" class="{headClass}">'
                +   '<div id="{titleId}" class="{titleClass}">'
                +   '{title}'
                +   '</div>'
                +   '{closeIcon}'
                + '</div>';

            var headData = {
                'headId':  helper.getId(me, head),
                'headClass':  helper.getClasses(me, head),
                'titleId':  helper.getId(me, title),
                'titleClass':  helper.getClasses(me, title),
                'title': me.title,
                'closeIcon': closeIcon
            }

            var headHtml = lib.format(headTpl, headData);

            var headPanelHtml = ''
                + '<div data-ui="type:Panel;childName:head">'
                + headHtml
                + '</div>';

            return headPanelHtml;

        };

        /**
         * 构建对话框主内容和底部内容
         *
         * @param {string} type foot | body 
         * @inner
         */
        function getBFHtml(control, type) {
            var me = control;
            var tpl = '<div class="{class}" id="{id}">{content}</div>';
            var data = {
                'class': helper.getClasses(me, type),
                'id': helper.getId(me, type),
                'content': type == 'body' ? me.content || me.foot
            };

            var innerHtml = lib.format(tpl, data);
            var panelHtml = ''
                + '<div data-ui="type:Panel;childName:' + type + '">'
                + innerHtml
                + '</div>';

            return panelHtml;

        };

        /**
         * 获取指定部分dom元素
         *
         * @param {string} type foot | body | head
         * @inner
         */
        function getPartHtml(type) {
            var domId = lib.getId(this, type);
            return lib.g(domId);
        };

        /**
         * 点击头部关闭按钮时事件处理函数
         *
         * @inner
         */
        function closeClickHandler() {
            this.hide();
        };

        /**
         * 页面resize时事件的处理函数
         *
         * @inner
         */
        function resizeHandler(control) {
            var me = control;
            var page = lib.page;
            var main = me.main;
            var left = me.left;
            var top = me.top; 

            if (!left) {
                left = (page.getViewWidth() - main.offsetWidth) / 2;
            }

            if (left < 0) {
                left = 0;
            }

            main.style.left = left + 'px';
            main.style.top = page.getScrollTop() + me.top + 'px';
        };

        Dialog.OK_TEXT = '确定';
        Dialog.CANCEL_TEXT = '取消';

        /**
         * 自增函数
         *
         * @inner
         */
        Dialog.increment = function () {
            var i = 0;
            return function () {
                return i++;
            };
        }();

        Dialog.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'Dialog',

            /**
             * 渲染控件
             * 
             * @param {object} refreshParam 更新属性集合
             * @override
             */
            repaint: function (refreshParam) {
                var main = this.main;

                // 设置样式
                main.style.left = '-10000px';

                var mainClass = helper.getClasses(this, 'main');
                var titleId = helper.getId(this, 'title');
                var bodyId = helper.getId(this, 'body');
                var bodyClass = helper.getClasses(this, 'body');
                var footId = helper.getId(this, 'foot');
                var footClass = helper.getClasses(this, 'foot');

                // 第一次渲染或全集渲染
                if (typeof refreshParam == 'undefined' ) {
                    main.innerHTML = ''
                        + getHeadHtml(this)
                        + getBFHtml(this, 'body')
                        + getBFHtml(this, 'foot');
                    this.initChildren(main);
                }
                // 局部渲染
                else {
                    // 如果需要更新content
                    // 高度
                    if(refreshParam.hasOwnProperty('height')) {
                        this.main.style.height = height + 'px';
                        if (this.isShow) {
                            resizeHandler(this);
                        }
                    }
                    // 宽度
                    if(refreshParam.hasOwnProperty('width')) {
                        this.main.style.width = width + 'px';
                        if (this.isShow) {
                            resizeHandler(this);
                        }
                    }
                    // 标题栏
                    if(refreshParam.hasOwnProperty('title')) {
                        lib.g(titleId).innerHTML = refreshParam.title;
                    }
                    // 主体内容
                    if(refreshParam.hasOwnProperty('content')) {
                        // 获取body panel
                        var body = this.getBody();
                        var bodyWrapper = lib.g(bodyId);
                        bodyWrapper.innerHTML = refreshParam.content;
                        // 需要重新init
                        body.initChildren(bodyWrapper);
                    }
                    // 腿部内容
                    if(typeof refreshParam.foot !== 'undefined') {
                        // 取消了foot
                        if (refreshParam.foot == null) {
                            this.needFoot = false;
                            var foot = this.getFoot();
                            this.removeChild(foot);
                        }
                        else {
                            this.needFoot = true;
                            var foot = this.getFoot();
                            var footWrapper = lib.g(footId);
                            footWrapper.innerHTML = refreshParam.foot;
                            foot.initChildren(footWrapper);
                        }
                    }
                }

                // 初始化控件主元素上的行为
                if (me.closeButton !== false) {
                    var close = me.getClose();
                    close.onclick = lib.bind(closeClickHandler, me);
                }

            },

            /**
             * 获取对话框主体的控件对象
             * 
             * 
             * @return {HTMLElement} 
             */
            getBody: function () {
                return this.getChild('body');
            },

            /**
             * 获取对话框主体的dom元素
             * 
             * 
             * @return {HTMLElement} 
             */
            getBodyDom: function () {
                return getPartHtml(this, 'head');
            },

            /**
             * 获取对话框头部的控件对象
             * 
             * 
             * @return {HTMLElement} 
             */
            getHead: function () {
                return this.getChild('head');
            },

            /**
             * 获取对话框头部的dom元素
             * 
             * 
             * @return {HTMLElement} 
             */
            getHeadDom: function () {
                return getPartHtml(this, 'head');
            },

            /**
             * 获取对话框腿部的控件对象
             * 
             * 
             * @return {HTMLElement} 
             */
            getFoot: function () {
                return this.getChild('foot');
            },

            /**
             * 获取对话框腿部的dom元素
             * 
             * 
             * @return {HTMLElement} 
             */
            getFootDom: function () {
                return getPartHtml(this, 'foot');
            },

            /**
             * 显示对话框
             * 
             */
            show: function () {
                var main = this.main;
                var mask = this.mask;

                if (!main) {
                    this.render();
                }

                this.setWidth(this.width);

                // 浮动层自动定位功能初始化
                if (this.autoPosition) {
                    lib.on(window, 'resize', resizeHandler);
                }

                resizeHandler(this);

                // 拖拽功能初始化
                if (this.dragable) {
                    //拖拽的库函数还未实现
                    //baidu.dom.draggable(main, {handler:this.getHead()});
                }

                if (this.onshow) {
                    this.onshow();
                }        

                if (mask) {
                    //依赖mask控件
                    //ui.Mask.show(mask.level, mask.type);
                }

                this.isShow = true;

            };


            /**
             * 隐藏对话框
             * 
             */
            hide: function () {
                var me = this;
                if (this.isShow) {
                    if ( this.autoPosition ) {
                        lib.un(window, 'resize', resizeHandler);
                    }
                    var main = this.main;
                    main.style.left = main.style.top = '-10000px';
                    if (mask) {
                        //依赖mask控件
                        //ui.Mask.hide(mask.level, mask.type);
                    }
                }
                if (this.onhide) {
                    this.onhide();
                }
                
                this.isShow = false;
            },

            /**
             * 设置标题文字
             * 
             * @param {string} html 要设置的文字，支持html
             */
            setTitle: function (html) {
                this.title = html;
                if ( this.lifeCycle == LifeCycle.RENDERED) {
                    this.repaint({'title': html});
                }
            },

            /**
             * 设置内容
             *
             * @param {string} content 要设置的内容，支持html.
             */
            setContent: function (content) {
                this.content = content;
                if ( this.lifeCycle == LifeCycle.RENDERED) {
                    this.repaint({'content': content});
                }
            },

            /**
             * 设置对话框的高度，单位为px
             *
             * @param {number} height 对话框的高度.
             */
            setHeight: function (height) {
                this.height = height;
            },

            /**
             * 设置对话框的宽度，单位为px
             *
             * @param {number} width 对话框的宽度.
             */
            setWidth: function (width) {
                this.width = width;
            },

            /**
             * 销毁释放控件
             * 
             * @override
             */
            dispose: function () {
                helper.beforeDispose(this);

                var main = this.main;
                if (main) {
                    main.onclick = null;
                    this.onshow = null;
                    this.onhide = null;
                }

                helper.dispose(this);
                helper.afterDispose(this);
            }
        };


        Dialog.confirm = function(args) {
            var dialogPrefix    = '__DialogConfirm';
            var okPrefix        = '__DialogConfirmOk';
            var cancelPrefix    = '__DialogConfirmCancel';

            var controlMain = require('./main');

            /**
             * 获取按钮点击的处理函数
             * 
             * @private
             * @param {Function} eventHandler 用户定义的按钮点击函数
             * @return {Functioin}
             */
            function getBtnClickHandler(eventHandler, id) {
                return function(){
                    var dialog = controlMain.get(dialogPrefix + id);
                    var okBtn = controlMain.get(okPrefix + id);
                    var cancelBtn = controlMain.get(cancelPrefix + id);

                    var isFunc = (typeof eventHandler == 'function');

                    if ((isFunc && eventHandler(dialog) !== false) || !isFunc) {
                        dialog.hide();
                        okBtn.dispose();
                        cancelBtn.dispose();
                        dialog.dispose();
                    }
                
                    dialog = null;
                }
            };

            var index = Dialog.increment();

            var title = args.title || '';
            var content = args.content || '';
            var type = args.type || 'confirm';
            var onok = args.onok;
            var oncancel = args.oncancel;
            var width   = args.width || 300; 
            var tpl = [
                '<div class="ui-dialog-icon ui-dialog-icon-{type}"></div>',
                '<div class="ui-dialog-text">{content}</div>'
            ].join('');

            var dialog = require('./main').create(
                'Dialog', 
                {
                    id: dialogPrefix + index,
                    closeButton: false,
                    title: '',
                    width: width,
                    mask: {level: args.level || 3}
                }
            );
        
            dialog.show();
            dialog.setTitle(title);
            dialog.setContent(
                lib.format(
                    tpl, 
                    {
                        'type': type,
                        'content': content
                    }
                )
            );
            dialog.setFoot(''
                + '<div data-ui="type:Button;childName:okBtn;id:' + okPrefix + index + '">'
                + Dialog.OK_TEXT
                + '</div>'
                + '<div data-ui="type:Button;childName:cancelBtn;id:' + cancelPrefix + index + '">'
                + Dialog.CANCEL_TEXT
                + '</div>'
            );

            var okBtn = dialog.getFoot().getChild('okBtn');
            okBtn.onclick = getBtnClickHandler(onok, index);


            var cancelBtn = dialog.getFoot().getChild('cancelBtn');
            cancelBtn.onclick = getBtnClickHandler(oncancel, index);

        };


        Dialog.alert = function(args) {
            var dialogPrefix    = '__DialogAlert';
            var okPrefix        = '__DialogAlertOk';

            var controlMain = require('./main');

            /**
             * 获取按钮点击的处理函数
             * 
             * @private
             * @param {Function} eventHandler 用户定义的按钮点击函数
             * @return {Functioin}
             */
            function getBtnClickHandler(eventHandler, id) {
                return function(){
                    var dialog = controlMain.get(dialogPrefix + id);
                    var okBtn = controlMain.get(okPrefix + id);

                    var isFunc = (typeof eventHandler == 'function');

                    if ((isFunc && eventHandler(dialog) !== false) || !isFunc) {
                        dialog.hide();
                        okBtn.dispose();
                        dialog.dispose();
                    }
                
                    dialog = null;
                }
            };

            var index = Dialog.increment();

            var title = args.title || '';
            var content = args.content || '';
            var type = args.type || 'warning';
            var onok = args.onok;
            var width   = args.width || 300; 
            var tpl = [
                '<div class="ui-dialog-icon ui-dialog-icon-{type}"></div>',
                '<div class="ui-dialog-text">{content}</div>'
            ].join('');


            var dialog = require('./main').create(
                'Dialog', 
                {
                    id: dialogPrefix + index,
                    closeButton: false,
                    title: '',
                    width: width,
                    mask: {level: args.level || 3}

                }
            );

            var okBtn = require('./main').create(
                'Button', 
                {
                    id: okPrefix + index,
                    content: Dialog.OK_TEXT
                }
            );
        
            dialog.show();
            dialog.setTitle(title);
            dialog.setContent(
                lib.format(
                    tpl, 
                    {
                        'type': type,
                        'content': content
                    }
                )
            );
            dialog.setFoot(''
                + '<div data-ui="type:Button;childName:okBtn;id:' + okPrefix + index + '">'
                + Dialog.OK_TEXT
                + '</div>'
            );

            var okBtn = dialog.getFoot().getChild('okBtn');
            okBtn.onclick = getBtnClickHandler(onok, index);

        }; 

        require('./lib').inherits(Dialog, Control);
            .register(Dialog);
        return Dialog;
    }
);
