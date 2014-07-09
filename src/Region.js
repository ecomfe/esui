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
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');
        var ui = require('./main');
        var u = require('underscore');

        /**
         * 地域控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Region(options) {
            InputControl.apply(this, arguments);
        }

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
                    inputId: helper.getId(region, 'param-value'),
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
         * @param {Array} value
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
            return lib.g(helper.getId(region, 'item-' + id));
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
         */
        function updateMulti(region, data, dontResetValue, level) {
            var level = level || 0;
            data = data || { children: region.regionData };
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
                        selChildLength ++;
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
                if (level == 3) {
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
            else {
                if (checkbox) {
                    if (checkbox.checked) {
                        region.rawValue.push(data.id);
                    }
                    // 好像不用了
                    // indexData.isSelected = checkbox.checked;
                    return checkbox.checked;
                }
                // 弹出层城市不一定创建，所以使用数据源判断选择状态
                else if (indexData.isSelected) {
                    region.rawValue.push(data.id);
                }

                return indexData.isSelected;
            }
        }

        /**
         * 获取hidden状态的class
         *
         * @return {string}
         */
        function getHiddenClassName() {
            return ui.getConfig('stateClassPrefix') + '-hidden';
        }

        /*
         * 更新城市选择状态，比如'2/30'
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object} selCityIdsLength 选中的选项个数.
         * @param {Object} cLength 全部选项个数
         * @param {string} dontResetValue 是否重设选中的值.
         */
        function updateSelectedTip(region, selCityIdsLength, cLength, id) {
            var infoTag = lib.g(helper.getId(region, 'info-' + id));
            if (selCityIdsLength !== 0 && selCityIdsLength !== cLength) {
                lib.removeClass(infoTag, getHiddenClassName());
                infoTag.innerHTML = selCityIdsLength + '/' + cLength + '';
            }
            else {
                lib.addClass(infoTag, getHiddenClassName());
                infoTag.innerHTML = '';
            }
        }



        // 地区、省、城市、区选项
        var tplInputItem = [
            '<div class="${itemClasses}" id="${itemWrapperId}" >',
                '<input type="checkbox" value="${itemValue}" id="${itemId}"',
                ' data-optionId="${itemValue}" data-level="${level}">',
                '<label for="${itemId}">${text}</label>',
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
            /**
             * margin-left: 0;
             * font-size: 10px;
             * color: #f00;
             * height: 5px
             * width: 25px;
             *
             */
            item.level = level;
            var subItemHtml = [];
            var children = item.children;
            if (children != null) {
                item.isSelected = false;
                // 省（直辖市）级具有弹出层
                if (item.level == 3) {
                    // 按需加载，先保存到缓存里
                    if (item.children && item.children.length > 0) {
                        region.cityCache[item.id] =
                            formatItemChildren(region, item);
                    }
                } else {
                    var len = children instanceof Array && children.length;
                    for (var i = 0; i < len; i++) {
                        subItemHtml.push(
                            getLevelHtml(region, item.children[i], level + 1)
                        );
                    }
                }
            }

            switch (level) {
                // 国家
                case 1:
                    return lib.format(
                        tplBoxWrapper,
                        {
                            boxClass:
                                helper.getPartClasses(
                                    region, 'country-box'
                                ).join(' '),
                            itemClasses:
                                helper.getPartClasses(
                                    region, 'country-check'
                                ).join(' '),
                            itemWrapperId: '',
                            itemValue: item.id,
                            itemId: helper.getId(region, 'item-' + item.id),
                            level: item.level,
                            text: item.text,
                            contentClass: '',
                            content: subItemHtml.join('')
                        }
                    );

                // 地区
                case 2:
                    return lib.format(
                        tplBoxWrapper,
                        {
                            boxClass:
                                helper.getPartClasses(
                                    region, 'region-box'+ (tempIdx++) % 2
                                ).join(' '),
                            itemClasses:
                                helper.getPartClasses(
                                    region, 'region-check'
                                ).join(' '),
                            itemWrapperId: '',
                            itemValue: item.id,
                            itemId: helper.getId(region, 'item-' + item.id),
                            level: item.level,
                            text: item.text,
                            contentClass:
                                helper.getPartClasses(
                                    region, 'province-box'
                                ).join(' '),
                            content: subItemHtml.join('')
                        }
                    );
                // 省（直辖市）
                case 3:
                    var layer = lib.format(
                        tplPopLayer,
                        {
                            popLayerClass:
                                helper.getPartClasses(
                                    region,
                                    'locator'
                                ).join(' '),
                            layerBoxClass:
                                helper.getPartClasses(
                                    region,
                                    'city-box'
                                ).join(' '),
                            hiddenClass: getHiddenClassName(),
                            id: helper.getId(region, 'sub-' + item.id),
                            infoId: helper.getId(region, 'info-' + item.id),
                            innerHTML: subItemHtml.join('')
                        }
                    );
                    var text = lib.format(
                        tplInputItem,
                        {
                            itemClasses:
                                helper.getPartClasses(
                                    region, 'text'
                                ).join(' '),
                            itemWrapperId:
                                helper.getId(region, 'wrapper-' + item.id),
                            itemValue: item.id,
                            itemId: helper.getId(region, 'item-' + item.id),
                            level: item.level,
                            text: item.text
                        }
                    );
                    return lib.format(
                        tplProvinceWrapper,
                        {
                            classes:
                                helper.getPartClasses(
                                    region, 'province-item'
                                ).join(' '),
                            content: layer + text
                        }
                    );
                // 市（区）
                case 4:
                    return lib.format(
                        tplInputItem,
                        {
                            itemClasses:
                                helper.getPartClasses(
                                    region, 'city'
                                ).join(' '),
                            itemWrapperId: '',
                            itemValue: item.id,
                            itemId: helper.getId(region, 'item-' + item.id),
                            level: item.level,
                            text: item.text
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
            if (item.level == 3 && item.children != null) {
                var itemHtml = [];
                var leftLength = 0, rightLength = 0;
                for (var i = 0; i < item.children.length; i++) {
                    item.children[i].parent = item;
                    item.children[i].level = item.level + 1;
                    itemHtml.push(
                        getLevelHtml(region, item.children[i], item.level + 1)
                    );

                    if (i % 2 === 0
                        && item.children[i].text.length > leftLength) {
                        leftLength = item.children[i].text.length;
                    }

                    if (i % 2 === 1
                        && item.children[i].text.length > rightLength) {
                        rightLength = item.children[i].text.length;
                    }
                }

                if (itemHtml.length % 2 === 1) {
                    itemHtml.push('');
                }

                var html = [
                    '<table border="0" cellspacing="0" cellpadding="0"',
                    ' width="',
                    ((leftLength + rightLength) * 14 + 66),
                    '">'].join('');
                var tpl = [
                    '<tr>',
                        '<td width="',
                        (leftLength * 14 + 33),
                        '">${firstItem}',
                        '</td>',
                        '<td width="',
                        (rightLength * 14 + 33),
                        '">${secondItem}',
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

                for (var i = 0; i < len; i++) {
                    var item = lib.clone(data[i]);
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
         * @param {Region} this Region控件实例
         * @param {Event} 触发事件的事件对象
         */
        function mainClick(e) {
            if (this.disabled || this.readOnly) {
                return;
            }
            var tar = e.target;
            while (tar && tar != document.body) {
                var hit = false;
                if (tar.nodeName.toLowerCase() === 'input') {
                    hit = true;
                }
                else if (tar.nodeName.toLowerCase() === 'label') {
                    var checkId = lib.getAttribute(tar, 'for');
                    tar = lib.g(checkId);
                    hit = true;
                }
                if (hit) {
                    optionClick(this, tar);
                    this.fire('change');
                    return;
                }
                tar = tar.parentNode;
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
            var id = lib.getAttribute(dom, 'data-optionId');
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
                //获取第三层checkbox
                if (lib.getAttribute(dom, 'level') == 3) {
                    var selCityIdsLength = 0;
                    var cityTotal = region.regionDataIndex[id].parent.children;
                    u.each(cityTotal, function (city) {
                        if (getOptionDOM(city.id).checked === true) {
                            selCityIdsLength ++;
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
         * @param {Region} this Region控件实例
         * @param {Event} 触发事件的事件对象
         */
        function mainMouseHandler(type, e) {
            if (this.disabled || this.readOnly) {
                return;
            }
            var tar = e.target;
            var textClass = helper.getPartClasses(
                this, 'text'
            );
            var layerClass = helper.getPartClasses(
                this, 'city-box');

            var handler = showSubCity;
            if (type == 'hide') {
                handler = hideSubCity;
            }

            var itemId;
            while (tar && tar != document.body) {
                var optionChildLayer;
                if (lib.hasClass(tar, textClass[0])) {
                    itemId = lib.getAttribute(tar.firstChild, 'value');
                    optionChildLayer = tar.previousSibling.firstChild;
                }
                else if (lib.hasClass(tar, layerClass[0])) {
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

            lib.removeClass(dom, getHiddenClassName());
            var wrapper = dom.parentNode.nextSibling;
            helper.addPartClasses(region, 'text-over', wrapper);
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
            lib.addClass(dom, getHiddenClassName());
            var wrapper = dom.parentNode.nextSibling;
            helper.removePartClasses(region, 'text-over', wrapper);
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
                    var len = children.length;
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
                + 'id:regionSel;width:100;"></div>'
                + '<input type="hidden" id="${inputId}" name="${name}" />';

            region.main.innerHTML = lib.format(
                tpl,
                {
                    inputId: helper.getId(region, 'param-value'),
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
                lib.bind(changeSingleRegion, null, region, regionSel)
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
        }

        /**
         * 批量
         * @inner
         * @param {Region} region Region控件实例
         * @param {boolean} disabled 是否不可用
         */
        function changeToDisabled(region, disabled) {
            if (region.mode === 'multi') {
                // 遍历素有checkbox，设置为disabled
                var elements =
                    region.main.getElementsByTagName('input');
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
            var input = lib.g(helper.getId(region, 'param-value'));
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

        Region.prototype = {
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
                    regionData: lib.clone(Region.REGION_LIST),
                    mode: 'multi',
                    pureSelect: false,
                    rawValue: []
                };

                helper.extractValueFromInput(this, options);

                if (options.value) {
                    options.rawValue = options.value.split(',');
                }

                lib.extend(properties, options);

                if (properties.mode == 'multi') {
                    //增加map型地域数据
                    initMultiData(this, properties);

                    this.cityCache = {};
                }
                else {
                    properties.rawValue = '';
                    //增加单选型地域数据
                    initSingleData(this, properties);
                }

                if (properties.pureSelect == 'false') {
                    properties.pureSelect = false;
                }

                this.setProperties(properties);
            },


            /**
             * 初始化DOM结构
             * ，
             * @protected
             */
            initStructure: function () {
                // 如果主元素是输入元素，替换成`<div>`
                // 如果输入了非块级元素，则不负责
                if (lib.isInput(this.main)) {
                    helper.replaceMain(this);
                }

                if (this.mode == 'multi') {
                    createMultiRegion(this);
                }
                else {
                    createSingleRegion(this);
                    lib.addClass(
                        this.main,
                        helper.getPartClasses(this, 'single').join(' ')
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
                if (this.mode == 'multi') {
                    //点击事件
                    this.helper.addDOMEvent(this.main, 'click', mainClick);

                    //鼠标悬浮事件
                    this.helper.addDOMEvent(this.main, 'mouseover', lib.curry(mainMouseHandler, 'show'));
                    //鼠标悬浮事件
                    this.helper.addDOMEvent(this.main, 'mouseout', lib.curry(mainMouseHandler, 'hide'));
                }
                else {
                    var regionSel = this.getChild('regionSel');

                    regionSel.on('change', lib.bind(changeSingleRegion, null, this, regionSel));
                }
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: helper.createRepaint(
                InputControl.prototype.repaint,
                {
                    name: 'rawValue',
                    paint: function (region, value) {
                        if (region.mode == 'multi') {
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
                            var input =
                                lib.g(helper.getId(region, 'param-value'));
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
                this.setProperties({ 'rawValue': value });
            },

            /**
             * 获取选中的地域，数组格式。
             *
             * @return {Array}
             */
            getRawValue: function () {
                if (this.mode == 'single') {
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
                if (this.mode == 'multi') {
                    return rawValue.join(',');
                }
                else {
                    return rawValue;
                }
            },

            /**
             * 将string类型的value转换成原始格式
             *
             * @param {string} value 字符串值
             * @return {*}
             */
            parseValue: function (value) {
                return value.split(',');
            }

        };

        /* jshint maxlen: 600 */
        Region.REGION_LIST = [
            {
                'id':'90',
                'text':'中国',
                'children':[
                    {
                        'id':'80',
                        'text':'华北地区',
                        'children':[
                            {
                                'id':'1',
                                'text':'北京',
                                'children':[
                                    {'id':'742','text':'昌平区'},
                                    {'id':'743','text':'朝阳区'},
                                    {'id':'744','text':'崇文区'},
                                    {'id':'745','text':'大兴区'},
                                    {'id':'746','text':'东城区'},
                                    {'id':'747','text':'房山区'},
                                    {'id':'748','text':'丰台区'},
                                    {'id':'749','text':'海淀区'},
                                    {'id':'750','text':'怀柔区'},
                                    {'id':'751','text':'门头沟区'},
                                    {'id':'752','text':'密云县'},
                                    {'id':'753','text':'平谷区'},
                                    {'id':'754','text':'石景山区'},
                                    {'id':'755','text':'顺义区'},
                                    {'id':'756','text':'通州区'},
                                    {'id':'757','text':'西城区'},
                                    {'id':'758','text':'宣武区'},
                                    {'id':'759','text':'延庆县'}
                                ]
                            },
                            {
                                'id':'3',
                                'text':'天津',
                                'children':[
                                    {'id':'760','text':'宝坻区'},
                                    {'id':'761','text':'北辰区'},
                                    {'id':'763','text':'东丽区'},
                                    {'id':'765','text':'河北区'},
                                    {'id':'766','text':'河东区'},
                                    {'id':'767','text':'和平区'},
                                    {'id':'768','text':'河西区'},
                                    {'id':'769','text':'红桥区'},
                                    {'id':'770','text':'蓟县'},
                                    {'id':'771','text':'津南区'},
                                    {'id':'772','text':'静海县'},
                                    {'id':'773','text':'南开区'},
                                    {'id':'774','text':'宁河县'},
                                    {'id':'776','text':'武清区'},
                                    {'id':'777','text':'西青区'},
                                    {'id':'900','text':'滨海新区'}
                                ]
                            },
                            {
                                'id':'15',
                                'text':'河北',
                                'children':[
                                    {'id':'226','text':'保定市'},
                                    {'id':'228','text':'沧州市'},
                                    {'id':'229','text':'承德市'},
                                    {'id':'230','text':'邯郸市'},
                                    {'id':'231','text':'衡水市'},
                                    {'id':'234','text':'廊坊市'},
                                    {'id':'236','text':'秦皇岛市'},
                                    {'id':'239','text':'石家庄市'},
                                    {'id':'240','text':'唐山市'},
                                    {'id':'241','text':'邢台市'},
                                    {'id':'242','text':'张家口市'}
                                ]
                            },
                            {
                                'id':'24',
                                'text':'内蒙古',
                                'children':[
                                    {'id':'428','text':'阿拉善盟'},
                                    {'id':'429','text':'巴彦淖尔市'},
                                    {'id':'430','text':'包头市'},
                                    {'id':'431','text':'赤峰市'},
                                    {'id':'432','text':'鄂尔多斯市'},
                                    {'id':'434','text':'呼和浩特市'},
                                    {'id':'435','text':'呼伦贝尔市'},
                                    {'id':'437','text':'通辽市'},
                                    {'id':'438','text':'乌海市'},
                                    {'id':'439','text':'乌兰察布市'},
                                    {'id':'442','text':'锡林郭勒盟'},
                                    {'id':'444','text':'兴安盟'}
                                ]
                            },
                            {
                                'id':'28',
                                'text':'山西',
                                'children':[
                                    {'id':'486','text':'大同市'},
                                    {'id':'491','text':'晋城市'},
                                    {'id':'492','text':'晋中市'},
                                    {'id':'493','text':'临汾市'},
                                    {'id':'494','text':'吕梁市'},
                                    {'id':'495','text':'朔州市'},
                                    {'id':'496','text':'太原市'},
                                    {'id':'497','text':'忻州市'},
                                    {'id':'498','text':'阳泉市'},
                                    {'id':'501','text':'运城市'},
                                    {'id':'502','text':'长治市'}
                                ]
                            }
                        ]
                    },
                    {
                        'id':'81',
                        'text':'东北地区',
                        'children':[
                            {
                                'id':'17',
                                'text':'黑龙江',
                                'children':[
                                    {'id':'272','text':'大庆市'},
                                    {'id':'273','text':'大兴安岭地区'},
                                    {'id':'276','text':'哈尔滨市'},
                                    {'id':'278','text':'鹤岗市'},
                                    {'id':'279','text':'黑河市'},
                                    {'id':'282','text':'鸡西市'},
                                    {'id':'284','text':'佳木斯市'},
                                    {'id':'287','text':'牡丹江市'},
                                    {'id':'289','text':'七台河市'},
                                    {'id':'290','text':'齐齐哈尔市'},
                                    {'id':'291','text':'双鸭山市'},
                                    {'id':'293','text':'绥化市'},
                                    {'id':'298','text':'伊春市'}
                                ]
                            },
                            {
                                'id':'20',
                                'text':'吉林',
                                'children':[
                                    {'id':'345','text':'白城市'},
                                    {'id':'346','text':'白山市'},
                                    {'id':'351','text':'吉林市'},
                                    {'id':'352','text':'辽源市'},
                                    {'id':'355','text':'四平市'},
                                    {'id':'356','text':'松原市'},
                                    {'id':'358','text':'通化市'},
                                    {'id':'359','text':'延边朝鲜族自治州'},
                                    {'id':'361','text':'长春市'}
                                ]
                            },
                            {
                                'id':'23',
                                'text':'辽宁',
                                'children':[
                                    {'id':'413','text':'鞍山市'},
                                    {'id':'414','text':'本溪市'},
                                    {'id':'415','text':'朝阳市'},
                                    {'id':'416','text':'大连市'},
                                    {'id':'417','text':'丹东市'},
                                    {'id':'418','text':'抚顺市'},
                                    {'id':'419','text':'阜新市'},
                                    {'id':'421','text':'葫芦岛市'},
                                    {'id':'422','text':'锦州市'},
                                    {'id':'423','text':'辽阳市'},
                                    {'id':'424','text':'盘锦市'},
                                    {'id':'425','text':'沈阳市'},
                                    {'id':'426','text':'铁岭市'},
                                    {'id':'427','text':'营口市'}
                                ]
                            }
                        ]
                    },
                    {
                        'id':'82',
                        'text':'华东地区',
                        'children':[
                            {
                                'id':'2',
                                'text':'上海',
                                'children':[
                                    {'id':'818','text':'宝山区'},
                                    {'id':'819','text':'崇明县'},
                                    {'id':'820','text':'奉贤区'},
                                    {'id':'821','text':'虹口区'},
                                    {'id':'822','text':'黄浦区'},
                                    {'id':'823','text':'嘉定区'},
                                    {'id':'824','text':'金山区'},
                                    {'id':'825','text':'静安区'},
                                    {'id':'826','text':'卢湾区'},
                                    {'id':'827','text':'闵行区'},
                                    {'id':'830','text':'浦东新区'},
                                    {'id':'831','text':'普陀区'},
                                    {'id':'832','text':'青浦区'},
                                    {'id':'833','text':'松江区'},
                                    {'id':'834','text':'徐汇区'},
                                    {'id':'835','text':'杨浦区'},
                                    {'id':'836','text':'闸北区'},
                                    {'id':'837','text':'长宁区'}
                                ]
                            },
                            {
                                'id':'8',
                                'text':'安徽',
                                'children':[
                                    {'id':'101','text':'安庆市'},
                                    {'id':'102','text':'蚌埠市'},
                                    {'id':'103','text':'亳州市'},
                                    {'id':'104','text':'巢湖市'},
                                    {'id':'105','text':'池州市'},
                                    {'id':'106','text':'滁州市'},
                                    {'id':'107','text':'阜阳市'},
                                    {'id':'110','text':'合肥市'},
                                    {'id':'111','text':'淮北市'},
                                    {'id':'112','text':'淮南市'},
                                    {'id':'113','text':'黄山市'},
                                    {'id':'115','text':'六安市'},
                                    {'id':'116','text':'马鞍山市'},
                                    {'id':'118','text':'铜陵市'},
                                    {'id':'119','text':'芜湖市'},
                                    {'id':'120','text':'宿州市'},
                                    {'id':'121','text':'宣城市'}
                                ]
                            },
                            {
                                'id':'9',
                                'text':'福建',
                                'children':[
                                    {'id':'124','text':'福州市'},
                                    {'id':'126','text':'龙岩市'},
                                    {'id':'127','text':'南平市'},
                                    {'id':'128','text':'宁德市'},
                                    {'id':'129','text':'莆田市'},
                                    {'id':'130','text':'泉州市'},
                                    {'id':'131','text':'三明市'},
                                    {'id':'132','text':'厦门市'},
                                    {'id':'138','text':'漳州市'}
                                ]
                            },
                            {
                                'id':'21',
                                'text':'江苏',
                                'children':[
                                    {'id':'363','text':'常州市'},
                                    {'id':'367','text':'淮安市'},
                                    {'id':'375','text':'连云港市'},
                                    {'id':'376','text':'南京市'},
                                    {'id':'377','text':'南通市'},
                                    {'id':'381','text':'苏州市'},
                                    {'id':'383','text':'泰州市'},
                                    {'id':'386','text':'无锡市'},
                                    {'id':'391','text':'宿迁市'},
                                    {'id':'392','text':'徐州市'},
                                    {'id':'393','text':'盐城市'},
                                    {'id':'395','text':'扬州市'},
                                    {'id':'399','text':'镇江市'}
                                ]
                            },
                            {
                                'id':'22',
                                'text':'江西',
                                'children':[
                                    {'id':'401','text':'抚州市'},
                                    {'id':'402','text':'赣州市'},
                                    {'id':'403','text':'吉安市'},
                                    {'id':'404','text':'景德镇市'},
                                    {'id':'406','text':'九江市'},
                                    {'id':'407','text':'南昌市'},
                                    {'id':'408','text':'萍乡市'},
                                    {'id':'409','text':'上饶市'},
                                    {'id':'410','text':'新余市'},
                                    {'id':'411','text':'宜春市'},
                                    {'id':'412','text':'鹰潭市'}
                                ]
                            },
                            {
                                'id':'27',
                                'text':'山东',
                                'children':[
                                    {'id':'461','text':'滨州市'},
                                    {'id':'462','text':'德州市'},
                                    {'id':'463','text':'东营市'},
                                    {'id':'466','text':'菏泽市'},
                                    {'id':'467','text':'济南市'},
                                    {'id':'468','text':'济宁市'},
                                    {'id':'470','text':'莱芜市'},
                                    {'id':'472','text':'聊城市'},
                                    {'id':'473','text':'临沂市'},
                                    {'id':'474','text':'青岛市'},
                                    {'id':'476','text':'日照市'},
                                    {'id':'477','text':'泰安市'},
                                    {'id':'479','text':'威海市'},
                                    {'id':'480','text':'潍坊市'},
                                    {'id':'481','text':'烟台市'},
                                    {'id':'482','text':'枣庄市'},
                                    {'id':'485','text':'淄博市'}
                                ]
                            },
                            {
                                'id':'34',
                                'text':'浙江',
                                'children':[
                                    {'id':'604','text':'杭州市'},
                                    {'id':'605','text':'湖州市'},
                                    {'id':'606','text':'嘉兴市'},
                                    {'id':'608','text':'金华市'},
                                    {'id':'611','text':'丽水市'},
                                    {'id':'615','text':'宁波市'},
                                    {'id':'617','text':'衢州市'},
                                    {'id':'619','text':'绍兴市'},
                                    {'id':'621','text':'台州市'},
                                    {'id':'624','text':'温州市'},
                                    {'id':'630','text':'舟山市'}
                                ]
                            }
                        ]
                    },
                    {
                        'id':'83',
                        'text':'华中地区',
                        'children':[
                            {
                                'id':'16',
                                'text':'河南',
                                'children':[
                                    {'id':'243','text':'安阳市'},
                                    {'id':'246','text':'鹤壁市'},
                                    {'id':'249','text':'焦作市'},
                                    {'id':'250','text':'开封市'},
                                    {'id':'252','text':'漯河市'},
                                    {'id':'253','text':'洛阳市'},
                                    {'id':'254','text':'南阳市'},
                                    {'id':'255','text':'平顶山市'},
                                    {'id':'256','text':'濮阳市'},
                                    {'id':'257','text':'三门峡市'},
                                    {'id':'258','text':'商丘市'},
                                    {'id':'261','text':'新乡市'},
                                    {'id':'262','text':'信阳市'},
                                    {'id':'263','text':'许昌市'},
                                    {'id':'266','text':'郑州市'},
                                    {'id':'267','text':'周口市'},
                                    {'id':'268','text':'驻马店市'},
                                    {'id':'901','text':'济源市'}
                                ]
                            },
                            {
                                'id':'18',
                                'text':'湖北',
                                'children':[
                                    {'id':'304','text':'鄂州市'},
                                    {'id':'305','text':'恩施市'},
                                    {'id':'307','text':'黄冈市'},
                                    {'id':'308','text':'黄石市'},
                                    {'id':'309','text':'荆门市'},
                                    {'id':'310','text':'荆州市'},
                                    {'id':'311','text':'潜江市'},
                                    {'id':'312','text':'神农架林区'},
                                    {'id':'313','text':'十堰市'},
                                    {'id':'314','text':'随州市'},
                                    {'id':'315','text':'天门市'},
                                    {'id':'317','text':'武汉'},
                                    {'id':'319','text':'仙桃市'},
                                    {'id':'320','text':'咸宁市'},
                                    {'id':'321','text':'襄樊市'},
                                    {'id':'323','text':'孝感市'},
                                    {'id':'324','text':'宜昌市'}
                                ]
                            },
                            {
                                'id':'19',
                                'text':'湖南',
                                'children':[
                                    {'id':'328','text':'常德市'},
                                    {'id':'329','text':'郴州市'},
                                    {'id':'330','text':'衡阳市'},
                                    {'id':'331','text':'怀化市'},
                                    {'id':'334','text':'娄底市'},
                                    {'id':'335','text':'邵阳市'},
                                    {'id':'337','text':'湘潭市'},
                                    {'id':'338','text':'湘西土家族苗族自治州'},
                                    {'id':'339','text':'益阳市'},
                                    {'id':'340','text':'永州市'},
                                    {'id':'341','text':'岳阳市'},
                                    {'id':'342','text':'张家界市'},
                                    {'id':'343','text':'长沙市'},
                                    {'id':'344','text':'株洲市'}
                                ]
                            }
                        ]
                    },
                    {
                        'id':'84',
                        'text':'华南地区',
                        'children':[
                            {
                                'id':'11',
                                'text':'广东',
                                'children':[
                                    {'id':'157','text':'潮州市'},
                                    {'id':'158','text':'东莞市'},
                                    {'id':'160','text':'佛山市'},
                                    {'id':'162','text':'广州市'},
                                    {'id':'163','text':'河源市'},
                                    {'id':'164','text':'惠州市'},
                                    {'id':'166','text':'江门市'},
                                    {'id':'167','text':'揭阳市'},
                                    {'id':'169','text':'茂名市'},
                                    {'id':'170','text':'梅州市'},
                                    {'id':'172','text':'清远市'},
                                    {'id':'173','text':'汕头市'},
                                    {'id':'174','text':'汕尾市'},
                                    {'id':'175','text':'韶关市'},
                                    {'id':'176','text':'深圳市'},
                                    {'id':'180','text':'阳江市'},
                                    {'id':'182','text':'云浮市'},
                                    {'id':'184','text':'湛江市'},
                                    {'id':'185','text':'肇庆市'},
                                    {'id':'186','text':'中山市'},
                                    {'id':'187','text':'珠海市'}
                                ]
                            },
                            {
                                'id':'12',
                                'text':'广西',
                                'children':[
                                    {'id':'188','text':'百色市'},
                                    {'id':'189','text':'北海市'},
                                    {'id':'191','text':'防城港市'},
                                    {'id':'193','text':'贵港市'},
                                    {'id':'194','text':'桂林市'},
                                    {'id':'195','text':'河池市'},
                                    {'id':'196','text':'贺州市'},
                                    {'id':'197','text':'来宾市'},
                                    {'id':'198','text':'柳州市'},
                                    {'id':'199','text':'南宁市'},
                                    {'id':'200','text':'钦州市'},
                                    {'id':'201','text':'梧州市'},
                                    {'id':'203','text':'玉林市'}
                                ]
                            },
                            {
                                'id':'14',
                                'text':'海南',
                                'children':[
                                    {'id':'218','text':'儋州市'},
                                    {'id':'219','text':'东方市'},
                                    {'id':'220','text':'海口市'},
                                    {'id':'221','text':'琼海市'},
                                    {'id':'223','text':'三亚市'},
                                    {'id':'225','text':'文昌市'},
                                    {'id':'867','text':'五指山'},
                                    {'id':'868','text':'万宁'}
                                ]
                            }
                        ]
                    },
                    {
                        'id':'85',
                        'text':'西南地区',
                        'children':[
                            {
                                'id':'4',
                                'text':'重庆',
                                'children':[
                                    {'id':'778','text':'巴南区'},
                                    {'id':'779','text':'北碚区'},
                                    {'id':'780','text':'璧山县'},
                                    {'id':'781','text':'城口县'},
                                    {'id':'782','text':'大渡口区'},
                                    {'id':'783','text':'大足县'},
                                    {'id':'784','text':'垫江县'},
                                    {'id':'785','text':'丰都县'},
                                    {'id':'786','text':'奉节县'},
                                    {'id':'787','text':'涪陵区'},
                                    {'id':'788','text':'合川区'},
                                    {'id':'789','text':'江北区'},
                                    {'id':'790','text':'江津区'},
                                    {'id':'791','text':'九龙坡区'},
                                    {'id':'792','text':'开县'},
                                    {'id':'793','text':'梁平县'},
                                    {'id':'794','text':'南岸区'},
                                    {'id':'795','text':'南川区'},
                                    {'id':'796','text':'彭水县'},
                                    {'id':'797','text':'綦江县'},
                                    {'id':'798','text':'黔江区'},
                                    {'id':'799','text':'荣昌县'},
                                    {'id':'800','text':'沙坪坝区'},
                                    {'id':'801','text':'石柱县'},
                                    {'id':'802','text':'双桥区'},
                                    {'id':'803','text':'铜梁县'},
                                    {'id':'804','text':'潼南县'},
                                    {'id':'805','text':'万盛区'},
                                    {'id':'806','text':'万州区'},
                                    {'id':'807','text':'巫山县'},
                                    {'id':'808','text':'巫溪县'},
                                    {'id':'809','text':'武隆县'},
                                    {'id':'810','text':'秀山县'},
                                    {'id':'811','text':'永川区'},
                                    {'id':'812','text':'酉阳县'},
                                    {'id':'813','text':'渝北区'},
                                    {'id':'814','text':'渝中区'},
                                    {'id':'815','text':'云阳县'},
                                    {'id':'816','text':'长寿区'},
                                    {'id':'817','text':'忠县'}
                                ]
                            },
                            {
                                'id':'13',
                                'text':'贵州',
                                'children':[
                                    {'id':'204','text':'安顺市'},
                                    {'id':'205','text':'毕节市'},
                                    {'id':'208','text':'贵阳市'},
                                    {'id':'210','text':'六盘水市'},
                                    {'id':'211','text':'黔东南苗族侗族自治州'},
                                    {'id':'212','text':'黔南布依族苗族自治州'},
                                    {'id':'213','text':'黔西南布依族苗族自治州'},
                                    {'id':'215','text':'铜仁市'},
                                    {'id':'217','text':'遵义市'}
                                ]
                            },
                            {
                                'id':'30',
                                'text':'四川',
                                'children':[
                                    {'id':'516','text':'阿坝藏族羌族自治州'},
                                    {'id':'517','text':'巴中市'},
                                    {'id':'518','text':'成都市'},
                                    {'id':'519','text':'达州市'},
                                    {'id':'520','text':'德阳市'},
                                    {'id':'523','text':'甘孜藏族自治州'},
                                    {'id':'524','text':'广安市'},
                                    {'id':'526','text':'广元市'},
                                    {'id':'528','text':'乐山市'},
                                    {'id':'529','text':'凉山彝族自治州'},
                                    {'id':'530','text':'泸州市'},
                                    {'id':'531','text':'眉山市'},
                                    {'id':'532','text':'绵阳市'},
                                    {'id':'534','text':'南充市'},
                                    {'id':'535','text':'内江市'},
                                    {'id':'536','text':'攀枝花市'},
                                    {'id':'538','text':'遂宁市'},
                                    {'id':'540','text':'雅安市'},
                                    {'id':'541','text':'宜宾市'},
                                    {'id':'542','text':'资阳市'},
                                    {'id':'543','text':'自贡市'}
                                ]
                            },
                            {
                                'id':'31',
                                'text':'西藏',
                                'children':[
                                    {'id':'546','text':'拉萨市'},
                                    {'id':'547','text':'林芝地区'},
                                    {'id':'548','text':'那曲地区'},
                                    {'id':'549','text':'日喀则地区'}
                                ]
                            },
                            {
                                'id':'33',
                                'text':'云南',
                                'children':[
                                    {'id':'578','text':'保山市'},
                                    {'id':'579','text':'楚雄市'},
                                    {'id':'580','text':'大理市'},
                                    {'id':'581','text':'德宏傣族景颇族自治州'},
                                    {'id':'585','text':'红河哈尼族彝族自治州'},
                                    {'id':'587','text':'昆明市'},
                                    {'id':'589','text':'丽江市'},
                                    {'id':'590','text':'临沧市'},
                                    {'id':'593','text':'普洱市'},
                                    {'id':'594','text':'曲靖市'},
                                    {'id':'595','text':'文山市'},
                                    {'id':'597','text':'玉溪市'},
                                    {'id':'598','text':'昭通市'}
                                ]
                            }
                        ]
                    },
                    {
                        'id':'86',
                        'text':'西北地区',
                        'children':[
                            {
                                'id':'10',
                                'text':'甘肃',
                                'children':[
                                    {'id':'139','text':'白银市'},
                                    {'id':'140','text':'定西市'},
                                    {'id':'144','text':'嘉峪关市'},
                                    {'id':'145','text':'金昌市'},
                                    {'id':'146','text':'酒泉市'},
                                    {'id':'147','text':'兰州市'},
                                    {'id':'148','text':'临夏回族自治州'},
                                    {'id':'150','text':'陇南市'},
                                    {'id':'151','text':'平凉市'},
                                    {'id':'152','text':'庆阳市'},
                                    {'id':'153','text':'天水市'},
                                    {'id':'154','text':'武威市'},
                                    {'id':'156','text':'张掖市'}
                                ]
                            },
                            {
                                'id':'25',
                                'text':'宁夏',
                                'children':[
                                    {'id':'446','text':'固原市'},
                                    {'id':'447','text':'石嘴山市'},
                                    {'id':'448','text':'吴忠市'},
                                    {'id':'449','text':'银川市'},
                                    {'id':'450','text':'中卫市'}
                                ]
                            },
                            {
                                'id':'26',
                                'text':'青海',
                                'children':[
                                    {'id':'454','text':'海东地区'},
                                    {'id':'456','text':'海西蒙古族藏族自治州'},
                                    {'id':'458','text':'西宁市'},
                                    {'id':'459','text':'玉树藏族自治州'}
                                ]
                            },
                            {
                                'id':'29',
                                'text':'陕西',
                                'children':[
                                    {'id':'503','text':'安康市'},
                                    {'id':'504','text':'宝鸡市'},
                                    {'id':'506','text':'汉中市'},
                                    {'id':'508','text':'商洛市'},
                                    {'id':'509','text':'铜川市'},
                                    {'id':'510','text':'渭南市'},
                                    {'id':'511','text':'西安市'},
                                    {'id':'512','text':'咸阳市'},
                                    {'id':'513','text':'延安市'},
                                    {'id':'515','text':'榆林市'}
                                ]
                            },
                            {
                                'id':'32',
                                'text':'新疆',
                                'children':[
                                    {'id':'551','text':'阿克苏地区'},
                                    {'id':'554','text':'阿勒泰市'},
                                    {'id':'556','text':'巴音郭楞蒙古自治州'},
                                    {'id':'557','text':'博尔塔拉蒙古自治州'},
                                    {'id':'560','text':'昌吉回族自治州'},
                                    {'id':'563','text':'哈密市'},
                                    {'id':'564','text':'和田市'},
                                    {'id':'565','text':'喀什市'},
                                    {'id':'566','text':'克拉玛依市'},
                                    {'id':'570','text':'石河子市'},
                                    {'id':'571','text':'塔城市'},
                                    {'id':'572','text':'吐鲁番市'},
                                    {'id':'573','text':'乌鲁木齐市'},
                                    {'id':'576','text':'伊犁市'},
                                    {'id':'869','text':'克孜勒苏柯尔克孜'},
                                    {'id':'870','text':'五家渠'}
                                ]
                            }
                        ]
                    },
                    {
                        'id':'87',
                        'text':'港澳台',
                        'children':[
                            {'id':'5','text':'澳门'
                            },
                            {'id':'6','text':'香港'
                            },
                            {'id':'7','text':'台湾'
                            }
                        ]
                    }
                ]
            },
            {'id':'999','text':'国外'},
            {'id':'0','text':'其他'}
        ];
        lib.inherits(Region, InputControl);
        ui.register(Region);
        return Region;
    }
);
