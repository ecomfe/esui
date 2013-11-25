/**
 * @class meta.SelectItem
 *
 * {@link Select}数据源的配置项
 */
function SelectItem() {
    /**
     * @property {string} [text]
     *
     * 显示文本，优先级低于{@link meta.SelectItem#name}
     */
    this.text;

    /**
     * @property {string} [name]
     *
     * 显示文本，优先级高于{@link meta.SelectItem#text}
     */
    this.name;

    /**
     * @property {Mixed} value
     *
     * 选项的值
     */
    this.value;

    /**
     * @property {boolean} [disabled=false]
     *
     * 标记该项是否禁用，禁用的项不能点击选中
     */
    this.disabled;
}
