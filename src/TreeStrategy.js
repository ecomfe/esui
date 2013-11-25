/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 树的数据交互策略类
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');

        /**
         * 树的数据交互策略
         *
         * 在ESUI中，{@link Tree}控件本身并不处理节点的展开、收起等工作，
         * 此项设计源于树的交互通常随业务的逻辑有很多的变化，如：
         *
         * - 是否远程加载数据，延迟加载数据
         * - 展开与否和权限相关
         * - 节点是否有禁用之类的状态
         *
         * 因此，在ESUI的设计中，当点击{@link Tree}的节点时，控件只触发
         * {@link Tree#expand}或{@link Tree#collapse}事件，
         * 以及{@link Tree#select}和{@link Tree#unselect}事件，本身不做任何改变。
         *
         * 而这两个事件将由关联在控件上的{@link Tree#strategy}对象来接收，
         * `TreeStrategy`将根据自身的逻辑来决定是否进行对应的修改。
         *
         * `TreeStrategy`类是对树的数据交互的策略的抽象，其包含以下方法：
         * 
         * `{boolean} isLeafNode({meta.TreeItem} node)`：判断一个节点是否为叶子，
         * 树对叶子节点的展现样式是特殊的
         * `{boolean} shouldExpand({meta.TreeItem} node)`：判断一个节点是否应展开，
         * 当树渲染一个节点时会调用此方法。如果需要展开，则会进一步渲染其children属性
         * `{void} attachTo({Tree} tree)`：绑定到对应的控件上，使当前策略生效
         *
         * 如果根据业务实现一个策略类，则通常来说，`attachTo`方法需注册
         * {@link Tree#expand}和{@link Tree#collapse}事件，
         * 在事件的处理函数中获取数据，并调用{@link Tree#expandNode}
         * 和{@link Tree#collapseNode}来使树得到正确的交互
         * 
         * 当{@link Tree#collapse}事件发生时，通常简单地调用
         * {@link Tree#collapseNode}方法收起节点即可，
         * 需要时可以通过{@link Tree#collapseNode}方法的`removeChild`参数设为`true`，
         * 控制子节点的删除以回收内存和提高性能
         * 
         * 当{@link Tree#expand}事件发生时，需要根据数据的获取方案来提供不同的逻辑：
         * 
         * - 如果数据是静态的，则直接调用{@link Tree#expandNode}，
         * 不传递`children`参数，由控件自动查找数据并生成子节点
         * - 如果数据是远程加载的，则：
         *     - 调用{@link Tree#indicateNodeLoading}方法，使节点进入加载状态
         *     - 通过`XMLHttpRequest`等手段加载远程数据，
         *     在收到数据后调用{@link Tree#expandNode}并传递`children`参数展开节点。
         *     注意在调用{@link Tree#expandNode}时，如果提供了`children`参数，
         *     则{@link Tree}控件会将提供的参数作为该节点的`children`属性保存，
         *     因此下一次调用时不再需要传递该参数
         *
         * 总结一下，通常来说，一个策略主要的任务是：
         *
         * - 注册{@link Tree#expand}及{@link Tree#collapse}事件，
         * 当事件触发时，根据逻辑来调用{@link Tree#expandNode}
         * 或{@link Tree#collapseNode}方法，或者不做任何行为
         * - 注册{@link Tree#select}及{@link Tree#unselect}事件，
         * 当事件触发时，根据逻辑来调用{@link Tree#selectNode}
         * 或{@link Tree#unselectNode}方法，或者不做任何行为
         *
         * 默认的`TreeStrategy`控件实现事件与方法的直接对接，中间不包含任何分支逻辑。
         * 具体业务可通过继承此类，并将实例在初始化时传递给{@link Tree}控件来控制树的行为
         *
         * @param {Object} [options] 初始化参数
         * @param {boolean} [options.defaultExpand=false] 节点是否展开
         * @constructor
         */
        function TreeStrategy(options) {
            var defaults = {
                defaultExpand: false
            };
            u.extend(this, defaults, options);
        }

        /**
         * 判断一个节点是否叶子节点
         *
         * @param {meta.TreeItem} node 节点数据项
         * @return {boolean}
         */
        TreeStrategy.prototype.isLeafNode = function (node) {
            return !node.children || !node.children.length;
        };

        /**
         * 判断一个节点是否应该展开
         *
         * @param {meta.TreeItem} node 节点数据项
         * @return {boolean}
         */
        TreeStrategy.prototype.shouldExpand = function (node) {
            return this.defaultExpand;
        };

        /**
         * 将当前策略依附到控件上
         *
         * @param {Tree} tree 控件实例
         */
        TreeStrategy.prototype.attachTo = function (tree) {
            this.enableToggleStrategy(tree);
            this.enableSelectStrategy(tree);
        };

        /**
         * 开启展开/收起相关的策略
         *
         * @param {Tree} tree 控件实例
         * @protected
         */
        TreeStrategy.prototype.enableToggleStrategy = function (tree) {
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

        /**
         * 开启选中/取消选中相关的策略
         *
         * @param {Tree} tree 控件实例
         * @protected
         */
        TreeStrategy.prototype.enableSelectStrategy = function (tree) {
            tree.on(
                'select',
                function (e) {
                    this.selectNode(e.node.id);
                }
            );
            tree.on(
                'unselect',
                function (e) {
                    if (tree.get('allowUnselectNode')) {
                        tree.unselectNode(e.node.id);
                    }
                }
            );
        };

        return TreeStrategy;
    }
);
