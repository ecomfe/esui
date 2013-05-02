define(
    function (require) {
        var Control = require('./Control');
        var lib = require('./lib');
        var helper = require('./controlHelper');

        /**
        * 树控件
        */
        function Tree() {
            Control.apply(this, arguments);
        }

        Tree.prototype.type = 'Tree';

        /**
         * 创建主元素
         *
         * @return {HTMLElement} 主元素
         * @override
         * @protected
         */
        Tree.prototype.createMain = function () {
            return document.createElement('ul');
        };

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @override
         * @protected
         */
        Tree.prototype.initOptions = function (options) {
            var defaults = {
                datasource: {}
            };
            var properties = lib.extend(defaults, options);
            this.setProperties(properties);
        };

        /**
         * 每个节点显示的内容的模板
         *
         * @type {string}
         * @public
         */
        Tree.prototype.itemTemplate = '<span>${text}</span>';

        /**
         * 获取每个节点显示的内容
         *
         * @param {Object} node 节点数据
         * @return {string} 节点的HTML
         * @public
         */
        Tree.prototype.getItemHTML = function (node) {
            return lib.format(this.itemTemplate, node);
        };


        var indicatorTextMapping = {
            'collapsed': '展开',
            'expanded': '收起',
            'busy': '加载中',
            'empty': '无内容'
        };

        /**
         * 获取指示器（节点文字前的那个图标）的HTML
         *
         * @param {Tree} tree 控件实例
         * @param {Object} node 节点数据
         * @param {string} type 指示器的类型，为`empty`、`expanded`或`collapsed`
         * @return {string}
         * @inner
         */
        function getIndicatorHTML(tree, node, type) {
            var classes = [].concat(
                helper.getPartClasses(tree, 'node-indicator'),
                type 
                    ? helper.getPartClasses(tree, 'node-indicator-' + type)
                    : []
            );
            var html = '<span class="' + classes.join(' ') + '">'
                + indicatorTextMapping[type || 'collapsed'] + '</span>';
            return html;
        }

        /**
         * 获取节点的内容HTML
         *
         * @param {Tree} tree 控件实例
         * @param {Object} node 节点数据
         * @param {boolean} expanded 是否处于展开状态
         * @return {string}
         * @iner
         */
        function getNodeContentHTML(tree, node, expanded) {
            var indicatorType = tree.strategy.isLeafNode(node)
                ? 'empty'
                : (expanded ? 'expanded' : 'collapsed');
            var html = getIndicatorHTML(tree, node, indicatorType);
            html += tree.getItemHTML(node);

            if (expanded && !tree.strategy.isLeafNode(node)) {
                html += '<ul>';
                for (var i = 0; i < node.children.length; i++) {
                    var child = node.children[i];
                    html += getNodeHTML(
                        tree, child, tree.strategy.shouldExpand(child));
                }
                html += '</ul>';
            }

            return html;
        }

        /**
         * 获取节点的HTML
         *
         * @param {Tree} tree 控件实例
         * @param {Object} node 节点数据
         * @param {boolean} expanded 是否处于展开状态
         * @return {string}
         * @iner
         */
        function getNodeHTML(tree, node, expanded) {
            var state = tree.strategy.isLeafNode(node)
                ? 'empty'
                : (expanded ? 'expanded' : 'collapsed');
            var classes = [].concat(
                helper.getPartClasses(tree, 'node'),
                helper.getPartClasses(tree, 'node-' + state)
            );

            var html = '<li class="' + classes.join(' ') + '" '
                + 'id="' + helper.getId(tree, 'node-' + node.id) + '" '
                + 'data-id="' + node.id + '">';
            html += getNodeContentHTML(tree, node, expanded);
            html += '</li>';
            return html;
        }

        /**
         * 根据节点的当前状态展开或收起节点
         *
         * @param {Tree} tree 控件实例
         * @param {Event} e DOM事件对象
         * @iner
         */
        function toggleNode(tree, e) {
            var target = e.target;
            while (target !== tree.main && !target.hasAttribute('data-id')) {
                target = target.parentNode;
            }

            if (target === tree.main) {
                return;
            }

            var id = target.getAttribute('data-id');
            var node = tree.nodeIndex[id];

            if (!node) {
                return;
            }

            var emptyClassName = helper.getPartClasses(tree, 'node-empty')[0];
            if (lib.hasClass(target, emptyClassName)) {
                return;
            }

            var className = helper.getPartClasses(tree, 'node-expanded')[0];
            var mode = lib.hasClass(target, className) ? 'collapse' : 'expand';

            tree.fire(mode, { node: node });
        }

        /**
         * 初始化DOM结构
         *
         * @override
         * @protected
         */
        Tree.prototype.initStructure = function () {
            helper.addDOMEvent(
                this,
                this.main,
                'click',
                lib.curry(toggleNode, this)
            );
            if (this.strategy) {
                this.strategy.attachTo(this);
            }
        };

        /**
         * 构建节点的id->数据的索引
         *
         * @param {Object} node 节点数据，第一次调用时为根
         * @param {Object=} index 用于存放索引的对象，第一次调用时不传递
         * @return {Object}
         * @inner
         */
        function buildNodeIndex(node, index) {
            index = index || {};

            index[node.id] = node;
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    buildNodeIndex(node.children[i], index);
                }
            }

            return index;
        }

        /**
         * 重绘
         *
         * @override
         * @protected
         */
        Tree.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            {
                name: 'datasource',
                paint: function (tree, datasource) {
                    tree.nodeIndex = buildNodeIndex(datasource);
                    tree.main.innerHTML = 
                        getNodeHTML(tree, datasource, true);
                }
            }
        );

        /**
         * 向指定节点填充子节点并展开节点
         *
         * @param {string} id 节点的id
         * @param {Array.<Object>=} 子节点数据，如果不提供此参数，
         * 则控件按照以下逻辑执行：
         *
         * - 如果原本已经有子树的元素，则直接展开
         * - 如果原本没有子树元素，则取对应节点的`children`属性创建子树
         */
        Tree.prototype.expandNode = function (id, children) {
            var nodeElement = lib.g(helper.getId(this, 'node-' + id));
            if (!nodeElement) {
                return;
            }

            // 更新过数据或者原本没有子树的情况下重绘
            if (children 
                || nodeElement.lastChild.nodeName.toLowerCase() !== 'ul'
            ) {
                var node = this.nodeIndex[id];
                if (!node) {
                    return;
                }
                if (children) {
                    node.children = children;
                }

                // 为了效率，直接刷掉原来的HTML
                nodeElement.innerHTML = getNodeContentHTML(this, node, true);
            }
            else {
                // 需要修改`indicator`的字样
                nodeElement.firstChild.innerHTML = 
                    indicatorTextMapping.expanded;
            }

            // CSS3动画可以通过这个class来操作
            var nodeClasses = [].concat(
                helper.getPartClasses(this, 'node'),
                helper.getPartClasses(this, 'node-expanded')
            );
            nodeElement.className = nodeClasses.join(' ');

            var indicator = nodeElement.firstChild;
            var indicatorClasses = [].concat(
                helper.getPartClasses(this, 'node-indicator'),
                helper.getPartClasses(this, 'node-indicator-expanded')
            );
            indicator.className = indicatorClasses.join(' ');
        };

        /**
         * 收起指定节点
         *
         * @param {string} id 节点的id
         * @param {boolean} removeChild 是否把子节点删除
         * @public
         */
        Tree.prototype.collapseNode = function (id, removeChild) {
            var nodeElement = lib.g(helper.getId(this, 'node-' + id));
            if (!nodeElement) {
                return;
            }

            var childRoot = nodeElement.getElementsByTagName('ul')[0];
            if (childRoot && removeChild) {
                childRoot.parentNode.removeChild(childRoot);
            }

            var nodeClasses = [].concat(
                helper.getPartClasses(this, 'node'),
                helper.getPartClasses(this, 'node-collapsed')
            );
            nodeElement.className = nodeClasses.join(' ');
            var indicator = nodeElement.firstChild;
            var indicatorClasses = [].concat(
                helper.getPartClasses(this, 'node-indicator'),
                helper.getPartClasses(this, 'node-indicator-collapsed')
            );
            indicator.className = indicatorClasses.join(' ');
            indicator.innerHTML = indicatorTextMapping.collapsed;
        };

        /**
         * 修改指定节点为正在加载数据的繁忙状态
         *
         * @param {string} id 节点的id
         * @public
         */
        Tree.prototype.indicateNodeLoading = function (id) {
            var nodeElement = lib.g(helper.getId(this, 'node-' + id));
            if (!nodeElement) {
                return;
            }

            var indicator = nodeElement.firstChild;
            indicator.innerHTML = indicatorTextMapping.busy;
            var classes = [].concat(
                helper.getPartClasses(this, 'node-indicator'),
                helper.getPartClasses(this, 'node-indicator-busy')
            );
            indicator.className = classes.join(' ');
        };

        require('./main').register(Tree);
        lib.inherits(Tree, Control);
        return Tree;
    }
);