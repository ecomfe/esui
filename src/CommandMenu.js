/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 命令菜单控件
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');
        var Layer = require('./Layer');
        var main = require('./main');

        /**
         * 选中某一项
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function selectItem(e) {
            var target = e.target;

            while (target !== e.currentTarget
                && !lib.hasAttribute(target, 'data-index')
            ) {
                target = target.parentNode;
            }
            
            var index = +target.getAttribute('data-index');
            var item = this.datasource[index];

            if (item.disabled) {
                return;
            }

            this.layer.hide();

            if (target === e.currentTarget) {
                return;
            }

            if (item) {
                if (typeof item.handler === 'function') {
                    item.handler.call(this, item, index);
                }
            }

            /**
             * @event select
             *
             * 选中菜单中的一项时触发
             *
             * @param {meta.CommandMenuItem} item 选中的项
             * @param {number} index 选中项在{@CommandMenu#datasource}中的的索引
             * @member CommandMenu
             */
            this.fire('select', { item: item, index: index });
        }

        /**
         * CommandMenu用浮层
         *
         * @extends Layer
         * @ignore
         * @constructor
         */
        function CommandMenuLayer() {
            Layer.apply(this, arguments);
        }

        lib.inherits(CommandMenuLayer, Layer);

        CommandMenuLayer.prototype.nodeName = 'ul';

        CommandMenuLayer.prototype.dock = {
            strictWidth: true
        };

        CommandMenuLayer.prototype.render = function (element) {
            var html = '';

            for (var i = 0; i < this.control.datasource.length; i++) {
                var classes = this.control.helper.getPartClasses('node');
                if (i === this.control.activeIndex) {
                    classes.push.apply(
                        classes,
                        this.control.helper.getPartClasses('node-active')
                    );
                }
                // 为disabled的menu条目加上样式
                if (this.control.datasource[i].disabled) {
                    classes.push.apply(
                        classes,
                        this.control.helper.getPartClasses('node-disabled')
                    );                    
                }

                html += '<li data-index="' + i + '"'
                    + ' class="' + classes.join(' ') + '">';

                html += this.control.getItemHTML(this.control.datasource[i]);
            }

            element.innerHTML = html;
        };

        /**
         * 初始化层的交互行为
         *
         * @param {HTMLElement} element 层元素
         * @override
         */
        CommandMenuLayer.prototype.initBehavior = function (element) {
            var helper = this.control.helper;

            helper.addDOMEvent(element, 'click', selectItem);
            lib.addClass(element, helper.getPrefixClass('dropdown'));
        };

        /**
         * 命令菜单
         *
         * 命令菜单在点击后会出现一个下拉框，根据{@link CommandMenu#datasource}配置，
         * 点击其中一项后会执行对应的{@link meta.CommandMenuItem#handler}函数，
         * 或者触发{@link CommandMenu#select}事件
         *
         * @extends {Control}
         * @constructor
         */
        function CommandMenu() {
            Control.apply(this, arguments);
            this.layer = new CommandMenuLayer(this);
        }

        /**
         * 控件类型，始终为`"CommandMenu"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        CommandMenu.prototype.type = 'CommandMenu';

        /**
         * 浮层中每一项的HTML模板
         *
         * 在模板中可以使用以下占位符：
         *
         * - `{string} text`：文本内容，经过HTML转义
         *
         * @type {string}
         */
        CommandMenu.prototype.itemTemplate = '<span>${text}</span>';

        /**
         * 获取浮层中每一项的HTML
         *
         * @param {meta.CommandMenuItem} item 当前项的数据项
         * @return {string} 返回HTML片段
         */
        CommandMenu.prototype.getItemHTML = function (item) {
            var data = {
                text: u.escape(item.text)
            };
            return lib.format(this.itemTemplate, data);
        };

        CommandMenu.prototype.initStructure = function () {
            var mainElement = this.main;
            if (!this.displayHTML) {
                this.displayHTML = mainElement.innerHTML;
            }
            lib.addClass(mainElement, this.helper.getPrefixClass('button'));
        },

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        CommandMenu.prototype.initEvents = function () {
            this.helper.addDOMEvent(this.main, 'click', u.bind(this.layer.toggle, this.layer));
        };

        var paint = require('./painters');
        /**
         * 重新渲染
         *
         * @method
         * @protected
         * @override
         */
        CommandMenu.prototype.repaint = paint.createRepaint(
            Control.prototype.repaint,
            /**
             * @property {number} width
             *
             * 宽度
             */
            paint.style('width'),
            /**
             * @property {number} height
             *
             * 高度，指浮层未展开时的可点击元素的高度， **与浮层高度无关**
             */
            paint.style('height'),
            {
                /**
                 * @property {meta.CommandMenuItem[]} datasource
                 *
                 * 数据源，其中每一项生成浮层中的一条
                 */
                name: 'datasource',
                paint: function (menu) {
                    menu.layer.repaint();
                }
            },
            /**
             * @property {string} displayText
             *
             * 显示在可点击元素上的文本, 为了保持向后兼容，此属性优先于displayHTML属性
             */
            paint.text('displayText'),
            {
                /**
                 * @property {string} displayHTML
                 *
                 * 显示在可点击元素上的HTML。
                 */
                name: 'displayHTML',
                paint: function (menu, displayHTML) {
                    if (!menu.displayText) {
                        menu.main.innerHTML = displayHTML;
                    }
                }
            },
            {
                name: ['disabled', 'hidden', 'readOnly'],
                paint: function (menu, disabled, hidden, readOnly) {
                    if (disabled || hidden || readOnly) {
                        menu.layer.hide();
                    }
                }
            }
        );

        /**
         * 创建控件主元素，默认使用`<button type="button">`元素
         *
         * 如果需要使用其它类型作为主元素，
         * 需要在始终化时提供{@link Control#main}属性
         *
         * @return {HTMLElement}
         * @protected
         * @override
         */
        CommandMenu.prototype.createMain = function () {
            return lib.dom.createElement('<button type="button"></button>');
        },

        /**
         * 销毁控件
         *
         * @override
         */
        CommandMenu.prototype.dispose = function () {
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }

            if (this.layer) {
                this.layer.dispose();
                this.layer = null;
            }

            Control.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(CommandMenu, Control);
        require('./main').register(CommandMenu);
        return CommandMenu;
    }
);
