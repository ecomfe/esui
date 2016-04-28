/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 浮层基类
 * @author dbear
 */
define(
    function (require) {
        var lib = require('./lib');
        var esui = require('./main');
        var Panel = require('./Panel');
        var $ = require('jquery');
        var u = require('underscore');
        var eoo = require('eoo');
        var painters = require('./painters');

        require('./behavior/jquery-ui');

        /**
         * 浮层控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        var Overlay = eoo.create(
            Panel,
            {
                type: 'Overlay',

                /**
                 * @override
                 */
                initOptions: function (options) {
                    // 默认属性
                    var properties = {
                        // 位置是否固定，固定时，scroll、 resize都触发重新布局
                        fixed: false,
                        // 点击浮层外部，是否自动关闭
                        autoClose: true,
                        // 是否具有遮挡层
                        hasMask: false,
                        appendToElement: 'body'
                    };
                    u.extend(properties, options);
                    this.$super([properties]);
                },

                /**
                 * @override
                 */
                initStructure: function () {
                    var $main = $(this.main);
                    $main.appendTo(this.appendToElement);
                    // 设置隐藏样式，如果直接隐藏可能会影响尺寸计算，所以只是移出
                    this.addState('hidden');
                    this.$super(arguments);
                },

                /**
                 * @override
                 */
                repaint: painters.createRepaint(
                    Panel.prototype.repaint,
                    {
                        name: ['width', 'height'],
                        paint: function (overlay, width, height) {
                            if (!isPropertyEmpty(width)) {
                                if (width === 'auto') {
                                    overlay.main.style.width = 'auto';
                                }
                                else {
                                    overlay.main.style.width = width + 'px';
                                }
                            }

                            if (!isPropertyEmpty(height)) {
                                if (height === 'auto') {
                                    overlay.main.style.height = 'auto';
                                }
                                else {
                                    overlay.main.style.height = height + 'px';
                                }
                            }

                            if (!overlay.isHidden()) {
                                autoLayout.apply(overlay);
                            }
                        }
                    },
                    {
                        name: ['attachedDOM', 'attachedControl'],
                        paint: function (overlay, attachedDOM, attachedControl) {
                            var targetDOM = getTargetDOM.call(overlay, attachedDOM, attachedControl);
                            overlay.attachedTarget = targetDOM;
                        }
                    }
                ),

                /**
                 * 显示浮层
                 */
                show: function () {
                    if (this.helper.isInStage('INITED')) {
                        this.render();
                    }
                    else if (this.helper.isInStage('DISPOSED')) {
                        return;
                    }

                    if (this.autoClose) {
                        // 点击文档自动关闭
                        this.helper.addDOMEvent(document, 'mousedown', close);
                    }

                    if (this.fixed) {
                        this.helper.addDOMEvent(window, 'resize', resizeHandler);
                        this.helper.addDOMEvent(window, 'scroll', resizeHandler);
                    }

                    this.removeState('hidden');

                    // 配置遮罩层zIndex
                    if (this.hasMask) {
                        showMask.call(this);
                    }

                    // 置顶
                    this.moveToTop();

                    // 先人肉执行一下layout
                    autoLayout.apply(this);
                    this.fire('show');
                },

                /**
                 * 隐藏对话框
                 *
                 */
                hide: function () {
                    if (!this.isHidden()) {
                        if (this.autoClose) {
                            // 点击文档自动关闭
                            this.helper.removeDOMEvent(document, 'mousedown', close);
                        }

                        if (this.fixed) {
                            this.helper.removeDOMEvent(window, 'resize', resizeHandler);
                            this.helper.removeDOMEvent(window, 'scroll', resizeHandler);
                        }

                        // 设置隐藏样式，如果直接隐藏可能会影响尺寸计算，所以只是移出
                        this.addState('hidden');

                        if (this.hasMask) {
                            hideMask.call(this);
                        }
                    }

                    this.fire('hide');
                },

                /**
                 * 置顶方法
                 *
                 */
                moveToTop: function () {
                    var zIndex = this.getZIndex();
                    this.main.style.zIndex = zIndex;

                    var mask = getMask.call(this);
                    if (mask) {
                        mask.style.zIndex = zIndex - 1;
                    }
                },

                /**
                 * 获取当前Overlay要显示所要的ZIndex
                 * @return {number}
                 */
                getZIndex: function () {
                    var primaryClassName = this.helper.getPrimaryClassName();
                    var hiddenPrimaryClassName = this.helper.getPrimaryClassName('hidden');
                    var zIndex = 1203;
                    // 查找当前overlay个数
                    var rawElements = $(document.body).children().toArray();
                    var $ele;
                    for (var i = 0, len = rawElements.length; i < len; i++) {
                        $ele = $(rawElements[i]);
                        if ($ele.hasClass(primaryClassName)
                            && !$ele.hasClass(hiddenPrimaryClassName)) {
                            zIndex = Math.max(zIndex, $ele[0].style.zIndex) + 10;
                        }
                    }

                    return zIndex;
                },

                /**
                 * 独立摆置
                 *
                 * @param {Object} options 放置相关的选项，选项中的所有边距都是css规范的
                 * @param {number} options.top 上边距
                 * @param {number} options.bottom 下边距
                 * @param {number} options.left 左边距
                 * @param {number} options.right 右边距
                 */
                selfLayout: function (options) {
                    var page = lib.page;
                    var main = this.main;

                    var properties = u.clone(options || {});
                    var layerPosition = lib.getOffset(main);

                    // 如果左右都没配，则自动居中
                    if (isPropertyEmpty(properties, 'left') && isPropertyEmpty(properties, 'right')) {
                        properties.left = (page.getViewWidth() - layerPosition.width) / 2;
                    }
                    // 如果都配了，则计算出宽度，然后取消right的设置
                    else if (!isPropertyEmpty(properties, 'left') && !isPropertyEmpty(properties, 'right')) {
                        // 如果宽度没配，才计算
                        if (isPropertyEmpty(properties, 'width')) {
                            // 还要考虑padding和border
                            properties.width = page.getViewWidth()
                                - properties.right
                                - properties.left
                                - $(this.main).css('padding-left')
                                - $(this.main).css('padding-right')
                                - $(this.main).css('border-left-width')
                                - $(this.main).css('border-right-width');
                        }
                        properties = u.omit(properties, 'right');
                    }

                    // 不可越界
                    properties.left = Math.max(properties.left, 0);
                    // 独立展开层的位置是相对viewPort的，因此要考虑进来scroll
                    properties.left = page.getScrollLeft() + properties.left;

                    // 如果上下都没配，则自动居中
                    if (isPropertyEmpty(properties, 'top') && isPropertyEmpty(properties, 'bottom')) {
                        properties.top = (page.getViewHeight() - layerPosition.height) / 2;
                    }
                    // 如果都配了，则计算出高度，然后取消bottom的设置
                    else if (!isPropertyEmpty(properties, 'top') && !isPropertyEmpty(properties, 'bottom')) {
                        // 如果高度没配，才计算
                        if (isPropertyEmpty(properties, 'height')) {
                            // 还要考虑padding和border
                            properties.height = page.getViewHeight()
                                - properties.top
                                - properties.bottom
                                - $(this.main).css('padding-top')
                                - $(this.main).css('padding-bottom')
                                - $(this.main).css('border-top-width')
                                - $(this.main).css('border-bottom-width');
                        }
                        properties = u.omit(properties, 'bottom');
                    }

                    // 不可越界
                    properties.top = Math.max(properties.top, 0);
                    // 算上滚动
                    properties.top = page.getScrollTop() + properties.top;

                    renderLayer.call(this, properties);
                },

                /**
                 * 有粘连元素的摆置
                 *
                 * @param {HTMLElement} target 目标元素
                 * @param {Object} [options] 停靠相关的选项
                 * @param {boolean} [options.strictWidth] 是否要求层的宽度不小于目标元素的宽度
                 * @param {Array} [options.preference] 首选位置
                 * --- 布局支持12种
                 * --- bottom left
                 * --- bottom right
                 * --- bottom center
                 * --- top right
                 * --- top left
                 * --- top center
                 * --- left top
                 * --- left bottom
                 * --- left center
                 * --- right top
                 * --- right bottom
                 * --- right center
                 */
                attachLayout: function (target, options) {
                    var main = this.main;
                    options = options || ['bottom', 'left'];

                    // 由于layer不会跑到target的内部
                    // 所以这里my选项取值与at相反即可
                    // 具体参考./behavior/position
                    var myPosition = 'right';
                    if (options[0] === 'right') {
                        myPosition = 'left';
                    }
                    else if (options[0] === 'top') {
                        myPosition = 'bottom';
                    }
                    else if (options[0] === 'bottom') {
                        myPosition = 'top';
                    }

                    $(main).position(
                        {
                            of: target,
                            at: options[1] + ' ' + options[0],
                            my: options[1] + ' ' + myPosition
                        }
                    );
                },

                /**
                 * 移动层的位置
                 *
                 * @param {number} top 上边界距离
                 * @param {number} left 左边界距离
                 * @public
                 */
                moveTo: function (top, left) {
                    this.selfLayout({top: top, left: left});
                },

                /**
                 * 缩放层的大小
                 *
                 */
                resize: function () {
                    autoLayout.apply(this);
                },

                /**
                 * 销毁控件
                 */
                dispose: function () {
                    if (this.helper.isInStage('DISPOSED')) {
                        return;
                    }
                    // 移除mask
                    $('#ctrl-mask-' + this.helper.getId()).remove();
                    // 移除dom
                    $(this.main).remove();
                    this.$super(arguments);
                }
            }
        );

        /**
         * 通过点击关闭弹层的处理方法
         *
         * @param {Event} e DOM事件对象
         */
        function close(e) {
            var target = e.target;
            var layer = this.main;

            if (!layer) {
                return;
            }

            var isChild = $.contains(layer, target) || layer === target;

            if (!isChild) {
                this.hide();
            }
        }

        /**
         * 自动布局
         */
        function autoLayout() {
            var attachedTarget = this.attachedTarget;
            var attachedLayout = this.attachedLayout;

            // 有粘连元素
            if (attachedTarget != null) {
                if (u.isString(attachedLayout)) {
                    attachedLayout = attachedLayout.split(',');
                }
                this.attachLayout(attachedTarget, attachedLayout);
            }
            // 无粘连元素
            else {
                var options = u.pick(this, 'left', 'right', 'top', 'bottom', 'width', 'height');
                this.selfLayout(options);
            }
        }

        /**
         * 通过domId或者控件id获取绑定目标的主元素
         * @param {string} domId DOM元素id
         * @param {string} control 控件或控件id
         * @return {HTMLElement} 控件主元素
         */
        function getTargetDOM(domId, control) {
            // DOM优先
            if (domId) {
                return lib.g(domId);
            }
            else if (control) {
                // 传的是id
                if (u.isString(control)) {
                    control = this.viewContext.get(control) || {};
                }
                return control.main;
            }

            return null;
        }

        /**
         * 渲染层样式
         *
         * @param {Object} options 定位参数
         * @param {number} options.left 坐标
         * @param {number} options.top 坐标
         * @param {Array} options.align 如 ['right', 'top']
         */
        function renderLayer(options) {
            var main = this.main;
            var properties = u.clone(options || {});

            // 设置class
            if (u.isArray(properties.align)) {
                // 要先清空之前的class
                var classList = u.filter(
                    lib.getClassList(main),
                    function (classItem) {
                        return !classItem.match(/top-|bottom-|right-|left-/);
                    }
                );

                classList.push(this.helper.getPartClasses(properties.align.join('-')));

                lib.setAttribute(main, 'className', classList.join(' '));
            }

            properties = u.omit(properties, 'align');

            // 避免原来的属性影响
            main.style.top = '';
            main.style.bottom = '';
            main.style.left = '';
            main.style.right = '';

            // 设置位置和大小
            u.each(properties, function (value, name) {
                if (!isPropertyEmpty(value)) {
                    main.style[name] = value + 'px';
                }
            });
        }

        function isPropertyEmpty(properties, key) {
            if (key) {
                if (!properties.hasOwnProperty(key)) {
                    return true;
                }
                properties = properties[key];
            }

            return properties == null || (properties !== 0 && lib.trim(properties) === '');
        }

        /**
         * 页面resize时事件的处理函数
         *
         * @inner
         */
        function resizeHandler() {
            // 隐藏状态不触发
            if (this.isHidden()) {
                return;
            }
            autoLayout.apply(this);
        }

        /**
         * 获取遮盖层dom元素
         *
         * @return {HTMLElement} 获取到的Mask元素节点.
         */
        function getMask() {
            var id = 'ctrl-mask-' + this.helper.getId();
            var mask = lib.g(id);

            if (!mask && this.hasMask) {
                mask = document.createElement('div');
                mask.id = id;
                document.body.appendChild(mask);
            }

            return mask;
        }

        /**
         * 显示遮盖层
         * @inner
         */
        function showMask() {
            var mask = getMask.call(this);
            var maskClass = this.helper.getPartClassName('mask');
            mask.className = maskClass;
            mask.style.display = 'block';
        }

        /**
         * 隐藏遮盖层
         * @inner
         */
        function hideMask() {
            var mask = getMask.call(this);
            $(mask).remove();
        }

        esui.register(Overlay);
        return Overlay;
    }
);
