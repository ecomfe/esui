define(
    function (require) {
        var InputControl = require('./InputControl');

        /**
         * 下拉选择控件
         *
         * @param {Object=} options 构造控件的选项
         * @constructor
         */
        function Select(options) {
            InputControl.apply(this, arguments);
        }

        Select.prototype.type = 'Select';

        /**
         * 创建主元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement} 主元素
         * @protected
         */
        Select.prototype.createMain = function (options) {
            return document.createElement('div');
        };

        /**
         * 根据`selectedIndex` < `value` < `rawValue`的顺序调整三个参数的值
         *
         * @param {Object} context 有可能包含以上3个参数的参数对象
         * @inner
         */
        function adjustValueProperties(context) {
            // 如果给了`selectedIndex`，且没有`value`和`rawValue`来覆盖，
            // 则以`selectedIndex`为准设定`rawValue`
            if (context.selectedIndex != null
                && context.value == null
                && context.rawValue == null
            ) {
                context.rawValue = 
                    context.datasource[context.selectedIndex].value;
                return;
            }

            // 如果给了`value`，则需要从其产生`rawValue`的值：
            // 
            // - 如果同时给了`rawValue`，以`rawValue`为准
            // - 否则使用`value`作为`rawValue`
            if (context.value != null) {
                if (context.rawValue == null) {
                    context.rawValue = context.value; 
                }
                delete context.value;
            }

            // 当以`value`或`rawValue`为基准时，要同步一次`selectedIndex`
            for (var i = 0; i < context.datasource.length; i++) {
                if (context.datasource[i].value === context.rawValue) {
                    context.selectedIndex = i;
                }
            }
        }

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @protected
         */
        Select.prototype.initOptions = function (options) {
            var defaults = {
                emptyText: '',
                datasource: []
            };

            var lib = require('./lib');
            var properties = {};
            lib.extend(properties, defaults, options);

            // 如果主元素是个`<select>`元素，则需要从元素中抽取数据源，
            // 这种情况下构造函数中传入的`datasource`无效
            if (properties.main
                && properties.main.nodeName.toLowerCase() === 'select'
            ) {
                properties.datasource = [];
                var elements = properties.main.getElementsByTagName('option');
                for (var i = 0, length = elements.length; i < length; i++) {
                    var item = elements[0];
                    var dataItem = { text: item.text, value: item.value };

                    // 没有值的那个`<option>`作为`emptyText`使用
                    if (!item.value) {
                        properties.emptyText = item.text;
                        // 且要放在最前面
                        properties.datasource.unshift(dataItem);
                    }
                    else {
                        properties.datasource.push(dataItem);
                    }

                    // 已经选择的那个会作为值，
                    // 但如果构造函数中有传入和值相关的选项，则跳过这段逻辑
                    if (item.selected
                        && properties.selectedIndex == null
                        && properties.value == null
                        && properties.rawValue == null
                    ) {
                        properties.rawValue = item.value;
                        // 无值的话肯定是在最前面
                        properties.selectedIndex = item.value ? i : 0;
                    }
                }
            }

            adjustValueProperties(properties);

            lib.extend(this, properties);
        };

        /**
         * 获取下拉弹层的HTML
         *
         * @param {Select} select Select控件实例
         * @inner
         */
        function getLayerHTML(select) {
            // 拼接HTML需要缩进，去掉`white`配置
            /* jshint white: false */
            var itemTemplate = [
                '<li data-value="${value}">',
                    '<span>${text}</span>',
                '</li>'
            ];
            itemTemplate = itemTemplate.join('');
            var html = '';
            var lib = require('./lib');
            for (var i = 0; i < select.datasource.length; i++) {
                var item = select.datasource[i];
                if (item.value === select.value) {
                    select.selectedIndex = i;
                }
                var data = {
                    text: lib.encodeHTML(item.text),
                    value: lib.encodeHTML(item.value)
                };
                html += lib.format(itemTemplate, data);
            }
            return html;
        }

        /**
         * 关闭下拉弹层
         *
         * @param {Select} select Select控件实例
         * @param {Event} 触发事件的事件对象
         * @inner
         */
        function closeLayer(select, e) {
            var target = e.target;
            var layer = select.selectionLayer;
            var main = select.main;

            if (!layer) {
                return;
            }

            while (target && (target !== layer && target !== main)) {
                target = target.parentNode;
            }

            if (target !== layer && target !== main) {
                layer.style.display = 'none';
            }
        }

        /**
         * 根据下拉弹层的`click`事件设置值
         *
         * @param {Select} select Select控件实例
         * @param {Event} 触发事件的事件对象
         * @inner
         */
        function selectValue(select, e) {
            e = e || window.event;
            var target = e.target || e.srcElement;
            while (target && !target.hasAttribute('data-value')) {
                target = target.parentNode;
            }
            if (target) {
                var value = target.getAttribute('data-value');
                select.setValue(value);
            }
            select.selectionLayer.style.display = 'none';
        }


        /**
         * 打开下拉弹层
         *
         * @param {Select} select Select控件实例
         * @inner
         */
        function openLayer(select) {
            var layer = select.selectionLayer;
            var lib = require('./lib');
            if (!layer) {
                var layer = document.createElement('ol');
                layer.className = 'ui-select-layer';
                layer.innerHTML = getLayerHTML(select);
                document.body.appendChild(layer);
                select.selectionLayer = layer;

                var helper = require('./controlHelper');
                helper.addDOMEvent(
                    select, 
                    layer, 
                    'click', 
                    lib.bind(selectValue, null, select)
                );
                var close = lib.bind(closeLayer, null, select);
                lib.on(document, 'mousedown', close);
                select.on(
                    'afterdispose',
                    function () {
                        lib.un(document, 'mousedown', close);
                    }
                );
            }

            layer.style.display = 'block';
            // TODO: 修正位置和大小

            // 同步选择状态
            var items = layer.getElementsByTagName('span');
            for (var i = items.length - 1; i >= 0; i--) {
                var item = items[i];
                if (item.getAttribute('data-value') === select.rawValue) {
                    lib.addClass(item, 'selected');
                }
            }
        }

        /**
         * 根据下拉弹层当前状态打开或关闭之
         *
         * @param {Select} select Select控件实例
         * @param {Event} 触发事件的事件对象
         * @inner
         */
        function toggleLayer(select, e) {
            if (!select.selectionLayer) {
                openLayer(select);
            }
            else {
                var layer = select.selectionLayer;
                if (layer.style.display === 'none') {
                    openLayer(select);
                }
                else {
                    select.selectionLayer.style.display = 'none';
                }
            }
        }

        /**
         * 初始化DOM结构
         *
         * @protected
         */
        Select.prototype.initStructure = function () {
            var html = [
                '<span></span>',
                '<input type="hidden" name="${name}" />'
            ];
            var lib = require('./lib');
            this.main.innerHTML = lib.format(
                html.join('\n'),
                { name: this.name }
            );

            var helper = require('./controlHelper');
            helper.addDOMEvent(
                this, this.main, 'click', lib.bind(toggleLayer, null, this));
        };

        /**
         * 根据控件的值更新其视图
         *
         * @param {Select} select Select控件实例
         * @inner
         */
        function updateValue(select) {
            // 同步`value`
            var hidden = select.main.getElementsByTagName('input')[0];
            hidden.value = select.rawValue;

            // 同步显示的文字
            var displayText = select.rawValue == null
                ? select.emptyText
                : select.datasource[select.selectedIndex].text;
            var textHolder = select.main.getElementsByTagName('span')[0];
            textHolder.innerHTML = require('./lib').encodeHTML(displayText);
        }

        /**
         * 重绘
         *
         * @param {Array=} 更新过的属性集合
         * @protected
         */
        Select.prototype.repaint = function (changes) {
            if (!changes) {
                updateValue(this);
            }
            else {
                for (var i = 0; i < changes.length; i++) {
                    var record = changes[i];
                    // 如果`datasource`更新，则下拉框的内容要重绘
                    if (record.name === 'datasource' && this.selectionLayer) {
                        this.selectionLayer.innerHTML = getLayerHTML(this);
                    }
                }
                // 在`setProperties`有控制，不会`value`和`selectedIndex`，
                // 剩下的`rawValue`和`emptyText`都需要整体的重绘
                updateValue(this);
            }
        };

        /**
         * 批量更新属性并重绘
         *
         * @param {Object} 需更新的属性
         * @public
         */
        Select.prototype.setProperties = function (properties) {
            adjustValueProperties(properties);
            InputControl.prototype.setProperties.apply(this, arguments);
        };

        require('./lib').inherits(Select, InputControl);
        require('./main').register(Select);
        return Select;
    }
);