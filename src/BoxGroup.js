/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 选择框组
 * @author otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');

        /**
         * 单选或复选框组
         */
        function BoxGroup() {
            InputControl.apply(this, arguments);
        }

        BoxGroup.prototype.type = 'BoxGroup';

        /*
         * 从已有的DOM中分析出数据源
         *
         * @param {HTMLElement} element 供分析的DOM元素
         * @param {Object} options 输入的配置项
         * @param {string|undefined} options.name 输入控件的名称
         * @param {string} options.boxType 选项框的类型，参考`unknownTypes`
         * @inner
         */
        function extractDatasourceFromDOM(element, options) {
            // 提取符合以下条件的子`<input>`控件：
            // 
            // - `type`属性已知（基本就是`radio`和`checkbox`）
            // - 二选一：
            //     - 当前控件和`<input>`控件都没有`name`属性
            //     - `<input>`和当前控件的`name`属性相同
            // 
            // 根据以下优先级获得`title`属性：
            // 
            // 1. 有一个`for`属性等于`<input>`的`id`属性的`<label>`元素，则取其文字
            // 2. 取`<input>`的`title`属性
            // 3. 取`<input>`的`value`
            var boxes = element.getElementsByTagName('input');
            var labels = element.getElementsByTagName('label');

            // 先建个索引方便取值
            var labelIndex = {};
            for (var i = labels.length - 1; i >= 0; i--) {
                var label = labels[i];
                var forAttribute = lib.getAttribute(label, 'for');
                if (forAttribute) {
                    labelIndex[forAttribute] = label;
                }
            }

            var datasource = [];
            var values = [];
            for (var i = 0, length = boxes.length; i < length; i++) {
                var box = boxes[i];
                if (box.type === options.boxType
                    && (options.name || '') === box.name // DOM的`name`是字符串
                ) {
                    // 提取`value`和`title`
                    var item = { value: box.value };
                    var label = box.id && labelIndex[box.id];
                    item.title = label ? lib.getText(label) : '';
                    if (!item.title) {
                        item.title = 
                            box.title || (box.value === 'on' ? box.value : '');
                    }
                    datasource.push(item);

                    if (box.checked) {
                        values.push(box.value);
                    }
                }
            }

            options.datasource = datasource;
            if (!options.rawValue && !options.value) {
                options.rawValue = values;
            }
        }

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @override
         * @protected
         */
        BoxGroup.prototype.initOptions = function (options) {
            var properties = {
                datasource: [],
                orientation: 'horizontal',
                boxType: 'radio'
            };
            lib.extend(properties, options);

            if (!properties.datasource.length) {
                extractDatasourceFromDOM(this.main, properties);
            }
            if (!properties.rawValue && !properties.value) {
                properties.rawValue = [];
            }

            this.setProperties(properties);
        };

        /**
         * 同步值
         *
         * @param {BoxGroup} this 控件实例
         * @inner
         */
        function syncValue() {
            var result = [];
            var inputs = this.main.getElementsByTagName('input');
            for (var i = inputs.length - 1; i >= 0; i--) {
                var input = inputs[i];
                if (input.type === this.boxType && input.checked) {
                    result.push(input.value);
                }
            }

            this.rawValue = result;
            var input = lib.g(helper.getId(this, 'value'));
            input.value = this.getValue();

            this.fire('change');
        }

        var itemTemplate = [
            '<label title="${title}" class="${wrapperClass}">',
                '<input type="${type}" name="${name}" id="${id}"'
                    + ' title="${title}" value="${value}"${checked} />',
                '<span>${title}</span>',
            '</label>'
        ];
        itemTemplate = itemTemplate.join('');

        /**
         * 渲染控件
         *
         * @param {BoxGroup} group 控件实例
         * @param {Array.<Object>} 数据源对象
         * @param {string} boxType 选择框的类型
         * @inner
         */
        function render(group, datasource, boxType) {
            // `BoxGroup`只会加`change`事件，所以全清就行
            helper.clearDOMEvents(group);

            // 一个隐藏的`<input>`元素
            var html = '<input type="hidden" '
                + 'id="' + helper.getId(group, 'value') + '"';
            if (group.name) {
                html += ' name="' + group.name + '"';
            }
            html += ' />';

            var classes = [].concat(
                helper.getPartClasses(group, boxType),
                helper.getPartClasses(group, 'wrapper')
            );

            var valueIndex = {};
            for (var i = 0; i < group.rawValue.length; i++) {
                valueIndex[group.rawValue[i]] = true;
            }

            // 分组的选择框必须有相同的`name`属性，所以哪怕没有也给造一个
            var name = group.name || helper.getGUID();
            for (var i = 0; i < datasource.length; i++) {
                var item = datasource[i];
                var data = {
                    wrapperClass: classes.join(' '),
                    id: helper.getId(group, 'box-' + i),
                    type: group.boxType,
                    name: name,
                    title: lib.trim(item.title || item.name || item.text),
                    value: item.value,
                    checked: valueIndex[item.value] ? ' checked="checked"' : ''
                };
                html += lib.format(itemTemplate, data);
            }

            group.main.innerHTML = html;

            // `change`事件不会冒泡的，所以在这里要给一个一个加上
            var inputs = group.main.getElementsByTagName('input');
            var eventName = group.main.addEventListener ? 'change' : 'click';
            for (var i = inputs.length - 1; i >= 0; i--) {
                var input = inputs[i];
                if (input.type === group.boxType) {
                    helper.addDOMEvent(group, input, eventName, syncValue);
                }
            }
        }

        /**
         * 批量更新属性并重绘
         *
         * @param {Object} 需更新的属性
         * @override
         * @public
         */
        BoxGroup.prototype.setProperties = function (properties) {
            // 修改了`datasource`或`boxType`，且没给新的`rawValue`或`value`的时候，
            // 要把`rawValue`清空。由于上层`setProperties`是全等判断，
            // 如果当前`rawValue`正好也是空的，就不要改值了，以免引起`change`事件
            if ((properties.datasource || properties.boxType)
                && (!properties.rawValue && !properties.value)
                && (!this.rawValue || !this.rawValue.length)
            ) {
                properties.rawValue = [];
            }

            var changes = 
                InputControl.prototype.setProperties.apply(this, arguments);
            if (changes.hasOwnProperty('rawValue')) {
                this.fire('change');
            }
        };

        /**
         * 重渲染
         *
         * @override
         * @protected
         */
        BoxGroup.prototype.repaint = helper.createRepaint(
            InputControl.prototype.repaint,
            {
                name: ['datasource', 'boxType'],
                paint: render
            },
            {
                name: ['disabled', 'readOnly'],
                paint: function (group, disabled, readOnly) {
                    var inputs = group.main.getElementsByTagName('input');
                    for (var i = inputs.length - 1; i >= 0; i--) {
                        var input = inputs[i];
                        input.disabled = disabled;
                        input.readOnly = readOnly;
                    }
                }
            },
            {
                name: 'rawValue',
                paint: function (group, rawValue) {
                    rawValue = rawValue || [];
                    // 因为`datasource`更换的时候会把`rawValue`清掉，这里再弄回去
                    group.rawValue = rawValue;
                    var map = {};
                    for (var i = 0; i < rawValue.length; i++) {
                        map[rawValue[i]] = true;
                    }

                    var inputs = group.main.getElementsByTagName('input');
                    for (var i = inputs.length - 1; i >= 0; i--) {
                        var input = inputs[i];
                        if (input.type === group.boxType) {
                            input.checked = map.hasOwnProperty(input.value);
                        }
                    }

                    // 有可能`rawValue`给多了，所以要重新获取一次以同步
                    var input = lib.g(helper.getId(group, 'value'));
                    input.value = group.getValue();
                }
            },
            {
                name: 'orientation',
                paint: function (group, orientation) {
                    group.removeState('vertical');
                    group.removeState('horizontal');
                    group.addState(orientation);
                }
            }
        );

        /**
         * 将string类型的value转换成原始格式
         * 
         * @param {string} value 字符串值
         * @return {Array.<string>}
         * @override
         * @protected
         */
        BoxGroup.prototype.parseValue = function (value) {
            return value.split(',');
        };

        lib.inherits(BoxGroup, InputControl);
        require('./main').register(BoxGroup);
        return BoxGroup;
    }
);