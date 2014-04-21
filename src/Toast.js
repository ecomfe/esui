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
        var lib = require('esui/lib');
        var helper = require('esui/controlHelper');
        var Control = require('esui/Control');

        /**
         * Toast控件
         *
         * @param {Object=} options 初始化参数
         * @extends esui/Control
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
         * @cfg {string} [defaultProperties.msgType='normal'] 消息类型
         *      normal info alert error success
         * @cfg {boolean} [defaultProperties.isStack=false] 是否堆叠
         *      false: 顶部显示
         *      true：右下角堆叠
         * @static
         */
        Toast.defaultProperties = {
            duration: 3000,
            msgType: 'normal',
            isStack: false
        };

        /**
         * 控件类型
         *
         * @type {string}
         */
        Toast.prototype.type = 'Toast';

        /**
         * 创建主元素
         *
         * @override
         * @protected
         */
        Toast.prototype.createMain = function () {
            return document.createElement('aside');
        };

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
            if (properties.content === null) {
                properties.content = this.main.innerHTML;
            }
            this.setProperties(properties);
        };

        var tempalte = '<p id="${id}" class="${classes}"></p>';

        /**
         * 初始化结构
         *
         * @override
         * @protected
         */
        Toast.prototype.initStructure = function () {
            this.helper.addPartClasses(this.msgType);
            if (this.main.isStack) {
                this.helper.addPartClasses('stack');
            }
            this.main.innerHTML = lib.format(
                tempalte,
                {
                    id: this.helper.getId('content'),
                    classes: this.helper.getPartClasses('content').join(' ')
                }
            );
        };

        /**
         * 重渲染
         *
         * @protected
         * @override
         */
        Toast.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            {
                name: 'content',
                paint: function (toast, content) {
                    var container = toast.main.firstChild;
                    container.innerHTML = content;
                    toast.show();
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
                this.timer = setTimeout(
                    lib.bind(this.hide, this),
                    this.duration
                );
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
            //销毁自身
            this.dispose();
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
         * Toast控件
         *
         * 获取堆叠时的容器
         * @private
         */
        function getContainer() {
            // 因为container是多个toast公用的，所以不能标记为特定id
            var element = document.getElementById('ui-toast-collection-area');
            if (!element) {
                element = document.createElement('div');
                element.id = 'ui-toast-collection-area';
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
                (function (msgType) {
                    Toast[msgType] = function (content, options) {
                        if (msgType === 'show') {
                            msgType = 'normal';
                        }
                        options.msgType = options.msgType || msgType;
                        options = lib.extend({ content:content }, options);
                        var toast = new Toast(options);
                        if (options.isStack) {
                            toast.appendTo(getContainer.call(toast));
                        }
                        else {
                            toast.appendTo(document.body);
                        }
                        return toast;
                    };
                }) (allType[key]);
            }
        };

        lib.inherits(Toast, Control);
        require('esui').register(Toast);
        return Toast;
    }
);