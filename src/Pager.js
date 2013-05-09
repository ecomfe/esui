/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 翻页控件
 * @author shenbin
 */

define(
    function (require) {
        // required js
        require('./Select');
        // required css
        require('css!./css/Select.css');
        require('css!./css/Pager.css');

        var lib = require('./lib');
        var ui = require('./main');
        var helper = require('./controlHelper');
        var Control = require('./control');

        /**
         * 获取控件主元素代码
         *
         * @param {Pager} pager Pager控件实例
         * @return {string} 拼接得到的html代码
         */
        function getMainHTML(pager) {
            var tpl = [
                '<table style=""><tr>',
                '<td width="60" style="padding:0">',
                    '<div class="${labelClass}">${label}</div>',
                '</td>',
                '<td width="40" style="padding:0">',
                    '<div data-ui="type:Select;childName:pagerSel;',
                    'id:${pagerSelId};width:40;"></div>',
                '</td>',
                '<td width="700" style="padding:0">',
                    '<div id="${pagerMainId}" class="${pagerMainClass}"></div>',
                '</td>',
                '</tr></table>'
            ];

            return lib.format(
                tpl.join('\n'),
                {
                    labelClass: helper.getPartClasses(pager, 'label').join(' '),
                    label: '\u6bcf\u9875\u663e\u793a',
                    pagerSelId: helper.getId(pager, 'pagerSel'),
                    pagerMainId: helper.getId(pager, 'pagerMain'),
                    pagerMainClass:
                        helper.getPartClasses(pager, 'pagerMain').join(' ')
                }
            );
        }

        /**
         * 获取页码区域元素代码
         *
         * @param {Pager} pager Pager控件实例
         * @return {string} 拼接得到的html代码
         */
        function getPagerMainHTML(pager) {
            // 页码的元素结构类型
            var pageType = pager.pageType;
            var page = pager.page;
            var countPerPage = pager.countPerPage;
            var backCount = pager.backCount;
            var forwardCount = pager.forwardCount;
            var urlTemplate = pager.urlTemplate;
            // 计算所得的总页码
            var totalPage = Math.ceil(pager.count / countPerPage);
            // 定义页码模板
            var plainTpl = '<li class="${className}" id="${id}">${text}</li>';
            var anchorTpl = '<li class="${className}" id="${id}">'
                + '<a href="${link}">${text}</a></li>';
            var omitTpl = '<li class="${className}">…</li>';
            // 数组html用于存储页码区域的元素代码
            var html = [];

            /**
             * 根据模板拼接url
             *
             * @param {number} page 页码
             * @return {string} 拼接返回的url
             */
            function _getUrlByTemplate(page) {
                var url = urlTemplate
                    .replace('${page}', page)
                    .replace('${pageSize}', countPerPage);

                return url;
            }

            /**
             * 生成用于填充模板的对象
             *
             * @param {string} className 类名
             * @param {number} page 页码
             * @param {number} id 用于模板的id字段
             * @param {string} text 用于模板的text字段
             * @return {string} 用于填充模板的对象
             */
            function _getTplObj(className, page, id, text) {
                var obj = {
                    className: helper.getPartClasses(
                        pager,
                        className
                    ).join(' ')
                };

                if (page) {
                    obj.link = _getUrlByTemplate(page);
                    obj.id = helper.getId(pager, id);
                    obj.text = '' + text;
                }

                return obj;
            }

            /**
             * 根据对象和模板格式化生成页面片段代码
             *
             * @param {Object} obj 用于填充模板的对象
             * @param {string} tpl 页面片段模板
             * @return {string} 页面片段代码
             */
            function _getSegmentHTML(obj, tpl) {
                var pageTpl = pageType === 'anchor' ? anchorTpl : plainTpl;
                if (tpl) {
                    pageTpl = tpl;
                }

                return lib.format(pageTpl, obj);
            }

            // <ul>起始
            html.push('<ul>');

            // 上一页
            if (page > 1) {
                var obj = _getTplObj(
                    'pager-item',
                    page - 1,
                    'pageBack',
                    '\u4e0a\u4e00\u9875'
                );
                var segment = _getSegmentHTML(obj);

                html.push(segment);
            }

            // 前缀页码
            if (page > backCount + 1) {
                var obj = _getTplObj(
                    'pager-item',
                    1,
                    'page-1',
                    '1'
                );
                var segment = _getSegmentHTML(obj);

                html.push(segment);

                // 前缀...符号
                if (page > backCount + 2) {
                    var obj = _getTplObj('pager-item-omit');
                    var segment = _getSegmentHTML(obj, omitTpl);

                    html.push(segment);
                }
            }

            /*
             * 中间页码区
             */
            // 前置页码
            var len = page > backCount ? backCount : page - 1;
            for (var i = page - len; i < page; i++) {
                var obj = _getTplObj(
                    'pager-item',
                    i,
                    'page-' + i,
                    i
                );
                var segment = _getSegmentHTML(obj);

                html.push(segment);
            }

            // 当前页码
            var obj = _getTplObj(
                'pager-item-current',
                page,
                'page-' + page,
                page
            );
            var segment = _getSegmentHTML(obj, plainTpl);

            html.push(segment);

            // 后置页码
            var len = totalPage - page > forwardCount
                ? forwardCount
                : totalPage - page;
            for (var i = page + 1; i < page + len + 1; i++) {
                var obj = _getTplObj(
                    'pager-item',
                    i,
                    'page-' + i,
                    i
                );
                var segment = _getSegmentHTML(obj);

                html.push(segment);
            }

            // 后缀页码
            if (page < totalPage - forwardCount) {
                // 后缀...符号
                if (page < totalPage - forwardCount - 1) {
                    var obj = _getTplObj('pager-item-omit');
                    var segment = _getSegmentHTML(obj, omitTpl);

                    html.push(segment);
                }

                var obj = _getTplObj(
                    'pager-item',
                    totalPage,
                    'page-' + totalPage,
                    totalPage
                );
                var segment = _getSegmentHTML(obj);

                html.push(segment);
            }

            // 下一页
            if (page < totalPage) {
                var obj = _getTplObj(
                    'pager-item',
                    page + 1,
                    'pageForward',
                    '\u4e0b\u4e00\u9875'
                );
                var segment = _getSegmentHTML(obj);

                html.push(segment);
            }

            // </ul>结束
            html.push('</ul>');

            return html.join('');
        }

        /**
         * 绘制页码区域部件
         * @inner
         * @param {Pager} pager Pager控件实例
         */
        function repaintPager(pager) {
            var count = pager.count;
            var countPerPage = pager.countPerPage;
            var page = pager.page;

            // 修正页码
            page = page > 0 ? page : 1;
            var totalPage = Math.ceil(count / countPerPage);
            page = page <= totalPage ? page : totalPage;
            pager.page = page;

            // 修正每页显示条数，每页显示不能为0
            countPerPage = countPerPage <= 0 ? 1 : countPerPage;
            pager.countPerPage = countPerPage;
            // 将修正后的每页显示条数更新控件
            var pagerSel = pager.getChild('pagerSel');
            pagerSel.setProperties({
                value: countPerPage
            });

            // 渲染pagerMain部分页面结构
            var pagerMainId = helper.getId(pager, 'pagerMain');
            var pagerMain = lib.g(pagerMainId);
            pagerMain.innerHTML = getPagerMainHTML(pager);
        }

        /**
         * 页码点击事件触发
         *
         * @param {Pager} pager Pager控件实例
         * @param {Event} e 事件对象
         */
        function pagerClick(pager, e) {
            var target = e.target || e.srcElement;
            var classes = helper.getPartClasses(pager, 'pager-item');
            var classesBack = helper.getId(pager, 'pageBack');
            var classesForward = helper.getId(pager, 'pageForward');
            var page = pager.page;

            if (lib.hasClass(target, classes[0])) {
                if (target.id === classesBack) {
                    page--;
                }
                else if (target.id === classesForward) {
                    page++;
                }
                else {
                    page = +target.innerHTML;
                }

                // 跳转至某页码
                pager.set('page', page);
            }
        }

        /**
         * 获取select的下拉控件的数据
         *
         * @param {Array.<number>} countPerPageList 配置信息中的下拉数据
         * @return {Array.<Object>} 用于Select控件的datasource
         */
        function getPageOptions(countPerPageList) {
            var dataSource = [];
            for (var i = 0, len = countPerPageList.length; i < len; i++) {
                var countPerPage = countPerPageList[i];
                dataSource.push({
                    text: countPerPage,
                    value: countPerPage
                });
            }

            return dataSource;
        }

        /**
         * 更新select控件的value
         *
         * @param {Pager} pager Pager控件实例
         * @param {Select} pagerSel Select控件实例
         */
        function changeCountPerPage(pager, pagerSel) {
            var countPerPage = parseInt(pagerSel.getValue(), 10);
            pager.countPerPage = countPerPage;
            repaintPager(pager);
        }

        /**
         * 翻页控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Pager(options) {
            Control.apply(this, arguments);
        }

        Pager.prototype = {
            /**
             * 控件类型
             * @type {string}
             */
            type: 'Pager',

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                var properties = {
                    pageType: 'anchor',
                    count: 0,
                    countPerPageList: [],
                    countPerPage: 1,
                    page: 1,
                    backCount: 0,
                    forwardCount: 0,
                    urlTemplate: ''
                };

                lib.extend(properties, options);
                lib.extend(this, properties);
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             */
            initStructure: function () {
                // 主元素必须是`<div>`，若不是则需要重置
                var mainDOM = this.main;
                if (mainDOM.nodeName.toLowerCase() !== 'div') {
                    var _main = this.createMain();
                    lib.insertBefore(_main, mainDOM);
                    mainDOM.parentNode.removeChild(mainDOM);
                    mainDOM = this.main = _main;
                }

                // 填充主元素代码
                mainDOM.innerHTML = getMainHTML(this);
                // 创建控件树
                this.initChildren(mainDOM);

                // 每页显示的下拉菜单
                var pagerSel = this.getChild('pagerSel');
                pagerSel.setProperties({
                    datasource: getPageOptions(this.countPerPageList),
                    value: this.countPerPage
                });
                pagerSel.on(
                    'change',
                    lib.bind(changeCountPerPage, null, this, pagerSel)
                );

                // pager主元素绑定事件
                var pagerMainId = helper.getId(this, 'pagerMain');
                var pagerMain = lib.g(pagerMainId);
                helper.addDOMEvent(
                    this, pagerMain, 'click',
                    lib.bind(pagerClick, null, this)
                );
            },

            /**
             * 重新绘制控件视图
             */
            repaint: helper.createRepaint(
                {
                    name: [
                        'pageType', 'count', 'countPerPage', 'page',
                        'backCount', 'forwardCount', 'urlTemplate'
                    ],
                    paint: repaintPager
                }
            ),

            /**
             * 设置select控件的数据
             *
             * @param {Array.<number>} list 页码数组
             */
            setCountPerPageList: function (list) {
                var pagerSel = this.getChild('pagerSel');
                pagerSel.setProperties({
                    datasource: getPageOptions(list)
                });
            }
        };

        lib.inherits(Pager, Control);
        ui.register(Pager);
        return Pager;
    }
);
