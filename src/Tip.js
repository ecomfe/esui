define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var ui = require('./main');

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
            lib.extend(this, properties);
        };

        /**
         * 创建主元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement} 主元素
         * @protected
         */
        Tip.prototype.createMain = function (options) {
            return document.createElement('div');
        };

        /**
         * 初始化DOM结构
         *
         * @protected
         */
        Tip.prototype.initStructure = function () {
            // 如果主元素不是`<div>`，替换成`<div>`
            if (this.main.nodeName.toLowerCase() !== 'div') {
                var main = this.createMain();
                lib.insertBefore(main, this.main);
                this.main.parentNode.removeChild(this.main);
                this.main = main;
            }

            helper.addDOMEvent(
                this, this.main, 'mouseover',
                lib.bind(toggleLayer, null, this)
            );
            helper.addDOMEvent(
                this, this.main, 'mouseout',
                lib.bind(hideLayer, null, this)
            );
        };

        /**
         * 触发显示layer
         *
         * @param {Tip} tip Tip控件实例
         * @inner
         */
        function toggleLayer(tip) {
             if (!tip.layer) {
                createLayer(tip);
             }
             else {
                showLayer(tip);
             }
        }

        /**
         * 创建layer
         *
         * @param {Tip} tip Tip控件实例
         * @param {Event} 触发事件的事件对象
         */
        function createLayer(tip, e) {
            layer = helper.layer.create('div');
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
            tip.layer = layer;
            helper.layer.attachTo(
                layer, 
                tip.main, 
                { top: 'bottom', left: 'left'}
            );

            tip.setProperties(
                {
                    'tipTitle': tip.title,
                    'tipContent': tip.content,
                    'tipArrow': tip.arrow
                }
            );
        }

        /**
         * 修改箭头位置
         * @param  {Tip} tip Tip控件实例
         * @param  {string} value 箭头位置变量
         */
        function arrowPostion(tip, value) {
            // 预初始化各种变量
            var arrowClass = 'arrow';
            var arrow = value; // 1|tr|rt|rb|br|bl|lb|lt|tl
            arrow && (arrowClass += '-' + arrow);
            arrowClass = helper.getPartClasses(tip, arrowClass).join(' ');
            var arrowDom = lib.g(helper.getId(tip, 'arrow'));           
            arrowDom.className = arrowClass;
        }

        /**
         * 隐藏下拉弹层
         *
         * @param {Tip} tip Tip控件实例
         */
        function hideLayer(tip) {
            var classes = helper.getPartClasses(tip, 'layer-hidden');
            lib.addClasses(tip.layer, classes);
        }

        /**
         * 显示下拉弹层
         *
         * @param {Tip} tip Tip控件实例
         */
        function showLayer(tip) {
            var classes = helper.getPartClasses(tip, 'layer-hidden');
            lib.removeClasses(tip.layer, classes);
        }

        /**
         * 重绘
         *
         * @param {Array=} 更新过的属性集合
         * @protected
         */
        Tip.prototype.repaint = helper.createRepaint(
            {
                name: 'tipTitle',
                paint: function (tip, value) {
                    if (tip.layer) {
                        var titleId = helper.getId(tip, 'title');
                        lib.g(titleId).innerHTML = value;
                    }
                }
            },
            {
                name: 'tipContent',
                paint: function (tip, value) {
                    if (tip.layer) {
                        var bodyId = helper.getId(tip, 'body');
                        lib.g(bodyId).innerHTML = value;
                    }
                }
            },
            {
                name: 'tipArrow',
                paint: function (tip, value) {
                    if (tip.layer) {
                        arrowPostion(tip, value);
                    }
                }
            }
        );

        lib.inherits(Tip, Control);
        ui.register(Tip);
        return Tip;
    }
);