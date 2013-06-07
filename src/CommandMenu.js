/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 命令菜单控件
 * @author otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        function CommandMenu() {
            Control.apply(this, arguments);
        }

        CommandMenu.prototype.type = 'CommandMenu';

        /**
         * 浮层中每一项的HTML模板
         *
         * @type {string}
         * @public
         */
        CommandMenu.prototype.itemTemplate = '<span>${text}</span>';

        /**
         * 获取浮层中每一项的HTML
         *
         * @param {Object} item 当前项的数据项
         * @return {string}
         * @public
         */
        CommandMenu.prototype.getItemHTML = function (item) {
            var data = {
                text: lib.encodeHTML(item.text)
            };
            return lib.format(this.itemTemplate, data);
        };

        /**
         * 获取浮层的HTML
         *
         * @param {Menu} menu 控件实例
         * @inner
         */
        function getLayerHTML(menu) {
            var html = '';
            for (var i = 0; i < menu.datasource.length; i++) {
                var classes = helper.getPartClasses(menu, 'node');
                if (i === menu.activeIndex) {
                    classes = classes.concat(
                        helper.getPartClasses(menu, 'node-active'));
                }
                html += '<li data-index="' + i + '"'
                    + ' class="' + classes.join(' ') + '">';
                html += menu.getItemHTML(menu.datasource[i]);
            }
            return html;
        }

        /**
         * 选中某一项
         *
         * @param {Menu} menu 控件实例
         * @parma {Event} e DOM事件对象
         * @inner
         */
        function selectItem(menu, e) {
            hideLayer(menu);

            var target = e.target;
            while (target !== e.currentTarget
                && !lib.hasAttribute(target, 'data-index')
            ) {
                target = target.parentNode;
            }

            if (target === e.currentTarget) {
                return;
            }

            var index = +target.getAttribute('data-index');
            var item = menu.datasource[index];
            if (item) {
                if (typeof item.handler === 'function') {
                    item.handler.call(menu, item, index);
                }
            }

            menu.fire('select', { item: item, index: index });
        }

        /**
         * 隐藏下拉弹层
         *
         * @param {CommandMenu} CommandMenu控件实例
         * @inner
         */
        function hideLayer(menu) {
            var layer = lib.g(helper.getId(menu, 'layer'));
            if (layer) {
                var classes = helper.getPartClasses(menu, 'layer-hidden');
                lib.addClasses(layer, classes);
                menu.removeState('active');
            }
        }

        /**
         * 关闭下拉弹层
         *
         * @param {Event} 触发事件的事件对象
         * @inner
         */
        function closeLayer(e) {
            var target = e.target;
            var layer = lib.g(helper.getId(this, 'layer'));
            var main = this.main;

            if (!layer) {
                return;
            }

            while (target && (target !== layer && target !== main)) {
                target = target.parentNode;
            }

            if (target !== layer && target !== main) {
                hideLayer(this);
            }
        }

        /**
         * 创建浮层
         *
         * @param {Menu} menu 控件实例
         * @inner
         */
        function createLayer(menu) {
            var layer = document.createElement('ul');
            layer.id = helper.getId(menu, 'layer');
            layer.className = helper.getPartClasses(menu, 'layer').join(' ');
            layer.innerHTML = getLayerHTML(menu);
            helper.addDOMEvent(
                menu,
                layer,
                'click',
                lib.curry(selectItem, menu)
            );
            document.body.appendChild(layer);

            helper.addDOMEvent(menu, document, 'mousedown', closeLayer);
            helper.addDOMEvent(
                menu, 
                layer,
                'mousedown',
                function (e) { e.stopPropagation(); }
            );
        }

        /**
         * 显示下拉弹层
         *
         * @param {CommandMenu} CommandMenu控件实例
         * @inner
         */
        function showLayer(menu) {
            var layer = lib.g(helper.getId(menu, 'layer'));
            var classes = helper.getPartClasses(menu, 'layer-hidden');
            helper.layer.attachTo(
                layer, 
                menu.main, 
                { top: 'bottom', left: 'left', right: 'right' }
            );
            lib.removeClasses(layer, classes);
            menu.addState('active');
        }

        /**
         * 根据当前状态显示或隐藏浮层
         *
         * @param {CommandMenu} CommandMenu控件实例
         * @inner
         */
        function toggleLayer(menu) {
            var layer = lib.g(helper.getId(menu, 'layer'));
            if (!layer) {
                createLayer(menu);
                showLayer(menu);
            }
            else {
                var classes = helper.getPartClasses(menu, 'layer-hidden');
                if (lib.hasClass(layer, classes[0])) {
                    showLayer(menu);
                }
                else {
                    hideLayer(menu);
                }
            }
        }

        /**
         * 初始化DOM结构
         *
         * @override
         * @protected
         */
        CommandMenu.prototype.initStructure = function () {
            helper.addDOMEvent(
                this,
                this.main,
                'click',
                lib.curry(toggleLayer, this)
            );
        };

        var paint = require('./painters');

        /**
         * 重绘
         *
         * @override
         * @public
         */
        CommandMenu.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            paint.style('width'),
            paint.style('height'),
            paint.html('datasource', 'layer', getLayerHTML),
            paint.text('displayText'),
            {
                name: ['disabled', 'hidden', 'readOnly'],
                paint: function (menu, disabled, hidden, readOnly) {
                    if (disabled || hidden || readOnly) {
                        hideLayer(menu);
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
        CommandMenu.prototype.dispose = function () {
            if (helper.isInStage(this, 'DISPOSED')) {
                return;
            }
                
            var layer = lib.g(helper.getId(this, 'layer'));
            if (layer) {
                layer.parentNode.removeChild(layer);
            }

            Control.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(CommandMenu, Control);
        require('./main').register(CommandMenu);
        return CommandMenu;
    }
);