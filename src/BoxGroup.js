/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 选择框组
 * @author otakustay
 */

define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var InputControl = require('./InputControl');
        var $ = require('jquery');
        var painters = require('./painters');
        var esui = require('./main');
        var eoo = require('eoo');

        /**
         * 单选或复选框组控件
         *
         * @extends InputControl
         * @constructor
         */
        var BoxGroup = eoo.create(
            InputControl,
            {
                /**
                 * 控件类型，始终为`"BoxGroup"`
                 *
                 * @type {string}
                 * @readonly
                 * @override
                 */
                type: 'BoxGroup',

                /**
                 * 初始化参数
                 *
                 * @param {Object} [options] 构造函数传入的参数
                 * @protected
                 * @override
                 */
                initOptions: function (options) {
                    var properties = {
                        datasource: [],
                        orientation: 'horizontal',
                        boxType: 'radio',
                        /**
                         * @property {string} boxClass
                         *
                         * 附加在boxgroup-wrapper上的css selector 名称。
                         * 做自定义boxgroup的时候用到。加在这里主要是想复用checkbox现成的样式。
                         */
                        boxClass: '',
                        /**
                         * @property {boolean} backwardCompatible
                         *
                         * 向后兼容(为true时，boxType为radio时rawValue为数组，setProperties fire change事件)
                         */
                        backwardCompatible: false
                    };
                    u.extend(properties, options);
                    // 使用默认的样式
                    if (!properties.boxClass) {
                        properties.boxClass
                            = this.helper.getPrefixClass(properties.boxType + '-custom');
                    }

                    var datasource = properties.datasource;
                    if (!datasource.length) {
                        extractDatasourceFromDOM(this.main, properties);
                    }
                    if (!properties.hasOwnProperty('rawValue') && !properties.hasOwnProperty('value')) {
                        // 单选框组在没有指定`value`时默认选中第一项
                        if (properties.boxType === 'radio' && datasource.length) {
                            properties.rawValue = [datasource[0].value];
                        }
                        else {
                            properties.rawValue = [];
                        }
                    }

                    this.setProperties(properties);
                },

                /**
                 * 初始化事件
                 *
                 * @override
                 */
                initEvents: function () {
                    var me = this;
                    var wrapperClass = this.helper.getPartClasses('wrapper');
                    $(this.main).on('click', '> .' + wrapperClass + ' > input', function (e) {
                        syncValue.call(me);
                    });
                },

                /**
                 * 批量更新属性并重绘
                 *
                 * @param {Object} properties 需更新的属性
                 * @override
                 * @fires change
                 */
                setProperties: function (properties) {
                    // 修改了`datasource`或`boxType`，且没给新的`rawValue`或`value`的时候，
                    // 要把`rawValue`清空。由于上层`setProperties`是全等判断，
                    // 如果当前`rawValue`正好也是空的，就不要改值了，以免引起`change`事件
                    if ((properties.datasource || properties.boxType)
                        && (!properties.rawValue && !properties.value)
                        && (!this.rawValue || !this.rawValue.length)
                    ) {
                        properties.rawValue = [];
                    }

                    var changes = this.$super([properties]);
                    // 需要向后兼容时才fire事件
                    if (changes.hasOwnProperty('rawValue') && this.backwardCompatible) {
                        /**
                         * @event change
                         *
                         * 值变化时触发
                         */
                        this.fire('change');
                    }
                },

                /**
                 * 重渲染
                 *
                 * @method
                 * @protected
                 * @override
                 */
                repaint: painters.createRepaint(
                    InputControl.prototype.repaint,
                    {
                        /**
                         * @property {meta.BoxGroupItem[]} datasource
                         *
                         * 数据源
                         */
                        name: ['datasource'],
                        paint: render
                    },
                    {
                        /**
                         * @property {boolean} disabled
                         *
                         * 表示是否禁用当前所有checkbox。
                         */

                        /**
                         * @property {string} disabledItems
                         *
                         * 逗号分隔的要禁用的选项value。
                         */
                        name: ['disabled', 'readOnly', 'disabledItems'],
                        paint: function (group, disabled, readOnly, disabledItems) {
                            if (u.isBoolean(disabled) || u.isBoolean(readOnly)) {
                                u.each(
                                    group.getBoxElements(),
                                    function (box) {
                                        box.disabled = disabled || readOnly;
                                    }
                                );
                            }
                            else if (u.isString(disabledItems)) {
                                var ids = disabledItems.split(',');
                                u.each(
                                    group.getBoxElements(),
                                    function (box) {
                                        box.disabled = u.contains(ids, '' + box.value);
                                    }
                                );
                            }
                        }
                    },
                    {
                        /**
                         * @property {string[]} rawValue
                         *
                         * 原始值，无论是`radio`还是`checkbox`，均返回数组
                         *
                         * 当{@link BoxGroup#boxType}值为`radio`时，数组必然只有一项
                         *
                         * @override
                         */
                        name: 'rawValue',
                        paint: function (group, rawValue) {
                            if (group.boxType === 'radio' && rawValue && group.backwardCompatible) {
                                group.rawValue = rawValue;
                                rawValue = [rawValue];
                            }
                            else {
                                rawValue = rawValue || [];
                                group.rawValue = rawValue;
                            }
                            // 因为`datasource`更换的时候会把`rawValue`清掉，这里再弄回去
                            var map = {};
                            for (var i = 0; i < rawValue.length; i++) {
                                map[rawValue[i]] = true;
                            }

                            u.each(
                                group.getBoxElements(),
                                function (box) {
                                    box.checked = map.hasOwnProperty(box.value);
                                    syncCheckedState.call(group, box);
                                }
                            );
                        }
                    },
                    {
                        /**
                         * @property {string} [orientation="horizontal"]
                         *
                         * 选框的放置方向，可以为`vertical`表示纵向，或者`horizontal`表示横向
                         */
                        name: 'orientation',
                        paint: function (group, orientation) {
                            group.removeState('vertical');
                            group.removeState('horizontal');
                            group.addState(orientation);
                        }
                    }
                ),

                /**
                 * 将字符串类型的值转换成原始格式
                 *
                 * @param {string} value 字符串值
                 * @return {string[]}
                 * @protected
                 * @override
                 */
                parseValue: function (value) {
                    /**
                     * @property {string} [value=""]
                     *
                     * `BoxGroup`的字符串形式的值为逗号分隔的多个值
                     */
                    if (this.boxType === 'radio' && !this.backwardCompatible) {
                        return value;
                    }
                    if (value) {
                        return typeof value === 'string'
                            ? value.split(',')
                            : [value];
                    }
                    return [];
                },

                /**
                 * 获取内部的输入元素
                 *
                 * @return {HTMLElement[]}
                 * @protected
                 */
                getBoxElements: function () {
                    return this.main.getElementsByTagName('input');
                }
            }
        );

        /**
         * 从已有的DOM中分析出数据源
         *
         * @param {HTMLElement} element 供分析的DOM元素
         * @param {Object} options 输入的配置项
         * @param {string|undefined} options.name 输入控件的名称
         * @param {string} options.boxType 选项框的类型，参考`unknownTypes`
         * @ignore
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
            for (var j = 0, max = boxes.length; j < max; j++) {
                var box = boxes[j];
                if (box.type === options.boxType
                    && (options.name || '') === box.name // DOM的`name`是字符串
                ) {
                    // 提取`value`和`title`
                    var item = {value: box.value};
                    var label2 = box.id && labelIndex[box.id];
                    item.title = label2 ? $(label2).text() : '';
                    if (!item.title) {
                        item.title
                            = box.title || (box.value === 'on' ? box.value : '');
                    }
                    item.customClasses = box.className || '';
                    datasource.push(item);

                    // firefox下的autocomplete机制在reload页面时,
                    // 可能导致box.checked属性不符合预期,
                    // 所以这里采用getAttribute
                    // 参考：http://t.cn/zRTdrVR

                    // 之前这里用了 getAttribute，在 ie8下，未设置 checked，返回的是空字符串，会导致逻辑问题
                    // if (box.getAttribute('checked') !== null) {

                    if (lib.hasAttribute(box, 'checked')) {
                        values.push(box.value);
                    }
                }
            }

            options.datasource = datasource;
            if (!options.rawValue && !options.value) {
                options.rawValue = values;
            }
        }

        function syncCheckedState(element) {
            var $label = $(element.parentNode);
            var checkedClass
                = this.helper.getPartClassName('wrapper-checked')
                + ' '
                +esui.getConfig('stateClassPrefix') + '-active';
            if (element.checked) {
                $label.addClass(checkedClass);
            }
            else {
                $label.removeClass(checkedClass);
            }
        }

        /**
         * 同步值
         *
         * @ignore
         */
        function syncValue() {
            // 同步样式
            u.each(this.getBoxElements(), syncCheckedState, this);

            // 同步值
            var result = u.chain(this.getBoxElements())
                .where({checked: true})
                .pluck('value')
                .value();

            this.rawValue = result;
            this.fire('change');
        }

        var itemTemplate = [
            '<div title="${title}" class="${wrapperClass}">',
            '    <input type="${type}" name="${name}" id="${id}" title="${title}" value="${value}"${checked} />',
            '    <label for="${id}">${title}</label>',
            '</div>'
        ].join('');

        /**
         * 渲染控件
         *
         * @param {BoxGroup} group 控件实例
         * @param {Object[]} datasource 数据源对象
         * @ignore
         */
        function render(group, datasource) {
            var html = '';
            var boxType = group.boxType;

            var classes = [].concat(
                group.helper.getPartClasses(boxType),
                group.helper.getPartClasses('wrapper')
            );

            var boxClass = group.boxClass;
            if (boxClass) {
                classes.push(boxClass);
            }

            var valueIndex = lib.toDictionary(group.rawValue);

            // 分组的选择框必须有相同的`name`属性，所以哪怕没有也给造一个
            var name = group.name || lib.getGUID();
            for (var i = 0; i < datasource.length; i++) {
                var item = datasource[i];
                var wrapperClass = '';
                if (item.customClasses) {
                    wrapperClass += ' ' + item.customClasses;
                }
                if (valueIndex[item.value]) {
                    wrapperClass += ' ' + group.helper.getPartClassName('wrapper-checked');
                }
                var data = {
                    wrapperClass: classes.join(' ') + wrapperClass,
                    id: group.helper.getId('box-' + i),
                    type: group.boxType,
                    name: name,
                    title: lib.trim(item.title || item.name || item.text),
                    value: item.value,
                    checked: valueIndex[item.value] ? ' checked="checked"' : ''
                };
                html += lib.format(itemTemplate, data);
            }

            group.main.innerHTML = html;
        }

        esui.register(BoxGroup);
        return BoxGroup;
    }
);
