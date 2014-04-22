/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 简易信息提示控件
 * @author zhanglili(otakustay@gmail.com) , chenhaoyin(curarchy@163.com)
 * @date 2014-01-13
 */
 define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        /**
         * Toast控件
         *
         * @param {Object=} options 初始化参数
         * @extends ./Control
         * @constructor
         * @public
         */
        function Toast(options) {
            Control.apply(this, arguments);
        }

        /**
         * @cfg defaultProperties
         *
         * 默认属性值
         *
         * @cfg {number} [defaultProperties.duration=3000] 显示时间
         * @cfg {string} [defaultProperties.messageType='normal'] 消息类型
         *      normal   默认信息：灰色背景
         *      info     通知信息：蓝色背景
         *      alert    警告信息：黄色背景
         *      error    错误信息：红色背景
         *      success  成功信息：绿色背景
         * @cfg {boolean} [defaultProperties.disposeOnHide=true] 隐藏后是否立即销毁
         * @static
         */
        Toast.defaultProperties = {
            duration: 3000,
            messageType: 'normal',
            disposeOnHide: true
        };

        /**
         * 控件类型
         *
         * @type {string}
         * @readonly
         * @override
         */
        Toast.prototype.type = 'Toast';

        /**
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Toast.prototype.initOptions = function (options) {
            var properties = {};
            lib.extend(properties, Toast.defaultProperties, options);
            if (properties.content == null) {
                properties.content = this.main.innerHTML;
            }
            this.setProperties(properties);
        };

        /**
         * 初始化结构
         *
         * @override
         * @protected
         */
        Toast.prototype.initStructure = function () {
            this.helper.addPartClasses(this.messageType);
            this.main.innerHTML = this.helper.getPartHTML('content', 'p');
        };

        /**
         * 重渲染
         *
         * @protected
         * @override
         */
        Toast.prototype.repaint = require('./painters').createRepaint(
            Control.prototype.repaint,
            {
                name: 'content',
                paint: function (toast, content) {
                    var container = toast.helper.getPart('content');
                    container.innerHTML = content;
                }
            }
        );

        /**
         * 显示提示信息
         *
         * @override
         * @public
         */
        Toast.prototype.show = function () {
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }

            Control.prototype.show.apply(this, arguments);
            this.fire('show');
            clearTimeout(this.timer);
            if (!isNaN(this.duration) && this.duration !== Infinity) {
                this.timer = setTimeout(lib.bind(this.hide, this), this.duration);
            }
        };

        /**
         * 隐藏提示信息
         *
         * @override
         * @public
         */
        Toast.prototype.hide = function () {
            Control.prototype.hide.apply(this, arguments);
            clearTimeout(this.timer);
            this.fire('hide');
            if (this.disposeOnHide) {
                this.dispose();
            }
        };

        /**
         * 销毁控件，同时移出DOM树
         *
         * @override
         * @protected
         */
        Toast.prototype.dispose = function () {
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }
            lib.removeNode(this.main);
            Control.prototype.dispose.apply(this, arguments);
        };

        /**
         * 获取的容器,可自行添加样式，使其呈现堆叠效果。
         *
         * @private
         */
        function getContainer() {
            // 因为container是多个toast公用的，所以不能标记为特定id
            var prefix = require('./main').getConfig('uiClassPrefix');
            var containerId = prefix + '-toast-collection-area';
            var element = document.getElementById(containerId);
            if (!element) {
                element = document.createElement('div');
                element.id = containerId;
                this.helper.addPartClasses('collection-area', element);
                document.body.appendChild(element);
            }
            return element;
        }

        /**
         * 快捷显示信息的方法
         *
         * @parma {string} content 显示的内容
         * @param {Object} options 其它配置项
         *
         * @public
         */
        var allType = ['show', 'info', 'alert', 'error', 'success'];
        for (var key in allType) {
            if (allType.hasOwnProperty(key)) {
                (function (messageType) {
                    Toast[messageType] = function (content, options) {
                        if (messageType === 'show') {
                            messageType = 'normal';
                        }
                        options.messageType = options.messageType || messageType;
                        options = lib.extend({ content: content }, options);
                        var toast = new Toast(options);
                        Control.prototype.hide.apply(toast);
                        toast.appendTo(getContainer.call(toast));
                        return toast;
                    };
                }) (allType[key]);
            }
        };

        lib.inherits(Toast, Control);
        require('./main').register(Toast);
        return Toast;
    }
);