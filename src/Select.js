/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 下拉框控件
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var InputControl = require('./InputControl');
        var Layer = require('./Layer');

        /**
         * 根据下拉弹层的`click`事件设置值
         *
         * @param {Event} e 触发事件的事件对象
         */
        function selectValue(e) {
            var target = lib.event.getTarget(e);
            var layer = this.layer.getElement();
            while (target && target !== layer
                && !lib.hasAttribute(target, 'data-index')
            ) {
                target = target.parentNode;
            }
            if (target && !this.helper.isPart(target, 'item-disabled')) {
                var index = target.getAttribute('data-index');
                this.set('selectedIndex', +index);
                this.layer.hide();
            }
        }

        function SelectLayer() {
            Layer.apply(this, arguments);
        }

        lib.inherits(SelectLayer, Layer);

        SelectLayer.prototype.nodeName = 'ol';

        SelectLayer.prototype.render = function (element) {
            var html = '';

            for (var i = 0; i < this.control.datasource.length; i++) {
                var item = this.control.datasource[i];
                var classes = this.control.helper.getPartClasses('item');
                if (item.disabled) {
                    classes.push.apply(
                        classes,
                        this.control.helper.getPartClasses('item-disabled')
                    );
                }
                html += '<li data-index="' + i + '" '
                    + 'class="' + classes.join(' ') + '">';
                html += this.control.getItemHTML(item);
                html += '</li>';
            }

            element.innerHTML = html;
        };

        SelectLayer.prototype.initBehavior = function (element) {
            this.control.helper.addDOMEvent(element, 'click', selectValue);
        };

        SelectLayer.prototype.syncState = function (element) {
            var classes = this.control.helper.getPartClasses('item-selected');

            var items = lib.getChildren(element);
            for (var i = items.length - 1; i >= 0; i--) {
                var item = items[i];
                if (i === this.control.selectedIndex) {
                    lib.addClasses(item, classes);
                }
                else {
                    lib.removeClasses(item, classes);
                }
            }
        };

        SelectLayer.prototype.position = function () {
            var element = this.getElement();

            // 获取的浮层一定是隐藏的，必须此时获得页面尺寸，
            // 一但让浮层显示出来，就可能导致滚动条出现，无法获得正确的尺寸了
            var pageWidth = lib.page.getViewWidth();
            var pageHeight = lib.page.getViewHeight();
            // 先计算需要的尺寸，浮层必须显示出来才能真正计算里面的内容
            element.style.display = 'block';
            element.style.top = '-5000px';
            element.style.left = '-5000px';
            // IE7下，如果浮层隐藏着反而会影响offset的获取，
            // 但浮层显示出来又可能造成滚动条出现，
            // 因此显示浮层显示后移到屏幕外面，然后计算坐标
            var offset = lib.getOffset(this.control.main);
            element.style.width = '';
            element.style.height = '';
            var layerWidth = element.offsetWidth;
            var layerHeight = element.offsetHeight;
            element.style.display = '';
            element.style.minWidth = offset.width + 'px';
            // 然后看下靠左放能不能放下，不能就靠右
            if (pageWidth - offset.left > layerWidth) {
                element.style.left = offset.left + 'px';
            }
            else {
                element.style.left = (offset.right - layerWidth) + 'px';
            }

            // 再看看放下面能不能放下，不能就放上面去
            if (pageHeight - offset.bottom > layerHeight) {
                element.style.top = offset.bottom + 'px';
            }
            else {
                element.style.top = (offset.top - layerHeight) + 'px';
            }
        };
        
        /**
         * 下拉选择控件
         *
         * @param {Object=} options 构造控件的选项
         * @constructor
         * @extends InputControl
         */
        function Select(options) {
            InputControl.apply(this, arguments);
            this.layer = new SelectLayer(this);
        }

        Select.prototype.type = 'Select';

        /**
         * 创建主元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement} 主元素
         * @protected
         * @override
         */
        Select.prototype.createMain = function (options) {
            return document.createElement('div');
        };

        /**
         * 根据`selectedIndex` < `value` < `rawValue`的顺序调整三个参数的值
         *
         * @param {Object} context 有可能包含以上3个参数的参数对象
         */
        function adjustValueProperties(context) {
            // 因为`value`可能多个项是相同的，所以必须一切以`selectedIndex`为准

            // 如果3个值都没有，就搞出默认值来
            if (context.selectedIndex == null
                && context.rawValue == null
                && context.value == null
            ) {
                context.selectedIndex = -1;
            }

            // 按`rawValue` > `value` > `selectedIndex`的顺序处理一下
            if (context.rawValue != null) {
                context.value = null;
                context.selectedIndex = null;
            }
            else if (context.value != null) {
                context.selectedIndex = null;
            }

            // 如果没给`selectedIndex`，那么就用`value`或`rawValue`来找第一个对上的
            if (context.selectedIndex == null
                && (context.value != null || context.rawValue != null)
            ) {
                // 以`rawValue`为优先
                context.selectedIndex = -1;
                var value = context.rawValue || context.value;
                for (var i = 0; i < context.datasource.length; i++) {
                    if (context.datasource[i].value == value) {
                        context.selectedIndex = i;
                        break;
                    }
                }
                delete context.value;
                delete context.rawValue;
            }

            // 有可能更换过`datasource`，或者给了一个不存在的`value`，
            // 则会导致`selectedIndex`无法同步，
            // 因此如果`selectedIndex`在数组范围外，要根据`emptyText`来决定修正
            if (context.selectedIndex < 0 
                || context.selectedIndex >= context.datasource.length
            ) {
                if (context.emptyText) {
                    context.selectedIndex = -1;
                }
                else {
                    // 找最近的一个未禁用的项
                    context.selectedIndex = -1;
                    for (var i = 0; i < context.datasource.length; i++) {
                        if (!context.datasource[i].disabled) {
                            context.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
        }

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @protected
         * @override
         */
        Select.prototype.initOptions = function (options) {
            var defaults = {
                datasource: []
            };

            var properties = {};
            u.extend(properties, defaults, options);

            // 如果主元素是个`<select>`元素，则需要从元素中抽取数据源，
            // 这种情况下构造函数中传入的`datasource`无效
            if (this.main.nodeName.toLowerCase() === 'select') {
                properties.datasource = [];
                var elements = this.main.getElementsByTagName('option');
                for (var i = 0, length = elements.length; i < length; i++) {
                    var item = elements[i];
                    var dataItem = {
                        name: item.name || item.text, 
                        value: item.value
                    };
                    if (item.disabled) {
                        dataItem.disabled = true;
                    }

                    properties.datasource.push(dataItem);

                    // 已经选择的那个会作为值，
                    // 但如果构造函数中有传入和值相关的选项，则跳过这段逻辑
                    if (item.selected
                        && properties.selectedIndex == null
                        && properties.value == null
                        && properties.rawValue == null
                    ) {
                        // 无值的话肯定是在最前面
                        properties.selectedIndex = item.value ? i : 0;
                    }
                }
            }

            this.setProperties(properties);
        };

        /**
         * 每个节点显示的内容的模板
         *
         * @type {string}
         */
        Select.prototype.itemTemplate = '<span>${text}</span>';

        /**
         * 获取每个节点显示的内容
         *
         * @param {Object} item 节点数据
         * @return {string} 节点的HTML
         */
        Select.prototype.getItemHTML = function (item) {
            var data = {
                text: u.escape(item.name || item.text),
                value: u.escape(item.value)
            };
            return lib.format(this.itemTemplate, data);
        };

        /**
         * 显示选中值的模板
         *
         * @type {string}
         */
        Select.prototype.displayTemplate = '${text}';

        /**
         * 获取选中值的内容
         *
         * @param {Object | null} item 选中节点的数据，如果有`emptyText`且未选节点，
         * 则传递`null`
         * @return {string} 显示的HTML
         */
        Select.prototype.getDisplayHTML = function (item) {
            if (!item) {
                return u.escape(this.emptyText || '');
            }

            var data = {
                text: u.escape(item.name || item.text),
                value: u.escape(item.value)
            };
            return lib.format(this.displayTemplate, data);
        };

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        Select.prototype.initStructure = function () {
            // 如果主元素是`<select>`，删之替换成`<div>`
            if (this.main.nodeName.toLowerCase() === 'select') {
                this.helper.replaceMain();
            }

            this.main.tabIndex = 0;
            
            this.main.innerHTML = this.helper.getPartHTML('text', 'span');

            this.helper.addDOMEvent(
                this.main, 
                'click', 
                u.bind(this.layer.toggle, this.layer)
            );
        };

        /**
         * 根据控件的值更新其视图
         *
         * @param {Select} select Select控件实例
         */
        function updateValue(select) {
            // 同步显示的文字
            var textHolder = select.helper.getPart('text');
            var selectedItem = select.selectedIndex === -1
                ? null
                : select.datasource[select.selectedIndex];
            textHolder.innerHTML = select.getDisplayHTML(selectedItem);

            var layerElement = select.layer.getElement(false);
            if (layerElement) {
                select.layer.syncState(layerElement);
            }
        }

        /**
         * 获取原始值
         *
         * @return {Mixed}
         * @override
         */
        Select.prototype.getRawValue = function () {
            if (this.selectedIndex < 0) {
                return null;
            }
            
            var item = this.datasource[this.selectedIndex];

            return item ? item.value : null;
        };

        var paint = require('./painters');

        /**
         * 重绘
         *
         * @protected
         * @override
         */
        Select.prototype.repaint = paint.createRepaint(
            InputControl.prototype.repaint,
            paint.style('width'),
            paint.style('height'),
            {
                name: 'datasource',
                paint: function (select) {
                    select.layer.repaint();
                }
            },
            {
                name: ['selectedIndex', 'emptyText', 'datasource'],
                paint: updateValue
            },
            {
                name: ['disabled', 'hidden', 'readOnly'],
                paint: function (select, disabled, hidden, readOnly) {
                    if (disabled || hidden || readOnly) {
                        select.layer.hide();
                    }
                }
            }
        );

        /**
         * 更新`datasource`属性，无论传递的值是否变化都会进行更新
         *
         * @param {Object[]} datasource 新的数据源对象
         */
        Select.prototype.updateDatasource = function (datasource) {
            if (!datasource) {
                datasource = this.datasource;
            }
            this.datasource = datasource;
            var record = { name: 'datasource' };
            this.repaint([record], { datasource: record });
        };

        /**
         * 批量更新属性并重绘
         *
         * @param {Object} 需更新的属性
         * @override
         */
        Select.prototype.setProperties = function (properties) {
            // 为了`adjustValueProperties`正常工作，需要加上一点东西，
            // 由于在`setProperties`有相等判断，所以额外加相同的东西不影响逻辑
            if (properties.datasource == null) {
                properties.datasource = this.datasource;
            }
            if (properties.value == null
                && properties.rawValue == null
                && properties.selectedIndex == null
                && properties.datasource === this.datasource
            ) {
                properties.selectedIndex = this.selectedIndex;
            }
            if (!properties.hasOwnProperty('emptyText')) {
                properties.emptyText = this.emptyText;
            }

            adjustValueProperties(properties);
            var changes = 
                InputControl.prototype.setProperties.apply(this, arguments);

            if (changes.hasOwnProperty('selectedIndex')) {
                this.fire('change');
            }

            return changes;
        };

        /**
         * 销毁控件
         *
         * @public
         */
        Select.prototype.dispose = function () {
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }
            
            if (this.layer) {
                this.layer.dispose();
                this.layer = null;
            }

            InputControl.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(Select, InputControl);
        require('./main').register(Select);
        return Select;
    }
);
