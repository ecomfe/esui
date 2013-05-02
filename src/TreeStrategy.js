define(
    function (require) {
        function TreeStrategy() {
        }

        TreeStrategy.prototype.isLeafNode = function (node) {
            return !node.children || !node.children.length;
        };

        TreeStrategy.prototype.shouldExpand = function (node) {
            return false;
        };

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