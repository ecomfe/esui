/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 命令扩展
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('../lib');
        var Extension = require('../Extension');

        /**
         * 从DOM元素中抓取命令事件的扩展
         *
         * 在ESUI的设计理念中，控件是 **对DOM元素和操作的封装** ，
         * 因此不希望外部代码直接访问控件中的DOM元素
         *
         * 但是控件自身很难提供足够的事件来满足所有的业务，有时业务会需要特定DOM元素的事件
         *
         * `Command`扩展的作用就是将控件内部DOM元素的指定事件，
         * 转变为控件的`command`事件触发，供外部的脚本注册及执行相关的逻辑
         *
         * 使用`Command`扩展后，如果一个DOM元素上有`data-command`属性，
         * 则对该DOM元素的事件进行监听，并按以下规则转化为控件的`command`事件：
         *
         * - 监听的事件由扩展的`events`属性决定
         * - 事件对象中的`name`属性值为DOM元素的`data-command`属性值
         * - 事件对象中的`args`属性值为DOM元素的`data-command-args`属性值
         *
         * 在使用HTML创建`Command`扩展时，`events`忏悔可以使用逗号或空格分隔的字符串：
         *
         *     data-ui-extension-command-events="click,mousedown,mouseup"
         *     // 或
         *     data-ui-extension-command-events="click mousedown mouseup"
         *
         * 则表示监听`click`、`mousedown`和`mouseup`事件
         *
         * @class extension.Command
         * @extends Extension
         * @param {Object} [options] 初始化配置
         * @constructor
         */
        function Command(options) {
            options = options || {};
            if (!options.events) {
                options.events = ['click'];
            }
            else {
                options.events = lib.splitTokenList(options.events);
            }
            Extension.apply(this, arguments);
        }

        /**
         * 指定扩展类型，始终为`"Command"`
         *
         * @type {string}
         */
        Command.prototype.type = 'Command';

        /**
         * 处理事件
         *
         * 该方法包含了以下逻辑：
         *
         * 1. 判断元素是否符合触发`command`事件的条件，默认条件为有`data-command`属性
         * 2. 构造事件对象，默认带有以下属性：
         *     - `{string} name`：命令名称，来自`data-command`属性的值
         *     - `{string} args`：命令参数，来自`data-command-args`属性的值
         *     - `{string} triggerType`：触发的DOM事件类型
         * 3. 触发`command`事件
         * 4. 控制`stopPropagation`等逻辑
         *
         * 通过重写本方法可以改变以上逻辑，多数情况下不需要重写
         *
         * @param {Event} e 事件对象
         * @protected
         */
        Command.prototype.handleCommand = function (e) {
            var target = e.target;
            // 为了让`main`上的点击也能触发，要一直追溯到`main`的父节点
            var endpoint = this.main && this.main.parentNode;
            
            while (target && target !== endpoint) {
                if (target.nodeType === 1 
                    // 点击事件不在禁用的元素上触发，其它事件则可以
                    && (target.disabled !== true || e.type !== 'click')
                ) {
                    var commandName = target.getAttribute('data-command');
                    if (commandName) {
                        var args = target.getAttribute('data-command-args');
                        var event = require('mini-event').fromDOMEvent(
                            e,
                            'command',
                            {
                                name: commandName, 
                                triggerType: e.type, 
                                args: args
                            }
                        );
                        event = this.fire('command', event);
                        
                        if (event.isPropagationStopped()) {
                            return;
                        }
                    }
                }
                target = target.parentNode;
            }
        };

        /**
         * 激活扩展
         *
         * @override
         */
        Command.prototype.activate = function () {
            for (var i = 0; i < this.events.length; i++) {
                this.target.helper.addDOMEvent(
                    this.target.main, 
                    this.events[i], 
                    this.handleCommand
                );
            }

            Extension.prototype.activate.apply(this, arguments);
        };

        /**
         * 取消扩展的激活状态
         *
         * @override
         */
        Command.prototype.inactivate = function () {
            for (var i = 0; i < this.events.length; i++) {
                this.target.helper.removeDOMEvent(
                    this.target.main, 
                    this.events[i], 
                    this.handleCommand
                );
            }

            Extension.prototype.inactivate.apply(this, arguments);
        };

        /**
         * 创建一个根据事件类型和命令名称分发至对应处理函数的函数
         *
         * 可以采用以下两种形式的配置：
         *     
         *         [
         *             { type: 'click', name: 'xxx', handler: xxx },
         *             { type: 'mouseover', name: 'xxx', handler: yyy },
         *             { type: 'click', name: 'yyy', handler: zzz },
         *         ]
         *     
         * 或
         *     
         *         {
         *             'click:xxx': xxx,
         *             'mouseover:xxx': yyy,
         *             'click:yyy': zzz
         *         }
         *
         * @param {Object} config 相关的配置
         * @return {Function} 分发函数，用于注册到`command`事件上
         * @static 
         */
        Command.createDispatcher = function (config) {
            var map = config;
            if (u.isArray(config)) {
                map = {};
                for (var i = 0; i < config.length; i++) {
                    var item = config[i];
                    var name = item.triggerType
                        ? item.triggerType + ':' + item.name
                        : item.name;
                    map[name] = item.handler;
                }
            }

            return function (e) {
                // 处理函数的查找规则，优先级从高到低依次是：
                // 
                // 1. 从`config`中传过来的且能对上类型及命令名称的
                // 2. 从`config`中传过来的且能对上命令名称的
                // 3. 控件实例上以`execute${name}${triggerType}`为名称的方法
                // 4. 控件实例上以`execute${name}`为名称的方法
                // 5. `config`中命令名称为`*`且类型能对上的
                // 6. `config`中命令名称为`*`且没提供类型的
                // 
                // 其中3和4两条中的`${name}`和`${triggerType}`均转为PascalCase
                var handler = map[e.triggerType + ':' + e.name];
                if (!handler) {
                    handler = map[e.name];
                }
                if (!handler) {
                    var method = 'execute' 
                        + lib.pascalize(e.name)
                        + lib.pascalize(e.triggerType);
                    handler = this[method];
                }
                if (typeof handler !== 'function') {
                    var method = 'execute' 
                        + lib.pascalize(e.name);
                    handler = this[method];
                }
                if (typeof handler !== 'function') {
                    handler = map[e.triggerType + ':*'];
                }
                if (!handler) {
                    handler = map['*'];
                }

                if (typeof handler === 'function') {
                    handler.apply(this, arguments);
                }
            };
        };

        lib.inherits(Command, Extension);
        require('../main').registerExtension(Command);

        return Command;
    }
);
