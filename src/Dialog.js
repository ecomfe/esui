/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 弹出框
 * @author dbear
 */

define(
    function (require) {
        require('./Button');
        require('./Panel');
        require('./behavior/Draggable');
        require('./behavior/position');

        var lib = require('./lib');
        var Control = require('./Control');
        var esui = require('./main');
        var painters = require('./painters');
        var eoo = require('eoo');
        var $ = require('jquery');
        var u = require('underscore');

        var maskIdPrefix = 'ctrl-mask';

        /**
         * 弹出框控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        var Dialog = eoo.create(
            Control,
            {
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
                    // 由main解析
                    parseMain(options);
                    /**
                     * 默认Dialog选项配置
                     */
                    var properties = {
                        closeButton: true,    // 是否具有关闭按钮
                        closeOnHide: true,    // 右上角关闭按钮是隐藏还是移除
                        draggable: false,     // 是否可拖拽
                        mask: true,           // 是否具有遮挡层
                        title: '我是标题',    // 标题的显示文字
                        content: '<p>我是内容</p>',   // 内容区域的显示内容
                        // TODO: 这两个属性有些不是特别方便。
                        // 也许可以改进一下用data-role=foot。
                        defaultFoot: ''
                            + '<div '
                            + 'class="'
                            + this.helper.getPartClassName('ok-btn')
                            + '" data-ui="type:Button;id:btnFootOk;'
                            + 'childName:btnOk;variants:primary;">确定</div> '
                            + '<div '
                            + 'class="'
                            + this.helper.getPartClassName('cancel-btn')
                            + '" data-ui="type:Button;'
                            + 'id:btnFootCancel;childName:btnCancel;variants:link">取消</div>',
                        needFoot: true,
                        roles: {},
                        // 是否跟随滚动条
                        setPositionOnScroll: true,
                        // resize时重新计算位置
                        setPositionOnResize: true
                    };

                    u.extend(properties, options);

                    if (properties.needFoot) {
                        if (!properties.foot) {
                            properties.foot = properties.defaultFoot;
                        }
                    }
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
                    this.addState('hidden');
                    createHead(this, this.roles.title);
                    this.createBF('body', this.roles.content);
                    if (this.needFoot) {
                        this.createBF('foot', this.roles.foot);
                    }
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                initEvents: function () {
                    if (this.closeButton) {
                        var close = lib.g(this.helper.getId('close-icon'));
                        if (close) {
                            this.helper.addDOMEvent(
                                close,
                                'click',
                                u.partial(closeClickHandler, this)
                            );
                        }
                    }
                },

                /**
                 * 构建对话框主内容和底部内容
                 *
                 * @param {string} type foot | body
                 * @param {HTMLElement} mainDOM body或foot主元素
                 * @inner
                 * @return {Panel} Panel
                 */
                createBF: function (type, mainDOM) {
                    if (mainDOM) {
                        this.content = mainDOM.innerHTML;
                    }
                    else {
                        mainDOM = document.createElement('div');

                        if (type === 'body') {
                            // 找到head
                            var head = this.getChild('head');
                            if (head) {
                                lib.insertAfter(mainDOM, head.main);
                            }
                            // 放到第一个
                            else if (this.main.firstChild) {
                                lib.insertBefore(
                                    mainDOM, head, this.main.firstChild
                                );
                            }
                            else {
                                this.main.appendChild(mainDOM);
                            }
                        }
                        else {
                            this.main.appendChild(mainDOM);
                        }
                    }

                    lib.addClasses(
                        mainDOM,
                        this.helper.getPartClasses(type + '-panel')
                    );
                    var properties = {
                        main: mainDOM,
                        renderOptions: this.renderOptions
                    };

                    var panel = esui.create('Panel', properties);
                    panel.render();
                    this.addChild(panel, type);
                    return panel;
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
                    {
                        name: 'height',
                        paint: function (dialog, value) {
                            if (value === 'auto') {
                                dialog.main.style.height = 'auto';
                            }
                            else if (value) {
                                dialog.main.style.height = value + 'px';
                            }
                            if (dialog.isShow) {
                                resizeHandler.apply(dialog);
                            }
                        }
                    },
                    {
                        name: 'width',
                        paint: function (dialog, value) {
                            if (value === 'auto') {
                                dialog.main.style.width = 'auto';
                            }
                            else if (value) {
                                dialog.main.style.width = value + 'px';
                            }
                            if (dialog.isShow) {
                                resizeHandler.apply(dialog);
                            }
                        }
                    },
                    {
                        name: 'title',
                        paint: function (dialog, value) {
                            var titleId = dialog.helper.getId('title');
                            lib.g(titleId).innerHTML = value;
                        }
                    },
                    {
                        name: 'content',
                        paint: function (dialog, value) {
                            if (!value) {
                                return;
                            }
                            var bfTpl = ''
                                + '<div class="${class}" id="${id}">'
                                + '${content}'
                                + '</div>';
                            // 获取body panel
                            var body = dialog.getBody();
                            var bodyId = dialog.helper.getId('body');
                            var bodyClass = dialog.helper.getPartClasses('body');
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
                        paint: function (dialog, value) {
                            var bfTpl = ''
                                + '<div class="${class}" id="${id}">'
                                + '${content}'
                                + '</div>';
                            var footId = dialog.helper.getId('foot');
                            var footClass = dialog.helper.getPartClasses('foot');
                            // 取消了foot
                            var foot = dialog.getFoot();
                            if (value == null) {
                                dialog.needFoot = false;
                                if (foot) {
                                    dialog.removeChild(foot);
                                }
                            }
                            else {
                                dialog.needFoot = true;
                                var data = {
                                    'class': footClass.join(' '),
                                    'id': footId,
                                    'content': value
                                };
                                if (!foot) {
                                    foot = dialog.createBF('foot');
                                }
                                foot.setContent(
                                    lib.format(bfTpl, data)
                                );
                            }
                        }
                    },
                    {
                        name: 'draggable',
                        paint: function (dialog, draggable) {
                            var unbind = false;
                            if (draggable) {
                                dialog.addState('draggable');
                            }
                            else {
                                dialog.removeState('draggable');
                                unbind = true;
                            }
                            initDragHandler(dialog, unbind);
                        }
                    }
                ),

                /**
                 * 获取对话框主体的控件对象
                 *
                 *
                 * @return {ui.Panel}
                 */
                getBody: function () {
                    return this.getChild('body');
                },


                /**
                 * 获取对话框头部的控件对象
                 *
                 *
                 * @return {ui.Panel}
                 */
                getHead: function () {
                    return this.getChild('head');
                },


                /**
                 * 获取对话框腿部的控件对象
                 *
                 *
                 * @return {ui.Panel}
                 */
                getFoot: function () {
                    return this.getChild('foot');
                },

                /**
                 * 显示对话框
                 *
                 */
                show: function () {
                    var mask = this.mask;
                    if (this.helper.isInStage('INITED')) {
                        this.render();
                    }
                    else if (this.helper.isInStage('DISPOSED')) {
                        return;
                    }

                    // 浮动层自动定位功能初始化
                    if (this.setPositionOnResize) {
                        this.helper.addDOMEvent(window, 'resize', resizeHandler);
                    }
                    if (this.setPositionOnScroll) {
                        this.helper.addDOMEvent(
                            window, 'scroll', resizeHandler
                        );
                    }
                    this.setWidth(this.width);
                    this.removeState('hidden');
                    resizeHandler.apply(this);

                    // 要把dialog置顶
                    var zIndex = 1203;
                    // if (this.alwaysTop) {
                    // 查找当前dialog个数
                    var rawElements = document.body.children;
                    var dialogNum = 0;
                    for (var i = 0, len = rawElements.length; i < len; i++) {
                        if (rawElements[i].nodeType === 1) {
                            if (lib.hasClass(rawElements[i], this.helper.getPrimaryClassName())
                                && !lib.hasClass(
                                    rawElements[i], this.helper.getPrimaryClassName('hidden'))
                            ) {
                                dialogNum++;
                            }
                        }
                    }

                    zIndex += dialogNum * 10;
                    // }
                    this.main.style.zIndex = zIndex;

                    if (mask) {
                        showMask(this, zIndex - 1);
                    }

                    if (this.isShow) {
                        return;
                    }

                    this.isShow = true;
                    this.fire('show');
                },

                /**
                 * 隐藏对话框
                 *
                 */
                hide: function () {
                    if (!this.isShow) {
                        return;
                    }

                    this.isShow = false;

                    if (this.setPositionOnResize) {
                        this.helper.removeDOMEvent(window, 'resize', resizeHandler);
                    }
                    if (this.setPositionOnScroll) {
                        this.helper.removeDOMEvent(
                            window, 'scroll', resizeHandler
                        );
                    }

                    this.addState('hidden');

                    if (this.mask) {
                        hideMask(this);
                    }

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
                 * 设置对话框的高度，单位为px
                 *
                 * @param {number} height 对话框的高度.
                 */
                setHeight: function (height) {
                    this.setProperties({height: height});
                },

                /**
                 * 设置对话框的宽度，单位为px
                 *
                 * @param {number} width 对话框的宽度.
                 */
                setWidth: function (width) {
                    this.setProperties({width: width});
                },

                /**
                 * 提供一个可以手动调用的resize接口
                 *
                 */
                resize: function () {
                    resizeHandler.apply(this);
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
                    var domId = this.main.id;
                    lib.removeNode(domId);
                    Control.prototype.dispose.apply(this, arguments);
                }
            }
        );

        /**
         * 渲染控件前重绘控件
         *
         * @param {Object} options 设置项
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
         * 构建对话框标题栏
         *
         * @param {Dialog} control 控件对象
         * @param {HTMLElement} mainDOM head主元素
         * @inner
         * @return {Panel} panel
         */
        function createHead(control, mainDOM) {
            var title = 'title';
            var close = 'close-icon';

            var closeTpl
                = '<div class="${clsClass}" id="${clsId}"></div>';
            var closeIcon = '';
            var cls = [];

            if (control.closeButton) {
                cls = control.helper.getPartClasses(close);
                cls.push(control.helper.getIconClass('close'));
                closeIcon = lib.format(
                    closeTpl,
                    {
                        clsId: control.helper.getId(close),
                        clsClass: cls.join(' ')
                    }
                );
            }

            var headTpl = ''
                + '<div id="${titleId}" class="${titleClass}">'
                + '</div>'
                + '${closeIcon}';

            var headClasses = [].concat(
                control.helper.getPartClasses('head')
            );

            var headData = {
                titleId: control.helper.getId(title),
                titleClass: control.helper.getPartClasses(title).join(' '),
                closeIcon: closeIcon
            };

            var headHtml = lib.format(headTpl, headData);

            if (mainDOM) {
                control.title = mainDOM.innerHTML;
            }
            else {
                mainDOM = document.createElement('div');
                if (control.main.firstChild) {
                    lib.insertBefore(mainDOM, control.main.firstChild);
                }
                else {
                    control.main.appendChild(mainDOM);
                }
            }

            mainDOM.innerHTML = headHtml;
            lib.addClasses(mainDOM, headClasses);
            var properties = {
                main: mainDOM,
                renderOptions: control.renderOptions
            };

            var panel = esui.create('Panel', properties);
            panel.render();
            control.addChild(panel, 'head');
            return panel;
        }

        /**
         * 点击头部关闭按钮时事件处理函数
         *
         * @inner
         * @return {boolean} 是否被事件阻止了
         */
        function closeClickHandler() {
            var event = this.fire('beforeclose');

            // 阻止事件，则不继续运行
            if (event.isDefaultPrevented()) {
                return false;
            }

            this.hide();

            this.fire('close');

            if (this.closeOnHide) {
                this.dispose();
            }
        }



        /**
         * 页面resize时事件的处理函数
         *
         * @inner
         */
        function resizeHandler() {
            var main = this.main;
            $(main).position(
                {
                    of: window,
                    at: 'center',
                    my: 'center'
                }
            );
        }

        /**
         * 绑定拖动drag事件
         * @param {ui.Dialog} dialog 控件对象
         * @param {boolean} unbind 是否移除事件
         */
        function initDragHandler(dialog, unbind) {
            var head = dialog.getChild('head').main;

            $(dialog.main).draggable(
                {
                    handle: head,
                    addClasses: false,
                    // 在可视窗口内拖动
                    containment: 'window',
                    disabled: unbind
                }
            );
        }

        /**
         * 显示遮盖层
         * @param {ui.Dialog} dialog 控件对象
         * @param {number} zIndex zIndex值
         */
        function showMask(dialog, zIndex) {
            var mask = getMask(dialog);
            var clazz = [
                dialog.helper.getPrefixClass('mask'),
                dialog.helper.getPrefixClass('mask-page')
            ];
            var maskClass = dialog.helper.getPartClasses('mask').join(' ');

            clazz.push(maskClass);

            mask.className = clazz.join(' ');
            mask.style.display = 'block';
            mask.style.zIndex = zIndex;
        }


        /**
         * 隐藏遮盖层
         * @param {ui.Dialog} dialog 控件对象
         */
        function hideMask(dialog) {
            var mask = getMask(dialog);
            if ('undefined' !== typeof mask) {
                lib.removeNode(mask);
            }
        }

        /**
         * 遮盖层初始化
         *
         * @param {string} maskId 遮盖层domId
         * @inner
         */
        function initMask(maskId) {
            var el = document.createElement('div');
            el.id = maskId;
            document.body.appendChild(el);
        }

        /**
         * 获取遮盖层dom元素
         *
         * @param {ui.Dialog} control 控件对象
         * @inner
         * @return {HTMLElement} 获取到的Mask元素节点.
         */
        function getMask(control) {
            var dialogId = control.helper.getId();
            var id = maskIdPrefix + '-' + dialogId;
            var mask = lib.g(id);

            if (!mask) {
                initMask(id);
            }

            return lib.g(id);
        }

        Dialog.OK_TEXT = '确定';
        Dialog.CANCEL_TEXT = '取消';

        /**
         * 确认提示框
         *
         * @param {Object} args 参数
         * @return {ui.Dialog} 窗口实例
         */
        Dialog.confirm = function (args) {
            var dialogPrefix = 'dialog-confirm';

            /**
             * 获取按钮点击的处理函数
             *
             * @private
             * @param {ui.Dialog} dialog 控件对象
             * @param {string} type 事件类型
             */
            function btnClickHandler(dialog, type) {
                // 如果在参数里设置了处理函数，会在fire时执行
                dialog.fire(type);
                dialog.dispose();
            }

            var title = lib.encodeHTML(args.title) || '';
            var content = lib.encodeHTML(args.content) || '';
            var okText = lib.encodeHTML(args.okText) || Dialog.OK_TEXT;
            var cancelText = lib.encodeHTML(args.cancelText) || Dialog.CANCEL_TEXT;

            var properties = {
                type: 'confirm',
                variants: 'confirm',
                title: ''
            };

            lib.extend(properties, args);

            var tpl = [
                '<div class="${prefix}-icon ${prefix}-icon-${type}"><span class="${icon}"></span></div>',
                '<div class="${prefix}-text">${content}</div>'
            ].join('');


            properties.id = lib.getGUID(dialogPrefix);
            properties.closeButton = false;
            properties.mask = true;
            properties.alwaysTop = true;

            var type = properties.type;
            properties.type = null;

            var dialog = esui.create('Dialog', properties);
            dialog.appendTo(document.body);
            dialog.show();

            // 使用默认foot，改变显示文字
            var okBtn = dialog.getFoot().getChild('btnOk');
            var cancelBtn = dialog.getFoot().getChild('btnCancel');
            okBtn.setContent(okText);
            cancelBtn.setContent(cancelText);

            dialog.setTitle(title);
            dialog.setContent(
                lib.format(
                    tpl,
                    {
                        type: type,
                        content: content,
                        prefix: dialog.helper.getPrimaryClassName(),
                        icon: dialog.helper.getIconClass('question-circle')
                    }
                )
            );

            // 也可以改宽高
            // DEPRECATED: 以后移除`btnHeight`和`btnWidth`支持
            if (properties.btnHeight) {
                okBtn.set('height', properties.btnHeight);
                cancelBtn.set('height', properties.btnHeight);
            }
            if (properties.btnWidth) {
                okBtn.set('width', properties.btnWidth);
                cancelBtn.set('width', properties.btnWidth);
            }

            okBtn.on(
                'click',
                u.partial(btnClickHandler, dialog, 'ok')
            );
            cancelBtn.on(
                'click',
                u.partial(btnClickHandler, dialog, 'cancel')
            );

            return dialog;

        };

        Dialog.alert = function (args) {
            var dialogPrefix = 'dialog-alert';
            var okPrefix = 'dialog-alert-ok';

            /**
             * 获取按钮点击的处理函数
             *
             * @private
             * @param {ui.Dialog} dialog 控件对象
             * @param {string} okBtn 事件类型
             */
            function btnClickHandler(dialog, okBtn) {
                // 如果在参数里设置了处理函数，会在fire时执行
                dialog.fire('ok');
                okBtn.dispose();
                dialog.dispose();
            }

            var title = lib.encodeHTML(args.title) || '';
            var content = lib.encodeHTML(args.content) || '';
            var okText = lib.encodeHTML(args.okText) || Dialog.OK_TEXT;

            var properties = {
                type: 'warning',
                variants: 'alert',
                title: ''
            };

            lib.extend(properties, args);

            var tpl = [
                '<div class="${prefix}-icon ${prefix}-icon-${type}"><span class="${icon}"></span></div>',
                '<div class="${prefix}-text">${content}</div>'
            ].join('');

            var dialogId = lib.getGUID(dialogPrefix);
            properties.id = dialogId;
            properties.closeButton = false;
            properties.mask = true;
            properties.alwaysTop = true;

            var type = properties.type;
            properties.type = null;

            var dialog = esui.create('Dialog', properties);
            dialog.appendTo(document.body);

            dialog.setTitle(title);
            dialog.setContent(
                lib.format(
                    tpl,
                    {
                        type: type,
                        content: content,
                        prefix: dialog.helper.getPrimaryClassName(),
                        icon: dialog.helper.getIconClass('exclamation-circle')
                    }
                )
            );

            dialog.setFoot(''
                + '<div '
                + 'class="' + dialog.helper.getPartClassName('ok-btn') + '"'
                + ' data-ui="type:Button;childName:okBtn;id:'
                + dialogId + '-' + okPrefix + ';variants:primary;">'
                + okText
                + '</div>'
            );

            dialog.show();
            var okBtn = dialog.getFoot().getChild('okBtn');
            okBtn.on(
                'click',
                u.partial(btnClickHandler, dialog, okBtn)
            );

            // 也可以改宽高
            // DEPRECATED: 以后移除`btnHeight`和`btnWidth`支持
            if (properties.btnHeight) {
                okBtn.set('height', properties.btnHeight);
            }

            if (properties.btnwidth) {
                okBtn.set('width', properties.btnwidth);
            }

            return dialog;
        };

        esui.register(Dialog);
        return Dialog;
    }
);
