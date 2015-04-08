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
        var ui = require('./main');
        var Panel = require('./Panel');
        var u = require('underscore');

        /**
         * 浮层控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Overlay(options) {
            Panel.apply(this, arguments);
        }

        lib.inherits(Overlay, Panel);

        Overlay.prototype.type = 'Overlay';

        /**
         * 根据DOM解析出控件各角色，这个方法看情况使用
         *
         * @param {Object} options 控件初始参数
         */
        Overlay.prototype.parseMain = function (options) {
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
        };

        /**
         * @override
         */
        Overlay.prototype.initOptions = function (options) {
            // 默认属性
            var properties = {
                // 位置是否固定，固定时，scroll、 resize都触发重新布局
                fixed: false,
                // 点击浮层外部，是否自动关闭
                autoClose: true,
                // 是否具有遮挡层
                hasMask: false
            };

            var booleanProperties = ['fixed', 'autoClose', 'hasMask'];
            u.each(
                booleanProperties,
                function (property) {
                    if (options[property] === 'false') {
                        options[property] = false;
                    }
                }
            );

            u.extend(properties, options);
            Panel.prototype.initOptions.call(this, properties);
        };

        /**
         * @override
         */
        Overlay.prototype.initStructure = function () {
            var main = this.main;
            // 判断main是否在body下，如果不在，要移到body下
            if (main.parentNode
                && main.parentNode.nodeName.toLowerCase() !== 'body') {
                document.body.appendChild(main);
            }

            // 设置隐藏样式，如果直接隐藏可能会影响尺寸计算，所以只是移出
            this.addState('hidden');

            Panel.prototype.initStructure.apply(this, arguments);
        };

        /**
         * @override
         */
        Overlay.prototype.repaint = require('./painters').createRepaint(
            Panel.prototype.repaint,
            {
                name: ['height', 'width'],
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

            var isChild = lib.dom.contains(layer, target);

            if (!isChild) {
                this.hide();
            }
        }

        /**
         * 显示浮层
         */
        Overlay.prototype.show = function () {
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
        };

        /**
         * 隐藏对话框
         *
         */
        Overlay.prototype.hide = function () {
            if (!this.isHidden()) {
                if (this.autoClose) {
                    // 点击文档自动关闭
                    this.helper.removeDOMEvent(document, 'mousedown', close);
                }

                this.helper.removeDOMEvent(window, 'resize', resizeHandler);
                this.helper.removeDOMEvent(window, 'scroll', resizeHandler);

                // 设置隐藏样式，如果直接隐藏可能会影响尺寸计算，所以只是移出
                this.addState('hidden');

                if (this.hasMask) {
                    hideMask.call(this);
                }
            }

            this.fire('hide');
        };

        /**
         * 置顶方法
         *
         */
        Overlay.prototype.moveToTop = function () {
            var zIndex = this.getZIndex();
            this.main.style.zIndex = zIndex;

            var mask = getMask.call(this);
            if (mask) {
                mask.style.zIndex = zIndex - 1;
            }
        };

        /**
         * 获取当前Overlay要显示所要的ZIndex
         * @return {number}
         */
        Overlay.prototype.getZIndex = function () {
            var primaryClassName = this.helper.getPrimaryClassName();
            var hiddenPrimaryClassName = this.helper.getPrimaryClassName('hidden');
            var zIndex = 1203;
            // 查找当前overlay个数
            var rawElements = lib.getChildren(document.body);
            for (var i = 0, len = rawElements.length; i < len; i++) {
                if (lib.hasClass(rawElements[i], primaryClassName)
                    && !lib.hasClass(rawElements[i], hiddenPrimaryClassName)) {
                    zIndex = Math.max(zIndex, rawElements[i].style.zIndex) + 10;
                }
            }

            return zIndex;
        };

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
         * @param {object} options 定位参数
         * @param {number} options.left
         * @param {number} options.top
         * @param {Array} options.align 如 ['right', 'top']
         */
        function renderLayer(options) {
            var main = this.main;
            var properties = lib.clone(options || {});

            // 设置class
            if (u.isArray(properties.align)) {
                lib.addClass(
                    main,
                    this.helper.getPartClasses(properties.align.join('-'))
                );
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
         * 获取dom的样式
         *
         * @private
         * @return {string}
         */
        function getStyleNum(dom, styleName) {
            var result = lib.getStyle(dom, styleName);
            return parseInt(result, 10) || 0;
        }

        /**
         * 独立摆置
         *
         * @param {Object} options 放置相关的选项，选项中的所有边距都是css规范的
         * @param {number} options.top 上边距
         * @param {number} options.bottom 下边距
         * @param {number} options.left 左边距
         * @param {number} options.right 右边距
         */
        Overlay.prototype.selfLayout = function (options) {
            var page = lib.page;
            var main = this.main;

            var properties = lib.clone(options || {});
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
                        - getStyleNum(this.main, 'padding-left')
                        - getStyleNum(this.main, 'padding-right')
                        - getStyleNum(this.main, 'border-left-width')
                        - getStyleNum(this.main, 'border-right-width');
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
                        - getStyleNum(this.main, 'padding-top')
                        - getStyleNum(this.main, 'padding-bottom')
                        - getStyleNum(this.main, 'border-top-width')
                        - getStyleNum(this.main, 'border-bottom-width');
                }
                properties = u.omit(properties, 'bottom');
            }

            // 不可越界
            properties.top = Math.max(properties.top, 0);
            // 算上滚动
            properties.top = page.getScrollTop() + properties.top;

            renderLayer.call(this, properties);
        };

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
        Overlay.prototype.attachLayout = function (target, options) {
            var main = this.main;
            options = options || ['bottom', 'left'];

            // 0. 获取页面的属性
            var pagePosition = {
                width: lib.page.getViewWidth(),
                height: lib.page.getViewHeight(),
                scrollTop: lib.page.getScrollTop(),
                scrollLeft: lib.page.getScrollLeft()
            };

            // 1. 获取目标元素的属性
            var rect = target.getBoundingClientRect();
            var targetOffset = lib.getOffset(target);
            var targetPosition = {
                layoutLeft: targetOffset.left,
                viewLeft: rect.left,
                layoutTop: targetOffset.top,
                viewTop: rect.top,
                layoutRight: targetOffset.right,
                viewRight: rect.right,
                layoutBottom: targetOffset.bottom,
                viewBottom: rect.bottom,
                width: targetOffset.width,
                height: targetOffset.height
            };

            // 2. 获取浮层元素的属性
            // 如果对层宽度有要求，则先设置好最小宽度
            if (this.strictWidth) {
                main.style.minWidth = targetOffset.width + 'px';
            }
            // IE7下，如果浮层隐藏着反而会影响offset的获取，
            // 但浮层显示出来又可能造成滚动条出现，
            // 因此显示浮层显示后移到屏幕外面，然后计算坐标
            // 先记录一下原始的状态，之后再恢复回去
            var previousDisplayValue = main.style.display;
            main.style.display = 'block';
            main.style.top = '-5000px';
            main.style.left = '-5000px';

            var layerPosition = lib.getOffset(main);

            // 用完改回来再计算后面的
            main.style.top = '';
            main.style.left = '';
            main.style.display = previousDisplayValue;

            // 3. 根据配置计算位置
            var positionOptions = {
                target: targetPosition,
                layer: layerPosition,
                page: pagePosition
            };
            var properties;
            if (options[0] === 'right' || options[0] === 'left') {
                properties = positionHorizontal(positionOptions, options);
            }
            else {
                properties = positionVertical(positionOptions, options);
            }

            renderLayer.call(this, properties);
        };

        /**
         * 放置位置如下图：
         *
         * [right bottom]
         *           _______
         *          |       |
         *  ________| layer |
         * |target  |       |
         * |________|_______|
         *
         * [right top]
         *  ________ _______
         * |target  |       |
         * |________| layer |
         *          |       |
         *          |_______|
         *
         * [right center]
         *           _______
         *          |       |
         *  ________|       |
         * |target  | layer |
         * |________|       |
         *          |       |
         *          |_______|
         *
         * [left top]
         *  _______ ________
         * |       |target  |
         * | layer |________|
         * |       |
         * |_______|
         *
         * [left bottom]
         *  _______
         * |       |
         * | layer |________
         * |       |target  |
         * |_______|________|
         *
         * [left center]
         *  _______
         * |       |
         * | layer |________
         * |       |target  |
         * |       |________|
         * |       |
         * |_______|
         *
         * @param {Object} options 位置参数
         * @param {Array} preference 用户这是的默认参数
         * @param {string} preference[0] 'right' | 'left'
         * @param {string} preference[1] 'top' | 'bottom' | 'center'
         * @return {Object} 定位配置
         */
        function positionHorizontal(options, preference) {
            var spaceRight = options.page.width - options.target.viewRight;
            var spaceLeft = options.target.viewLeft;

            var spaceBottomToTop = options.target.viewBottom;
            var spaceTopToBottom = options.page.height - options.target.viewTop;

            // 空间可用判断
            var validConfig = {};

            // 可以放置右侧
            if (spaceRight >= options.layer.width) {
                validConfig.right = true;
            }

            // 可以放置左侧
            if (spaceLeft >= options.layer.width) {
                validConfig.left = true;
            }

            // 可以底部对齐，放置上侧
            if (spaceBottomToTop >= options.layer.height) {
                validConfig.bottom = true;
            }

            // 可以顶部对齐，放置下侧
            if (spaceTopToBottom >= options.layer.height) {
                validConfig.top = true;
            }

            // 位置配置
            var positionConfig = {
                right: options.target.layoutRight,
                left: options.target.layoutLeft - options.layer.width,
                bottom: options.target.layoutBottom - options.layer.height,
                top: options.target.layoutTop,
                center: options.target.layoutTop - (options.layer.height - options.target.height) * 1 / 2
            };

            var properties = {
                align: []
            };
            // 用户配置可用
            if (validConfig[preference[0]] === true) {
                properties.left = positionConfig[preference[0]];
                properties.align.push(preference[0]);
            }
            // 用户配置不可用，默认放右
            else {
                properties.left = positionConfig.right;
                properties.align.push('right');
            }

            // 用户配置可用
            // 如果用户配置的是居中，那么就居中
            if (preference[1] === 'center') {
                properties.top = positionConfig.center;
                properties.align.push('center');
            }
            else if (validConfig[preference[1]] === true) {
                properties.top = positionConfig[preference[1]];
                properties.align.push(preference[1]);
            }
            // 用户配置不可用，默认放右
            else {
                properties.top = positionConfig.top;
                properties.align.push('top');
            }

            return properties;
        }

        /**
         * [top left]
         *  __________
         * |          |
         * | layer    |
         * |__________|
         * | target|
         * |_______|
         *
         * [top right]
         *  __________
         * |          |
         * | layer    |
         * |__________|
         *    | target|
         *    |_______|
         *
         * [top center]
         *  ______________
         * |     layer    |
         * |              |
         * |______________|
         *    | target |
         *    |________|
         *
         * [bottom left]
         *  ________
         * | target |
         * |________|__
         * | layer     |
         * |           |
         * |___________|
         *
         * [bottom right]
         *     ________
         *    | target |
         *  __|________|
         * | layer     |
         * |           |
         * |___________|
         *
         * [bottom center]
         *     ________
         *    | target |
         *  __|________|__
         * |     layer    |
         * |              |
         * |______________|
         *
         * @param {Object} options 位置参数
         * @param {Array} preference 用户这是的默认参数
         * @param {string} preference[0] 'top' | 'bottom'
         * @param {string} preference[1] 'right' | 'left' | 'center'
         * @return {Object} 定位配置
         */
        function positionVertical(options, preference) {
            var spaceRightToLeft = options.target.viewRight;
            var spaceLeftToRight = options.page.width - options.target.viewLeft;

            var spaceTop = options.target.viewTop;
            var spaceBottom = options.page.height - options.target.viewBottom;

            // 空间可用判断
            var validConfig = {};

            // 可以右边对齐
            if (spaceRightToLeft >= options.layer.width) {
                validConfig.right = true;
            }

            // 可以左边对齐
            if (spaceLeftToRight >= options.layer.width) {
                validConfig.left = true;
            }

            // 可以放置下侧
            if (spaceBottom >= options.layer.height) {
                validConfig.bottom = true;
            }

            // 可以放置上侧
            if (spaceTop >= options.layer.height) {
                validConfig.top = true;
            }

            // 位置配置
            var positionConfig = {
                right: options.target.layoutRight - options.layer.width,
                left: options.target.layoutLeft,
                center: options.target.layoutLeft - (options.layer.width - options.target.width) * 1 / 2,
                bottom: options.target.layoutBottom,
                top: options.target.layoutTop - options.layer.height
            };

            var properties = {
                align: []
            };
            // 用户配置可用
            if (validConfig[preference[0]] === true) {
                properties.top = positionConfig[preference[0]];
                properties.align.push(preference[0]);
            }
            // 用户配置不可用，默认放右
            else {
                properties.top = positionConfig.bottom;
                properties.align.push('bottom');
            }

            // 用户配置可用
            // 如果用户配置的是居中，那么就居中
            if (preference[1] === 'center') {
                properties.left = positionConfig.center;
                properties.align.push('center');
            }
            else if (validConfig[preference[1]] === true) {
                properties.left = positionConfig[preference[1]];
                properties.align.push(preference[1]);
            }
            // 用户配置不可用，默认放右
            else {
                properties.left = positionConfig.left;
                properties.align.push('left');
            }

            return properties;
        }

        /**
         * 移动层的位置
         *
         * @param {number} top 上边界距离
         * @param {number} left 左边界距离
         * @public
         */
        Overlay.prototype.moveTo = function (top, left) {
            this.selfLayout({top: top, left: left});
        };

        /**
         * 缩放层的大小
         *
         */
        Overlay.prototype.resize = function () {
            autoLayout.apply(this);
        };

        /**
         * 销毁控件
         */
        Overlay.prototype.dispose = function () {
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }
            // 移除mask
            lib.removeNode('ctrl-mask-' + this.helper.getId());
            // 移除dom
            lib.removeNode(this.main);
            Panel.prototype.dispose.apply(this, arguments);
        };

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
         * 遮盖层初始化
         *
         * @param {string} maskId 遮盖层domId
         */
        function initMask(maskId) {
            var maskElement = document.createElement('div');
            maskElement.id = maskId;
            document.body.appendChild(maskElement);
        }

        /**
         * 获取遮盖层dom元素
         *
         * @return {HTMLElement} 获取到的Mask元素节点.
         */
        function getMask() {
            var id = 'ctrl-mask-' + this.helper.getId();
            var mask = lib.g(id);

            if (!mask) {
                initMask(id);
            }

            return lib.g(id);
        }

        /**
         * 显示遮盖层
         */
        function showMask() {
            var mask = getMask.call(this);
            var maskClass = this.helper.getPartClassName('mask');
            mask.className = maskClass;
            mask.style.display = 'block';
        }

        /**
         * 隐藏遮盖层
         */
        function hideMask() {
            var mask = getMask.call(this);
            if ('undefined' !== typeof mask) {
                lib.removeNode(mask);
            }
        }

        ui.register(Overlay);
        return Overlay;
    }
);
