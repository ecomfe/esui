/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件类常用的helper方法模块
 * @author erik, otakustay
 */

define(
    function (require) {
        var lib = require('./lib');

        var Helper = require('./Helper');

        /**
         * 控件类常用的helper方法模块
         * 
         * @type {Object}
         */
        var helper = {};

        /**
         * 获取唯一id
         * 
         * @inner
         * @param {string} prefix 前缀
         * @return {string}
         */
        helper.getGUID = function (prefix) {
            return lib.getGUID();
        };

        var methods = [
            // life
            'initViewContext', 'initExtensions',
            'isInStage', 'changeStage',
            'dispose', 'beforeDispose', 'afterDispose',
            // dom
            'getPartClasses', 'addPartClasses', 'removePartClasses',
            'getStateClasses', 'addStateClasses', 'removeStateClasses',
            'getId', 'replaceMain',
            // event
            'addDOMEvent', 'removeDOMEvent', 'clearDOMEvents'
        ];

        helper.createRepaint = require('./painters').create;

        // 补上原有的方法，全部代理到`Helper`上
        require('underscore').each(
            methods,
            function (name) {
                helper[name] = function (control) {
                    var helper = new Helper(control);
                    var args = [].slice.call(arguments, 1);
                    return helper[name].apply(helper, args);
                };
            }
        );

        // 再往下的全部是等待废弃的

        /**
         * 替换控件的主元素中提取信息(name value disabled readonly)
         *
         * @param {Control} control 控件实例
         * @param {Object} options 需要更新的参数
         * @return {Object} 提取到的value和name
         * @deprecated
         */
        helper.extractValueFromInput = function (control, options) {
            var main = control.main;
            // 如果是输入元素
            if (lib.isInput(main)) {
                if (main.value && !options.value) {
                    options.value = main.value;
                }
                if (main.name && !options.name) {
                    options.name = main.name;
                }
                if (main.disabled 
                    && (options.disabled === null
                        || options.disabled === undefined)) {
                    options.disabled = main.disabled;
                }
                if (main.readOnly 
                    && (options.readOnly === null
                        || options.readOnly === undefined)) {
                    options.readOnly = main.readonly || main.readOnly;
                }
            }
        };

        var layer = helper.layer = {};
        var zIndexStack = 1000;

        // 统一方法
        function render(element, options) {
            var properties = lib.clone(options || {});

            // 如果同时有`top`和`bottom`，则计算出`height`来
            if (properties.hasOwnProperty('top')
                && properties.hasOwnProperty('bottom')
            ) {
                properties.height = properties.bottom - properties.top;
                delete properties.bottom;
            }
            // 同样处理`left`和`right`
            if (properties.hasOwnProperty('left')
                && properties.hasOwnProperty('right')
            ) {
                properties.width = properties.right - properties.left;
                delete properties.right;
            }

            // 避免原来的属性影响
            if (properties.hasOwnProperty('top')
                || properties.hasOwnProperty('bottom')
            ) {
                element.style.top = '';
                element.style.bottom = '';
            }

            if (properties.hasOwnProperty('left')
                || properties.hasOwnProperty('right')
            ) {
                element.style.left = '';
                element.style.right = '';
            }

            // 设置位置和大小
            for (var name in properties) {
                if (properties.hasOwnProperty(name)) {
                    element.style[name] = properties[name] + 'px';
                }
            }
        }

        /**
         * 创建层元素
         *
         * @param {string=} tagName 元素的标签名，默认为`div`
         * @return {HTMLElement}
         * @deprecated
         */
        layer.create = function (tagName) {
            var element = document.createElement(tagName || 'div');
            element.style.position = 'absolute';
            return element;
        };

        /**
         * 获取层应当使用的`z-index`的值
         *
         * @param {HTMLElement=} owner 层的所有者元素
         * @return {number}
         * @deprecated
         */
        layer.getZIndex = function (owner) {
            var zIndex = 0;
            while (!zIndex && owner && owner !== document) {
                zIndex = 
                    parseInt(lib.getComputedStyle(owner, 'zIndex'), 10);
                owner = owner.parentNode;
            }
            zIndex = zIndex || 0;
            return zIndex + 1;
        };

        /**
         * 将当前层移到最前
         *
         * @param {HTMLElement} element 目标层元素
         * @public
         * @deprecated
         */
        layer.moveToTop = function (element) {
            element.style.zIndex = ++zIndexStack;
        };

        /**
         * 移动层的位置
         *
         * @param {HTMLElement} element 目标层元素
         * @param {number} top 上边界
         * @param {number} left 左边界
         * @public
         * @deprecated
         */
        layer.moveTo = function (element, top, left) {
            render(element, { top: top, left: left });
        };

        /**
         * 缩放层的大小
         *
         * @param {HTMLElement} element 目标层元素
         * @param {number} width 宽度
         * @param {number} height 高度
         * @public
         * @deprecated
         */
        layer.resize = function (element, width, height) {
            render(element, { width: width, height: height });
        };

        /**
         * 让当前层靠住一个元素
         *
         * @param {HTMLElement} element 目标层元素
         * @param {HTMLElement} target 目标元素
         * @param {Object=} options 停靠相关的选项
         * @param {string=} options.top 指示当前层的上边缘靠住元素的哪个边，
         * 可选值为**top**或**bottom**
         * @param {string=} options.bottom 指示当前层的下边缘靠住元素的哪个边，
         * 可选值为**top**或**bottom**，* 当`top`值为**bottom**时，该值无效
         * @param {string=} options.left 指示当前层的左边缘靠住元素的哪个边，
         * 可选值为**left**或**right**
         * @param {string=} options.right 指示当前层的下边缘靠住元素的哪个边，
         * 可选值为**left**或**right**，* 当`left`值为**right**时，该值无效
         * @param {number=} options.width 指定层的宽度
         * @param {number=} options.height 指定层的高度
         * @public
         * @deprecated
         */
        layer.attachTo = function (element, target, options) {
            options = options || { left: 'left', top: 'top' };
            // 虽然这2个变量下面不一定用得到，但是不能等层出来了再取，
            // 一但层出现，可能造成滚动条出现，导致页面尺寸变小
            var pageWidth = lib.page.getViewWidth();
            var pageHeight = lib.page.getViewHeight();

            // 浮层的存在会影响页面高度计算，必须先让它消失，
            // 但在消失前，又必须先计算到浮层的正确高度
            var previousDisplayValue = element.style.display;
            element.style.display = 'block';
            element.style.top = '-5000px';
            element.style.left = '-5000px';
            // IE7下，如果浮层隐藏着反而会影响offset的获取，
            // 但浮层显示出来又可能造成滚动条出现，
            // 因此显示浮层显示后移到屏幕外面，然后计算坐标
            var offset = lib.getOffset(target);
            // 用完改回来再计算后面的
            element.style.top = '';
            element.style.left = '';
            var elementHeight = element.offsetHeight;
            var elementWidth = element.offsetWidth;
            element.style.display = previousDisplayValue;

            // 有2种特殊的情况：
            // 
            // -`{ top: 'top', bottom: 'bottom' }`
            // -`{ left: 'left', right: 'right' }`
            // 
            // 这两种情况下，要计算出宽和高来，且覆盖掉提供的宽高
            var config = lib.clone(options);

            // 如果要靠住某一边，且要检测剩余空间，则那个边空间不够，就要移到另一边
            if (config.spaceDetection === 'vertical'
                || config.spaceDetection === 'both') {
                // 对纵向的策略如下：
                // 
                // - 如果指定`top === 'bottm'`，则尝试放下面，放不了就放上面
                // - 如果指定`bottom === 'top'`，则尝试放上面，放不下就放下面
                // - 如果指定`top === 'top'`，则尝试上边对齐，不行就下边对齐
                // - 如果指定`bottom === 'bottom`'，则尝试下边对齐，不行就上边对齐
                if (config.top === 'bottom') {
                    if (pageHeight - offset.bottom <= elementHeight) {
                        config.top = null;
                        config.bottom = 'top';
                    }
                }
                else if (config.bottom === 'top') {
                    if (offset.top <= elementHeight) {
                        config.top = 'bottom';
                        config.bottom = null;
                    }
                }
                else if (config.top === 'top') {
                    if (pageHeight - offset.top <= elementHeight) {
                        config.top = null;
                        config.bottom = 'bottom';
                    }
                }
                else if (config.bottom === 'bottom') {
                    if (offset.bottom <= elementHeight) {
                        config.top = 'top';
                        config.bottom = null;
                    }
                }
            }
            if (config.spaceDetection === 'horizontal'
                || config.spaceDetection === 'both') {
                // 对横向的策略如下：
                // 
                // - 如果指定`left === 'right'`，则尝试放右边，放不了就放左边
                // - 如果指定`right === 'left'`，则尝试放左边，放不下就放右边
                // - 如果指定`left === 'left'`，则尝试左边对齐，不行就右边对齐
                // - 如果指定`right === 'right`'，则尝试右边对齐，不行就左边对齐
                if (config.left === 'right') {
                    if (pageWidth - offset.right <= elementWidth) {
                        config.left = null;
                        config.right = 'left';
                    }
                }
                else if (config.right === 'left') {
                    if (offset.left <= elementWidth) {
                        config.left = 'right';
                        config.right = null;
                    }
                }
                else if (config.left === 'left') {
                    if (pageWidth - offset.left <= elementWidth) {
                        config.left = null;
                        config.right = 'right';
                    }
                }
                else if (config.right === 'right') {
                    if (offset.right <= elementWidth) {
                        config.left = 'left';
                        config.right = null;
                    }
                }
            }

            if (config.top === 'top' && config.bottom === 'bottom') {
                config.height = offset.height;
                config.bottom = null;
            }
            if (config.left === 'left' && config.right === 'right') {
                config.width = offset.width;
                config.right = null;
            }

            var properties = {};
            if (config.width) {
                properties.width = config.width;
            }
            if (config.height) {
                properties.height = config.height;
            }

            if (config.left) {
                properties.left = offset[config.left];
            }
            else if (config.right) {
                properties.left = offset[config.right] - elementWidth;
            }

            if (config.top) {
                properties.top = offset[config.top];
            }
            else if (config.bottom) {
                properties.top = offset[config.bottom] - elementHeight;
            }

            element.style.display = previousDisplayValue;
            render(element, properties);
        };

        /**
         * 将层在视图中居中
         *
         * @param {HTMLElement} element 目标层元素
         * @param {Object=} options 相关配置项
         * @param {number=} options.width 指定层的宽度
         * @param {number=} options.height 指定层的高度
         * @param {number=} options.minTop 如果层高度超过视图高度，
         * 则留下该值的上边界保底
         * @param {number=} options.minLeft 如果层宽度超过视图高度，
         * 则留下该值的左边界保底
         * @public
         * @deprecated
         */
        layer.centerToView = function (element, options) {
            var properties = options ? lib.clone(options) : {};

            if (typeof properties.width !== 'number') {
                properties.width = this.width;
            }
            if (typeof properties.height !== 'number') {
                properties.height = this.height;
            }

            properties.left = (lib.page.getViewWidth() - properties.width) / 2;

            var viewHeight = lib.page.getViewHeight();
            if (properties.height >= viewHeight && 
                options.hasOwnProperty('minTop')
            ) {
                properties.top = options.minTop;
            }
            else {
                properties.top = 
                    Math.floor((viewHeight - properties.height) / 2);
            }

            var viewWidth = lib.page.getViewWidth();
            if (properties.height >= viewWidth && 
                options.hasOwnProperty('minLeft')
            ) {
                properties.left = options.minLeft;
            }
            else {
                properties.left = 
                    Math.floor((viewWidth - properties.width) / 2);
            }

            properties.top += lib.page.getScrollTop();
            this.setProperties(properties);
        };

        return helper;
    }
);
