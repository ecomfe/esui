/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 表格控件
 * @author wurongyao
 */
define(
    function (require) {
        var eoo = require('eoo');
        var esui = require('./main');
        var lib = require('./lib');
        var u = require('underscore');
        var Control = require('./Control');
        var painters = require('./painters');
        var $ = require('jquery');

        require('./behavior/mouseproxy');
        require('./Tip');

        /**
         * dom表格起始的html模板
         */
        var tplTablePrefix = '<table cellpadding="0" cellspacing="0" '
            + 'width="${width}" data-control-table="${controlTableId}">';

        var tplRowPrefix = '<div id="${id}" class="${className}" data-index="${index}" ${attr}>';

        /**
         * 表格控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        var Table = eoo.create(
            Control,
            {
                constructor: function (options) {
                    var protectedProperties = {
                        followHeightArr: [0, 0],
                        followWidthArr: [],
                        handlers: []
                    };

                    this.$super([u.extend({}, options, protectedProperties)]);
                },

                /**
                 * 控件类型
                 *
                 * @type {string}
                 */
                type: 'Table',

                /**
                 * 初始化参数
                 *
                 * @param {Object} options 构造函数传入的参数
                 * @override
                 * @protected
                 */
                initOptions: function (options) {
                    /**
                     * 默认Table选项配置
                     *
                     * @const
                     * @inner
                     * @type {Object}
                     */
                    var properties = {};

                    u.extend(properties, Table.defaultProperties, options);

                    this.setProperties(properties);
                },

                /**
                 * 初始化DOM结构
                 *
                 * @override
                 * @protected
                 */
                initStructure: function () {
                    this.realWidth = getWidth(this);
                    if (this.realWidth) {
                        this.main.style.width = this.realWidth + 'px';
                    }

                    resetMainZIndex(this);

                    initBaseBuilderList(this);
                    initResizeHandler(this);
                    initMainEventhandler(this);
                },

                /**
                 * 渲染控件
                 *
                 * @override
                 */
                repaint: function (changes, changesIndex) {
                    this.$super(arguments);
                     // 初始化控件主元素上的行为
                    var table = this;
                    if (!table.realWidth) {
                        table.realWidth = getWidth(table);
                        if (table.realWidth) {
                            table.main.style.width = table.realWidth + 'px';
                        }
                    }
                    var defaultProperties = Table.defaultProperties;
                    var allProperities = {};

                    if (!changes) {
                        for (var property in defaultProperties) {
                            if (defaultProperties.hasOwnProperty(property)) {
                                allProperities[property] = true;
                            }
                        }
                    }
                    // 局部渲染
                    else {
                        for (var i = 0; i < changes.length; i++) {
                            var record = changes[i];
                            allProperities[record.name] = true;
                        }
                    }

                    var fieldsChanged = false;
                    var colsWidthChanged = false;
                    var tbodyChange = false;

                    if (allProperities.fields
                        || allProperities.select
                        || allProperities.selectMode
                        || allProperities.sortable
                    ) {
                        initFields(table);
                        fieldsChanged = true;
                    }
                    if (fieldsChanged
                        || allProperities.breakLine
                        || allProperities.colPadding
                        || allProperities.fontSize
                    ) {
                        initMinColsWidth(table);
                        initColsWidth(table);
                        colsWidthChanged = true;
                    }
                    if (fieldsChanged
                        || colsWidthChanged
                        || allProperities.noHead
                        || allProperities.order
                        || allProperities.orderBy
                        || allProperities.selectedIndex
                    ) {
                        renderHead(table);
                    }
                    if (allProperities.followHead
                        || allProperities.noFollowHeadCache) {
                        initFollowHead(table);
                        initTopResetHandler(table);
                    }
                    if (fieldsChanged
                        || colsWidthChanged
                        || allProperities.neck
                    ) {
                        renderNeck(table);
                    }
                    if (fieldsChanged
                        || colsWidthChanged
                        || allProperities.encode
                        || allProperities.noDataHtml
                        || allProperities.datasource
                        || allProperities.selectedIndex
                    ) {
                        renderBody(table);
                        tbodyChange = true;
                    }
                    if (tbodyChange
                        || allProperities.bodyMaxHeight) {
                        updateBodyMaxHeight(table);
                    }
                    if (fieldsChanged
                        || colsWidthChanged
                        || allProperities.foot
                    ) {
                        renderFoot(table);
                    }

                    table.extraRepaint = painters.createRepaint(
                        [
                            {
                                name: 'disabled',
                                paint: setDisabledStyle
                            },
                            {

                                name: 'width',
                                paint: handleResize
                            },
                            {
                                name: 'zIndex',
                                paint: resetMainZIndex
                            }
                        ]
                    );
                    table.extraRepaint(changes, changesIndex);

                    // 如果未绘制过，初始化resize处理
                    if (tbodyChange
                        && table.helper.isInStage('RENDERED')) {
                        // 重绘时触发onselect事件
                        switch (table.select) {
                            case 'multi':
                                setSelectedIndex(table, []);
                                table.fire(
                                    'select',
                                    {selectedIndex: table.selectedIndex}
                                );
                                break;
                        }
                    }

                    // 如果表格的绘制导致浏览器出现纵向滚动条
                    // 需要重新计算各列宽度
                    if (table.realWidth !== getWidth(table)) {
                        handleResize(table);
                    }
                },

                /**
                 * 获取表格相关ID
                 *
                 * @protected
                 * @param {number} id 转换前id
                 * @return {string}
                 */
                getId: function (id) {
                    return getId(this, id);
                },

                getBodyCellId: function (rowIndex, fieldIndex) {
                    return getBodyCellId(this, rowIndex, fieldIndex);
                },

                /**
                 * 设置单元格的文字
                 *
                 * @public
                 * @param {string} text 要设置的文字
                 * @param {string} rowIndex 行序号
                 * @param {string} columnIndex 列序号
                 * @param {boolean=} isEncodeHtml 是否需要进行html转义
                 */
                setCellText: function (text, rowIndex, columnIndex, isEncodeHtml) {
                    if (isEncodeHtml) {
                        text = u.escape(text);
                    }
                    text = isNullOrEmpty(text) ? '&nbsp' : text;

                    lib.g(
                        getId(
                            this, 'cell-textfield-' + rowIndex + '-' + columnIndex
                        )
                    ).innerHTML = text;
                },

                /**
                 * 获取表格相关ClassName
                 *
                 * @protected
                 * @param {string} name class name
                 * @return {string}
                 */
                getClass: function (name) {
                    return getClass(this, name);
                },

                /**
                 * 初始化表格体子控件
                 *
                 * @protected
                 * @param {number} index 行数
                 * @return {Element}
                 */
                getRow: function (index) {
                    return getRow(this, index);
                },

                /**
                 * 获取表格行的html
                 *
                 * @private
                 * @param {ui.Table} table table控件实例
                 * @param {Object} data 当前行的数据
                 * @param {number} index 当前行的序号
                 * @param {Array} builderList rowBuilder数组
                 * @return {string}
                 */
                getRowHtml: function (table, data, index, builderList) {
                    var html = [];
                    var fields = table.realFields;
                    var rowWidthOffset = table.rowWidthOffset;

                    var extraArgsList = [];
                    var rowClass = [];
                    var rowAttr = [];

                    for (var i = 0, l = builderList.length; i < l; i++) {
                        var builder = builderList[i];
                        var rowArgs = builder.getRowArgs
                                    ? builder.getRowArgs(table, index) || {}
                                    : {};

                        extraArgsList.push(rowArgs);

                        (rowArgs.rowClass) && (rowClass.push(rowArgs.rowClass));
                        (rowArgs.rowAttr) && (rowAttr.push(rowArgs.rowAttr));
                    }

                    function sortByIndex(a, b) {
                        return a.index - b.index;
                    }

                    u.each(fields, function (field, i) {
                        var colWidth = table.colsWidth[i];
                        var colClass = [];
                        var textClass = [];
                        var colAttr = [];
                        var textAttr = [];
                        var textHtml = [];
                        var allHtml = [];
                        var textStartIndex = -1;

                        for (var s = 0, t = builderList.length; s < t; s++) {
                            var colResult = builderList[s].getColHtml(
                                table, data, field, index, i, extraArgsList[s]
                            );
                            if (!colResult) {
                                continue;
                            }

                            var colHtml = colResult.html;
                            if (colResult.colClass) {
                                colClass.push(colResult.colClass);
                            }
                            if (colResult.textClass) {
                                textClass.push(colResult.textClass);
                            }
                            if (colResult.colAttr) {
                                colAttr.push(colResult.colAttr);
                            }
                            if (colResult.textAttr) {
                                textAttr.push(colResult.textAttr);
                            }

                            if (hasValue(colHtml)) {
                                if (colResult.notInText) {
                                    colResult.index = s;
                                    allHtml.push(colResult);
                                }
                                else {
                                    textHtml.push(colHtml);
                                    (textStartIndex < 0) && (textStartIndex = s);
                                }
                            }
                        }

                        var contentHtml;
                        textHtml = [
                            '<div class="' + textClass.join(' ') + '" ',
                            textAttr.join(' ') + '>',
                                textHtml.join(''),
                            '</div>'
                        ].join('');

                        allHtml.push({html: textHtml, index: textStartIndex});
                        allHtml.sort(sortByIndex);

                        if (allHtml.length > 1) {
                            contentHtml = [
                                '<table width="100%" cellpadding="0" cellspacing="0">',
                                    '<tr>'
                            ];

                            for (s = 0, t = allHtml.length; s < t; s++) {
                                var aHtml = allHtml[s];
                                contentHtml.push(
                                    '<td ',
                                        hasValue(aHtml.width)
                                        ? ' width="' + aHtml.width + '" '
                                        : '',
                                        aHtml.align
                                        ? ' align="' + aHtml.align + '">'
                                        : '>',
                                            aHtml.html,
                                    '</td>'
                                );
                            }

                            contentHtml.push('</tr></table>');

                            contentHtml = contentHtml.join('');
                        }
                        else {
                            contentHtml = textHtml;
                        }

                        html.push(
                            '<td id="' + getBodyCellId(table, index, i) + '" ',
                            'class="' + colClass.join(' ')  + '" ',
                            colAttr.join(' ') + ' ',
                            'style="width:' + (colWidth + rowWidthOffset) + 'px;',
                            (colWidth ? '' : 'display:none') + '" ',
                            'data-control-table="' + table.id + '" ',
                            'data-row="' + index + '" data-col="' + i + '">',
                            contentHtml,
                            '</td>'
                        );
                    });

                    html.unshift(
                        lib.format(
                            tplRowPrefix,
                            {
                                id: getId(table, 'row') + index,
                                className: rowClass.join(' '),
                                attr: rowAttr.join(' '),
                                index: index
                            }
                        ),
                        lib.format(
                            tplTablePrefix,
                            {width: '100%', controlTableId: table.id}
                        )
                    );

                    html.push('</tr></table></div>');

                    if (table.hasSubrow) {
                        for (i = 0, l = builderList.length; i < l; i++) {
                            var subrowBuilder = builderList[i].getSubrowHtml;
                            if (subrowBuilder) {
                                html.push(
                                    subrowBuilder(table, index, extraArgsList[i])
                                );
                            }
                        }
                    }

                    return html.join('');
                },

                /**
                 * 添加表格插件
                 *
                 * @protected
                 * @param {Array} builders rowBuilder数组
                 */
                addRowBuilders: function (builders) {
                    addRowBuilderList(this, builders);
                },

                /**
                 * 添加table主元素上事件委托
                 *
                 * @public
                 * @param {string} eventType 事件类型
                 * @param {Array} handlers 处理函数数组或单个函数
                 *
                 * @return {Array} 事件委托处理函数数组
                 */
                addHandlers: function (eventType, handlers) {
                    if (!handlers.length) {
                        handlers = [handlers];
                    }

                    return addHandlers(this, this.main, eventType, handlers);
                },

                /**
                 * 删除table主元素上事件委托
                 *
                 * @public
                 * @param {string} eventType 事件类型
                 * @param {Array} handlers 处理函数数组或单个函数
                 */
                removeHandlers: function (eventType, handlers) {
                    if (!handlers.length) {
                        handlers = [handlers];
                    }

                    removeHandlers(this, this.main, eventType, handlers);
                },

                 /**
                 * 自适应表格宽度
                 *
                 * @public
                 */
                adjustWidth: function () {
                    handleResize(this);
                },

                /**
                 * 设置Table的datasource，并强制更新
                 *
                 * @public
                 * @param {Object} datasource 数据源
                 */
                setDatasource: function (datasource) {
                    this.datasource = datasource;
                    setSelectedIndex(this, []);
                    var record = {name: 'datasource'};
                    var record2 = {name: 'selectedIndex'};

                    if (this.helper.isInStage('RENDERED')) {
                        this.repaint([record, record2],
                            {
                                datasource: record,
                                selectedIndex: record2
                            }
                        );
                    }
                },

                /**
                 * 重新绘制Table某行
                 *
                 * @param {number} index 行数
                 * @param {Object} data 该行对应的数据源
                 * @public
                 */
                updateRowAt: function (index, data) {
                    (data) && (this.datasource[index] = data);
                    var dataItem = this.datasource[index];
                    var rowEl = getRow(this, index);

                    if (dataItem && rowEl) {
                        this.fire(
                            'beforerowupdate',
                            {index: index, data: dataItem}
                        );

                        var container = document.createElement('div');
                        container.innerHTML = this.getRowHtml(
                            this, data, index, this.rowBuilderList
                        );
                        var newRowEl = container.children[0];

                        rowEl.parentNode.replaceChild(newRowEl, rowEl);

                        this.fire(
                            'afterrowupdate',
                            {index: index, data: dataItem}
                        );
                    }
                },

                 /**
                 * 获取Table的选中数据项
                 *
                 * @public
                 * @return {Array}
                 */
                getSelectedItems: function () {
                    var selectedIndex = this.selectedIndex;
                    var result = [];
                    if (selectedIndex) {
                        var datasource = this.datasource;
                        if (datasource) {
                            for (var i = 0; i < selectedIndex.length; i++) {
                                result.push(datasource[selectedIndex[i]]);
                            }
                        }
                    }
                    return result;
                },

                /**
                 * 设置行选中
                 *
                 * @param {number|Array} index 行号
                 * @param {boolean} isSelected 是否选中
                 * @public
                 */
                setRowSelected: function (index, isSelected) {
                    var table = this;
                    var isMutil = table.select === 'multi';
                    var selectedHandler = isMutil ? selectMulti : selectSingle;

                    if (u.isArray(index)) {
                        if (isMutil) {
                            u.each(index, function (value) {
                                selectedHandler(table, value, isSelected);
                            });
                        }
                        else {
                            selectedHandler(table, index[0], isSelected);
                        }
                    }
                    else {
                        selectedHandler(table, index, isSelected);
                    }

                    if (isMutil) {
                        resetMutilSelectedStatus(table);
                    }
                },

                /**
                 * 设置所有行选中
                 *
                 * @param {boolean} isSelected 是否选中
                 * @public
                 */
                setAllRowSelected: function (isSelected) {
                    this.setRowSelected(-1, isSelected);
                },

                /**
                 * 重置表头跟随设置
                 *
                 * @public
                 */
                resetFollowHead: function () {
                    resetFollowHead(this);
                },

                /**
                 * 销毁释放控件
                 *
                 * @override
                 */
                dispose: function () {
                    var helper = this.helper;
                    if (helper.isInStage('DISPOSED')) {
                        return;
                    }

                    helper.beforeDispose();
                    var main = this.main;
                    if (main) {
                        // 释放表头跟随的元素引用
                        this.followDoms = null;

                        $('#' + getId(this, 'drag-mark')).remove();
                    }

                    this.rowBuilderList = null;

                    this.headPanel.disposeChildren();
                    this.bodyPanel.disposeChildren();

                    this.headPanel = null;
                    this.bodyPanel = null;

                    helper.dispose();
                    helper.afterDispose();
                }
            }
        );

        /**
         * 默认属性值
         *
         * @type {Object}
         * @public
         */
        Table.defaultProperties = {
            noDataHtml: '没有数据',
            subEntryOpenTip: '点击展开',
            subEntryCloseTip: '点击收起',
            noFollowHeadCache: false,
            followHead: false,
            sortable: false,
            encode: false,
            columnResizable: false,
            rowWidthOffset: -1,
            select: '',
            selectMode: 'box',
            subrowMutex: 1,
            subEntryWidth: 18,
            breakLine: false,
            hasTip: false,
            hasSubrow: false,
            tipWidth: 18,
            sortWidth: 9,
            fontSize: 13,
            colPadding: 8,
            zIndex: 0,
            overflowX: 'hidden'
        };

        /**
         * 判断值是否为空
         *
         * @private
         * @param {Object} obj 要判断的值
         * @return {bool}
         */
        function hasValue(obj) {
            return !(typeof obj === 'undefined' || obj === null);
        }

        /**
         * 判断值是否为空,包括空字符串
         *
         * @private
         * @param {Object} obj 要判断的值
         * @return {bool}
         */
        function isNullOrEmpty(obj) {
            return !hasValue(obj) || !obj.toString().length;
        }

        /**
         * 设置元素属性 自动加上data-前缀
         *
         * @private
         * @param {Element} element 要设置的元素
         * @param {string} key 属性名
         * @param {string} value 属性值
         */
        function setAttr(element, key, value) {
            lib.setAttribute(element, 'data-' + key, value);
        }

        /**
         * 获取dom带有data-前缀的属性值
         *
         * @private
         * @param {Element} element 要设置的元素
         * @param {string} key 属性名
         * @return {string}
         */
        function getAttr(element, key) {
            return lib.getAttribute(element, 'data-' + key);
        }

        /**
         * 获取element的样式
         *
         * @param {Element} element 要获取样式的元素
         * @param {string} styleName 样式名称
         * @private
         * @return {string}
         */
        function getStyleNum(element, styleName) {
            var result = lib.getStyle(element, styleName);
            return (result === '' ? 0 : (parseInt(result, 10) || 0));
        }

        /**
         * 获取Id
         *
         * @protected
         * @param {ui.Table} table table控件实例
         * @param {string} name 转换前id
         * @return {string}
         *
         */
        function getId(table, name) {
            return table.helper.getId(name);
        }

        /**
         * 获取dom子部件的css class
         *
         * @protected
         * @param {ui.Table} table table控件实例
         * @param {string} name 转换前class
         * @return {string}
         */
        function getClass(table, name) {
            return table.helper.getPartClasses(name).join(' ');
        }

        /**
         * 获取列表头容器元素
         *
         * @public
         * @param {ui.Table} table table控件实例
         * @return {Element}
         */
        function getHead(table) {
            return lib.g(getId(table, 'head'));
        }

        /**
         * 获取列表首容器元素
         *
         * @public
         * @param {ui.Table} table table控件实例
         * @return {Element}
         */
        function getNeck(table) {
            var neck = lib.g(getId(table, 'neck'));
            if (!(table.neck instanceof Array)) {
                neck && (neck.style.display = 'none');
                return null;
            }

            if (!neck) {
                neck = document.createElement('div');
                neck.id = getId(table, 'neck');
                neck.className = getClass(table, 'neck');
                setAttr(neck, 'control-table', table.id);

                table.main.appendChild(neck);
            }
            return neck;
        }

        /**
         * 获取列表体容器素
         *
         * @public
         * @param {ui.Table} table table控件实例
         * @return {Element}
         */
        function getBody(table) {
            return lib.g(getId(table, 'body'));
        }

        /**
         * 获取列表尾容器元素
         *
         * @public
         * @param {ui.Table} table table控件实例
         * @return {Element}
         */
        function getFoot(table) {
            var foot = lib.g(getId(table, 'foot'));
            if (!(table.foot instanceof Array)) {
                foot && (foot.style.display = 'none');
                return null;
            }

            if (!foot) {
                foot = document.createElement('div');
                foot.id = getId(table, 'foot');
                foot.className = getClass(table, 'foot');
                setAttr(foot, 'control-table', table.id);

                table.main.appendChild(foot);
            }
            return foot;
        }

        /**
         * 获取表格内容行的dom元素
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {number} index 行号
         * @return {Element}
         */
        function getRow(table, index) {
            return lib.g(getId(table, 'row') + index);
        }

        /**
         * 获取checkbox选择列表格头部的checkbox表单
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @return {Element}
         */
        function getHeadCheckbox(table) {
            return lib.g(getId(table, 'select-all'));
        }

        /**
         * selectedIndex的setter，将自动设置selectedIndexMap
         *
         * @private
         * @param {Object} table 表格控件本身
         * @param {number} selectedIndex 选中的行号
         */
        function setSelectedIndex(table, selectedIndex) {
            table.selectedIndex = selectedIndex;
            var selectedIndexMap = {};
            for (var i = selectedIndex.length - 1; i >= 0; i--) {
                selectedIndexMap[selectedIndex[i]] = 1;
            }
            table.selectedIndexMap = selectedIndexMap;
        }

        /**
         * 判断某行是否选中
         *
         * @private
         * @param {Object} table 表格控件本身
         * @param {number} index 行号
         * @return {boolean}
         */
        function isRowSelected(table, index) {
            if (table.selectedIndexMap) {
                return !!table.selectedIndexMap[index];
            }
            return false;
        }

        /**
         * 获取body元素宽度
         *
         * @private
         * @param {Object} table 表格控件本身
         * @return {number}
         */
        function getBodyWidth(table) {
            var bodyWidth = 0;
            var fields = table.realFields;
            var minColsWidth = table.minColsWidth;
            for (var i = 0, len = fields.length; i < len; i++) {
                var field = fields[i];
                bodyWidth += (field.width || minColsWidth[i]);
            }
            return bodyWidth;
        }

        /**
         * 获取表格所在区域宽度
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @return {number}
         */
        function getWidth(table) {
            // 如果手工设置宽度，不动态计算
            if (table.width) {
                return table.width;
            }

            // 根据表格父容器获取表格宽度
            var rulerDiv = document.createElement('div');
            var parent = table.main.parentNode;

            parent.appendChild(rulerDiv);
            var width = rulerDiv.offsetWidth;
            rulerDiv.parentNode.removeChild(rulerDiv);

            return width;
        }

        /**
         * 初始化表格的字段
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function initFields(table) {
            if (!table.fields) {
                return;
            }

            // 避免刷新时重新注入
            var fields = table.fields;
            var realFields = fields.slice(0);
            var len = realFields.length;

            while (len--) {
                if (!realFields[len]) {
                    realFields.splice(len, 1);
                }
            }
            table.realFields = realFields;

            if (!table.select) {
                return;
            }

            switch (table.select.toLowerCase()) {
                case 'multi':
                    realFields.unshift(getMultiSelectField(table));
                    break;
                case 'single':
                    realFields.unshift(getSingleSelectField(table));
                    break;
            }
        }


        /**
         * 初始化FollowHead
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function initFollowHead(table) {
            if (table.followHead) {
                cachingFollowDoms(table);
                if (!table.noFollowHeadCache) {
                    resetFollowOffset(table);
                }
            }
        }

        /**
         *  刷新FollowHead设置
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function resetFollowHead(table) {
            if (table.followHead) {
                cachingFollowDoms(table);
                resetFollowOffset(table);
            }
        }

         /**
         * 缓存表头跟随的Dom元素
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function cachingFollowDoms(table) {
            if (!table.followHead) {
                return;
            }

            var followDoms = table.followDoms = [];
            var walker = table.main.parentNode.firstChild;
            var tableId = table.id;
            // 缓存表格跟随的dom元素
            while (walker) {
                if (walker.nodeType === 1
                 && (getAttr(walker, 'follow-thead') === tableId)) {
                    followDoms.push(walker);
                }
                walker = walker.nextSibling;
            }

            resetFollowDomsWidth(table);
            resetFollowHeight(table);
        }

        /**
         * 重置FollowDoms的Heights
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function resetFollowHeight(table) {
            var followDoms = table.followDoms;
            var followHeights = table.followHeightArr;

            // 读取height和width的值缓存
            followHeights[0] = 0;
            var i = 0;
            for (var len = followDoms.length; i < len; i++) {
                var dom = followDoms[i];
                followHeights[i + 1] = followHeights[i] + dom.offsetHeight;
            }
            followHeights[i + 1] = followHeights[i];
            followHeights.lenght = i + 2;
        }

        /**
         * 重置followDoms元素的宽度
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function resetFollowDomsWidth(table) {
            var followDoms = table.followDoms;
            var followWidths = table.followWidthArr;

            for (var i = 0, len = followDoms.length; i < len; i++) {
                var dom =  followDoms[i];
                var followWidth = getStyleNum(dom, 'padding-left')
                    + getStyleNum(dom, 'padding-right')
                    + getStyleNum(dom, 'border-left-width')
                    + getStyleNum(dom, 'border-right-width');

                followWidths[i] = followWidth;
                followDoms[i].style.width = table.realWidth
                                            - followWidth + 'px';
            }
        }

        /**
         * 重置FollowDoms的offset
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function resetFollowOffset(table) {
            var followDoms = table.followDoms;

            // 读取跟随的高度，缓存
            var followOffest = lib.getOffset(followDoms[0] || table.main);
            table.followTop = followOffest.top;
            table.followLeft = followOffest.left;
        }

        /**
         * 初始最小列宽
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function initMinColsWidth(table) {
            var fields = table.realFields;
            var result = [];
            var fontSize = table.fontSize;
            var extraWidth = table.colPadding * 2 + 5;

            if (!table.noHead) {

                for (var i = 0, len = fields.length; i < len; i++) {
                    var field = fields[i];
                    var width = field.minWidth;
                    if (!width && !field.breakLine) {
                        width = field.title.length * fontSize
                                + extraWidth
                                + (table.sortable && field.sortable
                                    ? table.sortWidth : 0)
                                + (field.tip ? table.tipWidth : 0);

                    }
                    result[i] = width;
                }
            }
            else {
                var minWidth = fontSize + extraWidth;
                for (i = 0, len = fields.length; i < len; i++) {
                    result[i] = minWidth;
                }
            }

            table.minColsWidth = result;
        }

        /**
         * 初始化列宽
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function initColsWidth(table) {
            var fields = table.realFields;
            var canExpand = [];

            table.colsWidth = [];

            var bodyWidth = table.overflowX === 'auto'
                                ? getBodyWidth(table)
                                : table.realWidth;
            bodyWidth = Math.max(bodyWidth, table.realWidth);
            table.bodyWidth = bodyWidth;

            // 减去边框的宽度
            var leftWidth = bodyWidth - 1;

            // 读取列宽并保存
            for (var i = 0, len = fields.length; i < len; i++) {
                var field = fields[i];
                var width = field.width;

                width = width ? parseInt(width, 10) : 0;
                table.colsWidth.push(width);
                leftWidth -= width;

                if (!field.stable) {
                    canExpand.push(i);
                }
            }

            // 根据当前容器的宽度，计算可拉伸的每列宽度
            len = canExpand.length;
            var leaveAverage = Math.round(leftWidth / len);
            var index;
            var offset;
            var minWidth;

            for (i = 0; i < len; i++) {
                index  = canExpand[i];
                offset = Math.abs(leftWidth) < Math.abs(leaveAverage)
                            ? leftWidth : leaveAverage;

                leftWidth -= offset;
                table.colsWidth[index] += offset;

                // 计算最小宽度
                minWidth = table.minColsWidth[index];
                if (minWidth > table.colsWidth[index]) {
                    leftWidth += table.colsWidth[index] - minWidth;
                    table.colsWidth[index] = minWidth;
                }
            }

            // 如果空间不够分配，需要重新从富裕的列调配空间
            if (leftWidth < 0) {
                i = 0;
                while (i < len && leftWidth !== 0) {
                    index = canExpand[i];
                    minWidth = table.minColsWidth[index];

                    if (minWidth < table.colsWidth[index]) {
                        offset = table.colsWidth[canExpand[i]] - minWidth;
                        offset = offset > Math.abs(leftWidth)
                                ? leftWidth
                                : -offset;
                        leftWidth += Math.abs(offset);
                        table.colsWidth[index] += offset;
                    }
                    i++;
                }
            }
            else if (leftWidth > 0) {// 如果空间富裕，则分配给第一个可调整的列
                table.colsWidth[canExpand[0]] += leftWidth;
            }
        }

        /**
         * 绘制表格尾
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function renderFoot(table) {
            var foot = getFoot(table);

            if (foot) {
                foot.style.display = '';
                if (table.realWidth) {
                    foot.style.width = table.realWidth + 'px';
                }
                foot.innerHTML = getNeckFootHtml(table, table.foot, 'foot');
            }
        }

        /**
         * 绘制表格首部自定义行
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function renderNeck(table) {
            var neck = getNeck(table);

            if (neck) {
                neck.style.display = '';
                if (table.realWidth) {
                    neck.style.width = table.realWidth + 'px';
                }
                neck.innerHTML = getNeckFootHtml(table, table.neck, 'neck');
            }
        }

        /**
         * 获取表格首尾的html
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {Array} rowArray fields数组
         * @param {string} neckFoot neckFoot标识
         * @return {string}
         */
        function getNeckFootHtml(table, rowArray, neckFoot) {
            var html = [];
            var fieldIndex = 0;
            var colsWidth = table.colsWidth;
            var thCellClass = getClass(table, 'fcell');
            var thTextClass = getClass(table, 'fcell-text');
            var rowWidthOffset = table.rowWidthOffset;
            html.push(
                lib.format(
                    tplTablePrefix,
                    {width: '100%', controlTableId: table.id}
                ),
                '<tr>'
            );

            for (var i = 0, len = rowArray.length; i < len; i++) {
                var rowInfo = rowArray[i];
                var colWidth = colsWidth[fieldIndex];
                var colspan = rowInfo.colspan || 1;
                var thClass = [thCellClass];
                var contentHtml = rowInfo.content;

                if ('function' === typeof contentHtml) {
                    contentHtml = contentHtml.call(table);
                }
                if (isNullOrEmpty(contentHtml)) {
                    contentHtml = '&nbsp;';
                }

                for (var j = 1; j < colspan; j++) {
                    colWidth += colsWidth[fieldIndex + j] + rowWidthOffset;
                }

                fieldIndex += colspan;
                if (rowInfo.align) {
                    thClass.push(
                        getClass(table, 'cell-align-' + rowInfo.align));
                }

                colWidth += rowWidthOffset;
                (colWidth < 0) && (colWidth = 0);
                html.push(
                    '<th id="' + getNeckFootCellId(table, i, neckFoot) + '" '
                        + 'class="' + thClass.join(' ') + '"',
                    ' style="width:' + colWidth + 'px;',
                    (colWidth ? '' : 'display:none;') + '">',
                    '<div class="' + thTextClass + '">',
                    contentHtml,
                    '</div></th>'
                );
            }

            html.push('</tr></table>');
            return html.join('');
        }

        /**
         * 绘制表格头
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function renderHead(table) {
            var head = getHead(table);
            var headPanelId = getId(table, 'head-panel');
            if (!head) {
                head = document.createElement('div');
                head.id =  getId(table, 'head');
                head.className = getClass(table, 'head');
                setAttr(head, 'control-table', table.id);
                table.main.appendChild(head);
                head.innerHTML = lib.format(
                    '<div id="${id}" data-ui="type:Panel;id:${id};"></div>',
                    {id: headPanelId}
                );

                table.initChildren(head);
                table.headPanel = table.viewContext.get(headPanelId);

                if (table.columnResizable) {
                    // 悬浮到可拖拽区域时变换鼠标指针
                    table.helper.addDOMEvent(
                        head,
                        'mousemove',
                        'th',
                        headMoveHandler
                    );

                    $(head).mouse(
                        {
                            start: u.partial(dragStartHandler, table),
                            drag: u.partial(dragingHandler, table),
                            stop: u.partial(dragEndHandler, table)
                        }
                    );
                }
            }

            if (table.noHead) {
                head.style.display = 'none';
                return;
            }

            head.style.display = '';
            if (table.bodyWidth) {
                head.style.width = table.bodyWidth + 'px';
            }

            lib.g(headPanelId).innerHTML = getHeadHtml(table);

            // 初始化表头子控件
            initHeadChildren(table, table.viewContext.get(headPanelId));
        }

         /**
         * 初始化表头子控件
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {ui.Panel} headPanel 表头对应的panel控件
         */
        function initHeadChildren(table, headPanel) {
            // 清理table之前的子控件,因为只有Head用到了子控件才能在这里调用该方法
            if (headPanel.children) {
                headPanel.disposeChildren();
            }

             // 初始化Head子控件
            if (table.hasTip) {
                headPanel.initChildren();
            }
        }

        // 表格排序区域模版
        var tplSortIcon = '<div class="${className}"></div>';

        // 表格头提示信息模版
        var tplTitleTip = ''
            + '<div id="${id}" class="${className}"'
            +     'data-ui-type="Tip" data-ui-id="${id}">'
            +     '${content}'
            + '</div>';

        /**
         * 获取表格头的html
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @return {string}
         */
        function getHeadHtml(table) {
            var fields = table.realFields;
            var thCellClass = getClass(table, 'hcell');
            var thTextClass = getClass(table, 'hcell-text');
            var breakClass = getClass(table, 'cell-break');
            var iconClass = table.helper.getIconClass();
            var sortClass = getClass(table, 'hsort')
                + ' '
                + iconClass;
            var selClass = getClass(table, 'hcell-sel');
            var canDragBegin = -1;
            var canDragEnd = -1;
            var rowWidthOffset = table.rowWidthOffset;

            if (!table.disabled) {
                // 计算最开始可拖拽的单元格
                for (var i = 0, len = fields.length; i < len; i++) {
                    if (!fields[i].stable) {
                        canDragBegin = i;
                        break;
                    }
                }
                // 计算最后可拖拽的单元格
                for (i = len - 1; i >= 0; i--) {
                    if (!fields[i].stable) {
                        canDragEnd = i;
                        break;
                    }
                }
            }

            var html = [];
            // 拼装html
            html.push(
                lib.format(
                    tplTablePrefix,
                    {width: '100%', controlTableId: table.id}
                ),
                '<tr>'
            );

            u.each(fields, function (field, i) {
                var thClass = [thCellClass];
                var title = field.title;
                var sortable = table.sortable && field.sortable;
                var currentSort = sortable
                                && field.field
                                && field.field === table.orderBy;
                var realThTextClass = thTextClass;

                if (i === 0) {
                    realThTextClass += ' '
                                    + getClass(table, 'hcell-text-first');
                }
                if (i === len - 1) {
                    realThTextClass += ' '
                                    + getClass(table, 'hcell-text-last');
                }

                // 计算排序图标样式
                var sortIconHtml = '';
                if (sortable) {
                    thClass.push(getClass(table, 'hcell-sort'));
                    if (currentSort) {
                        thClass.push(getClass(table, 'hcell-' + table.order));
                    }
                    sortIconHtml = lib.format(
                        tplSortIcon,
                        {className: sortClass}
                    );
                }

                // 计算表格对齐样式
                if (field.align) {
                    thClass.push(getClass(table, 'cell-align-' + field.align));
                }

                // 判断是否breakline模式
                if (table.breakLine || field.breakLine) {
                    thClass.push(breakClass);
                }

                var titleTipHtml = '';
                var titleTipContent = '';
                var tip = field.tip;
                // 计算内容html
                if (typeof tip === 'function') {
                    titleTipContent = tip.call(table);
                }
                else {
                    titleTipContent = tip;
                }
                if (titleTipContent) {
                    titleTipHtml = lib.format(
                        tplTitleTip,
                        {
                            id: getId(table, 'htip' + i),
                            className: getClass(table, 'htip'),
                            content: titleTipContent
                        }
                    );

                    table.hasTip = true;
                }

                var contentHtml;
                // 计算内容html
                if (typeof title === 'function') {
                    contentHtml = title.call(table);
                }
                else {
                    contentHtml = title;
                }
                if (isNullOrEmpty(contentHtml)) {
                    contentHtml = '&nbsp;';
                }

                var tpl = '<th id="${cellId}" data-index="${index}" class="${classes}"'
                    + ' ${sortable} ${dragRight} ${dragLeft} '
                    + 'style="width:${width}px; ${display}">'
                    + '<div class="${realThTextClass} ${selClass}">'
                    + '${content}'
                    + '</div>'
                    + '</th>';
                html.push(
                    lib.format(
                        tpl,
                        {
                            cellId: getTitleCellId(table, i),
                            index: i,
                            classes: thClass.join(' '),
                            sorable: sortable ? 'data-sortable="1"' : '',
                            dragRight: i >= canDragBegin && i < canDragEnd
                                ? 'data-dragright="1"' : '',
                            dragLeft: i <= canDragEnd && i > canDragBegin
                                ? 'data-dragleft="1"' : '',
                            width: table.colsWidth[i] + rowWidthOffset,
                            display: table.colsWidth[i] ? '' : 'display:none',
                            realThTextClass: realThTextClass,
                            selClass: field.select ? selClass : '',
                            content: titleTipHtml + contentHtml + sortIconHtml
                        }
                    )
                );
            });
            html.push('</tr></table>');

            return html.join('');
        }

        /**
         * 获取表格头单元格的id
         *
         * @private
         * @param {Object} table table控件
         * @param {number} index 单元格的序号
         * @return {string}
         */
        function getTitleCellId(table, index) {
            return getId(table, 'title-cell') + index;
        }

        /**
         * 获取表格尾单元格的id
         *
         * @private
         * @param {Object} table table控件
         * @param {number} index 单元格的序号
         * @param {string} neckFoot headFoot标识
         * @return {string}
         */
        function getNeckFootCellId(table, index, neckFoot) {
            return getId(table, neckFoot + '-cell') + index;
        }

        /**
         * 获取表头是否处于拖拽状态
         *
         * @private
         * @param {Object} table table控件
         * @return {boolean}
         */
        function isDragging(table) {
            return table.tableHeadDragging;
        }

        /**
         * 表格头单元格鼠标移入的事件handler
         *
         * @private
         * @param {Element} element 移出的单元格
         * @param {Event} e 事件对象
         */
        function titleOverHandler(element, e) {
            titleOver(this, element);
        }

        /**
         * 鼠标hover至title时的逻辑
         *
         * @param {ui.Table} table table控件实例
         * @param {Element} element 移出的单元格
         */
        function titleOver(table, element) {
            if (isDragging(table) || table.dragReady) {
                return;
            }

            table.helper.addPartClasses('hcell-hover', element);

            if (table.sortable) {
                table.sortReady = 1;
                var index = getAttr(element, 'index');
                var field = table.realFields[index];

                if (field && field.sortable) {
                    table.helper.addPartClasses('hcell-sort-hover', element);
                }
            }
        }

        /**
         * 表格头单元格鼠标移出的事件handler
         *
         * @private
         * @param {Element} cell 移出的单元格
         * @param {Event} e 事件对象
         */
        function titleOutHandler(cell, e) {
            titleOut(this, cell);
        }

        /**
         * 表格头单元格鼠标移出响应，主要是样式处理
         *
         * @param {ui.Table} table table控件实例
         * @param {Element} element 表头单元格元素
         */
        function titleOut(table, element) {
            table.helper.removePartClasses('hcell-hover', element);

            if (table.sortable) {
                table.sortReady = 0;
                table.helper.removePartClasses('hcell-sort-hover', element);
            }
        }

        /**
         * 表格头单元格点击的事件handler
         *
         * @private
         * @param {Element} cell 点击的单元格
         * @param {Event} e 事件对象
         */
        function titleClickHandler(cell, e) {
            var table = this;
            // 避免拖拽触发排序行为
            if (table.sortable && table.sortReady) {
                var index = getAttr(cell, 'index');
                var field = table.realFields[index];
                if (field.sortable) {
                    var orderBy = table.orderBy;
                    var order = table.order;

                    if (orderBy === field.field) {
                        order = (!order || order === 'asc') ? 'desc' : 'asc';
                    }
                    else {
                        order = 'desc';
                    }

                    table.setProperties({
                        order: order,
                        orderBy: field.field
                    });

                    table.fire('sort', {field: field, order: order});
                }
            }
        }

        /**
         * 获取表格头鼠标移动的事件handler
         *
         * @private
         * @param {Event} e 事件对象
         */
        function headMoveHandler(e) {
            var table = this;
            if (isDragging(table)) {
                return;
            }

            var dragClass = 'startdrag';
            var range = 8; // 可拖拽的单元格边界范围

            var target = e.originalEvent.target;
            // 寻找th节点。如果查找不到，退出
            target = findDragCell(table, target);
            if (!target) {
                return;
            }
            var head = table.helper.getPart('head');
            var pageX = e.pageX || e.clientX + lib.page.getScrollLeft();

            // 获取位置与序号
            var pos = lib.getOffset(target);
            var sortable = getAttr(target, 'sortable');

            // 如果允许拖拽，设置鼠标手型样式与当前拖拽点
            if (getAttr(target, 'dragleft')  && pageX - pos.left < range) {
                sortable && (titleOut(table, target)); // 清除可排序列的over样式
                table.helper.addPartClasses(dragClass, head);
                table.dragPoint = 'left';
                table.dragReady = 1;
            }
            else if (getAttr(target, 'dragright')
                && pos.left + target.offsetWidth - pageX < range
            ) {
                sortable && (titleOut(table, target)); // 清除可排序列的over样式
                table.helper.addPartClasses(dragClass, head);
                table.dragPoint = 'right';
                table.dragReady = 1;
            }
            else {
                table.helper.removePartClasses(dragClass, head);
                table.dragPoint = '';
                table.dragReady = 0;
                titleOver(table, target); // 附加可排序列的over样式
            }
        }

        /**
         * 查询拖拽相关的表格头单元格
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {Element} target 触发事件的元素
         * @return {HTMLTHElement}
         */
        function findDragCell(table, target) {
            while (target.nodeType === 1) {
                if (target.nodeName === 'TH') {
                    return target;
                }
                target = target.parentNode;
            }
            return null;
        }

        /**
         * 获取表格头鼠标点击拖拽起始的事件handler
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {Event} e 事件对象
         * @return {Function}
         */
        function dragStartHandler(table, e) {
            // @DEPRECATED: 移除
            table.fire('startdrag');
            table.fire('dragstart');

            var dragClass = getClass(table, 'startdrag');
            var target = e.originalEvent.target;

            // 寻找th节点，如果查找不到，退出
            target = findDragCell(table, target);
            if (!target) {
                return false;
            }

            if (lib.g(getId(table, 'head')).className.indexOf(dragClass) < 0) {
                return false;
            }
            table.tableHeadDragging = true;
            // 获取显示区域高度
            table.htmlHeight = document.documentElement.clientHeight;

            table.dragIndex = getAttr(target, 'index');
            table.dragStart = e.pageX || e.clientX + lib.page.getScrollLeft();

            initTableOffset(table);

            // 显示拖拽基准线
            showDragMark(table, table.dragStart);

            return true;
        }

         /**
         * 缓存Table的Offset数据
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function initTableOffset(table) {
            var tableOffset = lib.getOffset(table.main);
            table.top = tableOffset.top;
            table.left = tableOffset.left;
        }

        /**
         * 获取拖拽中的事件handler
         * 移动拖拽基准线
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {Event} e 事件对象
         * @return {Function}
         */
        function dragingHandler(table, e) {
            showDragMark(
                table,
                e.pageX || e.clientX + lib.page.getScrollLeft()
            );
            return false;
        }

        /**
         * 显示基准线
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {number} left 基准线水平位置
         */
        function showDragMark(table, left) {
            var mark = getDragMark(table);

            var right = table.left + table.realWidth;
            // 加减1是为了在表格边框以内
            var rangeLeft = table.left + 1;
            var rangeRight = right - 1;

            left = left < rangeLeft ? rangeLeft : left;
            left = left > rangeRight ? rangeRight : left;

            if (!mark) {
                mark = createDragMark(table);
            }

            mark.style.top = table.top + 'px';
            mark.style.left = left + 'px';
            mark.style.zIndex = table.zIndex || '';

            var height = table.htmlHeight
                        - table.top
                        + lib.page.getScrollTop();
            var mainHeight = table.main.offsetHeight;
            height = mainHeight > height ? height : mainHeight;
            mark.style.height = height + 'px';
        }

        /**
         * 隐藏基准线
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function hideDragMark(table) {
            var mark = getDragMark(table);
            mark.style.left = '-10000px';
            mark.style.top = '-10000px';
        }

        /**
         * 创建拖拽基准线
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @return {Element}
         */
        function createDragMark(table) {
            var mark = document.createElement('div');
            mark.id = getId(table, 'drag-mark');
            mark.className = getClass(table, 'mark ');
            mark.style.top = '-10000px';
            mark.style.left = '-10000px';
            document.body.appendChild(mark);
            return mark;
        }

        /**
         * 获取基准线的dom元素
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @return {Element}
         */
        function getDragMark(table) {
            return lib.g(getId(table, 'drag-mark'));
        }

        /**
         * 获取拖拽结束的事件handler
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {Event} e 事件对象
         * @return {Function}
         */
        function dragEndHandler(table, e) {
            var index = parseInt(table.dragIndex, 10);
            // 校正拖拽元素
            // 如果是从左边缘拖动的话，拖拽元素应该上一列
            if (table.dragPoint === 'left') {
                index--;
            }

            var colsWidth = table.colsWidth;
            // 校正拖拽列的宽度
            // 不允许小于最小宽度
            var minWidth = table.minColsWidth[index];
            var pageX = e.pageX;
            var offsetX = pageX - table.dragStart;
            var currentWidth = colsWidth[index] + offsetX;
            if (currentWidth < minWidth) {
                offsetX += (minWidth - currentWidth);
                currentWidth = minWidth;
            }

            var alters = [];
            var alterWidths = [];
            var alterWidth;
            // 查找宽度允许改变的列
            var fields = table.realFields;
            var fieldLen = fields.length;
            var alterSum = 0;
            for (var i = index + 1; i < fieldLen; i++) {
                if (!fields[i].stable && colsWidth[i] > 0) {
                    alters.push(i);
                    alterWidth = colsWidth[i];
                    alterWidths.push(alterWidth);
                    alterSum += alterWidth;
                }
            }

            var revise = 0;

            // 计算允许改变的列每列的宽度
            var leave = offsetX;
            var alterLen = alters.length;
            for (i = 0; i < alterLen; i++) {
                var alter = alters[i];
                alterWidth = alterWidths[i];    // 当前列宽
                var roughWidth = offsetX * alterWidth / alterSum; // 变更的列宽

                // 校正变更的列宽
                // roughWidth可能存在小数点
                var offsetWidth = leave > 0 ? Math.ceil(roughWidth) : Math.floor(roughWidth);
                offsetWidth = Math.abs(offsetWidth) < Math.abs(leave) ? offsetWidth : leave;

                // 校正变更后的列宽
                // 不允许小于最小宽度
                alterWidth -= offsetWidth;
                leave -= offsetWidth;
                minWidth = table.minColsWidth[alter];
                if (alterWidth < minWidth) {
                    revise += minWidth - alterWidth;
                    alterWidth = minWidth;
                }

                colsWidth[alter] = alterWidth;
            }

            // 校正拖拽列的宽度
            // 当影响的列如果宽度小于最小宽度，会自动设置成最小宽度
            // 相应地，拖拽列的宽度也会相应减小
            currentWidth -= revise;

            colsWidth[index] = currentWidth;

            // 重新绘制每一列
            resetColumns(table);

            hideDragMark(table);

            // @DEPRECATED: 移除
            table.fire('enddrag');
            table.fire('dragend');
            table.tableHeadDragging = false;

            return false;
        }

        /**
         * 绘制表格主体
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function renderBody(table) {
            var tBody = getBody(table);
            var tBodyPanelId = getId(table, 'body-panel');
            if (!tBody) {
                var type = 'body';
                var id = getId(table, type);

                tBody = document.createElement('div');
                tBody.id = id;
                tBody.className = getClass(table, type);
                table.main.appendChild(tBody);
                tBody.innerHTML = lib.format(
                    '<div id="${id}" data-ui="type:Panel;id:${id}"></div>',
                    {id: tBodyPanelId}
                );
                table.initChildren(tBody);
                table.bodyPanel = table.viewContext.get(tBodyPanelId);
            }

            // var style = tBody.style;
            // style.overflowX = 'auto';
            // style.overflowY = 'auto';
            // if (table.bodyWidth) {
                // style.width = table.bodyWidth + 'px';
            // }

            table.bodyPanel.disposeChildren();
            lib.g(tBodyPanelId).innerHTML = getBodyHtml(table);

            table.fire('bodyChange');
        }

         /**
         * 更新表格指定高度
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function updateBodyMaxHeight(table) {
            var tBody = getBody(table);
            var style = tBody.style;
            var dataLen = table.datasource.length;
            var bodyMaxHeight = table.bodyMaxHeight;
            // 如果设置了表格体高度
            // 表格需要出现纵向滚动条
            if (bodyMaxHeight > 0 && dataLen > 0) {
                var totalHeight = bodyMaxHeight;
                var bodyContainer = lib.g(getId(table, 'body-panel'));

                if (bodyContainer) {
                    totalHeight = bodyContainer.offsetHeight;
                }
                if (totalHeight >= bodyMaxHeight) {
                    style.height = bodyMaxHeight + 'px';
                    return;
                }
            }
            style.height = 'auto';
        }

        var noDataHtmlTpl = '<div class="${className}">${html}</div>';

        /**
         * 获取表格主体的html
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @return {string}
         */
        function getBodyHtml(table) {
            var data = table.datasource || [];
            var dataLen = data.length;
            var html = [];

            if (!dataLen) {
                return lib.format(
                    noDataHtmlTpl,
                    {
                        className: getClass(table, 'body-nodata'),
                        html: table.noDataHtml
                    }
                );
            }

            var rowBuilderList = table.rowBuilderList;

            for (var i = 0; i < dataLen; i++) {
                var item = data[i];
                html.push(table.getRowHtml(table, item, i, rowBuilderList));
            }

            return html.join('');
        }

        /**
         * 获取表格体的单元格id
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {number} rowIndex 当前行序号
         * @param {number} fieldIndex 当前字段序号
         * @return {string}
         */
        function getBodyCellId(table, rowIndex, fieldIndex) {
            return getId(table, 'cell') + rowIndex + '-' + fieldIndex;
        }

         /**
         * 批量添加rowBuilder
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {Array} builderList rowBuilder数组
         */
        function addRowBuilderList(table, builderList) {
            var rowBuilderList = table.rowBuilderList || [];
            for (var i = 0, l = builderList.length; i < l; i++) {
                var builder = builderList[i];
                if (!builder.getColHtml) {
                    continue;
                }

                if (builder.getSubrowHtml) {
                    table.hasSubrow = true;
                }

                if (!hasValue(builder.index)) {
                    builder.index = 1000;
                }

                rowBuilderList.push(builder);
            }

            rowBuilderList.sort(function (a, b) {
                return a.index - b.index;
            });

            table.rowBuilderList = rowBuilderList;
        }

        /**
         * 初始化基础Builder
         *
         * @private
         * @param {ui.Table} table table控件实例
         *
         */
        function initBaseBuilderList(table) {
            addRowBuilderList(
                table,
                [
                    {
                        index: 1,
                        getRowArgs: getRowBaseArgs,
                        getColHtml: getColBaseHtml
                    }
                ]
            );
        }



        /**
         * base行绘制每行基本参数
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {number} rowIndex 行号
         * @return {Object} 绘制行时基本参数
         */
        function getRowBaseArgs(table, rowIndex) {
            var datasource = table.datasource || [];
            var dataLen = datasource.length;
            return {
                tdCellClass: getClass(table, 'cell'),
                tdBreakClass: getClass(table, 'cell-break'),
                tdTextClass: getClass(table, 'cell-text'),
                fieldLen: table.realFields.length,
                rowClass: [
                    getClass(table, 'row'),
                    getClass(table, 'row-' + ((rowIndex % 2) ? 'odd' : 'even')),
                    isRowSelected(table, rowIndex)
                        ? getClass(table, 'row-selected')
                        : '',
                    dataLen - 1 === rowIndex
                        ? getClass(table, 'row-last')
                        : ''
                ].join(' ')
            };
        }

        var baseColTextTpl = '<div id="${colTextId}">${content}</div>';

        /**
         * base列
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {Object} data 对应某一行数据源
         * @param {Object} field 对应某一列配置
         * @param {number} rowIndex 行号
         * @param {number} fieldIndex 列号
         * @param {Object} extraArgs 额外参数
         * @return {Object} 生成单元格内容
         */
        function getColBaseHtml(table, data, field, rowIndex, fieldIndex, extraArgs) {
            var tdCellClass = extraArgs.tdCellClass;
            var tdBreakClass = extraArgs.tdBreakClass;
            var tdTextClass = extraArgs.tdTextClass;
            var tdClass = [tdCellClass];
            var textClass = [tdTextClass];
            var content = field.content;

            if (fieldIndex === 0) {
                textClass.push(getClass(table, 'cell-text-first'));
            }
            if (fieldIndex === extraArgs.fieldLen - 1) {
                textClass.push(getClass(table, 'cell-text-last'));
            }

            // 生成可换行列的样式
            if (table.breakLine || field.breakLine) {
                tdClass.push(tdBreakClass);
            }

            // 生成选择列的样式
            if (field.select) {
                textClass.push(getClass(table, 'cell-sel'));
            }

            // 计算表格对齐样式
            if (field.align) {
                tdClass.push(getClass(table, 'cell-align-' + field.align));
            }

             // 计算表格排序样式
            if (field.field && field.field === table.orderBy) {
                tdClass.push(getClass(table, 'cell-sorted'));
            }

            // 构造内容html
            var contentHtml = 'function' === typeof content
                ? content.call(table, data, rowIndex, fieldIndex)
                : (table.encode
                    ? u.escape(data[content])
                    : data[content]
                );

            if (isNullOrEmpty(contentHtml)) {
                contentHtml = '&nbsp;';
            }

            return {
                colClass: tdClass.join(' '),
                textClass: textClass.join(' '),
                html: lib.format(
                    baseColTextTpl,
                    {
                        colTextId: getId(
                            table,
                            'cell-textfield-' + rowIndex + '-' + fieldIndex
                        ),
                        content: contentHtml
                    }
                )
            };
        }

        /**
         * 表格行鼠标移上的事件handler
         *
         * @private
         * @param {Element} element 行元素
         * @param {Event} e 事件对象
         */
        function rowOverHandler(element, e) {
            if (isDragging(this)) {
                return;
            }
            this.helper.addPartClasses('row-hover', element);
        }

        /**
         * 表格行鼠标移出的事件handler
         *
         * @private
         * @param {Element} element 行元素
         * @param {Event} e 事件对象
         */
        function rowOutHandler(element, e) {
            this.helper.removePartClasses('row-hover', element);
        }

        /**
         * 表格行鼠标点击的事件handler
         *
         * @private
         * @param {Element} element 行元素
         * @param {Event} e 事件对象
         */
        function rowClickHandler(element, e) {
            var table = this;
            var rowClassName = table.helper.getPartClasses('cell-text')[0];

            if (table.selectMode === 'line'
                && lib.hasClass(e.target, rowClassName)) {
                if (table.dontSelectLine) {
                    table.dontSelectLine = false;
                    return;
                }
                var index = getAttr(element, 'index');
                switch (table.select) {
                    case 'multi':
                        var input = lib.g(getId(table, 'multi-select') + index);
                        selectMulti(table, index, !input.checked);
                        resetMutilSelectedStatus(table);
                        break;

                    case 'single':
                        selectSingle(table, index, true);
                        break;
                }
            }
        }

        /**
         * 初始化resize的event handler
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function initResizeHandler(table) {
            table.viewWidth = lib.page.getViewWidth();
            table.viewHeight = lib.page.getViewHeight();

            var resizeHandler = function () {
                var viewWidth = lib.page.getViewWidth();
                var viewHeight = lib.page.getViewHeight();

                if (viewWidth === table.viewWidth
                    && viewHeight === table.viewHeight
                ) {
                    return;
                }

                table.viewWidth = viewWidth;
                table.viewHeight = viewHeight;

                handleResize(table);
            };

            table.helper.addDOMEvent(window, 'resize', resizeHandler);
        }

        /**
         * 浏览器resize的处理
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function handleResize(table) {
            var head = getHead(table);
            var foot = getFoot(table);
            var neck = getNeck(table);
            table.realWidth = getWidth(table);
            var widthStr = table.realWidth + 'px';

            if (table.realWidth) {
                table.main.style.width = widthStr;
            }

            // 重新绘制每一列
            // 这一步也将重设bodyWidth
            initColsWidth(table);
            resetColumns(table);

            var bodyWidthStr = table.bodyWidth + 'px';
            // 设置主区域宽度
            if (table.realWidth) {
                getBody(table).style.width = bodyWidthStr;
                head && (head.style.width = bodyWidthStr);
                foot && (foot.style.width = widthStr);
                neck && (neck.style.width = widthStr);
            }

            if (table.followHead) {
                resetFollowDomsWidth(table);

                // 宽度的改变是会影响高度的，所以高度信息放在后面
                resetFollowHeight(table);
            }

            // 重新获取Table位置
            initTableOffset(table);

            table.fire('resize');

            table.topReseter && table.topReseter();
        }

        /**
         * 设置元素位置
         *
         * @private
         * @param {Element} element 要设置位置的元素
         * @param {string} pos css position值
         * @param {number|string} top css top值
         * @param {number|string} left css left值
         */
        function setPos(element, pos, top, left) {
            if (element) {
                element.style.top = top + 'px';
                element.style.left = left + 'px';
                element.style.position = pos;
            }
        }

        /**
         * 纵向锁定初始化
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function initTopResetHandler(table) {
            // 避免重复绑定
            if (!table.followHead || table.topReseter) {
                return;
            }

            var domHead = getHead(table);
            var placeHolderId = getId(table, 'top-placeholder');
            var domPlaceholder = document.createElement('div');
            // 占位元素
            // 否则元素浮动后原位置空了将导致页面高度减少，影响滚动条
            domPlaceholder.id = placeHolderId;
            domPlaceholder.style.width = '100%';
            domPlaceholder.style.display = 'none';

            lib.insertBefore(domPlaceholder, table.main);
            domPlaceholder = null;

            table.topReseter = function () {
                if (!table.followHead) {
                    return;
                }
                var scrollTop = lib.page.getScrollTop();
                var posStyle = lib.ie && lib.ie < 7 ? 'absolute' : 'fixed';
                var mainHeight = table.main.offsetHeight;
                var absolutePosition = posStyle === 'absolute';
                var placeHolder = lib.g(placeHolderId);
                var followDoms = table.followDoms;

                // 如果不启用缓存，则需要每次滚动都做判断并获取了
                if (table.noFollowHeadCache) {
                    var position = domHead.style.position;
                    if ((position !== 'fixed' && position !== 'absolute')) {
                        resetFollowOffset(table);
                    }
                }

                var i;
                if (scrollTop > table.followTop
                    && (absolutePosition
                        || scrollTop - table.followTop < mainHeight)) {

                    var scrollLeft = lib.page.getScrollLeft();
                    var fhArr = table.followHeightArr;
                    var fhLen = fhArr.length;

                    initTableOffset(table);
                    var curLeft = absolutePosition
                                ? table.left
                                : table.left - scrollLeft;

                    placeHolder.style.height = fhArr[fhLen - 1]
                                                + domHead.offsetHeight + 'px';
                    placeHolder.style.display = '';

                    if (lib.ie && lib.ie < 8) {
                        domHead.style.zIndex = table.zIndex + 1;
                    }

                    if (absolutePosition) {
                        var len = followDoms.length;
                        for (i = 0; i < len; i++) {
                            setPos(
                                followDoms[i],
                                posStyle,
                                fhArr[i] + scrollTop,
                                curLeft
                            );
                        }

                        setPos(
                            domHead,
                            posStyle,
                            fhArr[fhLen - 1] + scrollTop,
                            curLeft
                        );

                    }
                    else {
                        for (i = 0, len = followDoms.length; i < len; i++) {
                            setPos(followDoms[i], posStyle, fhArr[i], curLeft);
                        }
                        setPos(domHead, posStyle, fhArr[fhLen - 1], curLeft);
                        resetFixedHeadLeft(table);
                    }
                }
                else {
                    placeHolder.style.height  = 0;
                    placeHolder.style.display = 'none';
                    posStyle = '';

                    for (i = 0, len = followDoms.length; i < len; i++) {
                        setPos(followDoms[i], posStyle, 0, 0);
                    }

                    setPos(domHead, posStyle, 0, 0);
                    domHead.style.zIndex = '';
                }

            };

            table.helper.addDOMEvent(window, 'scroll', table.topReseter);
            table.helper.addDOMEvent(table.main, 'scroll', function (e) {
                table.fire('scroll');
                resetFixedHeadLeft(table);
            });
        }

        /**
         * 重置fixed的表头的left值
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function resetFixedHeadLeft(table) {
            var tableScrollLeft = table.main.scrollLeft;
            var domHead = getHead(table);
            var posStyle = $(domHead).css('position');
            if (posStyle === 'fixed') {
                var scrollLeft = lib.page.getScrollLeft();

                initTableOffset(table);
                var curLeft = table.left - scrollLeft;
                $(domHead).css('left', curLeft - scrollLeft - tableScrollLeft);
            }
        }

        /**
         * 重新设置表格每个单元格的宽度
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function resetColumns(table) {
            var colsWidth = table.colsWidth;
            var neck = table.neck;
            var foot = table.foot;
            var id = table.id;
            var tds = getBody(table).getElementsByTagName('td');
            var tdsLen = tds.length;
            var rowWidthOffset = table.rowWidthOffset;

            var i;
            var j;
            var width;
            var td;
            var colIndex = 0;
            var item;
            var colspan;
            var len = neck instanceof Array && neck.length;
            // 重新设置表格颈的每列宽度
            if (len) {
                for (i = 0; i < len; i++) {
                    item = neck[i];
                    width = colsWidth[colIndex];
                    colspan = item.colspan || 1;

                    for (j = 1; j < colspan; j++) {
                        width += colsWidth[colIndex + j] + rowWidthOffset;
                    }
                    colIndex += colspan;

                    td = lib.g(getNeckFootCellId(table, i, 'neck'));
                    width = Math.max(width + rowWidthOffset, 0);

                    td.style.width = width + 'px';
                    td.style.display = width ? '' : 'none';
                }
            }
            // 重新设置表格尾的每列宽度
            colIndex = 0;
            len = foot instanceof Array && foot.length;
            if (len) {
                for (i = 0; i < len; i++) {
                    item = foot[i];
                    width = colsWidth[colIndex];
                    colspan = item.colspan || 1;

                    for (j = 1; j < colspan; j++) {
                        width += colsWidth[colIndex + j] + rowWidthOffset;
                    }
                    colIndex += colspan;

                    td = lib.g(getNeckFootCellId(table, i, 'foot'));
                    width = Math.max(width + rowWidthOffset, 0);

                    td.style.width = width + 'px';
                    td.style.display = width ? '' : 'none';
                }
            }

            // 重新设置表格头的每列宽度
            len = colsWidth.length;
            if (!table.noHead) {
                for (i = 0; i < len; i++) {
                    width = Math.max(colsWidth[i] + rowWidthOffset, 0);
                    td = lib.g(getTitleCellId(table, i));
                    td.style.width = width + 'px';
                    td.style.display = width ? '' : 'none';
                }
            }

            // 重新设置表格体的每列宽度
            j = 0;
            for (i = 0; i < tdsLen; i++) {
                td = tds[i];
                if (getAttr(td, 'control-table') === id) {
                    width = Math.max(
                        colsWidth[j % len] + rowWidthOffset,
                        0
                    );
                    td.style.width = width + 'px';
                    td.style.display = width ? '' : 'none';
                    j++;
                }
            }
        }

        /**
         * 多选框全选模版
         *
         * @private
         */
        var mutilSelectAllTpl = '<div class="${checkboxClassName}">'
                                + '<input '
                                + 'type="checkbox" '
                                + 'id="${id}" '
                                + 'class="${className}" '
                                + 'data-index="${index}" '
                                + '${disabled}/><label for="${id}"></label></div>';

        /**
         * 多选框模版
         *
         * @private
         */
        var mutilSelectTpl = '<div class="${checkboxClassName}">'
            + '<input type="checkbox" id="${id}" class="${className}" '
            + 'data-index="${index}" ${disabled} ${checked} />'
            + '<label for="${id}"></label></div>';

        /**
         * 获取第一列的多选框
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @return {Object} 第一列多选框的配置
         */
        function getMultiSelectField(table) {
            var helper = table.helper;
            var cls = [
                helper.getPrefixClass('checkbox-custom'),
                helper.getPrefixClass('checkbox-single')
            ].join(' ');

            return {
                width: 30,
                stable: true,
                select: true,
                title: function (item, index) {
                    var data = {
                        id: getId(table, 'select-all'),
                        className: getClass(table, 'select-all'),
                        disabled: table.disabled ? 'disabled="disabled"' : '',
                        index: index,
                        checkboxClassName: cls
                    };
                    return lib.format(mutilSelectAllTpl, data);
                },

                content: function (item, index) {
                    var data = {
                        id: getId(table, 'multi-select') + index,
                        className: getClass(table, 'multi-select'),
                        disabled: table.disabled ? 'disabled="disabled"' : '',
                        index: index,
                        checked: isRowSelected(table, index)
                            ? 'checked="checked"'
                            : '',
                        checkboxClassName: cls
                    };
                    return lib.format(mutilSelectTpl, data);
                }
            };
        }

        /**
         * 单选框模版
         *
         * @private
         */
        var singleSelectTpl = '<div class="${checkboxClassName}">'
            + '<input type="radio" id="${id}" name="${name}" class="${className}" '
            + 'data-index="${index}" ${disabled} ${checked} />'
            + '<label for="${id}"></label></div>';

        /**
         * 第一列的单选框
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @return {Object} 第一列单选框配置
         */
        function getSingleSelectField(table) {
            return {
                width: 30,
                stable: true,
                title: '&nbsp;',
                select: true,
                content: function (item, index) {
                    var id =  getId(table, 'single-select');
                    var data = {
                        id: id + index,
                        name: id,
                        className: getClass(table, 'single-select'),
                        index: index,
                        disabled: table.disabled ? 'disabled="disabled"' : '',
                        checked: isRowSelected(table, index)
                            ? 'checked="checked"'
                            : '',
                        checkboxClassName: table.helper.getPrefixClass('radio-custom')
                    };
                    return lib.format(singleSelectTpl, data);
                }
            };
        }

        /**
         * 行的checkbox点击处理函数
         *
         * @private
         * @param {Element} element 行元素
         */
        function rowCheckboxClick(element) {
            var index = getAttr(element, 'index');
            selectMulti(this, index);
            resetMutilSelectedStatus(this);
        }

        /**
         * 根据checkbox是否全部选中，更新头部以及body的checkbox状态
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {number} index 需要更新的body中checkbox行，不传则更新全部
         * @param {boolean} isSelected 是否设置选中
         */
        function selectMulti(table, index, isSelected) {
            var selectedClass = 'row-selected';
            var helper = table.helper;
            var row;
            var input;
            if (index >= 0) {
                input = lib.g(getId(table, 'multi-select') + index);
                if (input) {
                    hasValue(isSelected) && (input.checked = isSelected);
                    row = getRow(table, index);
                    if (input.checked) {
                        helper.addPartClasses(selectedClass, row);
                    }
                    else {
                        helper.removePartClasses(selectedClass, row);
                    }
                }
            }
            else if (hasValue(isSelected)) {
                var inputs = findSelectBox(table, 'checkbox');
                for (var i = 0, len = inputs.length; i < len; i++) {
                    input = inputs[i];
                    input.checked = isSelected;
                    var inputIndex = getAttr(input, 'index');
                    row = getRow(table, inputIndex);
                    if (isSelected) {
                        helper.addPartClasses(selectedClass, row);
                    }
                    else {
                        helper.removePartClasses(selectedClass, row);
                    }
                }
            }
        }


        /**
         * 重置多选的选中状态，包括是否全选和selectedIndex
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function resetMutilSelectedStatus(table) {
            var selectAll = getHeadCheckbox(table);
            var inputs = findSelectBox(table, 'checkbox');
            var allChecked = true;
            var selected = [];
            var cbIdPrefix = getId(table, 'multi-select');

            for (var i = 0, len = inputs.length; i < len; i++) {
                var input = inputs[i];
                if (input.id.indexOf(cbIdPrefix) >= 0) {
                    var inputIndex = getAttr(input, 'index');
                    if (!input.checked) {
                        allChecked = false;
                    }
                    else {
                        selected.push(inputIndex);
                    }
                }
            }

            setSelectedIndex(table, selected);
            table.fire('select', {selectedIndex: selected});

            selectAll.checked = allChecked;
        }

        /**
         * 全选/不选 所有的checkbox表单
         *
         * @private
         */
        function toggleSelectAll() {
            selectAll(this, getHeadCheckbox(this).checked);
        }

        /**
         * 获取所有选择Box
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {string} type box类型
         * @return {Array}
         */
        function findSelectBox(table, type) {
            var inputs = getBody(table).getElementsByTagName('input');
            var result = [];
            for (var i = 0, len = inputs.length; i < len; i++) {
                var input = inputs[i];
                var inputId = input.id;
                if (input.getAttribute('type') === type && inputId) {
                    result.push(input);
                }
            }
            return result;
        }

        /**
         * 更新所有checkbox的选择状态
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {boolean} checked 是否选中
         */
        function selectAll(table, checked) {
            selectMulti(table, -1, checked);
            resetMutilSelectedStatus(table);
        }

        /**
         * 单选响应函数
         *
         * @param {Element} element 目标元素
         */
        function selectSingleHandler(element) {
            selectSingle(this, getAttr(element, 'index'), true);
        }

        /**
         * 单选选取
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {number} index 选取的序号
         * @param {boolean} isSelected 是否设置选中
         */
        function selectSingle(table, index, isSelected) {
            var selectedIndex = table.selectedIndex;
            // index 为-1时表示全选，对于single类型不需要处理
            if (index >= 0) {
                var input = lib.g(getId(table, 'single-select') + index);
                if (input) {
                    hasValue(isSelected) && (input.checked = isSelected);

                    table.fire('select', {selectedIndex: index});

                    if (selectedIndex && selectedIndex.length) {
                        table.helper.removePartClasses(
                            'row-selected', getRow(table, selectedIndex[0])
                        );
                    }
                    // isSelected为true时，设置选中，为false时，不需要设置
                    if (isSelected) {
                        setSelectedIndex(table, [index]);
                        table.helper.addPartClasses('row-selected', getRow(table, index));
                    }
                }
            }
        }

        /**
         * 重置Table主元素的ZIndex
         *
         * @param {ui.Table} table table控件实例
         *
         * @private
         */
        function resetMainZIndex(table) {
            table.main.style.zIndex = table.zIndex || '';
        }

        /**
         * 设置元素的disable样式
         *
         * @param {ui.Table} table table控件实例
         *
         * @private
         */
        function setDisabledStyle(table) {
            var inputs = findSelectBox(
                table, table.select === 'multi' ? 'checkbox' : 'radio');
            for (var i = inputs.length - 1; i >= 0; i--) {
                if (table.disabled) {
                    inputs[i].setAttribute('disabled', 'disabled');
                }
                else {
                    inputs[i].removeAttribute('disabled');
                }
            }

            if (table.select === 'multi') {
                var selectAll = getHeadCheckbox(table);
                if (selectAll) {
                    if (table.disabled) {
                        selectAll.setAttribute('disabled', 'disabled');
                    }
                    else {
                        selectAll.removeAttribute('disabled');
                    }
                }
            }

            if (table.children && table.children.length) {
                var children = table.children;
                for (i = children.length - 1; i >= 0; i--) {
                    children[i].setDisabled(table.disabled);
                }
            }
        }

        var rclass = /[\t\r\n]/g;

        /**
         * 根据单个className的元素匹配函数
         *
         * @private
         * @param {string} className className
         * @return {Function}
         */
        function getClassMatch(className) {
            var cssClass = ' ' + className + ' ';
            return function (element) {
                var elClassName = ' ' + element.className + ' ';
                return  elClassName.replace(rclass, ' ').indexOf(cssClass) >= 0;
            };
        }

        /**
         * 创建委托的Handler
         *
         * @private
         * @param {Function} handler 响应函数
         * @param {Function} matchFn className相关的判定函数
         * @return {Object}
         */
        function createHandlerItem(handler, matchFn) {
            var fn = null;
            if (matchFn) {
                fn = 'function' === typeof matchFn
                     ? matchFn
                     : getClassMatch(matchFn);
            }

            return {
                handler: handler,
                matchFn: fn
            };
        }

        /**
         * 获取对应事件的handle队列
         *
         * @private
         * @param {ui.Table} table table控件实例
         * @param {Element} element 元素
         * @param {string} eventType 事件类型
         * @return {Array}
         */
        function getHandlers(table, element, eventType) {
            var realId = element.id;
            var handlers = table.handlers[realId];

            if (!handlers) {
                handlers = (table.handlers[realId]  = {});
            }
            if (eventType) {
                handlers = table.handlers[eventType];
                if (!handlers) {
                    handlers = (table.handlers[eventType] = []);
                }
            }

            return handlers;
        }

        /**
         * 批量添加handlers
         *
         * @param {ui.Table} table table控件实例
         * @param {Element} element 元素
         * @param {string} eventType 事件类型
         * @param {Array} handlers handle队列
         * @private
         *
         * @return {Array} handle队列
         */
        function addHandlers(table, element, eventType, handlers) {
            var handlerQueue = getHandlers(table, element, eventType);
            var addedHandlers = [];

            // 若从未在该element元素上添加过该eventType的事件委托，
            // 则初次则自动添加该委托
            if (!handlerQueue.length) {
                addDelegate(table, element, eventType);
            }

            for (var i = 0, l = handlers.length; i < l; i++) {
                var item = handlers[i];
                var hanlderItem = createHandlerItem(item.handler, item.matchFn);
                handlerQueue.push(hanlderItem);
                addedHandlers.push(hanlderItem);
            }

            return addedHandlers;
        }

        /**
         * 批量删除handlers
         *
         * @param {ui.Table} table table控件实例
         * @param {Element} element 元素
         * @param {string} eventType 事件类型
         * @param {Array} handlers handle队列
         *
         * @private
         */
        function removeHandlers(table, element, eventType, handlers) {
            var handlerQueue = getHandlers(table, element, eventType);
            for (var i = 0, len = handlers.length; i < len; i++) {
                var handler = handlers[i];

                for (var j = 0, l = handlerQueue.length; j < l; j++) {
                    if (handlerQueue[j] === handler) {
                        handlerQueue.splice(j, 1);
                        j--;
                    }
                }
            }

            // 若handlerQueue为空则移除该事件委托，
            // 与addHandlers中添加事件委托的逻辑相呼应
            if (!handlerQueue.length) {
                removeDelegate(table, element, eventType);
            }
        }

        /**
         * 生成委托处理函数
         *
         * @private
         * @param {Element} element 元素
         * @param {Array} handlerQueue handle队列
         * @param {Object} scope handle上下文
         * @return {Function}
         */
        function getDelegateHandler(element, handlerQueue, scope) {
            return function (e) {
                var cur = e.target;
                while (cur) {
                    if (cur.nodeType === 1) {
                        for (var i = handlerQueue.length - 1; i >= 0; i--) {
                            var handlerItem = handlerQueue[i];
                            if (!handlerItem.matchFn
                                || handlerItem.matchFn(cur)
                            ) {
                                handlerItem.handler.call(scope, cur, e);
                            }
                        }
                    }
                    if (cur === element) {
                        break;
                    }
                    cur = cur.parentNode;
                }
            };
        }

        /**
         * 添加事件委托
         *
         * @param {ui.Control} control 控件
         * @param {Element} element 元素
         * @param {string} eventType 事件类型
         */
        function addDelegate(control, element, eventType) {
            var handlerQueue = getHandlers(control, element, eventType);
            control.helper.addDOMEvent(
                element,
                eventType,
                getDelegateHandler(element, handlerQueue, control)
            );
        }

        /**
         * 移除事件委托
         *
         * @param {ui.Control} control 控件
         * @param {Element} element 元素
         * @param {string} eventType 事件类型
         */
        function removeDelegate(control, element, eventType) {
            control.helper.removeDOMEvent(element, eventType);
        }

        /**
         * 初始化main元素事件处理函数
         *
         * @param {ui.Table} table table控件实例
         */
        function initMainEventhandler(table) {
            var helper = table.helper;
            var rowClass = helper.getPartClassName('row');
            var titleClass = helper.getPartClassName('hcell');
            var selectAllClass = helper.getPartClassName('select-all');
            var multiSelectClass = helper.getPartClassName('multi-select');
            var singleSelectClass = helper.getPartClassName('single-select');

            addHandlers(
                table,
                table.main,
                'mouseover',
                [
                    {
                        handler: rowOverHandler,
                        matchFn: rowClass
                    },
                    {
                        handler: titleOverHandler,
                        matchFn: titleClass
                    }
                ]
            );

            addHandlers(
                table,
                table.main,
                'mouseout',
                [
                    {
                        handler: rowOutHandler,
                        matchFn: rowClass
                    },
                    {
                        handler: titleOutHandler,
                        matchFn: titleClass
                    }
                ]
            );

            addHandlers(
                table,
                table.main,
                'click',
                [
                    {
                        handler: rowClickHandler,
                        matchFn: rowClass
                    },
                    {
                        handler: titleClickHandler,
                        matchFn: titleClass
                    },
                    {
                        handler: toggleSelectAll,
                        matchFn: selectAllClass
                    },
                    {
                        handler: rowCheckboxClick,
                        matchFn: multiSelectClass
                    },
                    {
                        handler: selectSingleHandler,
                        matchFn: singleSelectClass
                    }
                ]
            );
        }

        esui.register(Table);
        return Table;
    }
);
