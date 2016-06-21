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
        require('./behavior/jquery-ui');

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
                        needFoot: true,
                        foot: '<div '
                            + 'class="'
                            + this.helper.getPartClassName('ok-btn')
                            + '" data-ui="type:Button;id:btnFootOk;'
                            + 'childName:btnOk;variants:primary wide;">确定</div> '
                            + '<div '
                            + 'class="'
                            + this.helper.getPartClassName('cancel-btn')
                            + '" data-ui="type:Button;'
                            + 'id:btnFootCancel;childName:btnCancel;variants:link wide">取消</div>',
                        // resize时重新计算位置
                        setPositionOnResize: true
                    };

                    u.extend(properties, Dialog.defaultProperties, options);
                    this.setProperties(properties);
                },

                /**
                 * 初始化DOM结构，仅在第一次渲染时调用
                 */
                initStructure: function () {
                    $(this.main).appendTo(this.appendToElement);

                    // 设置样式
                    this.addState('hidden');

                    var helper = this.helper;
                    var me = this;

                    u.each(['title', 'content', 'foot'], function (item) {
                        if (item === 'foot' && !me.needFoot) {
                            return;
                        }

                        var panelName = item === 'title' ? 'head' : (item === 'content' ? 'body' : 'foot');
                        // search mainDom
                        var mainDOM = $(me.main).children('[data-role=' + item + ']');
                        if (mainDOM.length !== 0) {
                            mainDOM = mainDOM[0];
                        }
                        else {
                            mainDOM = document.createElement('div');
                            mainDOM.innerHTML = me[item];
                        }
                        $(mainDOM).attr({
                            id: helper.getId(panelName),
                            class: helper.getPartClassName(panelName + '-panel')
                        });
                        var properties = {
                            main: mainDOM,
                            renderOptions: this.renderOptions
                        };
                        var panel = esui.create('Panel', properties);

                        panel.appendTo(me.main);
                        me.addChild(panel, panelName);
                    });

                    // close Icon
                    if (this.closeButton) {
                        var cls = helper.getPartClasses('close-icon');
                        cls.push(helper.getIconClass('close'));
                        var closeBtn = lib.format(
                            '<div class="${clsClass}" id="${clsId}"></div>',
                            {
                                clsId: helper.getId('close-icon'),
                                clsClass: cls.join(' ')
                            }
                        );
                        $(this.main).append(closeBtn);
                    }

                    // 在dialog里面添加innerWrapper
                    var dialogInnerWrapper = '<div class="' + this.helper.getPartClassName('inner-wrapper') + '"></div>';
                    $(this.main).wrapInner(dialogInnerWrapper);
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
                            if (value) {
                                var dialogInnerWrapper = dialog.main.children[0];
                                $(dialogInnerWrapper).css('height', value);
                                dialog.resize();
                            }
                        }
                    },
                    {
                        name: 'width',
                        paint: function (dialog, value) {
                            if (value) {
                                var dialogInnerWrapper = dialog.main.children[0];
                                $(dialogInnerWrapper).css('width', value);
                                dialog.resize();
                            }
                        }
                    },
                    {
                        name: 'title',
                        paint: function (dialog, value) {
                            if (!value) {
                                return;
                            }
                            if (dialog.helper.isInStage('RENDERED')) {
                                var titleEle = lib.g(dialog.helper.getId('head'));
                                titleEle.innerHTML = value;
                            }
                        }
                    },
                    {
                        name: 'content',
                        paint: function (dialog, value) {
                            if (!value) {
                                return;
                            }
                            // initStructure时已经渲染panel, 初始化状态时无需再执行
                            if (dialog.helper.isInStage('RENDERED')) {
                                var panel = dialog.getBody();
                                panel.setContent(value);
                                dialog.resize();
                            }
                        }
                    },
                    {
                        name: 'foot',
                        paint: function (dialog, value) {
                            if (!value || !dialog.needFoot) {
                                return;
                            }
                            if (dialog.helper.isInStage('RENDERED')) {
                                var panel = dialog.getFoot();
                                panel.setContent(value);
                                dialog.resize();
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

                    var helper = this.helper;
                    if (this.isShow || helper.isInStage('DISPOSED')) {
                        return;
                    }
                    else if (helper.isInStage('INITED')) {
                        this.render();
                    }
                    this.isShow = true;
                    this.setWidth(this.width);
                    this.removeState('hidden');

                    // resize事件绑定
                    if (this.setPositionOnResize) {
                        helper.addDOMEvent(window, 'resize', resizeHandler);
                    }

                    // 要把dialog置顶
                    var zIndex = 1203;
                    var rawElements = document.body.children;
                    var dialogNum = 0;
                    for (var i = 0, len = rawElements.length; i < len; i++) {
                        if (rawElements[i].nodeType === 1) {
                            if (lib.hasClass(rawElements[i], helper.getPrimaryClassName())
                                && !lib.hasClass(
                                    rawElements[i], helper.getPrimaryClassName('hidden'))
                            ) {
                                dialogNum++;
                            }
                        }
                    }
                    zIndex += dialogNum * 10;
                    $(this.main).css('zIndex', zIndex);

                    if (this.mask) {
                        showMask(this, zIndex - 1);
                    }
                    this.resize();

                    // body隐藏导航条
                    $('body').addClass('hasDialog');

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

                    this.addState('hidden');

                    if (this.mask) {
                        hideMask(this);
                    }

                    // body显示导航条
                    if ($('body').hasClass('hasDialog')) {
                        $('body').removeClass('hasDialog');
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

        Dialog.defaultProperties = {
            appendToElement: 'body'
        };

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
            if (this.isShow) {
                var dialogInnerWrapper = this.main.children[0];
                $(dialogInnerWrapper).position(
                    {
                        of: window,
                        at: 'center',
                        my: 'center',
                        collision: 'fit'
                    }
                );
            }
        }

        /**
         * 绑定拖动drag事件
         *
         * @param {ui.Dialog} dialog 控件对象
         * @param {boolean} unbind 是否移除事件
         */
        function initDragHandler(dialog, unbind) {
            var head = dialog.getChild('head').main;

            $(dialog.main.children[0]).draggable(
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
         *
         * @param {ui.Dialog} dialog 控件对象
         * @param {number} zIndex zIndex值
         */
        function showMask(dialog, zIndex) {
            var helper = dialog.helper;
            var mask = getMask(dialog);
            var maskClass = [
                helper.getPrefixClass('mask'),
                helper.getPrefixClass('mask-page'),
                helper.getPartClasses('mask').join(' ')
            ];
            $(mask).addClass(maskClass.join(' '));
            $(mask).css({
                display: 'block',
                zIndex: zIndex
            });
        }


        /**
         * 隐藏遮盖层
         *
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
         * @param {Object} args 提示框参数
         * @param {string=} args.title 提示框标题文本
         * @param {string=} args.content 提示框内容文本
         * @param {string=} args.rawTitle 提示框标题HTML，覆盖title
         * @param {string=} args.rawContent 提示框内容HTML，覆盖content
         * @param {string=} args.okText 确认按钮文本
         * @param {string=} args.cancelText 取消按钮文本
         * @return {ui.Dialog} 窗口实例
         */
        Dialog.confirm = function (args) {
            var dialogPrefix = 'dialog-confirm';

            // initOption
            var properties = {
                type: 'confirm',
                variants: 'confirm',
                title: '',
                closeButton: false,
                mask: true,
                alwaysTop: true
            };
            u.extend(properties, args);

            properties.id = lib.getGUID(dialogPrefix);
            var type = properties.type;
            properties.type = null;

            var dialog = esui.create('Dialog', properties);
            dialog.appendTo(document.body);
            dialog.show();

            // initStructure
            var title = args.rawTitle || lib.encodeHTML(args.title) || '';
            var content = args.rawContent || lib.encodeHTML(args.content) || '';
            var okText = u.escape(args.okText) || Dialog.OK_TEXT;
            var cancelText = u.escape(args.cancelText) || Dialog.CANCEL_TEXT;

            var tpl = [
                '<div class="${prefix}-icon ${prefix}-icon-${type}"><span class="${icon}"></span></div>',
                '<div class="${prefix}-text">${content}</div>'
            ].join('');

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

            // 使用默认foot，改变显示文字
            var okBtn = dialog.getFoot().getChild('btnOk');
            var cancelBtn = dialog.getFoot().getChild('btnCancel');
            okBtn.setContent(okText);
            cancelBtn.setContent(cancelText);

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

            okBtn.on(
                'click',
                u.partial(btnClickHandler, dialog, 'ok')
            );
            cancelBtn.on(
                'click',
                u.partial(btnClickHandler, dialog, 'cancel')
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

            return dialog;

        };

        /**
         * 警告提示框
         *
         * @param {Object} args 提示框参数
         * @param {string=} args.title 提示框标题文本
         * @param {string=} args.content 提示框内容文本
         * @param {string=} args.rawTitle 提示框标题HTML，覆盖title
         * @param {string=} args.rawContent 提示框内容HTML，覆盖content
         * @param {string=} args.okText 确认按钮文本
         * @return {Dialog}
         */
        Dialog.alert = function (args) {
            var dialogPrefix = 'dialog-alert';
            var okPrefix = 'dialog-alert-ok';

            // initOptions
            var properties = {
                type: 'warning',
                variants: 'alert',
                title: '',
                closeButton: false,
                mask: true,
                alwaysTop: true
            };
            u.extend(properties, args);

            var dialogId = lib.getGUID(dialogPrefix);
            properties.id = dialogId;
            var type = properties.type;
            properties.type = null;

            var dialog = esui.create('Dialog', properties);
            dialog.appendTo(document.body);

            // initStructure
            var tpl = [
                '<div class="${prefix}-icon ${prefix}-icon-${type}"><span class="${icon}"></span></div>',
                '<div class="${prefix}-text">${content}</div>'
            ].join('');

            var title = args.rawTitle || lib.encodeHTML(args.title) || '';
            var content = args.rawContent || lib.encodeHTML(args.content) || '';
            var okText = u.escape(args.okText) || Dialog.OK_TEXT;

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
