define(
    function (require) {
        var Panel = require('./Panel');

        /**
         * 浮动层控件
         *
         * @param {Object=} options 构造控件的选项
         * @constructor
         */
        function Layer(options) {
            Panel.apply(this, arguments);
        }

        Layer.prototype.type = 'Layer';

        /**
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Layer.prototype.initOptions = function (options) {
            var properties = {};
            require('./lib').extend(properties, options);

            var style = this.main.style;
            if (style.left) {
                properties.left = parseInt(style.left, 10);
            }
            if (style.top) {
                properties.top = parseInt(style.top, 10);
            }
            if (style.bottom) {
                properties.bottom = parseInt(style.bottom, 10);
            }
            if (style.right) {
                properties.right = parseInt(style.right, 10);
            }
            if (style.width) {
                properties.width = parseInt(style.width, 10);
            }
            if (style.height) {
                properties.height = parseInt(style.height, 10);
            }

            this.setProperties(properties);
        };

        /**
         * 初始化DOM结构
         *
         * @protected
         */
        Layer.prototype.initStructure = function () {
            Panel.prototype.initStructure.apply(this, arguments);
            this.main.style.position = 'absolute';
        };

        /**
         * 批量更新属性并重绘
         *
         * @param {Object} 需更新的属性
         * @public
         */
        Layer.prototype.setProperties = function (properties) {
            // 如果同时有`top`和`bottom`，则计算出`height`来
            if (properties.hasOwnProperty('top')
                && prototype.hasOwnProperty('bottom')
            ) {
                properties.height = properties.bottom - properties.top;
                delete properties.bottom;
            }
            // 同样处理`left`和`right`
            if (properties.hasOwnProperty('left')
                && prototype.hasOwnProperty('right')
            ) {
                properties.width = properties.right - properties.left;
                delete properties.right;
            }

            return Panel.prototype.setProperties.apply(this, arguments);
        };

        var paint = require('./painters');
        var repaint = require('/controlHelper').createRepaint(
            paint.style('width'),
            paint.style('height'),
            paint.style('top'),
            paint.style('right'),
            paint.style('bottom'),
            paint.style('left'),
            paint.style('zIndex')
        );

        /**
         * 渲染自身
         *
         * @param {Array=} 变更过的属性的集合
         * @override
         * @protected
         */
        Layer.prototype.repaint = function (changes, changesIndex) {
            if (changesIndex.hasOwnProperty('top')
                || changesIndex.hasOwnProperty('bottom')
            ) {
                this.main.style.top = '';
                this.main.style.bottom = '';
            }

            if (changesIndex.hasOwnProperty('left')
                || changesIndex.hasOwnProperty('right')
            ) {
                this.main.style.left = '';
                this.main.style.right = '';
            }

            changes = Panel.prototype.repaint.apply(this, arguments);
            return repaint.apply(this, arguments);
        };

        var zIndexStack = 1000;

        /**
         * 将当前层移到最前
         *
         * @public
         */
        Layer.prototype.moveToTop = function () {
            this.set('zIndex', ++zIndexStack);
        };

        /**
         * 移动层的位置
         *
         * @param {number} top 上边界
         * @param {number} left 左边界
         * 
         * @public
         */
        Layer.prototype.moveTo = function (top, left) {
            this.setProperties({ top: top, left: left });
        };

        /**
         * 缩放层的大小
         *
         * @param {number} width 宽度
         * @param {number} height 高度
         * 
         * @public
         */
        Layer.prototype.resize = function (width, height) {
            this.setProperties({ width: width, height: height });
        };

        /**
         * 让当前层靠住一个元素
         *
         * @param {HTMLElement} element 目标元素
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
         * 
         * @public
         */
        Layer.prototype.attachTo = function (element, options) {
            options = options || { left: 'left', top: 'top' };
            var lib = require('./lib');
            var offset = lib.getOffset(element);
            // 有2种特殊的情况：
            // 
            // -`{ top: 'top', bottom: 'bottom' }`
            // -`{ left: 'left', right: 'right' }`
            // 
            // 这两种情况下，要计算出宽和高来，且覆盖掉提供的宽高
            var config = lib.clone(options);
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
                properties.right = offset[config.right];
            }

            if (config.top) {
                properties.top = offset[config.top];
            }
            else if (config.bottom) {
                properties.bottom = offset[config.bottom];
            }

            this.setProperties(properties);
        };

        /**
         * 将层在视图中居中
         *
         * @param {Object=} options 相关配置项
         * @param {number=} options.width 指定层的宽度
         * @param {number=} options.height 指定层的高度
         * @param {number=} options.minTop 如果层高度超过视图高度，
         * 则留下该值的上边界保底
         * @param {number=} options.minLeft 如果层宽度超过视图高度，
         * 则留下该值的左边界保底
         */
        Layer.prototype.centerToView = function (options) {
            var lib = require('./lib');
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

        require('./lib').inherits(Layer, Panel);
        require('./main').register(Layer);

        return Layer;
    }
);