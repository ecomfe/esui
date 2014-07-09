/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file 表格控件
 * @author wurongyao
 */
define(
    function (require) {
        var lib = require('./lib');
        var u = require('underscore');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        /**
         * 表格控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Table(options) {
            var protectedProperties = {
                followHeightArr: [0, 0],
                followWidthArr: [],
                handlers: []
            };

            Control.call(this, u.extend({}, options, protectedProperties));
        }

        /**
         * 默认属性值
         *
         * @type {Object}
         * @public
         */
        Table.defaultProperties = {
            noDataHtml: '没有数据',
            noFollowHeadCache: false,
            followHead: false,
            sortable: false,
            encode: false,
            columnResizable: false,
            rowWidthOffset: -1,
            select: '',
            selectMode: 'box',
            subrowMutex: 1,
            subEntryOpenTip: '点击展开',
            subEntryCloseTip: '点击收起',
            subEntryWidth: 18,
            breakLine: false,
            hasTip: false,
            hasSubrow: false,
            tipWidth: 18,
            sortWidth: 9,
            fontSize: 13,
            colPadding: 8,
            zIndex: 0
        };

        /**
         * 判断值是否为空
         *
         * @private
         * @return {bool}
         */
        function hasValue(obj) {
            return !(typeof obj === 'undefined' || obj === null);
        }


        /**
         * 判断值是否为空,包括空字符串
         *
         * @private
         * @return {bool}
         */
        function isNullOrEmpty(obj) {
            return !hasValue(obj) || !obj.toString().length;
        }

        /**
         * 设置元素属性 自动加上data-前缀
         *
         * @private
         */
        function setAttr(element, key, value){
            lib.setAttribute(element, 'data-' + key, value);
        }

        /**
         * 获取dom带有data-前缀的属性值
         *
         * @private
         * @return {string}
         */
        function getAttr(element, key){
            return lib.getAttribute(element, 'data-' + key);
        }

        /**
         * 获取dom的样式
         *
         * @private
         * @return {string}
         */
        function getStyleNum(dom, styleName) {
            var result = lib.getStyle(dom, styleName);
            return (result === '' ? 0 : (parseInt(result, 10) || 0));
        }

         /**
         * 获取Id
         *
         * @protected
         */
        function getId(table, name) {
            return helper.getId(table, name);
        }

        /**
         * 获取dom子部件的css class
         *
         * @protected
         * @return {string}
         */
        function getClass(table, name) {
            return helper.getPartClasses(table, name).join(' ');
        }

        /**
         * 获取列表头容器元素
         *
         * @public
         * @return {HTMLElement}
         */
        function getHead(table) {
            return lib.g(getId(table, 'head'));
        }

        /**
         * 获取列表体容器素
         *
         * @public
         * @return {HTMLElement}
         */
        function getBody(table) {
            return lib.g(getId(table, 'body'));
        }


        /**
         * 获取列表尾容器元素
         *
         * @public
         * @return {HTMLElement}
         */
        function getFoot(table) {
            return lib.g(getId(table, 'foot'));
        }

        /**
         * 获取表格内容行的dom元素
         *
         * @private
         * @param {number} index 行号
         * @return {HTMLElement}
         */
        function getRow(table, index) {
            return lib.g(getId(table, 'row') + index);
        }

        /**
         * 获取checkbox选择列表格头部的checkbox表单
         *
         * @private
         * @return {HTMLElement}
         */
        function getHeadCheckbox(table) {
            return lib.g(getId(table, 'select-all'));
        }

        /**
         * selectedIndex的setter，将自动设置selectedIndexMap
         *
         * @private
         * @param {object} table 表格控件本身
         * @param {number} index 行号
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
         * @param {object} table 表格控件本身
         * @param {number} index 行号
         */
        function isRowSelected(table, index) {
            if (table.selectedIndexMap) {
                return !!table.selectedIndexMap[index];
            }
            return false;
        }

        /**
         * 获取表格所在区域宽度
         *
         * @private
         * @return {number}
         */
        function getWidth(table) {
            // 如果手工设置宽度，不动态计算
            if (table.width) {
                return table.width;
            }

            //根据表格父容器获取表格宽度
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
         * dom表格起始的html模板
         *
         * @private
         */
        var tplTablePrefix = '<table '
                            + 'cellpadding="0" '
                            + 'cellspacing="0" '
                            + 'width="${width}" '
                            + 'data-control-table="${controlTableId}">';

        /**
         * 初始化FollowHead
         *
         * @private
         */
        function initFollowHead(table){
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
         */
        function resetFollowHead(table){
            if (table.followHead) {
                cachingFollowDoms(table);
                resetFollowOffset(table);
            }
        }

         /**
         * 缓存表头跟随的Dom元素
         *
         * @private
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
         */
        function resetFollowDomsWidth(table){
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
            } else {
                var minWidth = fontSize + extraWidth;
                for (var i = 0, len = fields.length; i < len; i++) {
                    result[i] = minWidth;
                }
            }

            table.minColsWidth = result;
        }

        /**
         * 初始化列宽
         *
         * @private
         */
        function initColsWidth(table) {
            var fields = table.realFields;
            var canExpand = [];

            table.colsWidth = [];

            // 减去边框的宽度
            var leftWidth = table.realWidth - 1;

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
            var len = canExpand.length;
            var leaveAverage = Math.round(leftWidth / len);

            for (var i = 0; i < len; i++) {
                var index  = canExpand[i];
                var offset = Math.abs(leftWidth) < Math.abs(leaveAverage)
                            ? leftWidth : leaveAverage;

                leftWidth -= offset;
                table.colsWidth[index] += offset;

                //计算最小宽度
                var minWidth = table.minColsWidth[index];
                if (minWidth > table.colsWidth[index]) {
                    leftWidth += table.colsWidth[index] - minWidth;
                    table.colsWidth[index] = minWidth;
                }
            }

            // 如果空间不够分配，需要重新从富裕的列调配空间
            if (leftWidth < 0) {
                var i = 0;
                while (i < len && leftWidth !== 0) {
                    var index = canExpand[i];
                    var minWidth = table.minColsWidth[index];

                    if (minWidth < table.colsWidth[index]) {
                        var offset = table.colsWidth[canExpand[i]] - minWidth;
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
         */
        function renderFoot(table) {
            var foot = getFoot(table);

            if (!(table.foot instanceof Array)) {
                foot && (foot.style.display = 'none');
            } else {
                if (!foot) {
                    foot = document.createElement('div');
                    foot.id = getId(table, 'foot');
                    foot.className = getClass(table, 'foot');
                    setAttr(foot, 'control-table', table.id);

                    table.main.appendChild(foot);
                }

                foot.style.display = '';
                 if (table.realWidth) {
                    foot.style.width = table.realWidth + 'px';
                }
                foot.innerHTML = getFootHtml(table);
            }
        }

        /**
         * 获取表格尾的html
         *
         * @private
         * @return {string}
         */
        function getFootHtml(table) {
            var html = [];
            var footArray = table.foot;
            var fieldIndex = 0;
            var colsWidth = table.colsWidth;
            var thCellClass = getClass(table, 'fcell');
            var thTextClass = getClass(table, 'fcell-text');
            var rowWidthOffset = table.rowWidthOffset;
            html.push(
                lib.format(
                    tplTablePrefix,
                    { width: '100%', controlTableId : table.id }
                ),
                '<tr>'
            );

            for (var i = 0, len = footArray.length; i < len; i++) {
                var footInfo = footArray[i];
                var colWidth = colsWidth[fieldIndex];
                var colspan = footInfo.colspan || 1;
                var thClass = [thCellClass];
                var contentHtml = footInfo.content;

                if ('function' == typeof contentHtml) {
                    contentHtml = contentHtml.call(table);
                }
                if (isNullOrEmpty(contentHtml)) {
                    contentHtml = '&nbsp;';
                }

                for (var j = 1; j < colspan; j++) {
                    colWidth += colsWidth[fieldIndex + j];
                }

                fieldIndex += colspan;
                if (footInfo.align) {
                    thClass.push(
                        getClass(table, 'cell-align-' + footInfo.align));
                }

                colWidth += rowWidthOffset;
                (colWidth < 0) && (colWidth = 0);
                html.push(
                    '<th id="' + getFootCellId(table, i) + '" '
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

                helper.addDOMEvent(
                    table,
                    head,
                    'mousemove',
                    u.bind(headMoveHandler, head, table)
                );
                helper.addDOMEvent(
                    table,
                    head,
                    'mousedown',
                    u.bind(dragStartHandler, head, table)
                );
            }

            if (table.noHead) {
                head.style.display = 'none';
                return;
            }

            head.style.display = '';
            if (table.realWidth) {
                head.style.width = table.realWidth + 'px';
            }

            lib.g(headPanelId).innerHTML = getHeadHtml(table);

            //初始化表头子控件
            initHeadChildren(table, table.viewContext.get(headPanelId));
        }

         /**
         * 初始化表头子控件
         *
         * @private
         */
        function initHeadChildren(table, headPanel){
            //清理table之前的子控件,因为只有Head用到了子控件才能在这里调用该方法
            if (headPanel.children) {
                headPanel.disposeChildren();
            }

             //初始化Head子控件
            if (table.hasTip) {
                headPanel.initChildren();
            }
        }

        //表格排序区域模版
        var tplSortIcon = '<div class="${className}"></div>';

        //表格头提示信息模版
        var tplTitleTip = '<div id="${id}" '
                        + 'class="${className}" '
                        + 'data-ui="type:Tip;id:${id};content:${content}">'
                        + '</div>';

        /**
         * 获取表格头的html
         *
         * @private
         * @return {string}
         */
        function getHeadHtml(table) {
            var fields = table.realFields;
            var thCellClass = getClass(table, 'hcell');
            var thTextClass = getClass(table, 'hcell-text');
            var breakClass = getClass(table, 'cell-break');
            var sortClass = getClass(table, 'hsort');
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
                for (var i = len - 1; i >= 0; i--) {
                    if (!fields[ i ].stable) {
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
                    { width: '100%' , controlTableId: table.id }
                ),
                '<tr>'
            );

            for (var i = 0, len = fields.length; i < len; i++) {
                var thClass = [thCellClass];
                var field = fields[i];
                var title = field.title;
                var sortable = table.sortable && field.sortable;
                var currentSort = sortable
                                && field.field
                                && field.field == table.orderBy;
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
                        { className: sortClass }
                    );
                }

                //计算表格对齐样式
                if (field.align) {
                    thClass.push(getClass(table, 'cell-align-' + field.align));
                }

                // 判断是否breakline模式
                if (table.breakLine|| field.breakLine) {
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
                            className: getClass(table,'htip'),
                            content: titleTipContent
                        }
                    );

                    table.hasTip = true;
                }

                var contentHtml;
                // 计算内容html
                if (typeof title == 'function') {
                    contentHtml = title.call(table);
                } else {
                    contentHtml = title;
                }
                if (isNullOrEmpty(contentHtml)) {
                    contentHtml = '&nbsp;';
                }


                html.push(
                    '<th id="' + getTitleCellId(table, i) + '"',
                    ' data-index="' + i + '"',
                    ' class="' + thClass.join(' ') + '"',
                    sortable ? ' data-sortable="1"' : '',
                    (i >= canDragBegin && i < canDragEnd
                        ? ' data-dragright="1"' : ''),
                    (i <= canDragEnd && i > canDragBegin
                        ? ' data-dragleft="1"' : ''),
                    ' style="',
                    'width:' + (table.colsWidth[i] + rowWidthOffset) + 'px;',
                    (table.colsWidth[i] ? '' : 'display:none') + '">',
                    '<div class="' + realThTextClass +
                    (field.select ? ' ' + selClass : '') + '">',
                    titleTipHtml,
                    contentHtml,
                    sortIconHtml,
                    '</div></th>'
                );
            }
            html.push('</tr></table>');

            return html.join('');
        }

        /**
         * 获取表格头单元格的id
         *
         * @private
         * @param {object} table table控件
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
         * @param {object} table table控件
         * @param {number} index 单元格的序号
         * @return {string}
         */
        function getFootCellId(table, index) {
            return getId(table, 'foot-cell') + index;
        }

        /**
         * 表格头单元格鼠标移入的事件handler
         *
         * @private
         * @param {HTMLElement} element 移出的单元格
         */
        function titleOverHandler(element, e) {
           titleOver(this, element);
        }

        function titleOver(table, element) {
            if (table.isDraging || table.dragReady) {
                return;
            }

            helper.addPartClasses(table, 'hcell-hover', element);

            if (table.sortable) {
                table.sortReady = 1;
                var index = getAttr(element, 'index');
                var field = table.realFields[index];

                if (field && field.sortable) {
                    helper.addPartClasses(table, 'hcell-sort-hover', element);
                }
            }
        }

        /**
         * 表格头单元格鼠标移出的事件handler
         *
         * @private
         * @param {HTMLElement} cell 移出的单元格
         */
        function titleOutHandler(element, e) {
            titleOut(this, element);
        }

        function titleOut(table, element) {
            helper.removePartClasses(table, 'hcell-hover', element);

            if (table.sortable) {
                table.sortReady = 0;
                helper.removePartClasses(table, 'hcell-sort-hover', element);
            }
        }

        /**
         * 表格头单元格点击的事件handler
         *
         * @private
         * @param {HTMLElement} cell 点击的单元格
         */
        function titleClickHandler(element, e) {
            var table = this;
            if (table.sortable && table.sortReady) { // 避免拖拽触发排序行为
                var index = getAttr(element, 'index');
                var field = table.realFields[index];
                if (field.sortable) {
                    var orderBy = table.orderBy;
                    var order = table.order;

                    if (orderBy == field.field) {
                        order = (!order || order == 'asc') ? 'desc' : 'asc';
                    } else {
                        order = 'desc';
                    }

                    table.setProperties({
                        order: order,
                        orderBy: field.field
                    });

                    table.fire('sort', { field: field, order: order });
                }
            }
        }

        /**
         * 获取表格头鼠标移动的事件handler
         *
         * @private
         * @return {Function}
         */
        function headMoveHandler(table, e) {
            if(!table.columnResizable){
                return;
            }

            var dragClass = 'startdrag';
            var range = 8; // 可拖拽的单元格边界范围
            if (table.isDraging) {
                return;
            }

            var tar = e.target ;
            // 寻找th节点。如果查找不到，退出
            tar = findDragCell(table, tar);
            if (!tar) {
                return;
            }
            var el = this;
            var pageX = e.pageX || e.clientX + lib.page.getScrollLeft();

            // 获取位置与序号
            var pos = lib.getOffset(tar);
            var sortable = getAttr(tar, 'sortable');

            // 如果允许拖拽，设置鼠标手型样式与当前拖拽点
            if (getAttr(tar, 'dragleft')  && pageX - pos.left < range) {
                sortable && (titleOut(table, tar)); // 清除可排序列的over样式
                helper.addPartClasses(table, dragClass, el);
                table.dragPoint = 'left';
                table.dragReady = 1;
            }
            else if (getAttr(tar, 'dragright')
                && pos.left + tar.offsetWidth - pageX < range
            ) {
                sortable && (titleOut(table, tar)); // 清除可排序列的over样式
                helper.addPartClasses(table, dragClass, el);
                table.dragPoint = 'right';
                table.dragReady = 1;
            }
            else {
                helper.removePartClasses(table, dragClass, el);
                sortable && (titleOver(table, tar)); // 附加可排序列的over样式
                table.dragPoint = '';
                table.dragReady = 0;
            }
        }

        /**
         * 查询拖拽相关的表格头单元格
         *
         * @private
         * @param {HTMLElement} target 触发事件的元素
         * @return {HTMLTHElement}
         */
        function findDragCell(taable, target) {
            while (target.nodeType == 1) {
                if (target.nodeName == 'TH') {
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
         * @return {Function}
         */
        function dragStartHandler(table, e) {
            if(!table.columnResizable){
                return;
            }

            // @DEPRECATED: 移除
            table.fire('startdrag');
            table.fire('dragstart');

            var dragClass = getClass(table, 'startdrag');
            var tar = e.target;

            // 寻找th节点，如果查找不到，退出
            tar = findDragCell(table, tar);
            if (!tar) {
                return;
            }

            if (lib.g(getId(table, 'head')).className.indexOf(dragClass) < 0) {
                return;
            }
            // 获取显示区域高度
            table.htmlHeight = document.documentElement.clientHeight;

            // 记忆起始拖拽的状态
            table.isDraging = true;
            table.dragIndex = getAttr(tar, 'index');
            table.dragStart = e.pageX || e.clientX + lib.page.getScrollLeft();

            initTableOffset(table);

            // 绑定拖拽事件
            var realDragingHandler = u.partial(dragingHandler, table);
            var realDragEndHandler = function(e) {
                var retrunResult = true;
                try { retrunResult = u.partial(dragEndHandler, table)(e); }
                catch (er) {}

                //清除拖拽向全局绑定的事件
                lib.un(document, 'mousemove', realDragingHandler);
                lib.un(document, 'mouseup', realDragEndHandler);

                return retrunResult;
            };

            lib.on(document, 'mousemove', realDragingHandler);
            lib.on(document, 'mouseup', realDragEndHandler);

            // 显示拖拽基准线
            showDragMark(table, table.dragStart);

            // 阻止默认行为
            lib.event.preventDefault(e);
            return false;
        }

         /**
         * 缓存Table的Offset数据
         *
         * @private
         */
        function initTableOffset(table){
            var tableOffset = lib.getOffset(table.main);
            table.top = tableOffset.top;
            table.left = tableOffset.left;
        }

        /**
         * 获取拖拽中的事件handler
         *
         * @private
         * @desc 移动拖拽基准线
         * @return {Function}
         */
        function dragingHandler(table, evt) {
            var e = evt || window.event;
            showDragMark(
                table,
                e.pageX || e.clientX + lib.page.getScrollLeft()
            );
            lib.event.preventDefault(e);
            return false;
        }

        /**
         * 显示基准线
         *
         * @private
         */
        function showDragMark(table, left) {
            var mark = getDragMark(table);

            var right = table.left + table.realWidth;
            //加减1是为了在表格边框以内
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
         * @return {HTMLElement}
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
         * @return {HTMLElement}
         */
        function getDragMark(table) {
            return lib.g(getId(table, 'drag-mark'));
        }

        /**
         * 获取拖拽结束的事件handler
         *
         * @private
         * @return {Function}
         */
        function dragEndHandler(table, evt) {
            var e = evt || window.event;
            var index = parseInt(table.dragIndex, 10);
            var pageX = e.pageX || e.clientX + lib.page.getScrollLeft();
            var fields = table.realFields;
            var fieldLen = fields.length;
            var alterSum = 0;
            var colsWidth = table.colsWidth;
            var revise = 0;

            // 校正拖拽元素
            // 如果是从左边缘拖动的话，拖拽元素应该上一列
            if (table.dragPoint == 'left') {
                index--;
            }

            // 校正拖拽列的宽度
            // 不允许小于最小宽度
            var minWidth = table.minColsWidth[index];
            var offsetX = pageX - table.dragStart;
            var currentWidth = colsWidth[index] + offsetX;
            if (currentWidth < minWidth) {
                offsetX += (minWidth - currentWidth);
                currentWidth = minWidth;
            }

            var alters = [];
            var alterWidths = [];
            //查找宽度允许改变的列
            for (var i = index + 1; i < fieldLen; i++) {
                if (!fields[ i ].stable && colsWidth[i] > 0) {
                    alters.push(i);
                    alterWidth = colsWidth[i];
                    alterWidths.push(alterWidth);
                    alterSum += alterWidth;
                }
            }

            // 计算允许改变的列每列的宽度
            var leave = offsetX;
            var alterLen = alters.length;
            for (var i = 0; i < alterLen; i++) {
                var alter = alters[i];
                var alterWidth = alterWidths[i];    //当前列宽
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

            table.isDraging = false;
            hideDragMark(table);

            // @DEPRECATED: 移除
            table.fire('enddrag');
            table.fire('dragend');

            lib.event.preventDefault(e);
            return false;
        }

        /**
         * 绘制表格主体
         *
         * @private
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

            var style = tBody.style;
            style.overflowX = 'hidden';
            style.overflowY = 'auto';
            if (table.realWidth) {
                style.width = table.realWidth + 'px';
            }

            table.bodyPanel.disposeChildren();
            lib.g(tBodyPanelId).innerHTML = getBodyHtml(table);

            table.fire('bodyChange');
        }

         /**
         * 更新表格指定高度
         *
         * @private
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
                html.push(getRowHtml(table, item, i, rowBuilderList));
            }

            return html.join('');
        }

        /**
         * 获取表格体的单元格id
         *
         * @private
         * @param {number} rowIndex 当前行序号
         * @param {number} fieldIndex 当前字段序号
         * @return {string}
         */
        function getBodyCellId(table, rowIndex, fieldIndex) {
            return getId(table, 'cell') + rowIndex + '-' + fieldIndex;
        }

         var tplRowPrefix = '<div '
                          + 'id="${id}" '
                          + 'class="${className}" '
                          + 'data-index="${index}" ${attr}>';

         /**
         * 批量添加rowBuilder
         *
         * @private
         * @param {Object} table
         * @param {Array} builderList rowBuilder数组
         */
        function addRowBuilderList(table, builderList) {
            var rowBuilderList = table.rowBuilderList || [];
            for (var i = 0, l = builderList.length; i <l; i++) {
                var builder = builderList[i];
                if (!builder.getColHtml) {
                    continue;
                }

                if(builder.getSubrowHtml) {
                    table.hasSubrow = true;
                }

                if(!hasValue(builder.index)) {
                    builder.index = 1000;
                }

                rowBuilderList.push(builder);
            }

            rowBuilderList.sort(function(a, b) {
                return a.index - b.index;
            });

            table.rowBuilderList = rowBuilderList;
        }

        /**
         * 初始化基础Builder
         *
         * @private
         * @param {Object} table
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
         * 获取表格行的html
         *
         * @private
         * @param {Object} data 当前行的数据
         * @param {number} index 当前行的序号
         * @return {string}
         */
        function getRowHtml(table, data, index, builderList) {
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

            for (var i = 0, l = fields.length; i < l; i++) {
                var field = fields[i];
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
                        } else {
                            textHtml.push(colHtml);
                            (textStartIndex < 0) && (textStartIndex = s);
                        }
                    }
                }

                var contentHtml = '';
                textHtml = [
                    '<div class="' + textClass.join(' ') + '" ',
                    textAttr.join(' ') + '>',
                        textHtml.join(''),
                    '</div>'
                ].join('');

                allHtml.push({html: textHtml, index: textStartIndex});
                allHtml.sort(sortByIndex);

                if (allHtml.length > 1) {
                    var contentHtml = [
                        '<table width="100%" cellpadding="0" cellspacing="0">',
                            '<tr>'
                    ];

                    for (var s = 0, t = allHtml.length; s < t; s++) {
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
                } else {
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
            }

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
                    { width : '100%' , controlTableId : table.id }
                )
            );

            html.push('</tr></table></div>');

            if (table.hasSubrow) {
                for (var i = 0, l = builderList.length; i <l; i++) {
                    var subrowBuilder = builderList[i].getSubrowHtml;
                    if (subrowBuilder) {
                        html.push(
                            subrowBuilder(table, index, extraArgsList[i])
                        );
                    }
                }
            }

            return html.join('');
        }

        /**
         * base行绘制每行基本参数
         *
         * @private
         */
        function getRowBaseArgs(table, rowIndex) {
            var datasource = table.datasource || [];
            var dataLen = datasource.length;
            return {
                tdCellClass : getClass(table, 'cell'),
                tdBreakClass : getClass(table, 'cell-break'),
                tdTextClass : getClass(table, 'cell-text'),
                fieldLen: table.realFields.length,
                rowClass: [
                    getClass(table, 'row'),
                    getClass(table, 'row-' + ((rowIndex % 2) ? 'odd' : 'even')),
                    isRowSelected(table, rowIndex)
                        ? getClass(table, 'row-selected')
                        : '',
                    dataLen - 1 == rowIndex
                        ? getClass(table, 'row-last')
                        : ''
                ].join(' ')
            };
        }

        var baseColTextTpl = '<span id="${colTextId}">${content}</span>';

        /**
         * base列
         *
         * @private
         */
        function getColBaseHtml(
            table, data, field, rowIndex, fieldIndex, extraArgs
        ) {
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
            if (field.field && field.field == table.orderBy) {
                tdClass.push(getClass(table, 'cell-sorted'));
            }

            // 构造内容html
            var contentHtml = 'function' == typeof content
                ? content.call(table, data, rowIndex, fieldIndex)
                : (table.encode
                    ? lib.encodeHTML(data[content])
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
                            'cell-textfield-' + rowIndex + '-'+ fieldIndex
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
         * @param {number} index 表格行序号
         */
        function rowOverHandler(element, e) {
            if (this.isDraging) {
                return;
            }
            helper.addPartClasses(this, 'row-hover',element);
        }

        /**
         * 表格行鼠标移出的事件handler
         *
         * @private
         * @param {number} index 表格行序号
         */
        function rowOutHandler(element, e) {
            helper.removePartClasses(this, 'row-hover', element);
        }

        /**
         * 表格行鼠标点击的事件handler
         *
         * @private
         * @param {number} index 表格行序号
         */
        function rowClickHandler(element, e) {
            var table = this;
            var rowClassName = helper.getPartClasses(table, 'cell-text')[0];

            if (table.selectMode == 'line'
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
         */
        function initResizeHandler(table) {
            table.viewWidth = lib.page.getViewWidth();
            table.viewHeight = lib.page.getViewHeight();

            var resizeHandler = function() {
                var viewWidth = lib.page.getViewWidth();
                var viewHeight = lib.page.getViewHeight();

                if (viewWidth == table.viewWidth
                    && viewHeight == table.viewHeight
                ) {
                    return;
                }

                table.viewWidth = viewWidth;
                table.viewHeight = viewHeight;

                handleResize(table);
            };

            helper.addDOMEvent(table, window, 'resize', resizeHandler);
        }

        /**
         * 浏览器resize的处理
         *
         * @private
         */
        function handleResize(table) {
            var head = getHead(table);
            var foot = getFoot(table);
            table.realWidth = getWidth(table);
            var widthStr = table.realWidth + 'px';

            // 设置主区域宽度
            if (table.realWidth) {
                table.main.style.width = widthStr;
                getBody(table).style.width = widthStr;
                head && (head.style.width = widthStr);
                foot && (foot.style.width = widthStr);
            }
            // 重新绘制每一列
            initColsWidth(table);
            resetColumns(table);

            if (table.followHead) {
                resetFollowDomsWidth(table);

                //宽度的改变是会影响高度的，所以高度信息放在后面
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
         */
        function setPos(dom, pos, top , left) {
            if (dom) {
                dom.style.top = top + 'px';
                dom.style.left = left + 'px';
                dom.style.position = pos;
            }
        }

        /**
         * 纵向锁定初始化
         *
         * @private
         */
         function initTopResetHandler(table) {
            //避免重复绑定
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

            table.topReseter = function() {
                if (!table.followHead) {
                    return ;
                }
                var scrollTop = lib.page.getScrollTop();
                var posStyle = lib.ie && lib.ie < 7 ? 'absolute' : 'fixed';
                var mainHeight = table.main.offsetHeight;
                var absolutePosition = posStyle == 'absolute';
                var placeHolder = lib.g(placeHolderId);
                var followDoms = table.followDoms;

                //如果不启用缓存，则需要每次滚动都做判断并获取了
                if (table.noFollowHeadCache) {
                    var position = domHead.style.position;
                    if ((position !== 'fixed' && position !== 'absolute')) {
                        resetFollowOffset(table);
                    }
                }

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
                        for (var i = 0, len = followDoms.length; i < len; i++) {
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

                    } else {
                        for (var i = 0, len = followDoms.length; i < len; i++) {
                            setPos(followDoms[i], posStyle, fhArr[i] ,curLeft);
                        }
                        setPos(domHead, posStyle, fhArr[fhLen - 1] , curLeft);
                    }
                }
                else {
                    placeHolder.style.height  = 0;
                    placeHolder.style.display = 'none';
                    posStyle = '';

                    for (var i = 0, len = followDoms.length; i < len; i++) {
                        setPos(followDoms[i], posStyle, 0, 0);
                    }

                    setPos(domHead, posStyle, 0, 0);
                    domHead.style.zIndex = '';
                }

            };

            helper.addDOMEvent(table, window, 'scroll', table.topReseter);
        }

        /**
         * 重新设置表格每个单元格的宽度
         *
         * @private
         */
        function resetColumns(table) {
            var colsWidth = table.colsWidth;
            var foot = table.foot;
            var id = table.id;
            var len = foot instanceof Array && foot.length;
            var tds = getBody(table).getElementsByTagName('td');
            var tdsLen = tds.length;
            var rowWidthOffset = table.rowWidthOffset;

            // 重新设置表格尾的每列宽度
            if (len) {
                var colIndex = 0;
                for (var i = 0; i < len; i++) {
                    var item    = foot[i];
                    var width   = colsWidth[colIndex];
                    var colspan = item.colspan || 1;

                    for (var j = 1; j < colspan; j++) {
                        width += colsWidth[colIndex + j];
                    }
                    colIndex += colspan;

                    var td = lib.g(getFootCellId(table, i));
                    width = Math.max(width + rowWidthOffset, 0);

                    td.style.width = width + 'px';
                    td.style.display = width ? '' : 'none';
                }
            }

            // 重新设置表格头的每列宽度
            len = colsWidth.length;
            if (!table.noHead) {
                for (var i = 0; i < len; i++) {
                    var width =
                        Math.max(colsWidth[i] + rowWidthOffset, 0);
                    var td = lib.g(getTitleCellId(table, i));
                    td.style.width = width + 'px';
                    td.style.display = width ? '' : 'none';
                }
            }

            // 重新设置表格体的每列宽度
            var j = 0;
            for (var i = 0; i < tdsLen; i++) {
                var td = tds[i];
                if (getAttr(td, 'control-table') == id) {
                    var width = Math.max(
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
        var mutilSelectAllTpl = '<input '
                                +  'type="checkbox" '
                                +  'id="${id}" '
                                +  'class="${className}" '
                                +  'data-index="${index}" '
                                +  '${disabled}/>';

        /**
         * 多选框模版
         *
         * @private
         */
        var mutilSelectTpl = '<input '
                            +  'type="checkbox" '
                            +  'id="${id}" '
                            +  'class="${className}" '
                            +  'data-index="${index}" '
                            +  '${disabled} '
                            +  '${checked} />';
        /**
         * 获取第一列的多选框
         *
         * @private
         */
        function getMultiSelectField(table) {
            return {
                width: 30,
                stable: true,
                select: true,
                title: function (item, index) {
                    var data = {
                        id: getId(table, 'select-all'),
                        className: getClass(table, 'select-all'),
                        disabled: table.disabled ? 'disabled="disabled"' : '',
                        index: index
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
                            : ''
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
        var singleSelectTpl = '<input '
                            +  'type="radio" '
                            +  'id="${id}" '
                            +  'name="${name}" '
                            +  'class="${className}" '
                            +  'data-index="${index}" '
                            +  '${disabled} '
                            +  '${checked} />';

        /**
         * 第一列的单选框
         *
         * @private
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
                            : ''
                    };
                    return lib.format(singleSelectTpl, data);
                }
            };
        }

        /**
         * 行的checkbox点击处理函数
         *
         * @private
         */
        function rowCheckboxClick(element, e) {
            var index = getAttr(element, 'index');
            selectMulti(this, index);
            resetMutilSelectedStatus(this);
        }

        /**
         * 根据checkbox是否全部选中，更新头部以及body的checkbox状态
         *
         * @private
         * @param {number} index 需要更新的body中checkbox行，不传则更新全部
         */
        function selectMulti(table, index, isSelected) {
            var selectedClass = 'row-selected';
            if (index >= 0) {
                var input = lib.g(getId(table, 'multi-select') + index);
                if (input) {
                    hasValue(isSelected) && (input.checked = isSelected);
                    var row = getRow(table, index);
                    if (input.checked) {
                        helper.addPartClasses(table, selectedClass, row);
                    } else {
                        helper.removePartClasses(table, selectedClass, row);
                    }
                }
            } else if(hasValue(isSelected)){
                var inputs = findSelectBox(table, 'checkbox');
                for (var i = 0, len = inputs.length; i < len; i++) {
                    var input = inputs[i];
                    input.checked = isSelected;
                    var inputIndex = getAttr(input, 'index');
                    var row = getRow(table, inputIndex);
                    if (isSelected) {
                        helper.addPartClasses(table, selectedClass, row);
                    } else {
                         helper.removePartClasses(table, selectedClass, row);
                    }
                }
            }
        }


        /**
         * 重置多选的选中状态，包括是否全选和selectedIndex
         *
         * @private
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
        function toggleSelectAll(arg) {
            selectAll(this, getHeadCheckbox(this).checked);
        }

        /**
         * 获取所有选择Box
         *
         * @private
         * @param {string} type box类型
         */
        function findSelectBox(table, type) {
            var inputs = getBody(table).getElementsByTagName('input');
            var result = [];
            for (var i = 0, len = inputs.length; i < len; i++) {
                var input = inputs[i];
                var inputId = input.id;
                if (input.getAttribute('type') == type && inputId) {
                    result.push(input);
                }
            }
            return result;
        }

        /**
         * 更新所有checkbox的选择状态
         *
         * @private
         * @param {boolean} checked 是否选中
         */
        function selectAll(table, checked) {
            selectMulti(table, -1, checked);
            resetMutilSelectedStatus(table);
        }

        function selectSingleHandler(element, e) {
            selectSingle(this, getAttr(element, 'index'));
        }

        /**
         * 单选选取
         *
         * @private
         * @param {number} index 选取的序号
         */
        function selectSingle(table, index, isSelected) {
            var selectedIndex = table.selectedIndex;
            var input = lib.g(getId(table, 'single-select') + index);
            if (input) {
                hasValue(isSelected) && (input.checked = isSelected);

                table.fire('select', {selectedIndex: index});

                if (selectedIndex && selectedIndex.length) {
                    helper.removePartClasses(
                        table, 'row-selected', getRow(table, selectedIndex[0]));
                }

                setSelectedIndex(table, [index]);
                helper.addPartClasses(table, 'row-selected', getRow(table, index));
            }
        }


        /**
         * 重置Table主元素的ZIndex
         *
         * @private
         */
        function resetMainZIndex(table){
            table.main.style.zIndex = table.zIndex || '';
        }

        /**
         * 设置元素的disable样式
         *
         * @private
         */
        function setDisabledStyle(table) {
            var inputs = findSelectBox(
                table, table.select == 'multi' ? 'checkbox' : 'radio');
            for (var i = inputs.length - 1; i >= 0; i--) {
                if (table.disabled) {
                    inputs[i].setAttribute('disabled', 'disabled');
                } else {
                    inputs[i].removeAttribute('disabled');
                }
            }

            if (table.select == 'multi') {
                var selectAll = getHeadCheckbox(table);
                if (selectAll) {
                    if (table.disabled) {
                        selectAll.setAttribute('disabled', 'disabled');
                    } else {
                        selectAll.removeAttribute('disabled');
                    }
                }
            }

            if (table.children && table.children.length) {
                var children = table.children;
                for (var i = children.length - 1; i >= 0; i--) {
                    children[i].setDisabled(table.disabled);
                }
            }
        }

        /**
         * 根据单个className的元素匹配函数
         *
         * @private
         */
        var rclass = /[\t\r\n]/g;
        function getClassMatch(className){
            var cssClass= ' ' + className + ' ';
            return function (element) {
                var elClassName = ' ' + element.className + ' ';
                return  elClassName.replace(rclass, ' ').indexOf(cssClass) >= 0;
            };
        }

        /**
         * 创建委托的Handler
         *
         * @private
         */
        function createHandlerItem(handler, matchFn){
            var fn = null;
            if (matchFn) {
                fn = 'function' == typeof matchFn
                     ? matchFn
                     : getClassMatch(matchFn);
            }

            return {
                handler : handler,
                matchFn : fn
            };
        }

        /**
         * 根据单个className的元素匹配函数
         *
         * @private
         */
        function getHandlers(table, el, eventType){
            var realId = el.id;
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
         * @private
         *
         * @return {Array} 事件委托处理函数数组
         */
        function addHandlers(table, el, eventType, handlers){
            var handlerQueue = getHandlers(table, el, eventType);
            var addedHandlers = [];

            //若从未在该el元素上添加过该eventType的事件委托，
            //则初次则自动添加该委托
            if (!handlerQueue.length) {
                addDelegate(table, el, eventType);
            }

            for (var i = 0, l = handlers.length; i < l ; i++) {
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
         * @private
         */
        function removeHandlers(table, el, eventType, handlers) {
            var handlerQueue = getHandlers(table, el, eventType);
            for (var i = 0, len = handlers.length; i < len ; i++) {
                var handler = handlers[i];

                for (var j = 0, l = handlerQueue.length; j < l ; j++) {
                    if (handlerQueue[j] == handler) {
                        handlerQueue.splice(j, 1);
                        j--;
                    }
                }
            }

            //若handlerQueue为空则移除该事件委托，
            //与addHandlers中添加事件委托的逻辑相呼应
            if (!handlerQueue.length) {
                removeDelegate(table, el, eventType);
            }
        }

        /**
        * 生成委托处理函数
        *
        * @private
        */
        function getDelegateHandler(element, handlerQueue, scrope) {
            return function(e) {
                var e = e || window.event;
                var cur = e.target;
                while (cur) {
                    if (cur.nodeType === 1) {
                        for (var i = handlerQueue.length - 1; i >= 0; i--) {
                            var handlerItem = handlerQueue[i];
                            if (!handlerItem.matchFn
                                || handlerItem.matchFn(cur)
                            ) {
                                handlerItem.handler.call(scrope, cur, e);
                            }
                        }
                    }
                    if (cur == element) {
                        break;
                    }
                    cur = cur.parentNode ;
                }
            };
        }

        /**
        * 添加事件委托
        */
        function addDelegate(control, element, eventType) {
            var handlerQueue = getHandlers(control, element, eventType);
            helper.addDOMEvent(
                control,
                element,
                eventType,
                getDelegateHandler(element, handlerQueue, control)
            );
        }

        /**
        * 移除事件委托
        */
        function removeDelegate(control, element, eventType) {
            helper.removeDOMEvent(control, element, eventType);
        }

        /**
        * 初始化main元素事件处理函数
        */
        function initMainEventhandler(table) {
            var getPartClasses = helper.getPartClasses;
            var rowClass = getPartClasses(table, 'row')[0];
            var titleClass = getPartClasses(table, 'hcell')[0];
            var selectAllClass = getPartClasses(table, 'select-all')[0];
            var multiSelectClass = getPartClasses(table, 'multi-select')[0];
            var singleSelectClass = getPartClasses(table, 'single-select')[0];

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

        Table.prototype = {
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
            initStructure: function() {
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
                Control.prototype.repaint.apply(this, arguments);
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

                table.extraRepaint = helper.createRepaint([
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
                ]);
                table.extraRepaint(changes, changesIndex);

                // 如果未绘制过，初始化resize处理
                if (tbodyChange
                    && helper.isInStage(table, 'RENDERED')) {
                    // 重绘时触发onselect事件
                    switch (table.select) {
                        case 'multi':
                            setSelectedIndex(table, []);
                            table.fire(
                                'select',
                                { selectedIndex: table.selectedIndex }
                            );
                            break;
                    }
                }

                // 如果表格的绘制导致浏览器出现纵向滚动条
                // 需要重新计算各列宽度
                if (table.realWidth != getWidth(table)) {
                    handleResize(table);
                }
            },

            /**
             * 获取表格相关ID
             *
             * @protected
             * @param {number} id
             * @return {string}
             */
            getId: function(id) {
                return getId(this, id);
            },


            getBodyCellId: function(rowIndex, fieldIndex){
                return getBodyCellId(this, rowIndex, fieldIndex);
            },


            /**
             * 设置单元格的文字
             *
             * @public
             * @param {string} text 要设置的文字
             * @param {string} rowIndex 行序号
             * @param {string} columnIndex 列序号
             * @param {boolean} opt_isEncodeHtml 是否需要进行html转义
             */
            setCellText: function (text, rowIndex, columnIndex, isEncodeHtml) {
                if (isEncodeHtml) {
                    text = lib.encodeHTML(text);
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
             * @param {string} name
             * @return {string}
             */
            getClass: function(name) {
                return getClass(this, name);
            },

            /**
             * 初始化表格体子控件
             *
             * @protected
             * @param {number} index
             * @param {Object} options
             */
            getRow: function(index) {
                return getRow(this, index);
            },

            /**
             * 添加表格插件
             *
             * @protected
             * @param {Array} builders
             */
            addRowBuilders: function(builders) {
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
            addHandlers: function(eventType, handlers) {
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
            removeHandlers: function(eventType, handlers) {
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
            adjustWidth: function(){
                handleResize(this);
            },

            /**
             * 设置Table的datasource，并强制更新
             *
             * @public
             */
            setDatasource: function(datasource){
                this.datasource = datasource;
                setSelectedIndex(this, []);
                var record = { name: 'datasource' };
                var record2 = { name: 'selectedIndex' };

                this.repaint([record, record2],
                    {
                        datasource: record,
                        selectedIndex: record2
                    }
                );
            },

            /**
             * 重新绘制Table某行
             * @param {Number} index
             * @param {Object} data
             * @public
             */
            updateRowAt: function(index, data) {
                (data) && (this.datasource[index] = data);
                var dataItem = this.datasource[index];
                var rowEl = getRow(this, index);

                if (dataItem && rowEl) {
                    this.fire(
                        'beforerowupdate',
                        { index: index, data: dataItem }
                    );

                    var container = document.createElement('div');
                    container.innerHTML = getRowHtml(
                        this, data, index, this.rowBuilderList
                    );
                    var newRowEl = container.children[0];

                    rowEl.parentNode.replaceChild(newRowEl, rowEl);

                    this.fire(
                        'afterrowupdate',
                        { index: index, data: dataItem }
                    );
                }
            },

             /**
             * 获取Table的选中数据项
             *
             * @public
             */
            getSelectedItems: function() {
                var selectedIndex = this.selectedIndex;
                var result = [];
                if(selectedIndex) {
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
             * @param {Number}/{Array} index
             * @param {Boolean} isSelected
             * @public
             */
            setRowSelected: function(index, isSelected) {
                var table = this;
                var isMutil = table.select === 'multi';
                var selectedHandler = isMutil ? selectMulti : selectSingle;

                if (u.isArray(index)) {
                    if (isMutil) {
                        u.each(index, function(value){
                            selectedHandler(table, value, isSelected);
                        });
                    } else {
                        selectedHandler(table, index[0], isSelected);
                    }
                } else {
                    selectedHandler(table, index, isSelected);
                }

                if (isMutil) {
                    resetMutilSelectedStatus(table);
                }
            },

            /**
             * 设置所有行选中
             *
             * @param {Boolean} isSelected
             * @public
             */
            setAllRowSelected: function(isSelected) {
                this.setRowSelected(-1, isSelected);
            },


            /**
             * 重置表头跟随设置
             *
             * @public
             */
            resetFollowHead: function(){
                resetFollowHead(this);
            },

            /**
             * 销毁释放控件
             *
             * @override
             */
            dispose: function () {
                if (helper.isInStage(this, 'DISPOSED')) {
                   return;
                }

                helper.beforeDispose(this);
                var main = this.main;
                if (main) {
                    // 释放表头跟随的元素引用
                    this.followDoms = null;

                    var mark = lib.g(getId(this, 'drag-mark'));
                    // 移除拖拽基准线
                    if (mark) {
                        document.body.removeChild(mark);
                    }
                }

                this.rowBuilderList = null;

                this.headPanel.disposeChildren();
                this.bodyPanel.disposeChildren();

                this.headPanel = null;
                this.bodyPanel = null;

                helper.dispose(this);
                helper.afterDispose(this);
            }
        };

        lib.inherits(Table, Control);
        require('./main').register(Table);

        return Table;
    }
);
