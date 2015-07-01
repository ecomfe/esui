/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 鼠标拖拽
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {
        var $ = require('jquery');
        var u = require('underscore');

        var Mouse = require('./Mouse');
        var behaviorUtil = require('./util');
        var jqBridge = require('./bridge');
        var eoo = require('eoo');
        var typeName = 'draggable';

        var Draggable = eoo.create(
            Mouse,
            {
                type: typeName,

                /**
                 * 构造函数
                 * @param {Object} options
                 * options属性参考defaultProperties
                 */
                constructor: function (options) {
                    options = u.extend(
                        {
                            // 是否添加`prefix-draggable`
                            // 如果可拖拽元素过多，处于性能考虑，可以设为false
                            addClasses: true,
                            // 如果helper不在文档中，为其指定父元素
                            appendTo: 'parent',
                            // 元素只能在一个方向移动，x / y
                            axis: false,
                            // 拖拽范围
                            containment: false,
                            // 鼠标的css值
                            cursor: 'auto',
                            // helper和鼠标的偏移
                            cursorAt: false,
                            // 限定按指定步长移动
                            grid: false,
                            // 拖拽手柄
                            handle: false,
                            // 指定helper为element还是重新clone一个
                            helper: 'original',
                            iframeFix: false,
                            // 拖拽过程中helper透明度
                            opacity: false,
                            refreshPositions: false,
                            /**
                             * 拖拽结束后是否回到起点
                             * 如果是string，可取`invalid` / `valid`,即如果没有放到droppable上，则回到起点
                             * @type {boolean|Function|string}
                             */
                            revert: false,
                            /**
                             * revert动画时间, false则不使用动画
                             * @type {number|boolean}
                             */
                            revertDuration: 500,

                            scope: 'default',
                            // 拖拽时元素溢出时父元素滚动条自动滚动
                            scroll: true,
                            // 距离多少时触发滚动
                            scrollSensitivity: 20,
                            // 滚动速度
                            scrollSpeed: 20,
                            // 接近边缘时吸附, `false` / `selector`
                            snap: false,
                            // 吸附到哪一边, 可取`inner` / `outer` / `both`
                            snapMode: 'both',
                            // 吸附的阈值
                            snapTolerance: 20,
                            // 对一类元素进行分组，总是当前拖拽的元素在最上方
                            // 类似操作系统的窗口
                            stack: false,
                            // 拖拽过程中helper的z-index
                            zIndex: false,

                            // callbacks
                            drag: null,
                            start: null,
                            stop: null
                        },
                        options
                    );

                    this.$super(arguments);

                    this.customEventPrefix = 'drag';
                    this.plugins = {};
                },

                /**
                 * 初始化
                 */
                init: function () {
                    var me = this;
                    var element = me.element;
                    var opts = me.options;

                    me.$super(arguments);
                    if (opts.helper === 'original') {
                        setPositionRelative.call(me);
                    }
                    if (opts.addClasses) {
                        me.addClass(element);
                    }
                    if (opts.disabled) {
                        me.addClass(element, 'disabled');
                    }
                    setHandleClassName.call(this);
                },

                /**
                 * 销毁
                 */
                dispose: function () {
                    var fullDraggingClass = this.getClassName(true, 'dragging');
                    if ((this.helper || this.element).is(fullDraggingClass)) {
                        this.destroyOnClear = true;
                        return;
                    }
                    removeHandleClassName.call(this);
                    this.$super(arguments);
                },

                /**
                 * @override
                 */
                mouseCapture: function (event) {
                    if (this.$super(arguments) === false) {
                        return false;
                    }
                    var options = this.options;

                    blurActiveElement.call(this, event);

                    var resizableHandleCls = this.getClassName(true, 'handle', 'resizable');
                    if (this.helper || options.disabled
                        || $(event.target).closest(resizableHandleCls).length > 0) {
                        return false;
                    }

                    // 鼠标不在handle中
                    this.handle = getHandle.call(this, event);
                    if (!this.handle) {
                        return false;
                    }
                    blockFrames.call(this, options.iframeFix === true ? 'iframe' : options.iframeFix);

                    return true;
                },

                /**
                 * @override
                 */
                mouseStart: function (event) {
                    var options = this.options;

                    // 创建helper
                    this.helper = createHelper.call(this, event);

                    this.addClass(this.helper, 'dragging');

                    // 缓存helper的尺寸
                    cacheHelperProportions.call(this);

                    cacheMargins.call(this);

                    this.cssPosition = this.helper.css('position');
                    this.scrollParent = this.helper.scrollParent(true);
                    this.offsetParent = this.helper.offsetParent();
                    this.hasFixedAncestor = this.helper.parents().filter(
                        function () {
                            return $(this).css('position') === 'fixed';
                        }
                    ).length > 0;

                    this.positionAbs = this.element.offset();
                    refreshOffsets.call(this, event);

                    // 拖拽前元素、鼠标位置信息
                    this.originalPosition = this.position = generatePosition.call(this, event, false);
                    this.originalPageX = event.pageX;
                    this.originalPageY = event.pageY;

                    // cursorAt是鼠标相对于helper的位置
                    (options.cursorAt && adjustOffsetFromHelper.call(this, options.cursorAt));

                    // 元素移动的限定范围
                    setContainment.call(this);

                    if (this.trigger('start', event) === false) {
                        clear.call(this);
                        return false;
                    }

                    // 重新缓存helper的尺寸
                    cacheHelperProportions.call(this);

                    this.mouseDrag(event, true);

                    return true;
                },

                /**
                 * 鼠标移动过程中，调整helper位置
                 * @param {Event} event 事件对象
                 * @param {boolean} noPropagation 是否冒泡drag事件到外部
                 * @return {boolean}
                 */
                mouseDrag: function (event, noPropagation) {
                    if (this.hasFixedAncestor) {
                        this.offset.parent = getParentOffset.call(this);
                    }

                    // 计算helper位置
                    this.position = generatePosition.call(this, event, true);
                    this.positionAbs = convertPositionTo.call(this, 'absolute');

                    if (!noPropagation) {
                        var ui = uiHash.call(this);
                        if (this.trigger('drag', u.extend({}, event, ui)) === false) {
                            this.mouseUp({});
                            return false;
                        }
                        this.position = ui.position;
                    }

                    this.helper[0].style.left = this.position.left + 'px';
                    this.helper[0].style.top = this.position.top + 'px';

                    return false;
                },

                mouseStop: function (event) {
                    var me = this;

                    if (this.options.revert === 'invalid' || this.options.revert === true) {
                        $(this.helper).animate(
                            this.originalPosition,
                            parseInt(this.options.revertDuration, 10),
                            function () {
                                if (me.trigger('stop', event) !== false) {
                                    clear.call(this);
                                }
                            }
                        );
                    }
                    else {
                        if (this.trigger('stop', event) !== false) {
                            clear.call(this);
                        }
                    }
                    return false;
                },

                mouseUp: function (event) {
                    unblockFrames.call();

                    if (this.handleElement.is(event.target)) {
                        this.element.focus();
                    }

                    return this.$super(arguments);
                },

                cancel: function () {
                    var helperDraggingFullCls = this.getClassName(true, 'dragging');
                    if (this.helper.is(helperDraggingFullCls)) {
                        this.mouseUp({});
                    }
                    else {
                        clear.call(this);
                    }

                    return this;
                }
            }
        );

        /**
         * 拖拽的时候如果鼠标滑过iframe上空，
         * 则当前文档会失去mousemove事件
         * 这里做个hack，给指定iframe上遮一个div
         * @param {Element|string|boolean} selector 要处理的iframe
         * @inner
         */
        function blockFrames(selector) {
            this.iframeBlocks = this.document.find(selector).map(
                function () {
                    var iframe = $(this);

                    return $('<div>')
                        .css('position', 'absolute')
                        .appendTo(iframe.parent())
                        .outerWidth(iframe.outerWidth())
                        .outerHeight(iframe.outerHeight())
                        .offset(iframe.offset())[0];
                }
            );
        }

        /**
         * 拖拽完成后，移除iframe上的遮照
         */
        function unblockFrames() {
            if (this.iframeBlocks) {
                this.iframeBlocks.remove();
                delete this.iframeBlocks;
            }
        }

        /**
         * 拖拽时要blur当前页面焦点元素
         * @param {Event} event 事件对象
         */
        function blurActiveElement(event) {
            if (!this.handleElement.is(event.target)) {
                return;
            }
            behaviorUtil.safeBlur(behaviorUtil.safeActiveElement(this.document[0]));
        }

        /**
         * 拖拽开始前重置当前拖拽的一些信息
         * @param {Event} event 事件对象
         */
        function refreshOffsets(event) {
            this.offset = {
                top: this.positionAbs.top - this.margins.top,
                left: this.positionAbs.left - this.margins.left,
                scroll: false,
                parent: getParentOffset.call(this),
                relative: getRelativeOffset.call(this)
            };

            this.offset.click = {
                left: event.pageX - this.offset.left,
                top: event.pageY - this.offset.top
            };
        }

        /**
         * 判断指定事件是否发生在handle上
         * @param {Event} event 事件对象
         * @return {boolean}
         */
        function getHandle(event) {
            return this.options.handle ?
                !!$(event.target).closest(this.element.find(this.options.handle)).length :
                true;
        }

        /**
         * 设置handle的className
         */
        function setHandleClassName() {
            this.handleElement = this.options.handle ?
                this.element.find(this.options.handle) : this.element;
            this.addClass(this.handleElement, 'handle');
        }

        /**
         * 移除handle的className
         */
        function removeHandleClassName() {
            this.removeClass(this.handleElement, 'handle');
        }

        /**
         * 创建helper，即拖拽时移动的元素
         * @param {Event} event 事件对象
         * @return {jQuery}
         */
        function createHelper(event) {
            var options = this.options;
            var helperIsFunction = $.isFunction(options.helper);
            var helper = helperIsFunction
                ? $(options.helper.apply(this.element[0], [event]))
                : (
                    options.helper === 'clone'
                        ? this.element.clone().removeAttr('id')
                        : this.element
                );

            // 通过function自定义创建的helper有可能不在dom中
            if (!helper.parents('body').length) {
                helper.appendTo(
                    options.appendTo === 'parent' ? this.element[0].parentNode : options.appendTo
                );
            }

            // helper如果是通过function方式自定义的，则要补充设置一下relative
            if (helperIsFunction && helper[0] === this.element[0]) {
                setPositionRelative.call(this);
            }

            if (helper[0] !== this.element[0] && !(/(fixed|absolute)/).test(helper.css('position'))) {
                helper.css('position', 'absolute');
            }

            return helper;
        }

        /**
         * 如果当前元素不是定位元素，则设置为relative
         */
        function setPositionRelative() {
            if (!(/^(?:r|a|f)/).test(this.element.css('position'))) {
                this.element[0].style.position = 'relative';
            }
        }

        /**
         * 设置helper相对于鼠标的位置偏移
         * @param {Object} obj options.cursorAt
         */
        function adjustOffsetFromHelper(obj) {
            if (typeof obj === 'string') {
                obj = obj.split(/\s+/);
            }
            if ($.isArray(obj)) {
                obj = {left: +obj[0], top: +obj[1] || 0};
            }
            if ('left' in obj) {
                this.offset.click.left = obj.left + this.margins.left;
            }
            if ('right' in obj) {
                this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
            }
            if ('top' in obj) {
                this.offset.click.top = obj.top + this.margins.top;
            }
            if ('bottom' in obj) {
                this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
            }
        }

        /**
         * 判断给定元素是否根元素
         * @param {Element} element 要判断的元素
         * @return {boolean}
         */
        function isRootNode(element) {
            return (/(html|body)/i).test(element.tagName) || element === this.document[0];
        }

        /**
         * 获取定位父元素的位置
         * @return {Object}
         */
        function getParentOffset() {

            var po = this.offsetParent.offset();
            var document = this.document[0];

            // 如果position为absolute，
            // 且定位父元素包含在一个scroll容器里，
            // 则需要算上scroll距离
            if (this.cssPosition === 'absolute'
                && this.scrollParent[0] !== document
                && $.contains(this.scrollParent[0], this.offsetParent[0])) {
                po.left += this.scrollParent.scrollLeft();
                po.top += this.scrollParent.scrollTop();
            }

            if (isRootNode.call(this, this.offsetParent[0])) {
                po = {top: 0, left: 0};
            }

            return {
                top: po.top + (parseInt(this.offsetParent.css('borderTopWidth'), 10) || 0),
                left: po.left + (parseInt(this.offsetParent.css('borderLeftWidth'), 10) || 0)
            };
        }

        /**
         * 返回position:relative元素，
         * 原始位置(即top / left为0)距离定位父元素的位置
         * @return {Object}
         */
        function getRelativeOffset() {
            if (this.cssPosition !== 'relative') {
                return {top: 0, left: 0};
            }

            var pos = this.element.position();
            var scrollIsRootNode = isRootNode.call(this, this.scrollParent[0]);

            return {
                top: pos.top - (parseInt(this.helper.css('top'), 10) || 0)
                    + (!scrollIsRootNode ? this.scrollParent.scrollTop() : 0),
                left: pos.left - (parseInt(this.helper.css('left'), 10) || 0)
                    + (!scrollIsRootNode ? this.scrollParent.scrollLeft() : 0)
            };
        }

        /**
         * 缓存元素margin
         */
        function cacheMargins() {
            this.margins = {
                left: (parseInt(this.element.css('marginLeft'), 10) || 0),
                top: (parseInt(this.element.css('marginTop'), 10) || 0),
                right: (parseInt(this.element.css('marginRight'), 10) || 0),
                bottom: (parseInt(this.element.css('marginBottom'), 10) || 0)
            };
        }

        /**
         * 缓存helper尺寸
         */
        function cacheHelperProportions() {
            this.helperProportions = {
                width: this.helper.outerWidth(),
                height: this.helper.outerHeight()
            };
        }

        /**
         * 设置helper的拖拽范围
         */
        function setContainment() {

            this.relativeContainer = null;

            var options = this.options;
            if (!options.containment) {
                this.containment = null;
                return;
            }

            // this.containment定义了helper拖拽时4个点的范围，
            // 该范围是相对于containmentElement内部的
            var document = this.document[0];
            if (options.containment === 'window') {
                this.containment = [
                    $(window).scrollLeft() - this.offset.relative.left - this.offset.parent.left,
                    $(window).scrollTop() - this.offset.relative.top - this.offset.parent.top,
                    $(window).scrollLeft() + $(window).width()
                        - this.helperProportions.width - this.margins.left,
                    $(window).scrollTop() + ($(window).height() || document.body.parentNode.scrollHeight)
                        - this.helperProportions.height - this.margins.top
                ];
                return;
            }

            if (options.containment === 'document') {
                this.containment = [
                    0,
                    0,
                    $(document).width() - this.helperProportions.width - this.margins.left,
                    ($(document).height() || document.body.parentNode.scrollHeight)
                        - this.helperProportions.height - this.margins.top
                ];
                return;
            }

            if (options.containment.constructor === Array) {
                this.containment = options.containment;
                return;
            }

            if (options.containment === 'parent') {
                options.containment = this.helper[0].parentNode;
            }

            var containmentElement = $(options.containment);
            var $containmentElement = containmentElement[0];

            if (!$containmentElement) {
                return;
            }

            var isUserScrollable = /(scroll|auto)/.test(containmentElement.css('overflow'));
            var containmentWidth = isUserScrollable
                ? Math.max($containmentElement.scrollWidth, $containmentElement.offsetWidth)
                : $containmentElement.offsetWidth;
            var containmentHeight = isUserScrollable
                    ? Math.max($containmentElement.scrollHeight, $containmentElement.offsetHeight)
                    : $containmentElement.offsetHeight;

            this.containment = [
                (parseInt(containmentElement.css('borderLeftWidth'), 10) || 0)
                    + (parseInt(containmentElement.css('paddingLeft'), 10) || 0),
                (parseInt(containmentElement.css('borderTopWidth'), 10) || 0)
                    + (parseInt(containmentElement.css('paddingTop'), 10) || 0),
                containmentWidth - (parseInt(containmentElement.css('borderRightWidth'), 10) || 0)
                    - (parseInt(containmentElement.css('paddingRight'), 10) || 0)
                    // 元素的margin部分也不能超出边界，这里要减掉margin
                    - this.helperProportions.width - this.margins.left - this.margins.right,
                containmentHeight  - (parseInt(containmentElement.css('borderBottomWidth'), 10) || 0)
                    - (parseInt(containmentElement.css('paddingBottom'), 10) || 0)
                    - this.helperProportions.height - this.margins.top - this.margins.bottom
            ];
            this.relativeContainer = containmentElement;
        }

        /**
         * 变化position值
         * d === 'absloute' --> 将元素的相对位置转成绝对位置
         * d === 'relative' --> 反之
         *
         * @param {string} d `absolute` / `relative`
         * @param {Object=} pos 要变换的位置，默认为this.position
         *
         * @return {Object} 变换后的位置信息
         */
        function convertPositionTo(d, pos) {
            if (!pos) {
                pos = this.position;
            }

            var mod = d === 'absolute' ? 1 : -1;
            var scrollIsRootNode = isRootNode.call(this, this.scrollParent[0]);

            return {
                top: (
                    pos.top
                    + this.offset.relative.top * mod
                    + this.offset.parent.top * mod
                    - (
                        this.cssPosition === 'fixed'
                            ? -this.offset.scroll.top
                            : (scrollIsRootNode ? 0 : this.offset.scroll.top)
                    ) * mod
                ),
                left: (
                    pos.left
                    + this.offset.relative.left * mod
                    + this.offset.parent.left * mod
                    - (
                        this.cssPosition === 'fixed'
                            ? -this.offset.scroll.left
                            : (scrollIsRootNode ? 0 : this.offset.scroll.left)
                    ) * mod
                )
            };
        }

        /**
         * 根据鼠标位置计算helper当前top / left
         * @param {Event} event 事件对象
         * @param {boolean} constrainPosition 是否根据containment / grid对鼠标位置进行修正
         *
         * @return {Object} top / left
         */
        function generatePosition(event, constrainPosition) {
            var scrollIsRootNode = isRootNode.call(this, this.scrollParent[0]);
            // Cache the scroll
            if (!scrollIsRootNode || !this.offset.scroll) {
                this.offset.scroll = {
                    top: this.scrollParent.scrollTop(),
                    left: this.scrollParent.scrollLeft()
                };
            }

            var pageX = event.pageX;
            var pageY = event.pageY;

            if (constrainPosition) {
                var containment;
                // 拖拽范围校正
                if (this.containment) {
                    if (this.relativeContainer) {
                        var co = this.relativeContainer.offset();
                        containment = [
                            this.containment[0] + co.left,
                            this.containment[1] + co.top,
                            this.containment[2] + co.left,
                            this.containment[3] + co.top
                        ];
                    }
                    // window / document / parent
                    else {
                        containment = this.containment;
                    }

                    if (event.pageX - this.offset.click.left < containment[0]) {
                        pageX = containment[0] + this.offset.click.left;
                    }
                    if (event.pageY - this.offset.click.top < containment[1]) {
                        pageY = containment[1] + this.offset.click.top;
                    }
                    if (event.pageX - this.offset.click.left > containment[2]) {
                        pageX = containment[2] + this.offset.click.left;
                    }
                    if (event.pageY - this.offset.click.top > containment[3]) {
                        pageY = containment[3] + this.offset.click.top;
                    }
                }

                var options = this.options;
                // grid表示按固定步长进行移动
                if (options.grid) {
                    var top = options.grid[1]
                        ? this.originalPageY
                            // 移多少步
                            + Math.round((pageY - this.originalPageY) / options.grid[1])
                            * options.grid[1]
                        : this.originalPageY;
                    var originalTop = top - this.offset.click.top;
                    pageY = containment ? (
                        (originalTop >= containment[1] || originalTop > containment[3])
                            ? top
                            : (
                                (originalTop >= containment[1])
                                    ? top - options.grid[1]
                                    : top + options.grid[1]
                            )
                    ) : top;

                    var left = options.grid[0]
                        ? this.originalPageX
                        + Math.round((pageX - this.originalPageX) / options.grid[0])
                        * options.grid[0]
                        : this.originalPageX;
                    var originalLeft = left - this.offset.click.left;
                    pageX = containment ? (
                        (originalLeft >= containment[0] || originalLeft > containment[2])
                            ? left
                            : (
                                (originalLeft >= containment[0])
                                    ? left - options.grid[0]
                                    : left + options.grid[0]
                            )
                    ) : left;
                }

                if (options.axis === 'y') {
                    pageX = this.originalPageX;
                }

                if (options.axis === 'x') {
                    pageY = this.originalPageY;
                }
            }

            return {
                top: (
                    // 鼠标相对于文档位置（校正过的）
                    pageY
                    // 鼠标相对于元素的偏移
                    - this.offset.click.top
                    // 元素相对于定位父元素的位置
                    - this.offset.relative.top
                    // 定位父元素相对于文档的位置
                    - this.offset.parent.top
                    + (
                        this.cssPosition === 'fixed'
                        ? -this.offset.scroll.top
                        : (scrollIsRootNode ? 0 : this.offset.scroll.top)
                    )
                ),
                left: (
                    pageX
                    // 鼠标相对于元素偏移
                    - this.offset.click.left
                    // 元素相对于定位父元素的位置
                    - this.offset.relative.left
                    // 定位父元素相对于文档的位置
                    - this.offset.parent.left
                    + (
                        this.cssPosition === 'fixed'
                        ? -this.offset.scroll.left
                        : (scrollIsRootNode ? 0 : this.offset.scroll.left)
                    )
                )
            };
        }

        /**
         * 拖拽完成后清理现场
         */
        function clear() {
            this.removeClass(this.helper, 'dragging');
            if (this.helper[0] !== this.element[0] && !this.cancelHelperRemoval) {
                this.helper.remove();
            }
            this.helper = null;
            this.cancelHelperRemoval = false;
            if (this.destroyOnClear) {
                this.dispose();
            }
        }

        function uiHash() {
            return {
                helper: this.helper,
                position: this.position,
                originalPosition: this.originalPosition,
                offset: this.positionAbs
            };
        }

        jqBridge(typeName, Draggable);
        return Draggable;

    }
);
