/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 翻页控件
 * @author shenbin
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var ui = require('./main');
        var Control = require('./Control');

        require('./Select');

        /**
         * 获取控件主元素HTML
         *
         * @param {Pager} pager 控件实例
         * @return {string} 拼接得到的HTML代码
         * @ignore
         */
        function getMainHTML(pager) {
            var template = [
                '<div id="${pagerWrapperId}" class="${pagerWrapperClass}">',
                    '<div id="${selectWrapperId}" ',
                    'class="${selectWrapperClass}">',
                        '<span id="${labelId}" class="${labelClass}">',
                        '${labelText}</span>',
                        '<div data-ui="type:Select;childName:select;',
                        'id:${selectId};width:40;"></div>',
                    '</div>',
                    '<ul id="${mainId}" class="${mainClass}"></ul>',
                '</div>'
            ];

            return lib.format(
                template.join(''),
                {
                    pagerWrapperId: pager.helper.getId('pager-wrapper'),
                    pagerWrapperClass:
                        pager.helper.getPartClasses(pager.layout)[0],
                    selectWrapperId: pager.helper.getId('select-wrapper'),
                    selectWrapperClass:
                        pager.helper.getPartClassName('select-wrapper'),
                    labelId: pager.helper.getId('label'),
                    labelClass: pager.helper.getPartClassName('label'),
                    labelText: '每页显示',
                    selectId: pager.helper.getId('select'),
                    mainId: pager.helper.getId('main'),
                    mainClass: pager.helper.getPartClassName('main')
                }
            );
        }

        /**
         * 获取页码区域元素代码
         *
         * @param {Pager} pager Pager控件实例
         * @return {string} 拼接得到的HTML代码
         * @ignore
         */
        function getPagerMainHTML(pager) {
            // 定义页码模板
            var plainTpl = '<li class="${className}" id="${id}"'
                + ' data-page="${page}">${text}</li>';
            var anchorTpl = '<li class="${className}" id="${id}">'
                + '<a href="${link}">${text}</a></li>';
            var omitTpl = '<li class="${className}">…</li>';

            /**
             * 根据模板拼接url
             *
             * @param {number} num 页码
             * @return {string} 拼接返回的URL
             * @ignore
             */
            function getUrlByTemplate(num) {
                return lib.format(
                    pager.urlTemplate,
                    {
                        page: num,
                        pageSize: pager.pageSize
                    }
                );
            }

            /**
             * 生成用于填充模板的对象
             *
             * @param {string} className 类名
             * @param {number} [num] 页码
             * @param {number} [id] 用于模板的id字段
             * @param {string | number} [text] 用于模板的text字段
             * @return {Object} 用于填充模板的对象
             * @ignore
             */
            function getTplObj(className, num, id, text) {
                var obj = {
                    className: pager.helper.getPartClassName(className)
                };

                if (arguments.length > 1) {
                    obj.link = getUrlByTemplate(num);
                    obj.id = pager.helper.getId(id);
                    obj.page = num;
                    obj.text = text;
                }

                return obj;
            }

            /**
             * 根据模板和填充对象格式化生成页面片段代码
             *
             * @param {Object} obj 用于填充模板的对象
             * @param {string} [tpl] 页面片段模板
             * @return {string} 页面片段代码
             * @ignore
             */
            function getSegmentHTML(obj, tpl) {
                if (!tpl) {
                    var templates = {
                        anchor: anchorTpl,
                        plain: plainTpl
                    };

                    // 由于pageType需要由外部指定，当指定的模板不存在时默认匹配anchor
                    tpl = templates[pager.pageType] || templates.anchor;
                }

                return lib.format(tpl, obj);
            }

            /**
             * 将页面片段添加到html数组中
             *
             * @param {Object | number} obj Object或者page
             * @param {string} [tpl] 可选模板
             * @ignore
             */
            function addSegmentToHTML(obj, tpl) {
                if (typeof obj === 'number') {
                    obj = getTplObj('item', obj, 'page-' + obj, obj);
                }
                var segment = getSegmentHTML(obj, tpl);

                html.push(segment);
            }

            var page = pager.page;
            var backCount = pager.backCount;
            var forwardCount = pager.forwardCount;
            // 计算得到的总页码数
            var totalPage = Math.ceil(pager.count / pager.pageSize);
            // 数组html用于存储页码区域的元素代码
            var html = [];

            // 上一页
            if (page > 1) {
                var obj = getTplObj(
                    'item-extend', page - 1, 'page-back', pager.backText);
                addSegmentToHTML(obj);
            }

            // 前缀页码
            if (page > backCount + 1) {
                addSegmentToHTML(1);

                // 前缀...符号
                if (page > backCount + 2) {
                    var obj = getTplObj('item-omit');
                    addSegmentToHTML(obj, omitTpl);
                }
            }

            /*
             * 中间页码区
             */
            // 前置页码
            var len = page > backCount ? backCount : page - 1;
            for (var i = page - len; i < page; i++) {
                addSegmentToHTML(i);
            }

            // 当前页码
            var obj = getTplObj(
                'item-current',
                page,
                'page-' + page,
                page
            );
            addSegmentToHTML(obj, plainTpl);

            // 后置页码
            var len = totalPage - page > forwardCount
                ? forwardCount
                : totalPage - page;
            for (var i = page + 1; i < page + len + 1; i++) {
                addSegmentToHTML(i);
            }

            // 后缀页码
            if (page < totalPage - forwardCount) {
                // 后缀...符号
                if (page < totalPage - forwardCount - 1) {
                    var obj = getTplObj('item-omit');
                    addSegmentToHTML(obj, omitTpl);
                }

                addSegmentToHTML(totalPage);
            }

            // 下一页
            if (page < totalPage) {
                var obj = getTplObj(
                    'item-extend', page + 1, 'page-forward', pager.forwardText);
                addSegmentToHTML(obj);
            }

            return html.join('');
        }

        /**
         * 绘制页码区域部件
         *
         * @param {Pager} pager Pager控件实例
         * @ignore
         */
        function repaintPager(pager) {
            // 修正每页显示条数，每页显示不能为0
            var pageSize = pager.pageSize;
            pageSize = pageSize > 0 ? pageSize : 1;
            pager.pageSize = pageSize;
            // 将修正后的每页显示数量更新至Select控件
            pager.getChild('select').set('value', pageSize + '');

            // 修正页码
            var totalPage = Math.ceil(pager.count / pageSize);
            var page = pager.page;
            page = page > totalPage ? totalPage : page;
            page = page > 0 ? page : 1;
            pager.page = page;

            // 渲染main元素页面结构
            var pagerMain = pager.helper.getPart('main');
            pagerMain.innerHTML = getPagerMainHTML(pager);
        }

        /**
         * 绘制控件布局结构
         *
         * @param {Pager} pager 控件实例
         * @param {string} style 布局样式
         * @ignore
         */
        function repaintLayout(pager, style) {
            /**
             * 获取class的集合
             *
             * @param {string} [style] 布局类型
             * @return {string[]} 布局类型集合
             * @ignore
             */
            function getClasses() {
                var classes = [];
                for (var i = 0, len = arguments.length; i < len; i++) {
                    classes.push(pager.helper.getPartClasses(arguments[i])[0]);
                }

                return classes;
            }

            var pagerWrapper = pager.helper.getPart('pager-wrapper');
            lib.removeClasses(
                pagerWrapper,
                getClasses(
                    'alignLeft', 'alignLeftReversed',
                    'alignRight', 'alignRightReversed',
                    'distributed', 'distributedReversed'
                )
            );
            lib.addClass(pagerWrapper, pager.helper.getPartClasses(style)[0]);
        }

        /**
         * 页码点击事件触发
         *
         * @param {Pager} this Pager控件实例
         * @param {Event} e 事件对象
         * @ignore
         */
        function pagerClick(e) {
            var target = e.target;
            var backId = this.helper.getId('page-back');
            var forwardId = this.helper.getId('page-forward');
            var page = this.page;

            if (this.helper.isPart(target, 'item')
                || this.helper.isPart(target, 'item-extend')
            ) {
                if (target.id === backId) {
                    page--;
                }
                else if (target.id === forwardId) {
                    page++;
                }
                else {
                    page = +lib.getAttribute(target, 'data-page');
                }

                // 跳转至某页码
                this.set('page', page);
            }
        }

        /**
         * 获取select的下拉控件的数据
         *
         * @param {number[]} pageSizes 配置信息中的下拉数据
         * @return {meta.SelectItem[]} 用于`Select`控件的数据源对象
         * @ignore
         */
        function getPageSizes(pageSizes) {
            var datasource = u.map(
                pageSizes,
                function (size) {
                    return { text: size + '', value: size + '' };
                }
            );

            return datasource;
        }

        /**
         * 更新`Select`控件的`value`属性
         *
         * @param {mini-event.Event} e 事件对象
         * @ignore
         */
        function changePageSize(e) {
            var pageSize = parseInt(this.getChild('select').getValue(), 10);
            this.pageSize = pageSize;

            // 重绘页码
            repaintPager(this);

            // 触发每页显示变更的事件
            /**
             * @event changepagesize
             *
             * 每页条数变化时触发
             *
             * @member Pager
             * @deprecated 使用{@link Pager#pagesizechange}代替
             */
            this.fire('changepagesize');

            /**
             * @event pagesizechange
             *
             * 每页条数变化时触发
             *
             * @member Pager
             */
            this.fire('pagesizechange');
        }

        /**
         * 显示`Select`控件及对应的label元素
         *
         * @param {Pager} pager 控件实例
         * @ignore
         */
        function showSelect(pager) {
            var selectWrapper = pager.helper.getPart('select-wrapper');
            pager.helper.removePartClasses('select-hidden', selectWrapper);
        }

        /**
         * 隐藏`Select`控件及对应的label元素
         *
         * @param {Pager} pager 控件实例
         * @ignore
         */
        function hideSelect(pager) {
            var selectWrapper = pager.helper.getPart('select-wrapper');
            pager.helper.addPartClasses('select-hidden', selectWrapper);
        }

        /**
         * 翻页控件
         *
         * 翻页控件包含2部分：
         *
         * - 一个显示页码的横条，根据各个属性配置显示当前页和前后若干页
         * - 一个选择“每页显示数量”的{@link Select}控件
         *
         * @extends Control
         * @requires Select
         * @constructor
         */
        function Pager(options) {
            Control.apply(this, arguments);
        }


        /**
         * @cfg defaultProperties
         *
         * 默认属性值
         *
         * @cfg {number[]} [defaultProperties.pageSizes] 默认每页数量可选项
         * @cfg {number} [defaultProperties.pageSize=15] 默认每页数量
         * @static
         */
        Pager.defaultProperties = {
            // 这里不加任何属性，不然会覆盖掉实例上的那个`defaultProperties`出问题，
            // 如果使用者直接改这个，自然是要覆盖的就没关系
        };


        Pager.prototype = {
            /**
             * 控件类型，始终为`"Pager"`
             *
             * @type {string}
             * @readonly
             * @override
             */
            type: 'Pager',

            /**
             * 默认属性
             *
             * @type {Object}
             * @deprecated 使用构造函数上的{@link Pager#cfg-defaultProperties}代替
             */
            defaultProperties: {
                pageSizes: [15, 30, 50, 100],
                pageSize: 15
            },

            /**
             * 初始化参数
             *
             * @param {Object} [options] 构造函数传入的参数
             * @protected
             * @override
             */
            initOptions: function (options) {
                var properties = {
                    pageType: 'anchor',
                    count: 0,
                    page: 1,
                    backCount: 3,
                    forwardCount: 3,
                    backText: '上一页',
                    forwardText: '下一页',
                    urlTemplate: '',
                    layout: 'alignLeft'
                };

                u.extend(
                    properties,
                    this.defaultProperties, // 这么是向后兼容，以后准备去掉
                    Pager.defaultProperties,
                    options
                );
                this.setProperties(properties);
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             * @override
             */
            initStructure: function () {
                // 填充主元素代码
                this.main.innerHTML = getMainHTML(this);
                // 创建控件树
                this.helper.initChildren();

                // 当初始化pageSizes属性不存在或为空数组时，隐藏控件显示
                var select = this.getChild('select');
                if (!this.pageSizes || !this.pageSizes.length) {
                    hideSelect(this);
                }
                else {
                    var properties = {
                        datasource: getPageSizes(this.pageSizes),
                        value: this.pageSize + ''
                    };
                    select.setProperties(properties);
                }

                // 同步一次状态
                changePageSize.call(this);
            },

            /**
             * 初始化事件交互
             *
             * @protected
             * @override
             */
            initEvents: function () {
                // 每页显示的select控件
                var select = this.getChild('select');
                select.on('change', changePageSize, this);

                // pager主元素绑定事件
                this.helper.addDOMEvent('main', 'click', pagerClick);
            },

            /**
             * 批量设置控件的属性值
             *
             * @param {Object} properties 属性值集合
             * @override
             */
            setProperties: function (properties) {
                properties = u.clone(properties);

                // `pageIndex`提供从0开始的页码，但是以`page`为准
                if (properties.hasOwnProperty('pageIndex')
                    && !properties.hasOwnProperty('page')
                ) {
                    /**
                     * @property {number} pageIndex
                     *
                     * 以0为起始的页码，其值始终为{@link Pager#page}减1
                     *
                     * 如果与{@link Pager#page}属性同时存在，
                     * 则优先使用{@link Pager#page}属性
                     */
                    properties.page = +properties.pageIndex + 1;
                }

                var digitalProperties = [
                    'count', 'page', 'backCount',
                    'forwardCount', 'pageSize'
                ];

                u.each(
                    digitalProperties,
                    function (name) {
                        var value = properties[name];
                        if (u.isString(value)) {
                            properties[name] = +value;
                        }
                    }
                );

                var changes =
                    Control.prototype.setProperties.apply(this, arguments);

                if (changes.hasOwnProperty('page')) {
                    // 触发页码变更事件
                    /**
                     * @event changepage
                     *
                     * 页码变化时触发
                     *
                     * @member Pager
                     * @deprecated 使用{@link Pager#pagechange}代替
                     */
                    this.fire('changepage');

                    /**
                     * @event pagechange
                     *
                     * 页码变化时触发
                     *
                     * @member Pager
                     */
                    this.fire('pagechange');
                }
            },

            /**
             * 重渲染
             *
             * @method
             * @protected
             * @override
             */
            repaint: require('./painters').createRepaint(
                Control.prototype.repaint,
                {
                    /**
                     * @property {number[]} pageSizes
                     *
                     * 可用的“每页条数”列表
                     */
                    name: 'pageSizes',
                    paint: function (pager, value) {
                        var select = pager.getChild('select');
                        // 当`pageSizes`属性不存在或为空数组时，隐藏控件显示
                        if (!value || !value.length) {
                            hideSelect(pager);
                        }
                        else {
                            var properties = {
                                datasource: getPageSizes(value),
                                value: pager.pageSize + ''
                            };
                            select.setProperties(properties);
                            showSelect(pager);
                        }
                    }
                },
                {
                    /**
                     * @property {string} [layout="alignLeft"]
                     *
                     * 指定控件的布局方式，可以使用以下值：
                     *
                     * - `alignLeft`：整体靠左对齐，页码在左，选择框在右
                     * - `alignLeftReversed`：整体靠左对齐，而码在右，选择框在左
                     * - `alignRight`：整体靠右对齐，页码在左，选择框在右
                     * - `alignRightReversed`：整体靠右对齐，而码在右，选择框在左
                     * - `distributed`：页码靠左对齐，选择框靠右对齐
                     * - `distributedReversed`：页码靠右对齐，选择框靠左对齐
                     */
                    name: 'layout',
                    paint: repaintLayout
                },
                {
                    name: [
                        /**
                         * @property {string} [pageType="anchor"]
                         *
                         * 页码元素类型，可以为：
                         *
                         * - `plain`：页码为普通文本，点击后不跳转链接，
                         * 仅触发{@link Pager#pagechange}事件
                         * - `anchor`：页码为`<a>`元素，点击后直接跳转
                         */
                        'pageType',

                        /**
                         * @property {number} [count=0]
                         *
                         * 总条目数量
                         */
                        'count',

                        /**
                         * @property {number} pageSize
                         *
                         * 每页显示条目数量
                         */
                        'pageSize',

                        /**
                         * @property {number} [page=1]
                         *
                         * 当前页码，以1为起始，即1表示第1页
                         */
                        'page',

                        /**
                         * @property {number} backCount
                         *
                         * 在当前页前面显示的页数
                         *
                         * 如{@link Pager#page}值为5，`backCount`为3，
                         * 则显示`[2] [3] [4]  [5]`
                         */
                        'backCount',

                        /**
                         * @property {number} forwardCount
                         *
                         * 在当前页后面显示的页数
                         *
                         * 如{@link Pager#page}值为5，`forwardCount`为3，
                         * 则显示`[5] [6] [7] [8]`
                         */
                        'forwardCount',

                        /**
                         * @property {string} backText
                         *
                         * “下一页”元素的显示文字
                         */
                        'backText',

                        /**
                         * @property {string} forwardText
                         *
                         * “上一页”元素的显示文字
                         */
                        'forwardText',

                        /**
                         * @property {string} urlTemplate
                         *
                         * 用于生成链接地址的URL模板
                         *
                         * 模板中可以使用以下占位符：
                         *
                         * - `page`：当前页码
                         * - `pageSize`：每页显示条目数
                         */
                        'urlTemplate'
                    ],
                    paint: repaintPager
                }
            ),

            /**
             * 获取从0开始的页码
             *
             * @return {number} 其值始终为{@link Pager#page}减去1
             */
            getPageIndex: function () {
                return this.get('page') - 1;
            }
        };

        lib.inherits(Pager, Control);
        ui.register(Pager);
        return Pager;
    }
);
