/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 地域选择
 * @author dbear
 */

define(
    function (require) {
        require('./Select');
        var $ = require('jquery');
        var lib = require('./lib');
        var InputControl = require('./InputControl');
        var esui = require('./main');
        var u = require('underscore');
        var eoo = require('eoo');
        var painters = require('./painters');

        /**
         * 地域控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        var Region = eoo.create(
            InputControl,
            {
                /**
                 * 控件类型
                 *
                 * @type {string}
                 */
                type: 'Region',

                /**
                 * 初始化参数
                 *
                 * @param {Object=} options 构造函数传入的参数
                 * @override
                 * @protected
                 */
                initOptions: function (options) {
                    /**
                     * 默认选项配置
                     */
                    var properties = {
                        regionData: [],
                        mode: 'multi',
                        pureSelect: false,
                        rawValue: []
                    };

                    if ($(this.main).is('input')) {
                        this.helper.extractOptionsFromInput(this.main, properties);
                    }

                    u.extend(properties, options);

                    if (options.value) {
                        properties.rawValue = properties.value.split(',');
                    }

                    if (properties.mode === 'multi') {
                        // 增加map型地域数据
                        initMultiData(this, properties);

                        this.cityCache = {};
                    }
                    else {
                        properties.rawValue = '';
                        // 增加单选型地域数据
                        initSingleData(this, properties);
                    }

                    this.setProperties(properties);
                },


                /**
                 * 初始化DOM结构
                 *
                 * @protected
                 */
                initStructure: function () {
                    if (lib.isInput(this.main)) {
                        this.helper.replaceMain();
                    }

                    if (this.mode === 'multi') {
                        createMultiRegion(this);
                    }
                    else {
                        createSingleRegion(this);
                        $(this.main).addClass(
                            this.helper.getPartClassName('single')
                        );
                    }
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                initEvents: function () {
                    var controlHelper = this.helper;

                    if (this.mode === 'multi') {
                        // 点击事件
                        controlHelper.addDOMEvent(this.main, 'click', 'input,label', mainClick);
                        // 鼠标悬浮事件
                        controlHelper.addDOMEvent(this.main, 'mouseover', u.partial(mainMouseHandler, 'show'));
                        // 鼠标悬浮事件
                        controlHelper.addDOMEvent(this.main, 'mouseout', u.partial(mainMouseHandler, 'hide'));
                    }
                    else {
                        var regionSel = this.getChild('regionSel');

                        regionSel.on('change', u.bind(changeSingleRegion, null, this, regionSel));
                    }
                },

                /**
                 * 重新渲染视图
                 * 仅当生命周期处于RENDER时，该方法才重新渲染
                 *
                 * @param {Array=} 变更过的属性的集合
                 * @override
                 */
                repaint: painters.createRepaint(
                    InputControl.prototype.repaint,
                    {
                        name: 'rawValue',
                        paint: function (region, value) {
                            if (region.mode === 'multi') {
                                selectMulti(region, value);
                            }
                            else {
                                var regionSel = region.getChild('regionSel');
                                regionSel.setProperties({
                                    value: value
                                });
                            }
                        }
                    },
                    {
                        name: ['disabled', 'readOnly'],
                        paint: function (region, disabled, readOnly) {
                            var editable = true;
                            /** disable的优先级高于readOnly */
                            if (disabled || readOnly) {
                                editable = false;
                            }

                            changeToDisabled(region, !editable);
                            // 只读状态下要开放input的读属性
                            if (!disabled && readOnly) {
                                var input
                                    = lib.g(region.helper.getId('param-value'));
                                input.disabled = false;
                            }
                        }

                    }
                ),

                /**
                 * 通过数组格式，设置选中的地域
                 *
                 * @param {Array} value 选取的地域.
                 */
                setRawValue: function (value) {
                    this.setProperties({rawValue: value});
                },

                /**
                 * 获取选中的地域，数组格式。
                 *
                 * @return {Array}
                 */
                getRawValue: function () {
                    if (this.mode === 'single') {
                        return this.getChild('regionSel').getValue();
                    }

                    if (this.pureSelect) {
                        // 伪造一个
                        var node = {
                            // 应该没人用这么奇葩的id吧。。。
                            id: '-100',
                            children: this.regionData
                        };
                        var ids = getPureSelected(this, node);
                        return ids;
                    }

                    return this.rawValue;
                },

                /**
                 * 将value从原始格式转换成string
                 *
                 * @param {*} rawValue 原始值
                 * @return {string}
                 */
                stringifyValue: function (rawValue) {
                    if (this.mode === 'multi') {
                        return rawValue.join(',');
                    }
                    return rawValue;
                },

                /**
                 * 将string类型的value转换成原始格式
                 *
                 * @param {string} value 字符串值
                 * @return {*}
                 */
                parseValue: function (value) {
                    return value.split(',');
                },

                /**
                 * 勾选指定地域
                 *
                 * @param {string} id 地域id
                 * @public
                 */
                checkRegion: function (id) {
                    var checkbox = getOptionDOM(this, id);
                    // 有就更新勾选状态
                    if (checkbox) {
                        checkbox.checked = true;
                        optionClick(this, checkbox);
                    }
                    // 没有就只修改值
                    else {
                        var item = this.regionDataIndex[id];
                        if (item) {
                            item.isSelected = true;

                            // 重复调一次，主要是为了更新“选中了几个城市”的显示信息
                            updateMulti(this);
                            updateParamValue(this);
                        }
                    }
                }
            }
        );

        /**
         * 创建多选地域
         *
         * @inner
         * @param {Region} region Region控件实例
         */
        function createMultiRegion(region) {
            var data = region.regionData;
            var len = data.length;
            var html = [];
            for (var i = 0; i < len; i++) {
                html.push(getLevelHtml(region, data[i], 1));
            }
            var tpl = '<input type="hidden" id="${inputId}" name="${name}" />';

            html.push(lib.format(
                tpl,
                {
                    inputId: region.helper.getId('param-value'),
                    name: region.name
                }
            ));

            region.main.innerHTML = html.join('');
        }

        /**
         * 深度遍历函数
         *
         * @inner
         * @param {Object} node 目标节点
         * @param {Function} handler 处理函数
         * @param {Object} context 执行环境
         */
        function walk(node, handler, context) {
            handler.call(context, node);
            u.each(node.children, function (child) {
                walk(child, handler, context);
            });
        }

        /**
         * 通过value批量选中地域（多选）
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Array} values 要选中的值数组
         */
        function selectMulti(region, values) {
            var regionDataIndex = region.regionDataIndex;
            // 先把已选节点的子节点的值也都选择上
            // TODO 使用者有可能把父节点和子节点都传进来，为了减少遍历，
            // 应该做下唯一性筛选
            var fullValues = [];
            u.each(values, function (value) {
                var node = regionDataIndex[value];
                if (node) {
                    walk(node, function (node) {
                        fullValues.push(node.id);
                    });
                }
            });

            // 把整理后全数据做标识
            var map = {};
            u.each(fullValues, function (value) {
                map[value] = 1;
            });

            // 根据标识勾选
            u.each(region.regionDataIndex, function (item, key) {
                var checked = map.hasOwnProperty(key);
                var checkbox = getOptionDOM(region, key);
                // 有就更新勾选状态
                if (checkbox) {
                    checkbox.checked = checked;
                }
                // 没有就只修改值
                else {
                    item.isSelected = checked;
                }
            });
            // 重复调一次，主要是为了更新“选中了几个城市”的显示信息
            updateMulti(region);
            updateParamValue(region);
        }

        /**
         * 获取多选选项的checkbox
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {string} id 选项标识.
         * @return {HTMLElement}
         */
        function getOptionDOM(region, id) {
            return lib.g(region.helper.getId('item-' + id));
        }

        /**
         * 更新多选地域的视图和选中值
         * 这个方法会由上至下的遍历节点，通过数据的选择状态更新视图的显示
         * 比如：
         * 1. 某节点处于选择状态时，它的子节点也会全被勾选；
         * 2. 某节点下的所有节点都被勾选，则该节点也被勾选；
         * 3. 某节点下的有节点没被勾选，则该节点去掉勾选；
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object=} data 数据源.
         * @param {number=} dontResetValue 是否重设选中的值.
         * @param {number=} level 更新到的层级.
         * @return {boolean} 是否选中了
         */
        function updateMulti(region, data, dontResetValue, level) {
            level = level || 0;
            data = data || {children: region.regionData};
            var indexData = region.regionDataIndex[data.id];
            // 虽然rawValue可能已经是最新的值了，这里暂时先清空，然后再填值
            // 为了兼容先勾选地域，再更新值的情况
            // 好丑。以后再改！
            if (!dontResetValue) {
                region.rawValue = [];
            }

            var isItemChecked;
            var selChildLength = 0;

            // 有id才有对应的勾选框
            var checkbox = data.id && getOptionDOM(region, data.id);

            var children = data.children;
            var len = children instanceof Array && children.length;
            if (len) {
                // 默认选择
                var isChecked = true;
                // 递归深度遍历，更新并获取子节点选择状态
                for (var i = 0; i < len; i++) {
                    isItemChecked = updateMulti(
                        region,
                        children[i],
                        1,
                        level + 1
                    );
                    if (isItemChecked) {
                        selChildLength++;
                    }
                    // 只要有一个子节点没有选中，父节点就不选中
                    isChecked = isChecked && isItemChecked;
                }
                // 更新节点勾选状态
                if (checkbox) {
                    checkbox.checked = isChecked;

                    // 再把选值塞回去，此时的原则是，
                    // 选了就塞，不管是否父节点已选
                    isChecked && region.rawValue.push(data.id);

                    // 通过手动点击勾选全部子节点，
                    // 造成父节点也选上的数据同步在这里进行
                    // 因为optionClick方法进行了向下的数据同步
                    indexData.isSelected = isChecked;
                }

                // 节点处在倒数第二层，需计算下其下选中的节点个数，并更新信息
                if (level === 3) {
                    if (!isChecked) {
                        updateSelectedTip(region, selChildLength, len, data.id);
                    }
                    else {
                        updateSelectedTip(region, 1, 1, data.id);
                    }
                }

                return isChecked;
            }
            // 到了最后一级弹出层节点
            if (checkbox) {
                if (checkbox.checked) {
                    region.rawValue.push(data.id);
                }

                indexData.isSelected = checkbox.checked;
                return checkbox.checked;
            }
            // 弹出层城市不一定创建，所以使用数据源判断选择状态
            else if (indexData.isSelected) {
                region.rawValue.push(data.id);
            }

            return indexData.isSelected;
        }

        /**
         * 获取hidden状态的class
         *
         * @return {string}
         */
        function getHiddenClassName() {
            return esui.getConfig('stateClassPrefix') + '-hidden';
        }

        /**
         * 更新城市选择状态，比如'2/30'
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object} selCityIdsLength 选中的选项个数.
         * @param {Object} cLength 全部选项个数
         * @param {string} id 对应的城市id
         */
        function updateSelectedTip(region, selCityIdsLength, cLength, id) {
            var $infoTag = $(lib.g(region.helper.getId('info-' + id)));
            if (selCityIdsLength !== 0 && selCityIdsLength !== cLength) {
                $infoTag.removeClass(getHiddenClassName());
                $infoTag.html(selCityIdsLength + '/' + cLength + '');
            }
            else {
                $infoTag.addClass(getHiddenClassName());
                $infoTag.html('');
            }
        }

        // 地区、省、城市、区选项
        var tplInputItem = [
            '<div class="${itemClasses}" id="${itemWrapperId}">',
            '<div class="${checkboxCustomClass}">',
            '<input type="checkbox" value="${itemValue}" id="${itemId}"',
            ' data-optionId="${itemValue}" data-level="${level}" />',
            '<label for="${itemId}" title="${text}">${text}</label>',
            '</div>',
            '</div>'].join('');

        // 国家、地区外包
        var tplBoxWrapper = [
            '<div class="${boxClass}">',
                tplInputItem,
                '<div class="${contentClass}">${content}</div>',
            '</div>'].join('');

        // 省级别下市弹出层
        var tplPopLayer = [
            '<div class="${popLayerClass}">',
                '<div class="${hiddenClass} ${layerBoxClass}" id="${id}">',
                '${innerHTML}</div>',
                '<b class="${hiddenClass}" id="${infoId}"></b>',
            '</div>'].join('');
        // 省外包
        var tplProvinceWrapper = '<div class="${classes}">${content}</div>';

        var tempIdx = 0;

        /**
         * 创建不同层级的选项html
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object} item 选项数据.
         * @param {number} level 选项层级. 1-国家 2-地区 3-省(直辖市) 4-市（区）
         * @return {string}
         */
        function getLevelHtml(region, item, level) {
            item.level = level;
            var subItemHtml = [];
            var children = item.children;
            if (children != null) {
                item.isSelected = false;
                // 省（直辖市）级具有弹出层
                if (item.level === 3) {
                    // 按需加载，先保存到缓存里
                    if (item.children && item.children.length > 0) {
                        region.cityCache[item.id]
                            = formatItemChildren(region, item);
                    }
                }
                else {
                    var len = children instanceof Array && children.length;
                    for (var i = 0; i < len; i++) {
                        subItemHtml.push(
                            getLevelHtml(region, item.children[i], level + 1)
                        );
                    }
                }
            }

            var controlHelper = region.helper;
            var customCheckbox = controlHelper.getPrefixClass('checkbox-custom');
            switch (level) {
                // 国家
                case 1:
                    return lib.format(
                        tplBoxWrapper,
                        {
                            boxClass:
                                controlHelper.getPartClasses(
                                    'country-box'
                                ).join(' '),
                            itemClasses:
                                controlHelper.getPartClasses(
                                    'country-check'
                                ).join(' '),
                            itemWrapperId: '',
                            itemValue: item.id,
                            itemId: controlHelper.getId('item-' + item.id),
                            level: item.level,
                            text: item.text,
                            contentClass: '',
                            content: subItemHtml.join(''),
                            checkboxCustomClass: customCheckbox
                        }
                    );

                // 地区
                case 2:
                    return lib.format(
                        tplBoxWrapper,
                        {
                            boxClass:
                                controlHelper.getPartClasses(
                                    'region-box' + (tempIdx++) % 2
                                ).join(' '),
                            itemClasses:
                                controlHelper.getPartClasses(
                                    'region-check'
                                ).join(' '),
                            itemWrapperId: '',
                            itemValue: item.id,
                            itemId: controlHelper.getId('item-' + item.id),
                            level: item.level,
                            text: item.text,
                            contentClass:
                                controlHelper.getPartClasses(
                                    'province-box'
                                ).join(' '),
                            content: subItemHtml.join(''),
                            checkboxCustomClass: customCheckbox
                        }
                    );
                // 省（直辖市）
                case 3:
                    var layer = lib.format(
                        tplPopLayer,
                        {
                            popLayerClass:
                                controlHelper.getPartClasses(
                                    'locator'
                                ).join(' '),
                            layerBoxClass:
                                controlHelper.getPartClasses(
                                    'city-box'
                                ).join(' '),
                            hiddenClass: getHiddenClassName(),
                            id: controlHelper.getId('sub-' + item.id),
                            infoId: controlHelper.getId('info-' + item.id),
                            innerHTML: subItemHtml.join('')
                        }
                    );
                    var text = lib.format(
                        tplInputItem,
                        {
                            itemClasses:
                                controlHelper.getPartClasses(
                                    'text'
                                ).join(' '),
                            itemWrapperId:
                                controlHelper.getId('wrapper-' + item.id),
                            itemValue: item.id,
                            itemId: controlHelper.getId('item-' + item.id),
                            level: item.level,
                            text: item.text,
                            checkboxCustomClass: customCheckbox
                        }
                    );
                    return lib.format(
                        tplProvinceWrapper,
                        {
                            classes:
                                controlHelper.getPartClasses(
                                    'province-item'
                                ).join(' '),
                            content: text + layer
                        }
                    );
                // 市（区）
                case 4:
                    return lib.format(
                        tplInputItem,
                        {
                            itemClasses:
                                controlHelper.getPartClasses(
                                    'city'
                                ).join(' '),
                            itemWrapperId: '',
                            itemValue: item.id,
                            itemId: controlHelper.getId('item-' + item.id),
                            level: item.level,
                            text: item.text,
                            checkboxCustomClass: customCheckbox
                        }
                    );
            }
        }

        /**
         * 创建弹出层选项html
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object} item 选项数据.
         * @return {string}
         */
        function formatItemChildren(region, item) {
            if (item.level === 3 && item.children != null) {
                var itemHtml = [];
                for (var i = 0; i < item.children.length; i++) {
                    item.children[i].parent = item;
                    item.children[i].level = item.level + 1;
                    itemHtml.push(
                        getLevelHtml(region, item.children[i], item.level + 1)
                    );
                }

                if (itemHtml.length % 2 === 1) {
                    itemHtml.push('');
                }

                var html = [
                    '<table border="0" cellspacing="0" cellpadding="0">'].join('');
                var tpl = [
                    '<tr>',
                        '<td>${firstItem}',
                        '</td>',
                        '<td>${secondItem}',
                        '</td>',
                    '</tr>'].join('');
                for (var j = 0; j < itemHtml.length; j += 2) {
                    html += lib.format(
                        tpl, {
                            firstItem: itemHtml[j],
                            secondItem: itemHtml[j + 1]
                        }
                    );
                }

                return html + '</table>';
            }
            return '';
        }

        /**
         * 多选模式初始化地域数据，转化为map形式便于检索
         *
         * @param {Region} region Region控件实例
         * @param {Object} properties 属性
         * @inner
         */
        function initMultiData(region, properties) {
            var source = properties.regionData;
            properties.regionDataIndex = {};
            walker(source, {children: source});

            function walker(data, parent) {
                var len = data instanceof Array && data.length;
                var i;
                var item;

                if (!len) {
                    return;
                }

                for (i = 0; i < len; i++) {
                    data[i].id = data[i].id || data[i].value;
                    item = u.clone(data[i]);
                    item.parent = parent;
                    properties.regionDataIndex[item.id] = item;
                    walker(item.children, item);
                }
            }
        }

        /**
         * 地域元素点击事件
         *
         * @inner
         * @param {Event} e 触发事件的事件对象
         */
        function mainClick(e) {
            if (this.disabled || this.readOnly) {
                return;
            }
            var tar = e.currentTarget;
            var $tar = $(tar);
            var hit = false;
            if ($tar.is('input')) {
                hit = true;
            }
            else if ($tar.is('label')) {
                var checkId = $tar.attr('for');
                tar = lib.g(checkId);
                hit = true;
            }
            if (hit) {
                optionClick(this, tar);
                this.fire('change');
                this.fire('changed');
                return;
            }
        }

        /**
         * 地域元素点击事件，
         * 先向下递归批量更新子节点的全选或全不选状态
         * 再全局遍历，向上更新选择状态和选择信息
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {HTMLInputElement} dom 选项checkbox的dom.
         * @param {boolean} dontRefreshView 是否需要更新状态.
         */
        function optionClick(region, dom, dontRefreshView) {
            var id = $(dom).attr('data-optionId');
            var isChecked = dom.checked;
            var data = region.regionDataIndex[id];
            data.isSelected = isChecked;
            var children = data.children;
            var len = children instanceof Array && children.length;
            // 有下层节点
            if (len) {
                // 自动勾选
                u.each(children, function (child) {
                    var checkbox = getOptionDOM(region, child.id);
                    if (checkbox) {
                        checkbox.checked = isChecked;
                        optionClick(region, checkbox, 1);
                    }
                    else {
                        region.regionDataIndex[child.id].isSelected = isChecked;
                    }
                });
            }
            else if (len === 0) {
                // 获取第三层checkbox
                if ($(dom).attr('level') === 3) {
                    var selCityIdsLength = 0;
                    var cityTotal = region.regionDataIndex[id].parent.children;
                    u.each(cityTotal, function (city) {
                        if (getOptionDOM(city.id).checked === true) {
                            selCityIdsLength++;
                        }
                    });
                    updateSelectedTip(
                        region,
                        selCityIdsLength,
                        cityTotal.length,
                        region.regionDataIndex[id].parent.id
                    );
                }
            }

            // 防止每次click都要更新一次信息
            if (!dontRefreshView) {
                updateMulti(region);
                updateParamValue(region);
            }
        }

        /**
         * 地域元素鼠标悬浮事件
         *
         * @inner
         * @param {string} type Region控件实例
         * @param {Event} e 触发事件的事件对象
         */
        function mainMouseHandler(type, e) {
            if (this.disabled || this.readOnly) {
                return;
            }
            var tar = e.target;
            var controlHelper = this.helper;
            var textClass = controlHelper.getPartClassName(
                'text'
            );
            var layerClass = controlHelper.getPartClassName(
                'city-box'
            );

            var handler = showSubCity;
            if (type === 'hide') {
                handler = hideSubCity;
            }

            var itemId;
            while (tar && tar !== document.body) {
                var optionChildLayer;
                if ($(tar).hasClass(textClass)) {
                    itemId = $(tar.firstChild.firstChild).attr('value');
                    optionChildLayer = tar.nextSibling.firstChild;
                }
                else if ($(tar).hasClass(layerClass)) {
                    optionChildLayer = tar;
                }
                if (optionChildLayer) {
                    handler(this, optionChildLayer, itemId);
                    return;
                }

                tar = tar.parentNode;
            }
        }

        /**
         * 显示子城市
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {HTMLInputElement} dom 弹出层的dom.
         * @param {string} itemId 弹出层对应的父城市id.
         */
        function showSubCity(region, dom, itemId) {
            // 装载
            if (itemId) {
                var subCityHTML = region.cityCache[itemId];
                if (!subCityHTML) {
                    return;
                }
                dom.innerHTML = subCityHTML;
                selectMulti(region, region.rawValue);
            }

            $(dom).removeClass(getHiddenClassName());
            var wrapper = dom.parentNode.previousSibling;
            region.helper.addPartClasses('text-over', wrapper);
        }

        /**
         * 隐藏子城市
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {HTMLInputElement} dom 弹出层的dom.
         * @param {string} itemId 弹出层对应的父城市id.
         */
        function hideSubCity(region, dom, itemId) {
            $(dom).addClass(getHiddenClassName());
            var wrapper = dom.parentNode.previousSibling;
            region.helper.removePartClasses('text-over', wrapper);
        }

        /**
         * 单选模式初始化数据
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object} properties 属性
         */
        function initSingleData(region, properties) {
            var result = [];
            walker({children: properties.regionData});

            function walker(data) {
                data.id = data.id || data.value;
                var children = data.children;
                var hasChild = !!children;
                if (data.id) {
                    result.push({
                        text: data.text,
                        value: data.id,
                        disabled: hasChild
                    });
                }
                if (hasChild) {
                    for (var i = 0, len = children.length; i < len; i++) {
                        walker(children[i]);
                    }
                }
            }
            properties.singleRegionData = result;
        }


        /**
         * 创建单选地域
         *
         * @inner
         * @param {Region} region Region控件实例
         */
        function createSingleRegion(region) {
            var tpl = ''
                + '<div data-ui="type:Select;childName:regionSel;'
                + 'id:regionSel;"></div>'
                + '<input type="hidden" id="${inputId}" name="${name}" />';

            region.main.innerHTML = lib.format(
                tpl,
                {
                    inputId: region.helper.getId('param-value'),
                    name: region.name
                }
            );

            // 创建控件树
            region.initChildren(region.main);
            var regionSel = region.getChild('regionSel');
            regionSel.setProperties({
                datasource: region.singleRegionData
            });

            regionSel.on(
                'change',
                u.bind(changeSingleRegion, null, region, regionSel)
            );
        }

        /**
         * 地域切换
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Select} regionSel Select控件实例
         */
        function changeSingleRegion(region, regionSel) {
            var regionId = parseInt(regionSel.getValue(), 10);
            region.rawValue = regionId;
            updateParamValue(region);
            region.fire('changed');
        }

        /**
         * 批量
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {boolean} disabled 是否不可用
         */
        function changeToDisabled(region, disabled) {
            if (region.mode === 'multi') {
                // 遍历素有checkbox，设置为disabled
                var elements
                    = region.main.getElementsByTagName('input');
                for (var i = 0, length = elements.length; i < length; i++) {
                    var item = elements[i];
                    item.disabled = disabled;
                }
            }
            else {
                var regionSel = region.getChild('regionSel');
                regionSel.setProperties({
                    disabled: disabled
                });
            }
        }

        /**
         * 更新输入控件的值
         *
         * @inner
         * @param {Region} region Region控件实例
         */
        function updateParamValue(region) {
            var input = lib.g(region.helper.getId('param-value'));
            var value = region.rawValue;
            if (lib.isArray(value)) {
                input.value = value.join(',');
            }
            else {
                input.value = value;
            }
        }

        /**
         * 获取“纯粹”已选节点（就是吧，如果父节点已选，子节点数据就不找了）
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object} node 节点
         * @return {Array} 选中的id数组
         */
        function getPureSelected(region, node) {
            var dataIndex = region.regionDataIndex;
            var ids = [];
            // 如果节点已选，就不用再找子节点了
            if (dataIndex[node.id] && dataIndex[node.id].isSelected) {
                ids.push(node.id);
            }
            else {
                u.each(node.children, function (child) {
                    // 带状态选择信息的节点在index下
                    var indexChild = dataIndex[child.id];
                    ids.push.apply(
                        ids,
                        getPureSelected(region, indexChild)
                    );
                });
            }
            return ids;
        }

        esui.register(Region);
        return Region;
    }
);
