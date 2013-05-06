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
        // css
        require('css!./css/Region.css');
        require('css!./css/Select.css');

        var lib = require('./lib');
        var helper = require('./controlHelper');
        var InputControl = require('./InputControl');
        var ui = require('./main');

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
                html.push(getOptionHtml(region, data[i], 0));
            }

            html.push('<div>' + region.cityCache.join('')　 + '</div>');

            var tpl = '<input type="hidden" id="${inputId}" name="${name}" />';

            html.push(lib.format(
                tpl,
                {
                    inputId: helper.getId(region, 'param-value'),
                    name: region.name
                }
            ));

            region.main.innerHTML = html.join('');

            //点击事件
            helper.addDOMEvent(
                region, region.main, 'click',
                lib.bind(mainClick, null, region)
            );

            //鼠标悬浮事件
            helper.addDOMEvent(
                region, region.main, 'mouseover',
                lib.bind(mainMouseOver, null, region)
            );
            //鼠标悬浮事件
            helper.addDOMEvent(
                region, region.main, 'mouseout',
                lib.bind(mainMouseOut, null, region)
            );
        }

        /**
         * 通过value批量选中地域（多选）
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Array} value
         */
        function selectMulti(region, value) {
            // 更新勾选
            var len = value.length;
            var map = {};
            var key;
            while (len--) {
                map[value[len]] = 1;
            }

            for (key in region.regionDataMap) {
                var checkbox = getOptionDOM(region, key);
                checkbox.checked = (key in map);
            }
            // 更新显示信息
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
            return lib.g(helper.getId(region, 'option-' + id));
        }


        /**
         * 更新多选地域的视图和选中值
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object=} data 数据源.
         * @param {number=} dontResetValue 是否重设选中的值.
         * @param {number=} level 更新到的层级.
         */
        function updateMulti(region, data, dontResetValue, level) {
            var level = level || 0;
            data = data || {children: region.regionData};
            // 虽然rawValue可能已经是最新的值了，这里暂时先清空，然后再填值
            // 为了兼容先勾选地域，再更新值的情况
            // 好丑。以后再改！
            if (!dontResetValue) {
                region.rawValue = [];
            }

            var isChecked = true;
            var isItemChecked;
            var selChildLength = 0;

            var checkbox = data.id && getOptionDOM(region, data.id);
            var children = data.children;
            var len = children instanceof Array && children.length;
            if (len) {
                for (var i = 0; i < len; i++) {
                    isItemChecked = updateMulti(
                        region,
                        children[i],
                        1,
                        level + 1
                    );
                    isChecked = isChecked && isItemChecked;
                    if (level == 3) {
                        if (isItemChecked) {
                            selChildLength++;
                        }
                    }
                }

                if (level == 3) {
                    // isProvince
                    if (!isChecked) {
                        updateSelectedTip(region, selChildLength, len, data.id);
                    }
                    else {
                        updateSelectedTip(region, 1, 1, data.id);
                    }
                }

                checkbox && (checkbox.checked = isChecked);
                if (!isNaN(parseInt(data.id, 10))) {
                    isChecked && region.rawValue.push(data.id);
                }
                return isChecked;
            }
            else {

                checkbox && checkbox.checked && region.rawValue.push(data.id);
                return checkbox.checked;
            }
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
            if (selCityIdsLength !== 0 && selCityIdsLength !== cLength) {
                lib.g(helper.getId(region, 'label-' + id)).innerHTML =
                    '(' + selCityIdsLength + '/' + cLength + ')';
            }
            else {
                lib.g(helper.getId(region, 'label-' + id)).innerHTML = '';
            }
        }

        /**
         * 获取选项的html
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Object} data 选项数据.
         * @param {number} level 选项层级.
         * @return {string}
         */
        function getOptionHtml(region, data, level) {
            /**
             * margin-left: 0;
             * font-size: 10px;
             * color: #f00;
             * height: 5px
             * width: 25px;
             *
             */
            var tplOption = [
                '<dt class="${bodyClass}">',
                    '<input type="checkbox" value="${id}" id="${optId}"',
                    ' data-optionId="${id}" data-level="${level}">',
                    '<label for="${optId}">${text}</label>',
                    '<span id="${labelId}"></span>',
                '</dt>'].join('');

            var optionClass = [];
            optionClass.push(
                helper.getPartClasses(region, 'option').join(' '),
                helper.getPartClasses(region, 'option-' + data.id).join(' '),
                helper.getPartClasses(region, 'option-level' + level).join(' ')
            );
            var html = [];
            html.push(
                '<dl class="' + optionClass.join(' ') + '">',
                lib.format(
                    tplOption,
                    {
                        bodyClass: 
                            helper.getPartClasses(
                                region, 'option-body').join(' '),
                        id: data.id,
                        optId: helper.getId(region, 'option-' + data.id),
                        level: level,
                        text: data.text,
                        labelId: helper.getId(region, 'label-' + data.id)
                    }
                )
            );

            var children = data.children;
            var len = children instanceof Array && children.length;
            if (len) {
                //从二级开始采用弹出菜单形式显示三级市区内容
                if (level == 2) {
                    var popId = helper.getId(region, 'option-child-' + data.id);
                    var popClass = helper.getPartClasses(
                        region, 'option-child').join(' ');
                    region.cityCache.push(
                        lib.format(
                            '<div class="ui-hidden ${class}" id="${id}">',
                            {
                                class: popClass,
                                id: popId
                            }
                        ) 
                    );
                }
                else {
                    var childrenClass =
                        helper.getPartClasses(
                            region, 'option-children'
                        ).join(' ');
                    html.push('<dd class="' + childrenClass + '">');
                }

                for (var i = 0; i < len; i++) {
                    if (level == 2) {
                        region.cityCache.push(
                            getOptionHtml(region, children[i], level + 1)
                        );
                    } else {
                        html.push(
                            getOptionHtml(region, children[i], level + 1)
                        );
                    }
                }

                if (level == 2) {
                    region.cityCache.push('</div>');
                }
                else {
                    html.push('</dd>');
                }
            }

            html.push('</dl>');

            return html.join('');
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
            properties.regionDataMap = {};
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
                    properties.regionDataMap[item.id] = item;
                    walker(item.children, item);
                }
            }
        }

        /**
         * 地域元素点击事件
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Event} 触发事件的事件对象
         */
        function mainClick(region, e) {
            if (region.disabled || region.readOnly) {
                return;
            }
            var tar = e.target || e.srcElement;
            while (tar && tar != document.body) {
                if (tar.nodeName.toLowerCase() === 'input') {
                    optionClick(region, tar);
                    return;
                }
                else if (tar.nodeName.toLowerCase() === 'label') {
                    var checkId = tar.getAttribute('for');
                    optionClick(region, lib.g(checkId));
                    return;
                }
                tar = tar.parentNode;
            }
        }

        /**
         * 地域元素点击事件
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {HTMLInputElement} dom 选项checkbox的dom.
         */
        function optionClick(region, dom, dontRefreshView) {  
            var id = dom.getAttribute('data-optionId');
            var data = region.regionDataMap[id];
            var isChecked = dom.checked;
            var children = data.children;
            var len = children instanceof Array && children.length;
            var item;
            var checkbox;

            if (len) {
                while (len--) {
                    item = children[len];
                    checkbox = getOptionDOM(region, item.id);
                    checkbox.checked = isChecked;
                    optionClick(region, checkbox, 1);
                }
            }
            else if (len === 0) {
                //获取第三层checkbox
                if (dom.getAttribute('level') == 3) {
                    var selCityIdsLength = 0;
                    var cityTotalLength =
                        region.regionDataMap[id].parent.children.length;
                    for (var i = 0; i < cityTotalLength; i++) {
                        var child =
                            region.regionDataMap[id].parent.children[i];
                        if (getOptionDOM(child.id).checked === true) {
                            selCityIdsLength++;
                        }
                    }
                    updateSelectedTip(
                        region,
                        selCityIdsLength,
                        cityTotalLength,
                        region.regionDataMap[id].parent.id
                    );
                }
            }

            if (!dontRefreshView) {
                updateMulti(region);
                updateParamValue(region);
            }
        }

        /**
         * 地域元素鼠标悬浮事件
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Event} 触发事件的事件对象
         */
        function mainMouseOver(region, e) {
            if (region.disabled || region.readOnly) {
                return;
            }
            var tar = e.target || e.srcElement;
            var optionChildClass = helper.getPartClasses(
                region, 'option-child');
            while (tar && tar != document.body) {
                var checkbox;
                var optionChildLayer;
                if (tar.nodeName.toLowerCase() === 'input') {
                    checkbox = tar;
                }
                else if (tar.nodeName.toLowerCase() === 'label') {
                    var checkId = tar.getAttribute('for');
                    checkbox = lib.g(checkId);

                }
                else if (lib.hasClass(tar, optionChildClass[0])) {
                    optionChildLayer = tar;
                }
                if (checkbox) {
                    if (checkbox.getAttribute('data-level') == '2') {
                        optionMouseOver(region, checkbox);
                        return;
                    }
                    else if (
                        lib.hasClass(checkbox.parentNode, optionChildClass)
                    ){
                        optionChildLayer = checkbox.parentNode;
                    }
                }
                if (optionChildLayer) {
                    optionMouseOverCity(region, optionChildLayer);
                    return;
                }

                tar = tar.parentNode;
            }
        }

        /**
         * 地域元素鼠标悬浮事件
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {Event} 触发事件的事件对象
         */
        function mainMouseOut(region, e) {
            if (region.disabled || region.readOnly) {
                return;
            }
            var tar = e.target || e.srcElement;
            var optionChildClass = helper.getPartClasses(
                region, 'option-child');
            while (tar && tar != document.body) {
                var checkbox;
                var optionChildLayer;
                if (tar.nodeName.toLowerCase() === 'input') {
                    checkbox = tar;
                }
                else if (tar.nodeName.toLowerCase() === 'label') {
                    var checkId = tar.getAttribute('for');
                    checkbox = lib.g(checkId);
                }
                else if (lib.hasClass(tar, optionChildClass[0])) {
                    optionChildLayer = tar;
                }
                if (checkbox) {
                    if (checkbox.getAttribute('data-level') == '2') {
                        optionMouseOut(region, checkbox);
                        return;
                    }
                    else if (
                        lib.hasClass(checkbox.parentNode, optionChildClass)
                    ){
                        optionChildLayer = checkbox.parentNode;
                    }
                }
                if (optionChildLayer) {
                    optionMouseOutCity(region, optionChildLayer);
                    return;
                }

                tar = tar.parentNode;
            }
        }

        /**
         * 多选选项mouseOver
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {HTMLInputElement} dom 选项checkbox的dom.
         */
        function optionMouseOver(region, dom) {
            var cityDiv = lib.g(dom.id.replace('option', 'option-child'));
            if (!cityDiv) {
                return;
            } 
            var offset = lib.getOffset(dom);
            var parentOffset = lib.getOffset(dom.offsetParent);
            lib.removeClass(cityDiv, 'ui-hidden');
            cityDiv.style.left = (offset.left - parentOffset.left) + 'px';
            cityDiv.style.top = (offset.top - parentOffset.top + 24) + 'px';
            cityDiv.style.border = '1px solid #CCC';

            // ff下offsetParent获取到的是region控件所在div;
            // ie下是省级checkbox所在的dt
            if (lib.ie) {
                var regionDiv = lib.g(region.domId);
                var regionDivPos = lib.getOffset(regionDiv);
                cityDiv.style.left = (pos.left - regionDivPos.left) + 'px';
                cityDiv.style.top = (pos.top - regionDivPos.top + 28) + 'px';
            }
            helper.addPartClasses(region, 'option-level3-over', cityDiv);
        }

        /**
         * 多选选项mouseOut
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {HTMLInputElement} dom 选项checkbox的dom.
         */
        function optionMouseOut(region, dom) {
            var cityDiv = lib.g(dom.id.replace('option', 'option-child'));
            if (!cityDiv) {
              return;
            } 
            lib.addClass(cityDiv, 'ui-hidden');
            helper.removePartClasses(region, 'option-level3-over', cityDiv);
        }

        /**
         * 三级城市弹出层mouseOver
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {HTMLInputElement} dom 弹出层的dom.
         */
        function optionMouseOverCity(region, dom) {
            lib.removeClass(dom, 'ui-hidden');
            helper.addPartClasses(region, 'option-level3-over', dom);
        }

        /**
         * 三级城市弹出层mouseOut
         *
         * @inner
         * @param {Region} region Region控件实例
         * @param {HTMLInputElement} dom 弹出层的dom.
         */
        function optionMouseOutCity(region, dom) {
            lib.addClass(dom, 'ui-hidden');
            helper.removePartClasses(region, 'option-level3-over', dom);
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
            // 遍历素有checkbox，设置为disabled
            var elements =
                region.main.getElementsByTagName('input');
            for (var i = 0, length = elements.length; i < length; i++) {
                var item = elements[i];
                if (item.getAttribute('type') == 'checkbox') {
                    item.disabled = disabled;
                }
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
                    cityCache: [],
                    rawValue: []
                };
                lib.extend(properties, options);

                if (properties.mode == 'multi') {
                    //增加map型地域数据
                    initMultiData(this, properties);
                }
                else {
                    //增加单选型地域数据
                    initSingleData(this, properties);
                }
                this.setProperties(properties);
            },


            /**
             * 初始化DOM结构
             * ，
             * @protected
             */
            initStructure: function () {
                // 如果主元素不是`<div>`，替换成`<div>`
                if (this.main.nodeName.toLowerCase() !== 'div') {
                    var main = this.createMain();
                    lib.insertBefore(main, this.main);
                    this.main.parentNode.removeChild(this.main);
                    this.main = main;
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
             * 创建控件主元素
             *
             * @param {Object=} options 构造函数传入的参数
             * @return {HTMLElement}
             * @override
             */
            createMain: function (options) {
                return document.createElement('DIV');
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: helper.createRepaint(
                {
                    name: 'rawValue',
                    paint: function (region, value) {
                        if (region.disabled || region.readOnly) {
                            return;
                        }
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
                        if (disabled || readOnly) {
                            changeToDisabled(region, true);
                            if (disabled) {
                                // 隐藏input也要置为disabled
                                var input =
                                    lib.g(helper.getId(region, 'param-value'));
                                input.disabled = disabled;
                            }
                        }
                    }
                }
            ),

            /**
             * 设置日期
             *
             * @param {Array} value 选取的地域.
             */
            setRawValue: function (value) {
                this.setProperties({ 'rawValue': value });
            },

            /**
             * 获取选取日期值
             * 
             * @return {Date} 
             */
            getRawValue: function () {
                return this.rawValue;
            },

            /**
             * 获取日期字符串
             * 
             * @return {string} 
             */
            getValue: function () {
                return '';
            }
        };

        /* jshint maxlen: 600 */
        Region.REGION_LIST=[{id:'China',text:'中国地区',children:[{id:'North',text:'华北地区',children:[{id:'1',text:'北京',children:[{text:'东城区',id:378},{text:'西城区',id:379},{text:'崇文区',id:380},{text:'宣武区',id:381},{text:'朝阳区',id:382},{text:'丰台区',id:383},{text:'石景山区',id:384},{text:'海淀区',id:385},{text:'门头沟区',id:386},{text:'房山区',id:387},{text:'通州区',id:388},{text:'顺义区',id:389},{text:'昌平区',id:390},{text:'大兴区',id:391},{text:'怀柔区',id:392},{text:'平谷区',id:393},{text:'密云县',id:394},{text:'延庆县',id:395}]},{id:'3',text:'天津',children:[{text:'和平区',
id:415},{text:'河东区',id:416},{text:'河西区',id:417},{text:'南开区',id:418},{text:'河北区',id:419},{text:'红桥区',id:420},{text:'塘沽区',id:421},{text:'汉沽区',id:422},{text:'大港区',id:423},{text:'东丽区',id:424},{text:'西青区',id:425},{text:'津南区',id:426},{text:'北辰区',id:427},{text:'武清区',id:428},{text:'宝坻区',id:429},{text:'宁河县',id:430},{text:'静海县',id:431},{text:'蓟县',id:432},{text:'滨海',id:475}]},{id:'13',text:'河北',children:[{text:'保定市',id:304},{text:'沧州市',id:305},{text:'承德市',id:306},{text:'廊坊市',id:307},{text:'秦皇岛市',id:325},{text:'邢台市',
id:326},{text:'石家庄市',id:327},{text:'唐山市',id:329},{text:'邯郸市',id:330},{text:'张家口市',id:331},{text:'衡水市',id:332}]},{id:'26',text:'山西',children:[{text:'晋城市',id:205},{text:'晋中市',id:206},{text:'长治市',id:209},{text:'吕梁市',id:210},{text:'临汾市',id:211},{text:'忻州市',id:212},{text:'朔州市',id:213},{text:'太原市',id:214},{text:'阳泉市',id:215},{text:'运城市',id:216},{text:'大同市',id:217}]},{id:'22',text:'内蒙古',children:[{text:'赤峰市',id:158},{text:'阿拉善盟',id:159},{text:'兴安盟',id:160},{text:'通辽市',id:161},{text:'巴彦淖尔市',id:162},{text:'乌兰察布市',
id:163},{text:'乌海市',id:164},{text:'锡林郭勒盟',id:165},{text:'呼伦贝尔市',id:166},{text:'呼和浩特市',id:167},{text:'鄂尔多斯市',id:168},{text:'包头市',id:169}]}]},{id:'NorthEast',text:'东北地区',children:[{id:'21',text:'辽宁',children:[{text:'丹东市',id:144},{text:'本溪市',id:145},{text:'锦州市',id:146},{text:'朝阳市',id:147},{text:'辽阳市',id:148},{text:'盘锦市',id:149},{text:'阜新市',id:150},{text:'鞍山市',id:151},{text:'抚顺市',id:152},{text:'沈阳市',id:153},{text:'铁岭市',id:154},{text:'大连市',id:155},{text:'营口市',id:156},{text:'葫芦岛市',id:157}]},{id:'18',text:'吉林',
children:[{text:'吉林市',id:38},{text:'白城市',id:39},{text:'长春市',id:40},{text:'辽源市',id:41},{text:'白山市',id:42},{text:'四平市',id:43},{text:'松原市',id:44},{text:'通化市',id:45},{text:'延吉市',id:46},{text:'延边朝鲜族自治州',id:47}]},{id:'15',text:'黑龙江',children:[{text:'鸡西市',id:333},{text:'佳木斯市',id:334},{text:'哈尔滨市',id:335},{text:'牡丹江市',id:336},{text:'齐齐哈尔市',id:337},{text:'七台河市',id:338},{text:'绥化市',id:339},{text:'双鸭山市',id:340},{text:'伊春市',id:341},{text:'大庆市',id:342},{text:'大兴安岭地区',id:343},{text:'鹤岗市',id:344},{text:'黑河市',id:345}]}]},
{id:'East',text:'华东地区',children:[{id:'2',text:'上海',children:[{text:'黄浦区',id:396},{text:'卢湾区',id:397},{text:'徐汇区',id:398},{text:'长宁区',id:399},{text:'静安区',id:400},{text:'普陀区',id:401},{text:'闸北区',id:402},{text:'虹口区',id:403},{text:'杨浦区',id:404},{text:'闵行区',id:405},{text:'宝山区',id:406},{text:'嘉定区',id:407},{text:'浦东新区',id:408},{text:'金山区',id:409},{text:'松江区',id:410},{text:'青浦区',id:411},{text:'南汇区',id:412},{text:'奉贤区',id:413},{text:'崇明县',id:414}]},{id:'19',text:'江苏',children:[{text:'淮安市',id:53},{text:'常州市',
id:54},{text:'南京市',id:55},{text:'南通市',id:56},{text:'连云港市',id:57},{text:'徐州市',id:58},{text:'苏州市',id:59},{text:'宿迁市',id:60},{text:'泰州市',id:61},{text:'无锡市',id:62},{text:'盐城市',id:63},{text:'扬州市',id:64},{text:'镇江市',id:65}]},{id:'32',text:'浙江',children:[{text:'金华市',id:272},{text:'嘉兴市',id:273},{text:'衢州市',id:274},{text:'丽水市',id:275},{text:'宁波市',id:276},{text:'绍兴市',id:277},{text:'温州市',id:278},{text:'台州市',id:279},{text:'杭州市',id:280},{text:'舟山市',id:281},{text:'湖州市',id:282}]},{id:'9',text:'安徽',children:[{text:'淮北市',
id:127},{text:'安庆市',id:128},{text:'巢湖市',id:129},{text:'池州市',id:130},{text:'滁州市',id:131},{text:'黄山市',id:132},{text:'淮南市',id:133},{text:'马鞍山市',id:134},{text:'六安市',id:135},{text:'宣城市',id:136},{text:'宿州市',id:137},{text:'铜陵市',id:138},{text:'芜湖市',id:139},{text:'阜阳市',id:140},{text:'蚌埠市',id:141},{text:'合肥市',id:142},{text:'亳州市',id:143}]},{id:'5',text:'福建',children:[{text:'福州市',id:81},{text:'龙岩市',id:50},{text:'南平市',id:49},{text:'宁德市',id:51},{text:'莆田市',id:48},{text:'泉州市',id:52},{text:'三明市',id:66},{text:'厦门市',
id:70},{text:'漳州市',id:80}]},{id:'20',text:'江西',children:[{text:'九江市',id:67},{text:'吉安市',id:68},{text:'景德镇市',id:69},{text:'萍乡市',id:71},{text:'南昌市',id:72},{text:'新余市',id:73},{text:'上饶市',id:74},{text:'宜春市',id:75},{text:'鹰潭市',id:76},{text:'赣州市',id:77},{text:'抚州市',id:78}]},{id:'25',text:'山东',children:[{text:'济南市',id:196},{text:'济宁市',id:197},{text:'莱芜市',id:198},{text:'聊城市',id:199},{text:'德州市',id:200},{text:'临沂市',id:201},{text:'青岛市',id:202},{text:'日照市',id:203},{text:'潍坊市',id:204},{text:'淄博市',id:207},{text:'泰安市',
id:208},{text:'威海市',id:218},{text:'烟台市',id:219},{text:'东营市',id:220},{text:'枣庄市',id:221},{text:'菏泽市',id:222},{text:'滨州市',id:223}]}]},{id:'Middle',text:'华中地区',children:[{id:'14',text:'河南',children:[{text:'焦作市',id:308},{text:'安阳市',id:309},{text:'开封市',id:310},{text:'洛阳市',id:311},{text:'漯河市',id:312},{text:'鹤壁市',id:323},{text:'南阳市',id:315},{text:'平顶山市',id:313},{text:'濮阳市',id:316},{text:'三门峡市',id:321},{text:'商丘市',id:320},{text:'新乡市',id:317},{text:'信阳市',id:318},{text:'许昌市',id:319},{text:'郑州市',id:322},{text:'周口市',
id:324},{text:'驻马店市',id:314}]},{id:'16',text:'湖北',children:[{text:'荆门市',id:346},{text:'荆州市',id:347},{text:'黄石市',id:348},{text:'黄冈市',id:349},{text:'潜江市',id:364},{text:'孝感市',id:365},{text:'恩施市',id:366},{text:'随州市',id:367},{text:'神农架林区',id:368},{text:'十堰市',id:369},{text:'襄樊市',id:370},{text:'武汉',id:371},{text:'仙桃市',id:372},{text:'天门市',id:373},{text:'咸宁市',id:375},{text:'宜昌市',id:376},{text:'鄂州市',id:377}]},{id:'17',text:'湖南',children:[{text:'怀化市',id:350},{text:'常德市',id:351},{text:'长沙市',id:352},{text:'郴州市',
id:353},{text:'娄底市',id:354},{text:'邵阳市',id:355},{text:'湘潭市',id:356},{text:'湘西土家族苗族自治州',id:357},{text:'张家界市',id:358},{text:'益阳市',id:359},{text:'衡阳市',id:360},{text:'岳阳市',id:361},{text:'永州市',id:362},{text:'株洲市',id:363}]}]},{id:'South',text:'华南地区',children:[{id:'4',text:'广东',children:[{text:'江门市',id:82},{text:'揭阳市',id:83},{text:'广州市',id:84},{text:'潮州市',id:85},{text:'茂名市',id:86},{text:'梅州市',id:88},{text:'清远市',id:89},{text:'佛山市',id:90},{text:'汕头市',id:91},{text:'汕尾市',id:92},{text:'深圳市',id:93},{text:'韶关市',
id:94},{text:'阳江市',id:109},{text:'湛江市',id:110},{text:'云浮市',id:111},{text:'中山市',id:112},{text:'珠海市',id:113},{text:'肇庆市',id:114},{text:'河源市',id:115},{text:'东莞市',id:116},{text:'惠州市',id:117}]},{id:'8',text:'海南',children:[{text:'东方市',id:296},{text:'琼海市',id:297},{text:'三亚市',id:298},{text:'文昌市',id:299},{text:'五指山',id:300},{text:'万宁',id:301},{text:'海口市',id:302},{text:'儋州市',id:303}]},{id:'12',text:'广西',children:[{text:'桂林市',id:95},{text:'贵港市',id:96},{text:'防城港市',id:98},{text:'南宁市',id:99},{text:'来宾市',id:100},
{text:'柳州市',id:101},{text:'钦州市',id:102},{text:'梧州市',id:103},{text:'北海市',id:104},{text:'玉林市',id:105},{text:'河池市',id:106},{text:'贺州市',id:107},{text:'百色市',id:108}]}]},{id:'SouthWest',text:'西南地区',children:[{id:'33',text:'重庆',children:[{id:433,text:'渝中'},{id:434,text:'大渡口'},{id:435,text:'江北'},{id:436,text:'沙坪坝'},{id:437,text:'九龙坡'},{id:438,text:'南岸'},{id:439,text:'北碚'},{id:440,text:'万盛'},{id:441,text:'双桥'},{id:442,text:'渝北'},{id:443,text:'巴南'},{id:444,text:'万州'},{id:445,text:'涪陵'},{id:446,text:'黔江'},{id:447,
text:'长寿'},{id:448,text:'江津'},{id:449,text:'合川'},{id:450,text:'永川'},{id:451,text:'南川'},{id:452,text:'綦江'},{id:453,text:'潼南'},{id:454,text:'铜梁'},{id:455,text:'大足'},{id:456,text:'荣昌'},{id:457,text:'璧山'},{id:458,text:'梁平'},{id:459,text:'城口'},{id:460,text:'丰都'},{id:461,text:'垫江'},{id:462,text:'武隆'},{id:463,text:'忠县'},{id:464,text:'开县'},{id:465,text:'云阳'},{id:466,text:'奉节'},{id:467,text:'巫山'},{id:468,text:'巫溪'},{id:469,text:'石柱'},{id:470,text:'秀山'},{id:471,text:'酉阳'},{id:472,text:'彭水'}]},{id:'28',text:'四川',
children:[{id:224,text:'广安'},{id:225,text:'广元'},{id:226,text:'成都'},{id:227,text:'眉山'},{id:228,text:'凉山'},{id:229,text:'绵阳'},{id:230,text:'攀枝花'},{id:231,text:'南充'},{id:232,text:'德阳'},{id:233,text:'乐山'},{id:234,text:'泸州'},{id:235,text:'内江'},{id:236,text:'甘孜'},{id:237,text:'遂宁'},{id:238,text:'资阳'},{id:247,text:'巴中'},{id:250,text:'达州'},{id:251,text:'雅安'},{id:252,text:'阿坝'},{id:253,text:'自贡'},{id:254,text:'宜宾'}]},{id:'10',text:'贵州',children:[{id:118,text:'贵阳'},{id:119,text:'安顺'},{id:120,text:'六盘水'},{id:121,
text:'黔南'},{id:122,text:'黔东南'},{id:123,text:'黔西南'},{id:124,text:'毕节'},{id:125,text:'铜仁'},{id:126,text:'遵义'}]},{id:'31',text:'云南',children:[{id:283,text:'楚雄'},{id:284,text:'昆明'},{id:285,text:'丽江'},{id:286,text:'德宏'},{id:287,text:'临沧'},{id:288,text:'曲靖'},{id:289,text:'保山'},{id:290,text:'普洱'},{id:291,text:'文山'},{id:292,text:'大理'},{id:293,text:'红河'},{id:294,text:'昭通'},{id:295,text:'玉溪市'}]},{id:'29',text:'西藏',children:[{text:'拉萨市',id:269},{text:'林芝地区',id:270},{text:'那曲地区',id:268},{text:'日喀则地区',id:271}]}]},
{id:'NorthWest',text:'西北地区',children:[{id:'27',text:'陕西',children:[{id:239,text:'宝鸡'},{id:240,text:'安康'},{id:241,text:'商洛'},{id:242,text:'铜川'},{id:243,text:'渭南'},{id:244,text:'西安'},{id:245,text:'咸阳'},{id:246,text:'延安'},{id:248,text:'汉中'},{id:249,text:'榆林'}]},{id:'11',text:'甘肃',children:[{id:255,text:'酒泉'},{id:256,text:'金昌'},{id:257,text:'嘉峪关'},{id:258,text:'兰州'},{id:259,text:'陇南'},{id:260,text:'平凉'},{id:261,text:'临夏'},{id:262,text:'庆阳'},{id:263,text:'定西'},{id:264,text:'武威'},{id:265,text:'天水'},{id:266,
text:'张掖'},{id:267,text:'白银'}]},{id:'24',text:'青海',children:[{text:'海东地区',id:176},{text:'海西蒙古族藏族自治州',id:177},{text:'西宁市',id:175},{text:'玉树藏族自治州',id:178}]},{id:'23',text:'宁夏',children:[{text:'固原市',id:170},{text:'石嘴山市',id:171},{text:'吴忠市',id:172},{text:'银川市',id:174},{text:'中卫市',id:173}]},{id:'30',text:'新疆',children:[{id:179,text:'哈密'},{id:180,text:'博尔塔拉'},{id:181,text:'昌吉'},{id:182,text:'阿勒泰'},{id:183,text:'喀什'},{id:184,text:'克拉玛依'},{id:185,text:'阿克苏'},{id:186,text:'克孜勒苏柯尔克孜'},{id:187,text:'石河子'},{id:188,
text:'塔城'},{id:189,text:'五家渠'},{id:190,text:'吐鲁番'},{id:191,text:'巴音郭楞'},{id:192,text:'乌鲁木齐'},{id:193,text:'伊犁'},{id:195,text:'和田'}]}]},{id:'Other',text:'其他地区',children:[{id:'34',text:'香港'},{id:'36',text:'澳门'},{id:'35',text:'台湾'}]}]},{id:'Abroad',text:'国外',children:[{id:'7',text:'日本'},{id:'37',text:'其他国家'}]}];

        lib.inherits(Region, InputControl);
        ui.register(Region);
        return Region;
    }
);
