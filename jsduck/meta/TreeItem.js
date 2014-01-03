/**
 * @class meta.TreeItem
 *
 * {@link Tree}数据源的配置项
 */
function TreeItem() {
    /**
     * @property {string} id
     *
     * 节点的唯一标识符，在同一棵树中不得重复
     */
    this.id;

    /**
     * @property {string} text
     *
     * 显示的文本
     */
    this.text;

    /**
     * @property {meta.TreeItem[]} children
     *
     * 子树
     */
    this.children;
}
