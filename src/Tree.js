define(
    function (require) {
        var Control = require('./Control');
        var lib = require('./lib');
        var helper = require('./controlHelper');

        function Tree() {
            Control.apply(this, arguments);
        }

        Tree.prototype.type = 'Tree';

        Tree.prototype.createMain = function () {
            return document.createElement('ul');
        };

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

        Tree.prototype.initOptions = function (options) {
            var defaults = {
                datasource: {}
            };
            var properties = lib.extend(defaults, options);
            properties.nodeIndex = buildNodeIndex(properties.datasource);
            this.setProperties(properties);
        };

        Tree.prototype.itemTemplate = '<span>${text}</span>';

        Tree.prototype.getItemHTML = function (node) {
            return lib.format(this.itemTemplate, node);
        };


        var indicatorTextMapping = {
            'collapsed': '展开',
            'expanded': '收起',
            'busy': '加载中'
        };

        function getIndicatorHTML(tree, node, mode) {
            var classes = [].concat(
                helper.getPartClasses(tree, 'node-indicator'),
                mode 
                    ? helper.getPartClasses(tree, 'node-indicator-' + mode)
                    : []
            );
            var html = '<span class="' + classes.join(' ') + '">'
                + indicatorTextMapping[mode || 'collapsed'] + '</span>';
            return html;
        }

        function getNodeHTML(tree, node, expanded) {
            var classes = helper.getPartClasses(tree, 'node');
            if (expanded) {
                classes = classes.concat(
                    helper.getPartClasses(tree, 'node-expanded'));
            }
            var html = '<li class="' + classes.join(' ') + '" '
                + 'id="' + helper.getId(tree, 'node-' + node.id) + '" '
                + 'data-id="' + node.id + '">';
            html += getIndicatorHTML(tree, node, expanded ? 'expanded' : '');
            html += tree.getItemHTML(node);
            if (expanded && node.children) {
                html += '<ul>';
                for (var i = 0; i < node.children.length; i++) {
                    var child = node.children[i];
                    html += getNodeHTML(tree, child, expanded);
                }
                html += '</ul>';
            }
            html += '</li>';

            return html;
        }

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

            var className = helper.getPartClasses(tree, 'node-expanded')[0];
            var mode = lib.hasClass(target, className) ? 'collapse' : 'expand';
            // 展开的时候由于涉及到数据请求等，不一定立刻展开，
            // 但收起的时候有一个默认行为
            if (mode === 'collapse') {
                helper.removePartClasses(tree, 'node-expanded', target);
                target.firstChild.innerHTML = indicatorTextMapping.collapsed;
                // 如果有需要删除子节点，再加代码
            }

            tree.fire(mode, { node: node });
        }

        Tree.prototype.initStructure = function () {
            helper.addDOMEvent(
                this,
                this.main,
                'click',
                lib.curry(toggleNode, this)
            );
        };

        Tree.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            {
                name: 'datasource',
                paint: function (tree, datasource) {
                    tree.main.innerHTML = 
                        getNodeHTML(tree, datasource, true);
                }
            }
        );

        /**
         * 向指定节点填充子节点
         *
         * @param {string} id 节点的id
         * @param {Array.<Object>=} 子节点数据，如果不提供此参数，
         * 则控件按照以下逻辑执行：
         *
         * - 如果原本已经有子树的元素，则直接展开
         * - 如果原本没有子树元素，则取对应节点的`children`属性创建子树
         */
        Tree.prototype.fillNode = function (id, children) {
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
                nodeElement.innerHTML = getNodeHTML(this, node, true);
            }
            else {
                // 需要修改`indicator`的字样
                nodeElement.firstChild.innerHTML = 
                    indicatorTextMapping.expanded;
            }

            // CSS3动画可以通过这个class来操作
            helper.addPartClasses(this, 'node-expanded', nodeElement);
        };

        /**
         * 清空指定节点的子节点
         *
         * @param {string} id 节点的id
         * @public
         */
        Tree.prototype.emptyNode = function (id) {
            var nodeElement = lib.g(helper.getId(this, 'node-' + id));
            if (!nodeElement) {
                return;
            }

            var childRoot = nodeElement.getElementsByTagName('ul')[0];
            if (childRoot) {
                childRoot.parentNode.removeChild(childRoot);
            }
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

            var indicator = node.firstChild;
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