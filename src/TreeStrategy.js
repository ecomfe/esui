define(
    function (require) {
        var lib = require('./lib');

        /**
         * 树的数据交互策略
         *
         * @param {Object=} options 初始化参数
         * @param {boolean=} options.defaultExpand 节点是否展开，默认为`false`
         * @constructor
         * @public
         */
        function TreeStrategy(options) {
            var defaults = {
                defaultExpand: false
            };
            lib.extend(this, defaults, options);
        }

        /**
         * 判断一个节点是否叶子节点
         *
         * @param {Object} node 节点数据项
         * @return {boolean}
         * @public
         */
        TreeStrategy.prototype.isLeafNode = function (node) {
            return !node.children || !node.children.length;
        };

        /**
         * 判断一个节点是否应该展开
         *
         * @param {Object} node 节点数据项
         * @return {boolean}
         * @public
         */
        TreeStrategy.prototype.shouldExpand = function (node) {
            return this.defaultExpand;
        };

        /**
         * 将当前策略依附到控件上
         *
         * @param {Tree} tree 控件实例
         * @public
         */
        TreeStrategy.prototype.attachTo = function (tree) {
            tree.on(
                'expand',
                function (e) {
                    // 默认的方案是同步更新数据的，所以不提示loading了
                    this.expandNode(e.node.id);
                }
            );
            tree.on(
                'collapse',
                function (e) {
                    this.collapseNode(e.node.id, false);
                }
            );
        };

        return TreeStrategy;
    }
);