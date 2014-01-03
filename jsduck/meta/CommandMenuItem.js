/**
 * @class meta.CommandMenuItem
 *
 * {@link CommandMenu}数据源的配置项
 */
function CommandMenuItem() {
    /**
     * @property {string} text
     *
     * 显示文本
     */
    this.text;

    /**
     * @property {Function} [handler]
     *
     * 点击此项时执行的函数
     */
    this.handler;
}
