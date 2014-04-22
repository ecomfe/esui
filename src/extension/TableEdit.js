/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 表格行内编辑扩展
 * @author wurongyao, otakustay
 */
define(
    function (require) {
        require('../validator/MaxLengthRule');
        require('../validator/MaxRule');
        require('../validator/MinRule');
        require('../validator/RequiredRule');
        require('../validator/PatternRule');

        var Extension = require('../Extension');
        var lib = require('../lib');
        var helper = require('../controlHelper');
        var main = require('../main');
        var Table = require('../Table');
        var ValidityState = require('../validator/ValidityState');
        var Validity = require('../validator/Validity');

        var layContentTpl = [
            '<div class="${optClass}">',
                '<div id="${inputFieldId}"></div>',
                '<div data-ui="id:${okId};type:Button;">${okText}</div>',
                '<div data-ui="id:${cancelId};type:Button;">',
                    '${cancelText}',
                '</div>',
            '</div>',
            '<div class="${errorClass}" id="${errorId}"></div>'
        ].join('');

        var inputFieldId = 'ctrl-table-editor-inputField';
        var inputId = 'ctrl-table-editorInput';
        var validId = 'ctrl-table-editor-validityLabel';
        var okId = 'ctrl-table-editor-ok';
        var cancelId = 'ctrl-table-editor-cancel';
        var errorId = 'ctrl-table-editor-error';
        var okText = '确定';
        var cancelText = '取消';

        var inputTpl ='<input data-ui="type:TextBox;id:${inputId}"/>';
        var validTpl ='<label data-ui="type:Validity;id:${validId}"></label>';

        var currentRowIndex = -1;
        var currentColIndex = -1;
        var currentState = 0;

        var layer = null;
        var inputCtrl = null;
        var okButton = null;
        var cancelButton = null;
        var currentTable = null;
        var currentField = null;
        var guid = 1;

        /**
         * 初始化表格内容编辑器
         *
         * @ignore
         */
        function init(table, options) {
            currentTable = table;
            currentRowIndex = options.rowIndex;
            currentColIndex = options.columnIndex;

            if (!layer) {
                layer = helper.layer.create();
                document.body.appendChild(layer);
                layer.className = table.helper.getPartClassName('editor');
                initLayer();
            }

            layer.style.zIndex = table.zIndex || '';

            initInputControl(options);
        }

        /**
         * 初始化编辑器浮层
         *
         * @ignore
         */
        function initLayer() {
            fillLayer();
            initButtonControl();
        }

        /**
         * 初始化浮层按钮的控件
         *
         * @ignore
         */
        function initButtonControl() {
            var controlMap = main.init(layer);
            okButton = getControlFromMap(controlMap, okId);
            cancelButton = getControlFromMap(controlMap, cancelId);

            okButton.on('click', getOkHandler());
            cancelButton.on('click', getCancelHandler());

            setButtonDisabled(1);
        }

        /**
         * 初始化输入及验证控件
         *
         * @ignore
         */
        function initInputControl(options) {
            if (options.field
                && currentField !== options.field) {

                inputCtrl && (inputCtrl.dispose());
                inputCtrl = null;

                var newInputId = inputId + (guid++);
                var newValidId = validId + guid;
                var inputField = lib.g(inputFieldId);
                var errorField = lib.g(errorId);

                inputField.innerHTML = lib.format(
                    inputTpl,
                    { inputId: newInputId }
                );
                errorField.innerHTML = lib.format(
                    validTpl,
                    { validId: newValidId }
                );

                var inputCtrlOptions = {properties:{}};
                inputCtrlOptions.properties[newInputId] = lib.extend(
                    {
                        id: newInputId,
                        width: 145,
                        height: 20,
                        validityLabel: validId + guid
                    },
                    options.field.editRules
                );

                inputCtrl = main.init(inputField, inputCtrlOptions)[0];
                main.init(errorField);

                inputCtrl.on('enter', getOkHandler());

                currentField = options.field;
            }
        }

        /**
         * 销毁释放控件
         *
         * @ignore
         */
        function disposeEditorControl(table) {
            if (table == currentTable) {
                hideLayer();

                inputCtrl.dispose();
                okButton.dispose();
                cancelButton.dispose();

                try{
                    layer && document.body.removeChild(layer);
                } catch (ex){}

                layer = null;
                inputCtrl = null;
                okButton = null;
                cancelButton = null;
                currentTable = null;
                currentField = null;
            }
        }

        /**
         * 填充浮层的内容
         *
         * @ignore
         */
        function fillLayer() {
            layer.innerHTML = lib.format(
                layContentTpl,
                {
                    inputFieldId: inputFieldId,
                    okId: okId,
                    cancelId: cancelId,
                    okText: okText,
                    cancelText: cancelText,
                    optClass: currentTable.helper.getPartClassName('editor-opt'),
                    errorClass: currentTable.helper.getPartClassName('editor-error'),
                    errorId: errorId
                }
            );
        }

        /**
         * 获取初始化后的控件
         *
         * @ignore
         */
        function getControlFromMap(controlMap, id) {
            for (var i = controlMap.length - 1; i >= 0; i--) {
                var control = controlMap[i];
                if (control.id === id) {
                    return control;
                }
            }
        }

        /**
         * 隐藏浮层
         *
         * @ignore
         */
        function hideLayer(argument) {
            (layer) && (layer.style.display = 'none');
        }

        /**
         * 现实浮层
         *
         * @ignore
         */
        function showLayer(argument) {
            (layer) && (layer.style.display = '');
        }

        /**
         * 显示错误信息
         *
         * @ignore
         */
        function showErrorMsg(error) {
            if (error) {
                var validity = new Validity();
                validity.addState(
                    'TableEditCustomRule',
                    new ValidityState(false, error)
                );
                inputCtrl.showValidity(validity);
            }
        }

        /**
         * 清空错误信息
         *
         * @ignore
         */
        function clearErrorMsg(error) {
            var validity = new Validity();
            validity.addState(
                'TableEditCustomRule',
                new ValidityState(true)
            );
            inputCtrl.showValidity(validity);
        }

        /**
         * 获取确定按钮的点击行为handler
         *
         * @return {Function}
         * @ignore
         */
        function getOkHandler() {
            return function () {
                saveEdit();
            };
        }

        function saveEdit() {
            if (inputCtrl.validate()) {
                var eventArgs = {
                    value: getValue(),
                    rowIndex: currentRowIndex,
                    columnIndex: currentColIndex,
                    field: currentTable.realFields[currentColIndex]
                };

                eventArgs = currentTable.fire('saveedit', eventArgs);
                fieldHanlder(currentTable, 'saveedit', eventArgs);

                if (!eventArgs.isDefaultPrevented()) {
                    saveSuccessHandler.call(currentTable, eventArgs);
                } else {
                    saveFailedHandler.call(currentTable, eventArgs);
                }
            }
        }

        function saveSuccessHandler(eventArgs) {
            if (this === currentTable) {
                hideLayer();
                currentState = 0;
            }
        }

        function saveFailedHandler(eventArgs) {
            if (this === currentTable && eventArgs.errorMsg) {
                showErrorMsg(eventArgs.errorMsg);
            }
        }

        /**
         * 获取取消按钮的点击行为handler
         *
         * @return {Function}
         * @ignore
         */
        function getCancelHandler() {
            return function () {
                stop();
            };
        }

        /**
         * table结束列拖拽事件处理函数
         *
         * @ignore
         */
        function tableEndDragHandler() {
            if (this == currentTable) {
                layerFollow(this);
            }
        }

        /**
         * table尺寸改变事件处理函数
         *
         * @ignore
         */
        function tableResizeHandler() {
            if (this == currentTable) {
                layerFollow(this);
            }
        }

        /**
         * 让浮层跟随编辑单元格
         *
         * @ignore
         */
        function layerFollow(table) {
            if (layer) {
                var entrance = lib.g(
                    table.getBodyCellId(
                        currentRowIndex,
                        currentColIndex
                    )
                );

                if (entrance) {
                   helper.layer.attachTo(
                        layer,
                        entrance
                    );
                }
            }
        }

        /**
         * 停止编辑功能
         *
         * @ignore
         */
        function stop() {
            currentState = 0;
            hideLayer();
            setButtonDisabled(1);
            var eventArgs = {
                rowIndex: currentRowIndex,
                columnIndex: currentColIndex,
                field: currentTable.realFields[currentColIndex]
            };

            eventArgs = currentTable.fire('canceledit', eventArgs);
            fieldHanlder(currentTable, 'canceledit', eventArgs);
        }

        /**
         * 启动编辑功能
         *
         * @param {Object} table 表格控件实例
         * @param {Object} options 启动参数表
         * @ignore
         */
        function start(table, options) {
            if (currentState && currentTable) {
                stop();
            }
            currentState = 1;

            init(table, options);
            setButtonDisabled(0);
            showLayer();
            var entrance = lib.g(
                table.getBodyCellId(
                    options.rowIndex,
                    options.columnIndex
                )
            );
            helper.layer.attachTo(
                layer,
                entrance
            );

            setValue(options.value);
            clearErrorMsg();
        }

         /**
         * 设置按钮的disabled状态
         *
         * @param {boolean} disabled 按钮的disabled状态
         * @ignore
         */
        function setButtonDisabled(disabled) {
            okButton.setDisabled(disabled);
            cancelButton.setDisabled(disabled);
        }

        /**
         * 设置当前编辑器的值
         *
         * @param {string} value 值内容
         * @ignore
         */
        function setValue(value) {
            inputCtrl.setValue(value);
        }

        /**
         * 获取当前编辑器所编辑的值
         *
         * @return {Mixed}
         * @ignore
         */
        function getValue() {
            return inputCtrl.getValue();
        }

        /**
         * 编辑按钮单击事件处理函数
         *
         * @param {object} element 事件元素
         * @param {object} e 事件元素
         * @ignore
         */
        function entranceClickHandler(element, e) {
            var table = this;
            if (table.startEdit) {
                var rowIndex = lib.getAttribute(element, 'data-row');
                var columnIndex = lib.getAttribute(element, 'data-col');
                table.startEdit(rowIndex, columnIndex, element);
            }
        }

        /**
         * 开始某行的编辑逻辑，初始化子控件
         * @param {number} rowIndex 行序号
         * @param {number} columnIndex 列序号
         * @ignore
         */
        function startEdit(rowIndex, columnIndex, element) {
            if (this.editable) {
                var field = this.realFields[columnIndex];
                var eventArgs = {
                    rowIndex: rowIndex,
                    columnIndex: columnIndex,
                    field: field
                };

                eventArgs = this.fire('startedit', eventArgs);
                fieldHanlder(this, 'startedit', eventArgs);

                if (!eventArgs.isDefaultPrevented()) {
                    var data = this.datasource[rowIndex];
                    var content = field.editContent;
                    var value = 'function' === typeof content
                        ? content.call(this, data, rowIndex, columnIndex)
                        : data[field.field];

                    start(
                        this,
                        {
                            field: field,
                            rowIndex: rowIndex,
                            columnIndex: columnIndex,
                            element: element,
                            value: value
                        }
                    );
                }
            }
        }

        /**
         * 取消编辑
         * @ignore
         */
        function cancelEdit() {
            if (this == currentTable) {
                stop();
            }
        }

        /**
         * 隐藏编辑浮层
         * @ignore
         */
        function hideEditLayer() {
            if (this === currentTable) {
                hideLayer();
            }
        }

        /**
         * 显示编辑浮层
         * @ignore
         */
        function showEditError () {
            if (this === currentTable) {
                showLayer();
            }
        }

        var editentryTpl = '<div class="${className}" '
                         + 'data-row="${row}" data-col="${col}"></div>';
        /**
         * 生成每单元格内容
         * @ignore
         */
        function getColHtml(
            table, data, field, rowIndex, fieldIndex, extraArgs
        ) {
            if (table.editable && field.editable) {
                return {
                    textClass: table.getClass('cell-editable'),
                    html: lib.format(
                        editentryTpl,
                        {
                            className: table.getClass('cell-editentry'),
                            row: rowIndex,
                            col: fieldIndex
                        }
                    )
                };
            }
        }

        function fieldHanlder(table, eventType, args) {
            var handler = args.field['on' + eventType];
            if (handler
                && '[object Function]' == Object.prototype.toString.call(handler)) {
                handler.call(table, args);
            }
        }

        /**
         * 表格行内编辑扩展
         *
         * 启用该扩展后，{@link Table}控件将可以在行内进行字段的编辑
         *
         * 在{@link Table#fields}配置中，可编辑的字段有以下属性控制：
         *
         * - `{boolean editable}`：设置为`true`表示可编辑
         * - `{Object} editRules`：配置编辑的验证规则，同{@link validator.Rule}定义
         * - `{Function | Mixed} editContent`：指定最终编辑后的内容，
         * 如果是函数则取函数的返回值作为最终编辑后的内容，其它类型则作为常量
         *
         * 在编辑过程中，{@link Table}控件将触发以下事件：
         *
         * - `startedit`：开始编辑
         * - `saveedit`：编辑生效
         * - `canceledit`：取消编辑
         *
         * 以上3个事件的事件对象均提供以下属性：
         *
         *
         * - `{number} rowIndex`：行索引
         * - `{number} columnIndex`：列索引
         * - `{number} field`：对应的字段
         *
         * 而`saveedit`还额外提供`{Mixed} value`属性表示保存的值
         *
         * 其中`saveedit`和`startedit`均可以通过`preventDefault()`阻止默认行为
         *
         * @class extension.TableEdit
         * @extends Extension
         * @constructor
         */
        function TableEdit() {
            Extension.apply(this, arguments);
        }

        /**
         * 指定扩展类型，始终为`"TableEdit"`
         *
         * @type {string}
         */
        TableEdit.prototype.type = 'TableEdit';

        /**
         * 激活扩展
         *
         * @override
         */
        TableEdit.prototype.activate = function () {
            var target = this.target;
            // 只对`Table`控件生效
            if (!(target instanceof Table)) {
                return;
            }

            target.startEdit = startEdit;
            target.cancelEdit = cancelEdit;
            target.hideEditLayer = hideEditLayer;
            target.showEditError = showEditError;

            target.addRowBuilders([
                {
                    index: 3,
                    getColHtml: getColHtml
                }
            ]);

            target.addHandlers(
                'click',
                {
                    handler: entranceClickHandler,
                    matchFn: helper.getPartClasses(
                        target, 'cell-editentry'
                    )[0]
                }
            );

            target.on('enddrag', tableEndDragHandler);
            target.on('resize', tableResizeHandler);

            Extension.prototype.activate.apply(this, arguments);
        };

        /**
         * 取消扩展的激活状态
         *
         * @override
         */
        TableEdit.prototype.inactivate = function () {
            var target = this.target;
            // 只对`Table`控件生效
            if (!(target instanceof Table)) {
                return;
            }

            delete target.startEdit;
            delete target.cancelEdit;

            target.un('enddrag', tableEndDragHandler);
            target.un('resize', tableResizeHandler);

            disposeEditorControl(target);

            Extension.prototype.inactivate.apply(this, arguments);
        };

        lib.inherits(TableEdit, Extension);
        main.registerExtension(TableEdit);

        return TableEdit;
    }
);
