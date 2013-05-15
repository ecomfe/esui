/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Schedule控件
 * @author miaojian
 */

define(
    function (require) {
        var lib     = require('./lib');
        var InputControl = require('./InputControl');
        var helper  = require('./controlHelper');

        // css
        require('css!./css/Schedule.css');

        /**
         * Schedule控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Schedule(options) {
            InputControl.apply(this, arguments);
        }

        var DEFAULT_OPTION = {
            //图例说明文本
            helpSelected: '投放时间段',
            help: '暂停时间段',
            
            shortcutTips: [
                '周一到周日全天投放',
                '周一到周五全天投放',
                '周六、周日全天投放'
            ],

            dayWords: [
                '星期一',
                '星期二',
                '星期三',
                '星期四',
                '星期五',
                '星期六',
                '星期日'
            ],

            shortcut: shortcut()
        };

        /**
         * 日程快捷方式
         */
        function shortcut() {

            function selectByDayStates(dayStates) {

                var value = [];
                for (var i = 0; i < 7 && i < dayStates.length; i++) {
                
                    value[i] = [];

                    for (var j = 0; j < 24; j++) {

                        value[i][j] = dayStates[i];
                    }
                }
                return value;
            }

            return [
                {
                    text: '全周投放',
                    tip: '周一到周日全天投放',
                    getVal: function () {
                        return selectByDayStates([1, 1, 1, 1, 1, 1, 1]);
                    }
                },
                {
                    text: '周一到周五投放',
                    tip: '周一到周五全天投放',
                    getVal: function () {
                        return selectByDayStates([1, 1, 1, 1, 1, 0, 0]);
                    }
                },
                {
                    text: '周末投放',
                    tip: '周六、周日全天投放',
                    getVal: function () {
                        return selectByDayStates([0, 0, 0, 0, 0, 1, 1]);
                    }
                }
            ];
        }

        /**
         * 挂接到Schedule上以便进行全局替换
         */
        Schedule.DEFAULT_OPTION = DEFAULT_OPTION;

        /**
         * 初始化视图的值
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function initValue(schedule) {
            var value = schedule.rawValue;

            //有值则返回
            if (value) {
                return;
            }

            //如果没有初始值，默认全部设为0，即全部选中
            value = [];
            for (var i = 0; i < 7; i++) {
                var lineValue = [];
                value.push(lineValue);

                for (var j = 0; j < 24; j++) {

                    lineValue.push(0);
                }
            }

            schedule.rawValue = value;
        }

        /**
         * 获取部件的css class
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function getClass(schedule, part) {

            return helper.getPartClasses(schedule, part).join(' ');
        }

        /**
         * 获取部件的id
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function getId(schedule, part) {

            return helper.getId(schedule, part);
        }

        /**
         * 事件处理中获取当前ui的引用字符串
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function getStrRef(schedule) {

            return 'require(\'esui/main\').get(\'' + schedule.id + '\')';
        }

        /**
         * 获取快捷方式的html
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function getShortcutHtml(schedule) {
            var me = schedule;
            var html = [];

            var tpl = ''
                + '<span class="${clazz}" item="${index}" '
                + 'onmouseover="${mouseover}" onmouseout="${mouseout}" '
                + 'onmousemove="${mousemove}" onclick="${click}"'
                + ' >${text}</span>';

            //说明标题拼接
            var textClass = getClass(me, 'shortcut-text-item');

            html.push('<span class="' + textClass + '">快速设定：</span>');


            var shortcuts = me.shortcut;
            var clazz = getClass(me, 'shortcut-item');

            //shortcut拼接
            for (var i = 0, len = shortcuts.length; i < len; i++) {
                var shortcut = shortcuts[i];
                html.push(
                    lib.format(
                        tpl,
                        {
                            clazz: clazz,
                            text:  shortcut.text,
                            mouseover: getStrRef(me) 
                                + '.shortcutOverOutHandler(this, event, 1)',

                            mouseout: getStrRef(me) 
                                + '.shortcutOverOutHandler(this, event, 0)',

                            mousemove: getStrRef(me) 
                                + '.shortcutMoveHandler(this, event)',

                            click: getStrRef(me) 
                                + '.shortcutClickHandler(this, event, '
                                + i + ')',

                            index: i
                        }
                    ));
            }

            return html.join('');
        }

        /**
         * 初始化body
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function initBody(schedule) {
            lib.g(getId(schedule, 'body')).innerHTML = ''
                + getBodyTimeHtml(schedule) // 拼接html: 头部time列表
                + getBodyDayHtml(schedule) // 拼接html: 星期列表 
                + getBodyItemHtml(schedule); // 拼接html: 时间item列表 
        }

        /**
         * 拼接html: body 头部time列表
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function getBodyTimeHtml(schedule) {
            var me = schedule;
            var html = [];

            var timelineClass = getClass(me, 'timeline');
            var bodyHeadId    = getId('BodyHead');
            html.push(
                '<div class="', timelineClass, '" id="',
                bodyHeadId + '">'
            );

            var timeHClass = getClass(me, 'timehead');
            for (var i = 0; i <= 24; i = i + 2) {
                html.push(
                    '<div class="', timeHClass, 
                    '" time="', i, '" id="', getId(me, 'TimeHead' + i), '">',
                     i + ':00', 
                     '</div>'
                );
            }

            html.push('</div>');

            return html.join('');
        }

        /**
         * 拼接html: body 星期列表
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function getBodyDayHtml(schedule) {
            var me = schedule;
            var html = [];

            var dayHClass  = getClass(me, 'dayhead');
            html.push('<div class="', dayHClass, '">');

            var dayClass = getClass(me, 'day');
            var dayTpl = ''
                + '<div class="' + dayClass + '">'
                    + '<input type="checkbox" id="${dayId}" value="${value}" '
                        + ' onclick="${click}">'
                    + '&nbsp;<label for="${dayId}">${dayWord}</label>'
                + '</div>';

            var dayWords = me.dayWords;
            for (var i = 0; i < 7; i++) {
                html.push(
                    lib.format(
                        dayTpl,
                        {
                            dayWord: dayWords[i],
                            dayId: getId(me, 'lineState' + i),
                            value: i,
                            click: getStrRef(me)
                                + '.dayClickHandler(this, event)'
                        }
                    )
                );
            }

            html.push('</div>');

            return html.join('');

        }

        /**
         * 拼接html: body 时间item列表 
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function getBodyItemHtml(schedule) {
            var me = schedule;
            var html = [];

            var timeTpl = ''
                + '<div class="${timeClass}" onmouseover="${mouseover}"'
                    + ' onmouseout="${mouseout}"'
                    + ' id="${itemId}"'
                    + ' day="${dayIndex}" timeitem="1" time="${timeIndex}">'
                    + '<div id="${overItemId}" class="${overItemClass}">'
                        + '<div id="${dragitemId}" class="${dragitemClass}">'
                        + '</div>'
                    + '</div>'
                + '</div>';

            var timeBClass = getClass(me, 'timebody');
            var timeBId    = getId(me, 'timebody');
            html.push('<div id="', timeBId, '" class="', timeBClass, '">');

            //7天
            var lineClass = getClass(me, 'line');
            for (var i = 0; i < 7; i++) {

                var lineId    = getId(me, 'line' + i); 
                html.push(
                    '<div class="', lineClass, '" id="', lineId, '">'
                );

                //24小时
                for (j = 0; j < 24; j++) {

                    var itemId = getId(me, 'time_' + i + '_' + j);
                    var overItemId = getId(me, 'overitem') + '_' + i + '_' + j;
                    var dragitemId = getId(me, 'dragitem') + '_' + i + '_' + j;

                    html.push(
                        lib.format(
                            timeTpl,
                            {
                                itemId: itemId,
                                timeClass: getClass(me, 'time'),
                                dayIndex: i,
                                timeIndex: j,
                                mouseover: getStrRef(me) 
                                    + '.timeOverHandler(this, event)',
                                mouseout: getStrRef(me) 
                                    + '.timeOutHandler(this, event)',
                                overItemId: overItemId,
                                overItemClass: getClass(me, 'overitem'),
                                dragitemId: dragitemId,
                                dragitemClass: getClass(me, 'dragitem')
                            }
                        )
                    );
                }

                html.push('</div>');
            }

            html.push('</div>');

            return html.join('');
        }

        /**
         * 重绘view区域
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function repaintView(schedule, value) {
            var me = schedule;
            var selectedClass = helper.getPartClasses(me, 'time-selected');

            for (var i = 0; i < 7; i++) {
                var statusArr = [];
                //item dom
                var lineEl = lib.g(getId(me, 'line' + i));

                //去掉每行的连续选择遮罩层
                removeSelectedLineCoverTip(schedule, lineEl);

                for (var j = 0; j < 24; j++) {
                    
                    var item = lib.g(getId(me, 'time_' + i + '_' + j));
                    var val  = value[i][j];

                    //根据value,设置item的选中状态
                    if (val) {

                        lib.addClasses(item, selectedClass);
                    } else {

                        lib.removeClasses(item, selectedClass);
                    }

                    statusArr.push(val);
                }
                //根据每周的value, 创建连续选中遮罩
                createSelectedLineCoverTip(me, statusArr, lineEl, i);
            }
        }

        /**
         * 根据每周的value, 创建连续选中遮罩
         * @param  {Schedule} schedule Schedule实例
         * @param  {Array.<string>}  arr 星期index（参数）的每天的value值
         * @param  {HTMLElement} parent item父元素
         * @param  {number} 星期索引
         * @inner
         */
        function createSelectedLineCoverTip(schedule, arr, parent, index) {
            var me = schedule;
            var i = index;

            //将当前星期的checkbox先初始化为不选中
            var checkInput = lib.g(getId(me, 'lineState' + i));
            checkInput.checked = false;

            //对于连续选中大于3天的进行遮罩处理
            var patt = /1{3,}/g;
            var statusStr = arr.join('');
            var result;
            var coverClass = getClass(me, 'continuecovertimes');
            var coverTpl = ''
                    + '<div class="${coverClass}">'
                        + '<strong>${text}</strong>'
                    + '</div>';

            while ((result = patt.exec(statusStr)) != null) {
                var length = result[0].length;
                var start = result.index;
                var end = start + length;

                var coverDiv = document.createElement('aside');
                var cssStyle = ';width:' + length * 25
                     + 'px;top:0;left:' + start * 25 + 'px;';

                //设置星期checkbox的选中值
                checkInput.checked = length == 24 ? true : false;

                coverDiv.setAttribute('starttime', start);
                coverDiv.setAttribute('endtime', end);
                coverDiv.setAttribute('day', i);
                coverDiv.className = coverClass;
                coverDiv.style.cssText += cssStyle;

                coverDiv.innerHTML = lib.format(
                    coverTpl,
                    {
                        start: start,
                        end: end,
                        text: length == 24 
                            ? '全天投放' : start + '.00-' + end + '.00',
                        coverClass: getClass(me, 'covertimestip')
                    }
                );

                parent.appendChild(coverDiv);

                //挂载事件
                //lib.commandAttr({ name: 'coverTip' }, coverDiv);
                helper.addDOMEvent(me, coverDiv, 'mouseover', 
                lib.bind(coverTipOverHandler, me, coverDiv));
            }
        }

        /**
         * coverTip command hanlder
         * 遮罩的hover 事件句柄 
         * 
         */
        function coverTipOverHandler(element) {

            lib.addClasses(element,
                helper.getPartClasses(this, 'continuecovertimesover'));
        }

        /**
         * 去掉每行的连续选择遮罩层
         * @param  {Schedule} schedule Schedule实例
         * @inner
         */
        function removeSelectedLineCoverTip(schedule, parent) {

            var removeDiv = parent.getElementsByTagName('aside');

            var len = removeDiv.length;
            while (len) {
                var item = removeDiv[0];

                if (item.getAttribute('day') != null) {
                    parent.removeChild(item);
                }
                len--;
            }
        }

        /**
         * dayWord click handle 
         * 点击星期checkbox的处理函数
         * 
         */
        function dayClickHandler(element) {

            var me = this;
            var dom = element;
            var dayIndex = parseInt(dom.getAttribute('value'), 10);
            var dayState = dom.checked;

            var rawValueCopy = rawValueClone(me.rawValue);

            var timeValue = rawValueCopy[dayIndex];

            for (var i = 0, len = timeValue.length; i < len; i++) {

                timeValue[i] = dayState ? 1 : 0;

            }

            if (me.onchange(rawValueCopy) !== false) {

                me.rawValue = rawValueCopy;
                repaintView(this, me.rawValue);
            }
            else {

                dom.checked = !dayState;
            }

        }

        /**
         * shortcut click handle 
         * 点击shortcut的处理函数
         * 
         * @param  {Object} arg 选项
         */
        function shortcutClickHandler(element, event, index) {

            var func = this.shortcut[index].getVal;
            typeof func == 'function' && func.call(this);

            var rawValue;

            if (typeof func == 'function') {

                rawValue = func.call(this);
            }
            else {

                rawValue = func;
            }

            var valueStr = this.stringifyValue(this.rawValue);
            var curValueStr = this.stringifyValue(rawValue);

            if (curValueStr != valueStr
                && this.onchange(rawValue) !== false) {

                this.rawValue = rawValue;
                repaintView(this, this.rawValue);
            }

        }

        var timeTipTpl = ''
            + '<div id="${timeId}" class="${timeClass}">${time}</div>'
            + '<div id="${textId}" class="${textClass}">${text}</div>';

        /**
         * timeItem mouseover handler
         * 时间的mouseover的处理函数
         * 
         */
        function timeOverHandler(element, e) {
            var clazz =  helper.getPartClasses(this, 'time-hover');
            lib.addClasses(element, clazz);
            
            //获取鼠标位置
            lib.event.getMousePosition(e);
            var mousepos = {};
            mousepos.y = e.pageY + 20;
            mousepos.x = e.pageX + 10;


            var me = this;
            //var tipClass = getClass(me, 'timeitem-tip');
            var time = parseInt(element.getAttribute('time'), 10);
            var day  = parseInt(element.getAttribute('day'), 10);

            var tipText = lib.format(timeTipTpl,
                {
                    time: '<strong>' + time 
                        + ':00</strong>&nbsp;—&nbsp;<strong>'
                        + (time + 1) + ':00</strong>',
                   text: '点击/拖动鼠标选择',
                   timeId: getId(me, 'timeitemtiphead'),
                   textId: getId(me, 'timeitemtipbody'),
                   timeClass: getClass(me, 'timeitem-tiphead'),
                   textClass: getClass(me, 'timeitem-tipbody')
                }
            );


            //创立并显示提示tip
            var tipId = getId(me, 'timeitemtip');
            var tipElement = showPromptTip(me, tipId, mousepos, tipText);
            tipElement.style.display = 'block';


            //创建可拖拽div
            var overDivId = getId(me, 'overitem') + '_' + day + '_' + time;
            //var overDivClass = getClass(me, 'overitem');
            var overElement = lib.g(overDivId);
            var dragElementId = getId(me, 'dragitem') + '_' + day + '_' + time;
            var dragElement = lib.g(dragElementId);

            dragElement.style.display = 'block';
            overElement.style.display = 'block';
            overElement.style.top = '-1px';
            overElement.style.left = '-1px';


            //创建鼠标跟随DIV
            var followEleId = getId(me, 'followitem');
            var followEleClass = getClass(me, 'followitem');
            var followEle = lib.g(followEleId);
            var timebody = lib.g(getId(me, 'timebody'));

            if (!followEle) {
                followEle = document.createElement('div');
                followEle.className = followEleClass;
                followEle.id = followEleId;
                timebody.appendChild(followEle);
            }

            /* 显示遮罩层 */
            var ele = element;
            var dayLine = ele.parentNode.parentNode;
            var continueCoverTimes = dayLine.getElementsByTagName('aside');

            for (var i = 0, len = continueCoverTimes.length; i < len; i++) {
                var item = continueCoverTimes[i];
                var startCT = parseInt(item.getAttribute('starttime'), 10);
                var endCT = parseInt(item.getAttribute('endtime'), 10);
                var CoverDay = parseInt(item.getAttribute('day'), 10);

                if ((time >= startCT) 
                    && (time < endCT)
                    && day == CoverDay) {

                    lib.addClasses(item, 
                        helper.getPartClasses(me, 'continuecovertimesover')
                    );
                }
                else {
                    lib.removeClasses(item, 
                        helper.getPartClasses(me, 'continuecovertimesover')
                    );
                }
            }
        }

        /**
         * 设置tip遮罩的位置
         * @param  {Schedule} schedule
         * @param  {string} tipId    要显示的tip Id
         * @param  {Object} mousepos 当前鼠标的位置
         * @param  {string} tipText  要显示的内容
         */
        function showPromptTip(schedule, tipId, mousepos, tipText) {
            var me = schedule;

            tipId = tipId || getId(me, 'tip');
            var tipElement = lib.g(tipId);

            if (tipElement) {

                tipElement.style.top = mousepos.y + 'px';
                tipElement.style.left = mousepos.x + 'px';
                tipElement.innerHTML = tipText;
            }
            else {
                var cssStyle = ''
                    + ';position:absolute;z-index:50;background:#fff6bd;top:'
                    + mousepos.y + 'px;left:' + mousepos.x + 'px;display:none;';

                var tipClass = getClass(me, 'shortcut-item-tip');

                tipElement = document.createElement('div');
                tipElement.style.cssText = cssStyle;
                tipElement.id = tipId;
                tipElement.className = tipClass;

                tipElement.innerHTML = tipText;
                document.body.appendChild(tipElement);

                //记录下来，以便dispose的时候清除
                me.followTip[tipId] = tipElement;
            }

            return tipElement;
        }

        /**
         * timeItem mouseout handler 
         * 时间的mouseout的处理函数
         * 
         */
        function timeOutHandler(element, e) {
            var clazz =  helper.getPartClasses(this, 'time-hover');

            lib.removeClasses(element, clazz);

            var me = this;

            var time = parseInt(element.getAttribute('time'), 10);
            var day  = parseInt(element.getAttribute('day'), 10);

            //还原去掉hover效果
            var overDivId = getId(me, 'overitem') + '_' + day + '_' + time;
            lib.g(overDivId).style.display = 'none';

            //隐藏tip
            var tipId = getId(me, 'timeitemtip');
            lib.g(tipId).style.display = 'none';

            //隐藏drag效果
            var dragElementId = getId(me, 'dragitem') + '_' + day + '_' + time;
            lib.g(dragElementId).style.display = 'none';
        }

        /**
         * 快捷方式区域的mousemove的处理函数
         *
         * @inner
         */
        function shortcutMoveHandler(element, e, i) {
            var me = this;

            //获取鼠标位置
            lib.event.getMousePosition(e);

            var mousepos = {};
            mousepos.y = e.pageY + 20;
            mousepos.x = e.pageX + 10;

            var dom = element;

            var index = dom.getAttribute('item');
            var tipId = getId(me, 'shortcut-item') + index;

            setTimeout(function () {
                var tipElement = lib.g(tipId);

                tipElement.style.top =  mousepos.y + 'px';
                tipElement.style.left = mousepos.x + 'px';

            }, 0);
        }

        /**
         * 快捷方式区域的mouseover mouseout的处理函数
         *
         * @inner
         */
        function shortcutOverOutHandler(element, e, isOver) {
            //获取鼠标位置
            lib.event.getMousePosition(e);

            var mousepos = {};
            mousepos.y = e.pageY + 20;
            mousepos.x = e.pageX + 10;

            var me = this;

            var dom = element;

            var index = dom.getAttribute('item');
            var tipId = getId(me, 'shortcut-item') + index;

            var shortcuts = me.shortcut;
            var tipText = shortcuts[index].tip;

            //构建并获取tip
            var tipElement = showPromptTip(me, tipId, mousepos, tipText);


            var clazz = helper.getPartClasses(me, 'shortcut-item-hover');

            if (isOver) {
                lib.addClasses(dom, clazz);
                tipElement.style.display = 'block';
            }
            else {
                lib.removeClasses(dom, clazz);
                tipElement.style.display = 'none';
            }
        }

        var getTimeBodyDownHandler; //drag mousedown的句柄
        var getTimeBodyMoveHandler; //drag mousemove的句柄
        var getTimeBodyUpHandler; //drag mouseup的句柄

        /**
         * 绑定拖动drag事件
         * @param  {Schedule} schedule
         */
        function bindEvent(schedule) {
            var me = schedule;
            var timebody = lib.g(getId(me, 'timebody'));
            
            getTimeBodyDownHandler = lib.bind(timeBodyDownHandler, me);

            lib.on(timebody, 'mousedown', getTimeBodyDownHandler);
        }

        /**
         * drag时 mousedown的事件处理函数
         */
        function timeBodyDownHandler(e) {
            var me = this;
            var doc = document;

            getTimeBodyMoveHandler = lib.bind(timeBodyMoveHandler, me);
            getTimeBodyUpHandler = lib.bind(timeBodyUpHandler, me);

            lib.on(doc, 'mousemove', getTimeBodyMoveHandler);
            lib.on(doc, 'mouseup', getTimeBodyUpHandler);

            //记录鼠标位置
            lib.event.getMousePosition(e);
            this.dragStartPos = {x: e.pageX, y: e.pageY};

            // 鼠标拖拽效果
            // 为了防止在控件渲染后，位置变动导致计算错误，所以每次mousedown
            // 位置都计算一遍
            var timebody = lib.g(getId(me, 'timebody'));
            me.dragRange = [];

            var timebodyTop = lib.getOffset(timebody).top;
            var timebodyLeft = lib.getOffset(timebody).left;
            me.dragRange.push(timebodyTop);
            me.dragRange.push(timebodyLeft + timebody.offsetWidth);
            me.dragRange.push(timebodyTop + timebody.offsetHeight);
            me.dragRange.push(timebodyLeft);


            ondragHuck(timebody);

            // 显示follow区域
            var cellPos = getTragTimeCellPos(this, 
                { x: e.pageX, y: e.pageY }
            );

            //渲染遮罩层
            setFollowEle(this, cellPos);
        }

        /**
         * drag时 mousemove的事件处理函数
         */
        function timeBodyMoveHandler(e) {
            //记录鼠标位置
            lib.event.getMousePosition(e);

            //计算当前显示区域
            var cellPos = getTragTimeCellPos(this, 
                { x: e.pageX, y: e.pageY }
            );

            //渲染遮罩层
            setFollowEle(this, cellPos);

        }

        /**
         * drag时 mouseup的事件处理函数
         */
        function timeBodyUpHandler(e) {
            var me = this;
            var doc = document;
            var followEle = lib.g(getId(me, 'followitem'));

            followEle.style.cssText += 'display:none;width:0;height:0';
            /*target,{position:"relative",top:"0px",left:"0px",
                                        width:"23px",height:"23px"});
            baidu.dom.setStyles(target.parentNode,{display:"none"});*/

            //记录鼠标位置
            lib.event.getMousePosition(e);

            //为了修正，up的时候再重新计算下位置
            var cellPos = getTragTimeCellPos(this, 
                { x: e.pageX, y: e.pageY }
            );
            setSelectedAreaValue(me, cellPos);

            //清除兼容设置
            var timebody = lib.g(getId(me, 'timebody'));

            //卸载事件
            lib.un(doc, 'mousemove', getTimeBodyMoveHandler);
            lib.un(doc, 'mouseup', getTimeBodyUpHandler);
            //ondragHuck(timebody);
            offDragHuck(timebody);
        }

        /**
         * drag后，重绘选中的值
         * @param {Schedule} schedule
         */
        function setSelectedAreaValue(schedule, cellPos) {

            var me = schedule;

            var startcell = cellPos.startcell;
            var endcell   = cellPos.endcell;

            var minXCell = Math.min(startcell.x, endcell.x);
            var minYCell = Math.min(startcell.y, endcell.y);
            var maxXCell = Math.max(startcell.x, endcell.x);
            var maxYCell = Math.max(startcell.y, endcell.y);

            var rawValueCopy = rawValueClone(me.rawValue);

            for (var i = minYCell; i <= maxYCell; i++) {
                for (var j = minXCell; j <= maxXCell; j++) {

                    if (rawValueCopy[i][j]) {
                        rawValueCopy[i][j] = 0;
                    }
                    else {
                        rawValueCopy[i][j] = 1;
                    }
                    
                }
            }
            timebodyCellRange = null;

            if (me.onchange(rawValueCopy) !== false) {

                me.rawValue = rawValueCopy;
                repaintView(me, me.rawValue);
            }
        }

        /**
         * 获取选择区域的开始和结束配置
         * @param  {Schedule} schedule
         * @param  {Object} mousepos 当前的鼠标位置
         * @return {Object} 选择区域的开始和结束配置
         */
        function getTragTimeCellPos(schedule, mousepos) {
            var me = schedule;
            var timeBodyPos  = me.dragRange;
            var dragStartPos = me.dragStartPos;
            var rangePos = {};

            //计算拖动遮罩层的结束鼠标点
            if (mousepos.x <= timeBodyPos[1] 
                && mousepos.x  >= timeBodyPos[3]) {
                rangePos.x = mousepos.x;
            }
            else {
                rangePos.x = mousepos.x - dragStartPos.x < 0 
                    ? timeBodyPos[3] : timeBodyPos[1];
            }

            if (mousepos.y  <= timeBodyPos[2] 
                && mousepos.y >= timeBodyPos[0]) {
                rangePos.y = mousepos.y;
            }
            else {
                rangePos.y = mousepos.y - dragStartPos.y < 0 
                ? timeBodyPos[0] : timeBodyPos[2];
            }

            var cellrange = { startcell: {}, endcell: {} };
            //计算拖动遮罩层覆盖区域位置
            cellrange.startcell.x = 
                Math.floor((dragStartPos.x - me.dragRange[3]) / 25);
            cellrange.startcell.y = 
                Math.floor((dragStartPos.y - me.dragRange[0]) / 25);
            cellrange.endcell.x = 
                Math.floor((rangePos.x - me.dragRange[3]) / 25);
            cellrange.endcell.y = 
                Math.floor((rangePos.y - me.dragRange[0]) / 25);

            if (cellrange.endcell.x >= 23) {
                cellrange.endcell.x = 23;
            }
            if (cellrange.endcell.y >= 6) {
                cellrange.endcell.y = 6;
            }

            return cellrange;
        }

        /**
         * drag时的拖动遮罩层的渲染方法
         * @param {Schedule} schedule
         * @param {Object} cellPos  选择区域的开始和结束配置
         */
        function setFollowEle(schedule, cellPos) {
            var followEle = lib.g(getId(schedule, 'followitem'));

            var startcell = cellPos.startcell;
            var endcell = cellPos.endcell;
            var startcellX = startcell.x;
            var startcellY = startcell.y;
            var endcellX = endcell.x;
            var endcellY = endcell.y;
            var divWidth = 0;
            var divHeight = 0;
            var divTop = 0;
            var divLeft = 0;

            if (endcellY >= startcellY) {
                divTop = startcellY * 25;
                divHeight = (endcellY - startcellY + 1) * 25 - 2;
            }
            else {
                divTop = endcellY * 25;
                divHeight = (startcellY - endcellY + 1) * 25 - 2;
            }

            if (endcellX >= startcellX) {
                divLeft = startcellX * 25;
                divWidth = (endcellX - startcellX + 1) * 25 - 2;
            }
            else {
                divLeft = endcellX * 25;
                divWidth = (startcellX - endcellX + 1) * 25 - 2;
            }

            var cssStyles = ''
                + ';display:block;'
                + ';width:' + divWidth + 'px'
                + ';height:' + divHeight + 'px'
                + ';top:' + divTop + 'px'
                + ';left:' + divLeft + 'px'
                + ';background:#faffbe';

            followEle.style.cssText += cssStyles;
        }

        /**
         * drag开启时的默认清理函数
         * @param  {HTMLElement} target 当前触发事件的元素
         */
        function ondragHuck(target) {

            var doc = document;

            //修正拖曳过程中页面里的文字会被选中
            lib.on(doc, 'selectstart', dragUnSelect);

            //设置鼠标粘滞
            if (target.setCapture) {
                target.setCapture();
            } 
            else if (window.captureEvents) {
                window.captureEvents(Event.MOUSEMOVE|Event.MOUSEUP);
            }

            //清除鼠标已选择元素
            if (document.selection) {
                document.selection.empty && document.selection.empty();
            }
            else if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        }

        /**
         * drag关闭时的清除函数
         * @param  {HTMLElement} target 当前触发事件的元素
         */
        function offDragHuck(target) {

            var doc = document;

            //解除鼠标粘滞
            if (target.releaseCapture) {
                target.releaseCapture();
            } 
            else if (window.releaseEvents) {

                window.releaseEvents(Event.MOUSEMOVE|Event.MOUSEUP);
            }

            lib.un(doc, 'selectstart', dragUnSelect);
        }

        /**
         * drag时清除选择区域的hander
         */
        function dragUnSelect(e) {
            lib.event.preventDefault(e);
        }

        /**
         * 拷贝rawValue一个副本
         * @param  {Array} rawValue 一个二维数组
         */
        function rawValueClone(rawValue) {

            var val = [];

            for (var i = 0, len = rawValue.length; i < len; i++) {

                val.push( [].slice.call(rawValue[i], 0) );
            }

            return val;
        }

        Schedule.prototype = {

            constructor: Schedule,

            /**
             * 控件类型
             * @type {string}
             */
            type: 'Schedule',

            /**
             * 创建控件主元素
             * @override
             * @return {HTMLElement}
             */
            createMain: function (options) {

                return document.createElement(options.tagName || 'div');
            },

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                var properties = {

                    dragRange: [], //记录当前timebody区域的位置
                    dragStartPos: null, //记录drag开始时的鼠标位置
                    followTip: {} //记录当前创建的tip元素
                };

                
                lib.extend(this, properties, DEFAULT_OPTION, options);

                //检测是否初始化value值，没有则设置为默认
                initValue(Schedule);
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             */
            initStructure: function () {
                var me = this;

                this.main.tabIndex = 0;

                var tpl = ''
                    + '<div class="${bodyClass}" id="${bodyId}"></div>'
                    + '<div class="${headClass}">'
                        + '<div class="${helpClass}">'
                            + '<div class="${helpSelectedClass}"></div>'
                            + '<div class="${helpTextClass}">'
                                + '${helpSelected}' 
                            + '</div>'
                            + '<div class="${helpUnselectedClass}"></div>'
                            + '<div class="${helpTextClass}">${help}</div>'
                        + '</div>'
                        + '<div class="${shortcutClass}">${shortcutHtml}</div>'
                    + '</div>';

                this.main.innerHTML =lib.format(
                    tpl,
                    {
                        headClass: getClass(me, 'head'),
                        bodyClass: getClass(me, 'body'),
                        helpClass: getClass(me, 'help'),
                        helpSelectedClass: getClass(me, 'help-selected'),
                        helpUnselectedClass: getClass(me, 'help-unselected'),
                        helpTextClass: getClass(me, 'help-text'),
                        shortcutClass: getClass(me, 'shortcut'),
                        bodyId: getId(me, 'body'), //7
                        helpSelected: me.helpSelected,
                        help: me.help,
                        shortcutHtml: getShortcutHtml(me)
                    }
                );

                initBody(me);
                bindEvent(me);
            },

            /**
             * 渲染自身
             *
             * @override
             * @protected
             */
            repaint: helper.createRepaint(
                 InputControl.prototype.repaint,
                {
                    name: 'rawValue',
                    paint: function (schedule, rawValue) {

                        repaintView(schedule, rawValue);
                    }
                }
            ),

            /**
             * 事件处理
             */
            shortcutOverOutHandler: function() {
                shortcutOverOutHandler.apply(this, arguments);
            },

            shortcutClickHandler: function() {
                shortcutClickHandler.apply(this, arguments);
            },

            shortcutMoveHandler: function() {
                shortcutMoveHandler.apply(this, arguments);
            },

            dayClickHandler: function() {
                dayClickHandler.apply(this, arguments);
            },

            coverTipOverHandler: function() {
                coverTipOverHandler.apply(this, arguments);
            },

            timeOverHandler: function() {
                timeOverHandler.apply(this, arguments);
            },

            timeOutHandler: function() {
                timeOutHandler.apply(this, arguments);
            },

            /**
             * 将string类型的value转换成原始格式
             *
             * @override
             * @param {string} value 字符串值
             * @return {Array}
             */
            parseValue: function (value) {
                var arr = [];
                var step = 24;

                for (var i = 0, len = value.length; i < len; i = i + step) {
                    var inner = value.substring(i, i + step).split('');

                    var innerOut = [];

                    for (var j = 0; j < inner.length; j++) {

                        innerOut.push(inner[j] - 0);
                    }

                    arr.push(innerOut);
                }
                return arr;
            },

            /**
             * 将value从原始格式转换成string
             * 
             * @override
             * 
             * @param {Array} rawValue 原始值
             * @return {string}
             */
            stringifyValue: function (rawValue) {

                var arr = [];

                for (var i = 0, len = rawValue.length; i < len; i++) {

                    arr.push(rawValue[i].join(''));
                }

                return arr.join('');
            },

            /**
             * 设置控件的值，并更新视图
             *
             * @public
             * @param {Array} rawValue 控件的值
             */
            setRawValue: function (rawValue) {

                this.setProperties({ rawValue: rawValue });
            },

            /**
             * 获取控件的值
             *
             * @public
             */
            getRawValue: function () {

                return this.rawValue;
            },

            onchange: function () {},

            /**
             * 销毁释放控件
             */
            dispose : function () {
                helper.beforeDispose(this);

                // remove movedown事件listener
                if (getTimeBodyDownHandler) {
                    var timebody = lib.g(getId(this, 'timebody'));
                    lib.un(timebody, 'mousedown', getTimeBodyDownHandler);
                }

                //清除followTip
                var followTip = this.followTip;
                for (var key in followTip) {

                    if (followTip[key]) {

                        document.body.removeChild(followTip[key]);
                    }
                }

                helper.dispose(this);
                helper.afterDispose(this);
            }
        };

        require('./lib').inherits(Schedule, InputControl);
        require('./main').register(Schedule);
        return Schedule;
    }
);
