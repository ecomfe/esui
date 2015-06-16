/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 控件浮层基类
 * @author otakustay
 */

define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var esui = require('./main');
        var eoo = require('eoo');
        var EventTarget = require('mini-event/EventTarget');
        var $ = require('jquery');
        require('./behavior/position');

        // 它们无法组合`Layer`实例，因此需要静态方法为其服务
        // 初始最高的`z-index`值，将浮层移到最上就是参考此值
        var zIndexStack = 1000;

        var Layer = eoo.create(
            EventTarget,
            {
                /**
                 * 浮层基类
                 *
                 * `Layer`类是一个与控件形成组合关系的类，但并不是一个控件
                 *
                 * 当一个控件需要一个浮层（如下拉框）时，可以使用此类，并重写相关方法来实现浮层管理
                 *
                 * 不把`Layer`作为一个控件来实现，是有以下考虑：
                 *
                 * - 即便`Layer`作为子控件使用，也必须重写所有相关方法才能起作用，并未节省代码
                 * - 控件的生命周期管理、事件管理等一大堆事对性能多少有些负面影响
                 * - 通常重写`Layer`的方法时，会依赖控件本身的一些开放接口。
                 * 那么如果`Layer`是个子控件，就形成了 **子控件反调用父控件方法** 的现象，不合理
                 *
                 * 关于如何使用`Layer`控件，可以参考{@link CommandMenu}进行学习
                 *
                 * @constructor
                 * @param {Control} control 关联的控件实例
                 */
                constructor: function (control) {
                    this.control = control;
                },

                /**
                 * 创建的元素标签类型
                 *
                 * @type {string}
                 */
                nodeName: 'div',

                /**
                 * 点击到浮层外是关闭
                 *
                 * @type {bool}
                 */
                autoClose: true,

                /**
                 * 当这些元素是父元素时，不自动关闭浮层。
                 *
                 * @type {Array}
                 */
                autoCloseExcludeElements: [],

                /**
                 * 创建浮层
                 *
                 * @return {HTMLElement}
                 */
                create: function () {
                    var control = this.control;
                    var helper = control.helper;
                    var element =
                        helper.createPart('layer', this.nodeName);

                    // 这里添加variant信息到layer上以方便定义variant样式。
                    var variants = control.variants;
                    var variantsCls = [];
                    if (variants) {
                        variants = typeof variants === 'string'
                            ? variants.split(' ')
                            : variants;

                        // 处理过一次在control render时候就不处理了。
                        control.variants = variants;
                        u.each(variants, function (v) {
                            variantsCls.push(helper.getPrimaryClassName('layer-' + v));
                        });
                        $(element).addClass(variantsCls.join(' '));
                    }

                    return element;
                },

                /**
                 * 给Layer增加自定义class
                 *
                 * @param {Array} layerClassNames 样式集合
                 */
                addCustomClasses: function (layerClassNames) {
                    var element = this.getElement();
                    $(element).addClass(layerClassNames.join(' '));
                },

                /**
                 * 渲染层内容
                 *
                 * @param {HTMLElement} element 层元素
                 * @abstract
                 */
                render: function (element) {
                },

                /**
                 * 同步控件状态到层
                 *
                 * @param {HTMLElement} element 层元素
                 * @abstract
                 */
                syncState: function (element) {
                },

                /**
                 * 重新渲染
                 */
                repaint: function () {
                    var element = this.getElement(false);

                    if (element) {
                        this.render(element);
                    }
                },

                /**
                 * 初始化层的交互行为
                 *
                 * @param {HTMLElement} element 层元素
                 * @abstract
                 */
                initBehavior: function (element) {
                },

                /**
                 * 获取浮层DOM元素
                 *
                 * @param {boolean} [create=true] 不存在时是否创建
                 * @return {HTMLElement}
                 */
                getElement: function (create) {
                    var element = this.control.helper.getPart('layer');

                    if (!element && create !== false) {
                        element = this.create();
                        this.render(element);

                        $(element).addClass(getHiddenClasses(this));

                        this.initBehavior(element);
                        this.syncState(element);

                        // IE下元素始终有`parentNode`，无法判断是否进入了DOM
                        if (!element.parentElement) {
                            document.body.appendChild(element);
                        }

                        this.fire('rendered');
                    }

                    return element;
                },

                /**
                 * 隐藏层
                 */
                hide: function () {
                    var classes = getHiddenClasses(this);

                    var element = this.getElement();
                    $(element).addClass(classes);
                    this.control.removeState('active');
                    this.fire('hide');
                },

                /**
                 * 显示层
                 */
                show: function () {
                    var me = this;
                    var element = me.getElement();
                    element.style.zIndex = me.getZIndex();
                    if (me.autoClose) {
                        // 点击文档自动关闭
                        setDocClickHandler(me);
                    }
                    var classes = getHiddenClasses(me);
                    $(element).removeClass(classes);
                    me.position();
                    me.control.addState('active');
                    me.fire('show');
                },

                /**
                 * 切换显示状态
                 */
                toggle: function () {
                    var element = this.getElement();
                    if (!element
                        || this.control.helper.isPart(element, 'layer-hidden')
                    ) {
                        this.show();
                    }
                    else {
                        this.hide();
                    }
                },

                /**
                 * 放置层
                 */
                position: function () {
                    var layer = this.getElement();
                    Layer.attachTo(layer, this.control.main, this.dock);
                },

                /**
                 * 获取层应该有的`z-index`样式值
                 *
                 * @return {number}
                 */
                getZIndex: function () {
                    return Layer.getZIndex(this.control.main);
                },

                /**
                 * 销毁
                 */
                dispose: function () {
                    var element = this.getElement(false);
                    this.autoCloseExcludeElements = [];
                    if (element) {
                        $(element).remove();
                    }
                    this.control = null;
                }
            }
        );

        /**
         * 通过点击关闭弹层的处理方法
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function close(e) {
            var target = e.target;
            var me = this;
            var layer = me.getElement(me);

            if (!layer) {
                return;
            }

            // 在内部点击
            var inLayer = layer === target || $.contains(layer, target);
            var inElements = false;
            u.each(me.autoCloseExcludeElements, function (ele) {
                inElements = $.contains(ele, target);
                if (inElements) {
                    return false;
                }
            });
            if (!inLayer && !inElements) {
                me.hide();
            }
            else if (me.autoClose) {
                setDocClickHandler(me);
            }
        }

        function setDocClickHandler(layer) {
            $(document).one('mousedown', function (e) {
                close.call(layer, e);
            });
        }

        function getHiddenClasses(layer) {
            var classes = layer.control.helper.getPartClasses('layer-hidden');
            classes.unshift(esui.getConfig('uiClassPrefix') + '-layer-hidden');

            return classes.join(' ');
        }

        /**
         * 创建层元素
         *
         * @param {string} [tagName="div"] 元素的标签名
         * @return {HTMLElement}
         * @static
         */
        Layer.create = function (tagName) {
            var element = document.createElement(tagName || 'div');
            element.style.position = 'absolute';
            return element;
        };

        /**
         * 获取层应当使用的`z-index`的值
         *
         * @param {HTMLElement} [owner] 层的所有者元素
         * @return {number}
         * @static
         */
        Layer.getZIndex = function (owner) {
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
         * @static
         */
        Layer.moveToTop = function (element) {
            element.style.zIndex = ++zIndexStack;
        };

        /**
         * 移动层的位置
         *
         * @param {HTMLElement} element 目标层元素
         * @param {number} top 上边界距离
         * @param {number} left 左边界距离
         * @static
         */
        Layer.moveTo = function (element, top, left) {
            positionLayerElement(element, {top: top, left: left});
        };

        /**
         * 缩放层的大小
         *
         * @param {HTMLElement} element 目标层元素
         * @param {number} width 宽度
         * @param {number} height 高度
         * @static
         */
        Layer.resize = function (element, width, height) {
            positionLayerElement(element, {width: width, height: height});
        };

        /**
         * 让当前层靠住一个指定的元素
         *
         * @param {HTMLElement} layer 目标层元素
         * @param {HTMLElement} target 目标元素
         * @param {Object} [options] 停靠相关的选项
         * @param {boolean} [options.strictWidth=false] 是否要求层的宽度不小于目标元素的宽度
         * @static
         */
        Layer.attachTo = function (layer, target, options) {
            options = options || {strictWidth: false};
            // 如果对层宽度有要求，则先设置好最小宽度
            if (options.strictWidth) {
                layer.style.minWidth = target.offsetWidth + 'px';
            }
            $(layer).position(
                u.extend(
                    {
                        my: 'left top',
                        of: target,
                        at: 'left bottom'
                    },
                    options
                )
            );
        };

        /**
         * 将层在视图中居中
         *
         * @param {HTMLElement} element 目标层元素
         * @param {Object} [options] 相关配置项
         * @param {number} [options.width] 指定层的宽度
         * @param {number} [options.height] 指定层的高度
         * @param {number} [options.minTop] 如果层高度超过视图高度，
         * 则留下该值的上边界保底
         * @param {number} [options.minLeft] 如果层宽度超过视图高度，
         * 则留下该值的左边界保底
         * @static
         */
        Layer.centerToView = function (element, options) {
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

        // 统一浮层放置方法方法
        function positionLayerElement(element, options) {
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
        return Layer;
    }
);
