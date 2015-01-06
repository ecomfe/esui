/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 简易信息提示控件
 * @author zhanglili(otakustay@gmail.com) , chenhaoyin(curarchy@163.com)
 */
define(
    function (require) {
        var lib = require('./lib');
        var Control = require('./Control');

        /**
         * Toast控件
         *
         * @param {Object=} options 初始化参数
         * @extends Control
         * @constructor
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
         *      `normal`：默认信息：灰色背景
         *      `info`：通知信息：蓝色背景
         *      `alert`：警告信息：黄色背景
         *      `error`：错误信息：红色背景
         *      `success`：成功信息：绿色背景
         * @cfg {boolean} [defaultProperties.disposeOnHide=true] 隐藏后是否立即销毁
         * @static
         */
        Toast.defaultProperties = {
            duration: 3000,
            messageType: 'normal',
            disposeOnHide: true
        };

        /**
         * 控件类型，始终为`"Toast"`
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
         * @protected
         * @override
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
         * @protected
         * @override
         */
        Toast.prototype.initStructure = function () {
            this.main.innerHTML = this.helper.getPartHTML('content', 'p');
        };

        /**
         * 重渲染
         *
         * @override
         * @protected
         */
        Toast.prototype.repaint = require('./painters').createRepaint(
            Control.prototype.repaint,
            {
                /**
                 * @property {string} content
                 *
                 * 提示的内容，支持HTML
                 */
                name: 'content',
                paint: function (toast, content) {
                    var container = toast.main.firstChild;
                    container.innerHTML = content;
                }
            },
            {
                /**
                 * @property {string} messageType
                 *
                 * 提示的类型
                 */
                name: 'messageType',
                paint: function (toast, messageType) {
                    toast.helper.addPartClasses(toast.messageType);
                }
            }
        );

        /**
         * 显示提示信息
         *
         * @override
         */
        Toast.prototype.show = function () {
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }

            // 如果没放到DOM中，这里放进去
            if (!this.main.parentElement && !this.main.parentNode) {
                this.appendTo(getContainer.call(this));
            }

            if (!this.isHidden()) {
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
         */
        Toast.prototype.hide = function () {
            if (this.isHidden()) {
                return;
            }
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
         * @protected
         * @override
         */
        Toast.prototype.dispose = function () {
            clearTimeout(this.timer);
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }
            lib.removeNode(this.main);
            Control.prototype.dispose.apply(this, arguments);
        };

        /**
         * 获取的容器,可自行添加样式，使其呈现堆叠效果。
         *
         * @return {HTMLElement}
         * @ignore
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

        function createHandler(messageType) {
            return function (content, options) {
                if (messageType === 'show') {
                    messageType = 'normal';
                }
                options = lib.extend({content: content}, options);
                options.messageType = options.messageType || messageType;
                var toast = new Toast(options);
                Control.prototype.hide.apply(toast);
                toast.appendTo(getContainer.call(toast));
                return toast;
            };
        }

        /**
         * 快捷显示信息的方法
         *
         * @param {string} content 显示的内容
         * @param {Object} options 其它配置项
         * @ignore
         */
        var allType = ['show', 'info', 'alert', 'error', 'success'];
        for (var key in allType) {
            if (allType.hasOwnProperty(key)) {
                var messageType = allType[key];
                Toast[messageType] = createHandler(messageType);
            }
        }

        lib.inherits(Toast, Control);
        require('./main').register(Toast);
        return Toast;
    }
);
