/**
 * @class meta.BoxGroupItem
 *
 * {@link BoxGroup}控件数据源配置项
 */
function BoxGroupItem() {
    /**
     * @property {string} [title]
     *
     * 标签文字，与{@link meta.BoxGroupItem#name}
     * 和{@link meta.BoxGroupItem#text}作用相同
     *
     * 三个属性的优先级为`title > name > text`
     */
    this.title;

    /**
     * @property {string} [name]
     *
     * 标签文字，与{@link meta.BoxGroupItem#title}
     * 和{@link meta.BoxGroupItem#text}作用相同
     *
     * 三个属性的优先级为`title > name > text`
     */
    this.name;

    /**
     * @property {string} [text]
     *
     * 标签文字，与{@link meta.BoxGroupItem#title}
     * 和{@link meta.BoxGroupItem#name}作用相同
     *
     * 三个属性的优先级为`title > name > text`
     */
    this.text;

    /**
     * @property {string} value
     *
     * 选框的值
     */
    this.value;
}
