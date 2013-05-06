define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var ui = require('./main');
        var paint = require('./painters');

        /**
         * 提示控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Tip(options) {
            Control.apply(this, arguments);
        }

        Tip.prototype.type = 'Tip';

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @override
         * @protected
         */
        Tip.prototype.initOptions = function (options) {
            /**
             * 默认选项配置
             */
            var properties = {
                title: '',
                content: '',
                arrow: 'tl'
            };
            lib.extend(properties, options);
            this.setProperties(properties);
        };

        /**
         * 创建主元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement} 主元素
         * @override
         * @protected
         */
        Tip.prototype.createMain = function (options) {
            return document.createElement('aside');
        };

        /**
         * 初始化DOM结构
         *
         * @override
         * @protected
         */
        Tip.prototype.initStructure = function () {
            helper.addDOMEvent(
                this, this.main, 'mouseover',
                lib.curry(toggleLayer, this)
            );
            helper.addDOMEvent(
                this, this.main, 'mouseout',
                lib.curry(hideLayer, this)
            );
        };

        /**
         * 触发显示layer
         *
         * @param {Tip} tip Tip控件实例
         * @inner
         */
        function toggleLayer(tip) {
            var layer = lib.g(helper.getId(tip, 'layer'));
             if (!layer) {
                createLayer(tip);
             }
             else {
                showLayer(tip, layer);
             }
        }

        /**
         * 创建layer
         *
         * @param {Tip} tip Tip控件实例
         * @param {Event} e 触发事件的事件对象
         */
        function createLayer(tip, e) {
            layer = helper.layer.create('div');
            layer.id = helper.getId(tip, 'layer');
            layer.className = helper.getPartClasses(tip, 'layer').join(' ');

            var title = document.createElement('h3');
            var body = document.createElement('div');
            var arrow = helper.layer.create('div');

            // 初始化提示标题
            title.id = helper.getId(tip, 'title');
            title.className = helper.getPartClasses(tip, 'title').join(' ');
            layer.appendChild(title);

            // 初始化提示体
            body.id = helper.getId(tip, 'body');
            body.className = helper.getPartClasses(tip, 'body').join(' ');
            layer.appendChild(body);

            // 初始化箭头
            arrow.id = helper.getId(tip, 'arrow');
            arrow.className = helper.getPartClasses(tip, 'arrow').join(' ');
            layer.appendChild(arrow);

            document.body.appendChild(layer);
            helper.layer.attachTo(
                layer, 
                tip.main, 
                { top: 'bottom', left: 'left'}
            );

            tip.repaint();
        }

        /**
         * 修改箭头位置
         *
         * @param {Tip} tip Tip控件实例
         * @param {string} value 箭头位置变量
         */
        function positionArrow(tip, value) {
            // 箭头的class形如`ui-tip-arrow ui-tip-arrow-tl`
            var classes = helper.getPartClasses(tip, 'arrow');
            if (typeof value === 'string') {
                classes = classes.concat(
                    helper.getPartClasses(tip, 'arrow-' + value));
            }
            var arrowElement = lib.g(helper.getId(tip, 'arrow'));           
            arrowElement.className = classes.join(' ');
        }

        /**
         * 隐藏下拉弹层
         *
         * @param {Tip} tip Tip控件实例
         * @inner
         */
        function hideLayer(tip, layer) {
            var layer = lib.g(helper.getId(tip, 'layer'));
            if (layer) {
                helper.addPartClasses(tip, 'layer-hidden', layer);
            }
        }

        /**
         * 显示下拉弹层
         *
         * @param {Tip} tip Tip控件实例
         * @param {HTMLElement} layer 浮层DOM元素
         * @inner
         */
        function showLayer(tip, layer) {
            helper.removePartClasses(tip, 'layer-hidden', layer);
        }

        /**
         * 重绘
         *
         * @param {Array=} 更新过的属性集合
         * @protected
         */
        Tip.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            paint.html('title', 'title'),
            paint.html('content', 'body'),
            {
                name: 'arrow',
                paint: function (tip, value) {
                    if (tip.layer) {
                        positionArrow(tip, value);
                    }
                }
            }
        );

        /**
         * 销毁控件
         *
         * @override
         * @public
         */
        Tip.prototype.dispose = function () {
            var layer = lib.g(helper.getId(this, 'layer'));
            if (layer) {
                layer.parentNode.removeChild(layer);
            }

            Control.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(Tip, Control);
        ui.register(Tip);
        return Tip;
    }
);