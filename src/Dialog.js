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

        var maskIdPrefix = 'ctrlMask';

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
            title: '我是标题',    // 标题的显示文字
            content: '<p>我是内容</p>',   // 内容区域的显示内容
            foot: ''
                + '<div data-ui-type="Button" data-ui-id="btnFootOk">确定</div>'
                + '<div>'
                +     '<a data-ui-type="Link" data-ui-id="btnFootCancel">'
                +         '取消'
                +     '</a>'
                + '</div>',
            needFoot: true
        };

        /**
         * 弹出框控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Dialog(options) {
            Control.apply(this, arguments);
        }

        /**
         * 渲染控件前重绘控件
         * 
         */
        function parseMain(options) {
            var main = options.main;
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

            options.title = roles.title || options.title;
            options.content = roles.content || options.content;

            if (options.needFoot) {
                options.foot = roles.foot || options.foot;
            }
            else {
                options.foot = null;
            }

        }


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

            var closeTpl = 
                '<div class="${clsClass}" id="${clsId}">&nbsp;</div>';
            var closeIcon = '';

            if (me.closeButton) {
                closeIcon = lib.format(
                    closeTpl,
                    {
                        'clsId': helper.getId(me, close),
                        'clsClass': helper.getClasses(me, close)
                    }
                );
            }

            var headTpl = ''
                + '<div id="${headId}" class="${headClass}">'
                +   '<div id="${titleId}" class="${titleClass}">'
                +   '${title}'
                +   '</div>'
                +   '${closeIcon}'
                + '</div>';

            var headData = {
                'headId':  helper.getId(me, head),
                'headClass':  helper.getClasses(me, head),
                'titleId':  helper.getId(me, title),
                'titleClass':  helper.getClasses(me, title),
                'title': me.title,
                'closeIcon': closeIcon
            };

            var headHtml = lib.format(headTpl, headData);

            var headPanelHtml = ''
                + '<div data-ui="type:Panel;childName:head">'
                + headHtml
                + '</div>';

            return headPanelHtml;

        }

        /**
         * 构建对话框主内容和底部内容
         *
         * @param {string} type foot | body 
         * @inner
         */
        function getBFHtml(control, type) {
            var me = control;
            var tpl = '<div class="${class}" id="${id}">${content}</div>';
            var data = {
                'class': helper.getClasses(me, type),
                'id': helper.getId(me, type),
                'content': type == 'body' ? me.content : me.foot
            };

            var innerHtml = lib.format(tpl, data);
            var panelHtml = ''
                + '<div data-ui="type:Panel;childName:' + type + '">'
                + innerHtml
                + '</div>';

            return panelHtml;

        }

        /**
         * 获取指定部分dom元素
         *
         * @param {string} type foot | body | head
         * @inner
         */
        function getPartHtml(type) {
            var domId = lib.getId(this, type);
            return lib.g(domId);
        }

        /**
         * 点击头部关闭按钮时事件处理函数
         *
         * @inner
         */
        function closeClickHandler() {
            this.hide();
        }

        /**
         * 页面resize时事件的处理函数
         *
         * @inner
         */
        function resizeHandler(control, level) {
            var me = control;
            var page = lib.page;
            var main = me.main;
            var left = me.left;
            if (!left) {
                left = (page.getViewWidth() - main.offsetWidth) / 2;
            }

            if (left < 0) {
                left = 0;
            }

            main.style.left = left + 'px';
            main.style.top = page.getScrollTop() + me.top + 'px';
        }

        /**
         * 页面大小发生变化的事件处理器
         *
         * @inner
         */
        function getMaskResizeHandler(level) {
            return function () {
                repaintMask(getMask(level));
            };
        }

        /**
         * 遮盖层初始化
         *
         * @inner
         */
        function initMask(level) {
            var id = maskIdPrefix + level,
                el = document.createElement('div');
            
            el.id = id;
            document.body.appendChild(el);
        }


        /**
         * 重新绘制遮盖层的位置
         *
         * @inner
         * @param {HTMLElement} mask 遮盖层元素.
         */
        function repaintMask(mask) {
            var width = Math.max(
                            document.documentElement.clientWidth,
                            Math.max(
                                document.body.scrollWidth,
                                document.documentElement.scrollWidth)),
                height = Math.max(
                            document.documentElement.clientHeight,
                            Math.max(
                                document.body.scrollHeight,
                                document.documentElement.scrollHeight));

            mask.style.width = width + 'px';
            mask.style.height = height + 'px';
        }

        /**
         * 获取遮盖层dom元素
         *
         * @inner
         * @return {HTMLElement} 获取到的Mask元素节点.
         */
        function getMask(level) {
            var id = maskIdPrefix + level;
            var mask = lib.g(id);

            if (!mask) {
                initMask(level);
            }

            return lib.g(id);
        }


        Dialog.OK_TEXT = '确定';
        Dialog.CANCEL_TEXT = '取消';

        //各层遮挡resize处理函数
        var maskResizeHandlerMap = {};

        /**
         * 自增函数
         *
         * @inner
         */
        Dialog.increment = (function () {
            var i = 0;
            return function () {
                return i++;
            };
        }());

        Dialog.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'Dialog',

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                options = lib.extend(DEFAULT_OPTION, options);
                if (options.main) {
                    parseMain(options);
                }
                this.setProperties(options);
            },

            /**
             * 创建控件主元素
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             */
            createMain: function (options) {
                this.main = document.createElement('div');
            },

            /**
             * 初始化DOM结构，仅在第一次渲染时调用
             */
            initStructure: function () {
                var main = this.main;

                // 设置样式
                main.style.left = '-10000px';

                var mainClass = helper.getClasses(this, 'main');
                var titleId = helper.getId(this, 'title');
                var bodyId = helper.getId(this, 'body');
                var bodyClass = helper.getClasses(this, 'body');
                var footId = helper.getId(this, 'foot');
                var footClass = helper.getClasses(this, 'foot');

                main.innerHTML = ''
                    + getHeadHtml(this)
                    + getBFHtml(this, 'body')
                    + getBFHtml(this, 'foot');
                this.initChildren(main);

                // 初始化控件主元素上的行为
                if (this.closeButton !== false) {
                    var close = this.getClose();
                    close.onclick = lib.bind(closeClickHandler, this);
                }
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: function (changes) {
                var main = this.main;

                // 设置样式
                main.style.left = '-10000px';

                var mainClass = helper.getClasses(this, 'main');
                var titleId = helper.getId(this, 'title');
                var bodyId = helper.getId(this, 'body');
                var bodyClass = helper.getClasses(this, 'body');
                var footId = helper.getId(this, 'foot');
                var footClass = helper.getClasses(this, 'foot');

                // 局部渲染
                if (typeof changes != 'undefined') {
                    // 如果需要更新content
                    // 高度
                    if (changes.height) {
                        this.main.style.height = changes.height + 'px';
                        if (this.isShow) {
                            resizeHandler(this);
                        }
                    }
                    // 宽度
                    if (changes.width) {
                        this.main.style.width = changes.width + 'px';
                        if (this.isShow) {
                            resizeHandler(this);
                        }
                    }
                    // 标题栏
                    if (changes.title) {
                        lib.g(titleId).innerHTML = changes.title;
                    }
                    // 主体内容
                    if (changes.content) {
                        // 获取body panel
                        var body = this.getBody();
                        var bodyWrapper = lib.g(bodyId);
                        bodyWrapper.innerHTML = changes.content;
                        // 需要重新init
                        body.initChildren(bodyWrapper);
                    }
                    // 腿部内容
                    if (typeof changes.foot !== 'undefined') {
                        // 取消了foot
                        if (changes.foot == null) {
                            this.needFoot = false;
                            var foot = this.getFoot();
                            this.removeChild(foot);
                        }
                        else {
                            this.needFoot = true;
                            var foot = this.getFoot();
                            var footWrapper = lib.g(footId);
                            footWrapper.innerHTML = changes.foot;
                            foot.initChildren(footWrapper);
                        }
                    }
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

                if (this.lifeCycle !== Control.LifeCycle.RENDERED) {
                    this.render();
                }

                // 浮动层自动定位功能初始化
                if (this.autoPosition) {
                    lib.on(window, 'resize', resizeHandler);
                }
                this.setWidth(this.width);
                resizeHandler(this);

                // 拖拽功能初始化
                if (this.dragable) {
                    // TODO: 拖拽的库函数还未实现
                    // baidu.dom.draggable(main, {handler:this.getHead()});
                }

                if (mask) {
                    this.showMask(mask.level, mask.type);
                }

                this.fire('show');
                this.isShow = true;

            },

            /**
             * 显示遮盖层
             */
            showMask: function (level, type) {
                level = level || '0';
                var mask = getMask(level);
                var clazz = [];
                var maskClass = helper.getClasses(this, 'mask');

                clazz.push(maskClass);
                clazz.push(maskClass + '-level-' + level);

                if (type) {
                    clazz.push(maskClass + '-' + type);
                }
                
                repaintMask(mask);

                mask.className = clazz.join(' ');
                mask.style.display = 'block';

                var resizeHandler = getMaskResizeHandler(level);
                maskResizeHandlerMap[level] = resizeHandler;
                lib.on(window, 'resize', resizeHandler);            
            },

            /**
             * 隐藏对话框
             * 
             */
            hide: function () {
                if (this.isShow) {
                    if (this.autoPosition) {
                        lib.un(window, 'resize', resizeHandler);
                    }
                    var main = this.main;
                    var mask = this.mask;

                    main.style.left = main.style.top = '-10000px';

                    if (mask) {
                        this.hideMask(mask.level, mask.type);
                    }
                }

                this.fire('hide');
                this.isShow = false;
            },

            /**
             * 隐藏遮盖层
             */
            hideMask: function (level) {
                level = level || '0';
                var mask = getMask(level);
                if ('undefined' != typeof mask) {
                    mask.style.display = 'none';

                    var resizeHandler = maskResizeHandlerMap[level];
                    lib.un(window, 'resize', resizeHandler);
                }
            },

            /**
             * 设置标题文字
             * 
             * @param {string} html 要设置的文字，支持html
             */
            setTitle: function (html) {
                this.title = html;
                if (this.lifeCycle == Control.LifeCycle.RENDERED) {
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
                if (this.lifeCycle == Control.LifeCycle.RENDERED) {
                    this.repaint({'content': content});
                }
            },

            /**
             * 设置腿部内容
             *
             * @param {string} foot 要设置的内容，支持html.
             */
            setFoot: function (foot) {
                this.foot = foot;
                if (this.lifeCycle == Control.LifeCycle.RENDERED) {
                    this.repaint({'foot': foot});
                }
            },

            /**
             * 设置对话框的高度，单位为px
             *
             * @param {number} height 对话框的高度.
             */
            setHeight: function (height) {
                this.height = height;
                if (this.lifeCycle == Control.LifeCycle.RENDERED) {
                    this.repaint({'height': height});
                }
            },

            /**
             * 设置对话框的宽度，单位为px
             *
             * @param {number} width 对话框的宽度.
             */
            setWidth: function (width) {
                this.height = width;
                if (this.lifeCycle == Control.LifeCycle.RENDERED) {
                    this.repaint({'width': width});
                }
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


        Dialog.confirm = function (args) {
            var dialogPrefix    = 'DialogConfirm';
            var okPrefix        = 'DialogConfirmOk';
            var cancelPrefix    = 'DialogConfirmCancel';

            var controlMain = require('./main');

            /**
             * 获取按钮点击的处理函数
             * 
             * @private
             * @param {Function} eventHandler 用户定义的按钮点击函数
             * @return {Functioin}
             */
            function getBtnClickHandler(eventHandler, id) {
                return function () {
                    var dialog = controlMain.get(dialogPrefix + id);
                    var domId = helper.getId(dialog);
                    var okBtn = controlMain.get(okPrefix + id);
                    var cancelBtn = controlMain.get(cancelPrefix + id);
                    var isFunc = (typeof eventHandler == 'function');

                    if ((isFunc && eventHandler(dialog) !== false) || !isFunc) {
                        dialog.hide();
                        okBtn.dispose();
                        cancelBtn.dispose();
                        dialog.dispose();
                        //移除dom
                        lib.removeNode(domId);
                    }
                
                    dialog = null;
                };
            }

            var index = Dialog.increment();

            var title = args.title || '';
            var content = args.content || '';
            var type = args.type || 'confirm';
            var onok = args.onok;
            var oncancel = args.oncancel;
            var width   = args.width || 300; 
            var tpl = [
                '<div class="ui-dialog-icon ui-dialog-icon-${type}"></div>',
                '<div class="ui-dialog-text">${content}</div>'
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
                lib.format(tpl, { type: type, content: content })
            );
            dialog.setFoot(''
                + '<div data-ui="type:Button;childName:okBtn;id:' 
                + okPrefix + index + '">'
                + Dialog.OK_TEXT
                + '</div>'
                + '<div data-ui="type:Button;childName:cancelBtn;id:' 
                + cancelPrefix + index + '">'
                + Dialog.CANCEL_TEXT
                + '</div>'
            );

            var okBtn = dialog.getFoot().getChild('okBtn');
            okBtn.onclick = getBtnClickHandler(onok, index);


            var cancelBtn = dialog.getFoot().getChild('cancelBtn');
            cancelBtn.onclick = getBtnClickHandler(oncancel, index);

        };


        Dialog.alert = function (args) {
            var dialogPrefix = 'DialogAlert';
            var okPrefix = 'DialogAlertOk';

            var controlMain = require('./main');

            /**
             * 获取按钮点击的处理函数
             * 
             * @private
             * @param {Function} eventHandler 用户定义的按钮点击函数
             * @return {Functioin}
             */
            function getBtnClickHandler(eventHandler, id) {
                return function () {
                    var dialog = controlMain.get(dialogPrefix + id);
                    var okBtn = controlMain.get(okPrefix + id);
                    var domId = helper.getId(dialog);

                    var isFunc = (typeof eventHandler == 'function');

                    if ((isFunc && eventHandler(dialog) !== false) || !isFunc) {
                        dialog.hide();
                        okBtn.dispose();
                        dialog.dispose();
                        //移除dom
                        lib.removeNode(domId);
                    }
                
                    dialog = null;
                };
            }

            var index = Dialog.increment();

            var title = args.title || '';
            var content = args.content || '';
            var type = args.type || 'warning';
            var onok = args.onok;
            var width   = args.width || 300; 
            var tpl = [
                '<div class="ui-dialog-icon ui-dialog-icon-${type}"></div>',
                '<div class="ui-dialog-text">${content}</div>'
            ].join('');


            //创建main
            var main = document.createElement('div');
            document.body.appendChild(main);
            var dialog = require('./main').create(
                'Dialog', 
                {
                    id: dialogPrefix + index,
                    closeButton: false,
                    title: '',
                    width: width,
                    mask: {level: args.level || 3},
                    main: main
                }
            );

            var okBtn = require('./main').create(
                'Button', 
                {
                    id: okPrefix + index,
                    content: Dialog.OK_TEXT,
                    skin: 'green'
                }
            );

            dialog.setTitle(title);
            dialog.setContent(
                lib.format(tpl, { type: type, content: content })
            );
            var okId = helper.getId(dialog, okPrefix + index);
            dialog.setFoot(''
                + '<div data-ui="type:Button;childName:okBtn;id:' 
                + okPrefix + index + '">'
                + Dialog.OK_TEXT
                + '</div>'
            );
            
            dialog.show();
            var okBtn = dialog.getChild('okBtn');
            okBtn.onclick = getBtnClickHandler(onok, index);



        }; 

        require('./lib').inherits(Dialog, Control);
        require('./main').register(Dialog);

        return Dialog;
    }
);
