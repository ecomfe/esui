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
        var $ = require('jquery');
        var lib = require('./lib');
        var Control = require('./Control');
        var Layer = require('./Layer');
        var main = require('./main');
        var eoo = require('eoo');
        var painters = require('./painters');

        var CommandMenuLayer = eoo.create(
            Layer,
            {
                nodeName: 'ul',

                dock: {
                    strictWidth: true
                },

                create: function () {
                    var ele = this.$super(arguments);
                    var $ele = $(ele);
                    var ctrl = this.control;

                    $ele.addClass(ctrl.helper.getPrefixClass('dropdown'));
                    $(ctrl.main).after($ele);
                    return ele;
                },

                render: function (element) {
                    var html = '';
                    var ctrl = this.control;
                    var helper = ctrl.helper;

                    for (var i = 0; i < ctrl.datasource.length; i++) {
                        var classes = [helper.getPartClassName('node')];
                        if (i === ctrl.activeIndex) {
                            classes.push(
                                helper.getPartClassName('node-active')
                            );
                        }
                        // 为disabled的menu条目加上样式
                        if (ctrl.datasource[i].disabled) {
                            classes.push(
                                helper.getPartClassName('node-disabled')
                            );
                        }

                        html += '<li data-index="' + i + '"'
                            + ' class="' + classes.join(' ') + '">';
                        html += ctrl.getItemHTML(ctrl.datasource[i]);
                        html += '</li>';
                    }

                    element.innerHTML = html;
                },

                /**
                 * 放置层
                 * @override
                 */
                position: function () {
                    var layer = this.getElement();
                    var alignToElement = this.control.alignToElement;
                    if (u.isString(alignToElement)) {
                        alignToElement = $('#' + alignToElement)[0];
                    }
                    Layer.attachTo(layer, alignToElement || this.control.main, this.dock);
                },

                /**
                 * 初始化层的交互行为
                 *
                 * @param {HTMLElement} element 层元素
                 * @override
                 */
                initBehavior: function (element) {
                    var helper = this.control.helper;

                    helper.addDOMEvent(
                        element,
                        'click',
                        '.' + helper.getPrimaryClassName('node'),
                        selectItem
                    );
                }
            }
        );

        /**
         * 选中某一项
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function selectItem(e) {
            var target = e.currentTarget;

            var index = +target.getAttribute('data-index');
            var item = this.datasource[index];

            if (item.disabled) {
                return;
            }
            if (typeof item.handler === 'function') {
                item.handler.call(this, item, index);
            }
            this.layer.hide();

            /**
             * @event select
             *
             * 选中菜单中的一项时触发
             *
             * @param {meta.CommandMenuItem} item 选中的项
             * @param {number} index 选中项在{@CommandMenu#datasource}中的的索引
             * @member CommandMenu
             */
            this.fire('select', {item: item, index: index});
        }

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
        var CommandMenu = eoo.create(Control, {
            constructor: function () {
                this.$super(arguments);
                this.layer = new CommandMenuLayer(this);
            },

            /**
             * 控件类型，始终为`"CommandMenu"`
             *
             * @type {string}
             * @readonly
             * @override
             */
            type: 'CommandMenu',

            /**
             * 浮层中每一项的HTML模板
             *
             * 在模板中可以使用以下占位符：
             *
             * - `{string} text`：文本内容，经过HTML转义
             *
             * @type {string}
             */
            itemTemplate: '<span>${text}</span>',

            /**
             * 下拉菜单对齐元素，提供DOM元素ID或者DOMElement
             *
             * @type {string|DOMElement}
             * @readonly
             * @override
             */
            alignToElement: null,

            /**
             * 获取浮层中每一项的HTML
             *
             * @param {meta.CommandMenuItem} item 当前项的数据项
             * @return {string} 返回HTML片段
             */
            getItemHTML: function (item) {
                var data = {
                    text: u.escape(item.text)
                };
                return lib.format(this.itemTemplate, data);
            },

            initStructure: function () {
                var mainElement = this.main;
                if (!this.displayHTML) {
                    this.displayHTML = mainElement.innerHTML;
                }
                this.layer.autoCloseExcludeElements = [mainElement];
                $(mainElement).addClass(this.helper.getPrefixClass('button'));
            },

            /**
             * 初始化事件交互
             *
             * @protected
             * @override
             */
            initEvents: function () {
                this.helper.addDOMEvent(this.main, 'click', u.bind(this.layer.toggle, this.layer));
            },

            /**
             * 重新渲染
             *
             * @method
             * @protected
             * @override
             */
            repaint: painters.createRepaint(
                Control.prototype.repaint,
                /**
                 * @property {number} width
                 *
                 * 宽度
                 */
                painters.style('width'),
                /**
                 * @property {number} height
                 *
                 * 高度，指浮层未展开时的可点击元素的高度， **与浮层高度无关**
                 */
                painters.style('height'),
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
                painters.text('displayText'),
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
            ),

            /**
             * 销毁控件
             *
             * @override
             */
            dispose: function () {
                if (this.helper.isInStage('DISPOSED')) {
                    return;
                }

                this.layer.autoCloseExcludeElements = [];
                if (this.layer) {
                    this.layer.dispose();
                    this.layer = null;
                }

                this.$super(arguments);
            }
        });

        main.register(CommandMenu);
        return CommandMenu;
    }
);
