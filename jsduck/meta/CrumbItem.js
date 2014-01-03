/**
 * @class meta.CrumbItem
 *
 * {@link Crumb}数据源的配置项
 */
function CrumbItem() {
    /**
     * @property {string} text
     *
     * 显示文本
     */
    this.text;

    /**
     * @property {string} [href]
     *
     * 点击链接，如果没有此属性，则将生成一个不可点击的纯文本节点，
     * 通常表示当前页的节点是没有点击链接的
     */
    this.href;
}
