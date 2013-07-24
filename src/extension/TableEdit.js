/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 表格行内编辑扩展
 * @author wurongyao
 */
define( 
    function (require) {
        require(
            [
                '../validator/MaxLengthRule',
                '../validator/MaxRule',
                '../validator/MinRule',
                '../validator/RequiredRule',
                '../validator/PatternRule'
            ]
        );

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
                '<div data-ui="id:${cancelId};type:Button;">${cancelText}</div></div>',
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
         * @private
         */
        function init(table, options) {
            currentTable = table;
            currentRowIndex = options.rowIndex;
            currentColIndex = options.columnIndex;

            if (!layer) {
                layer = helper.layer.create();
                document.body.appendChild(layer);
                layer.className = 'ui-table-editor';
                initLayer();
            }

            initInputControl(options);
        }
        
        /**
         * 初始化编辑器浮层
         *
         * @private
         */
        function initLayer() {
            fillLayer();
            initButtonControl();
        }
        
        /**
         * 初始化浮层按钮的控件
         *
         * @private
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
         * @private
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
         * @private
         */
        function disposeEditorControl(table) {
            if (table == currentTable) {
                hideLayer();

                layer.dispose();
                inputCtrl.dispose();
                okButton.dispose();
                cancelButton.dispose();

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
         * @private
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
                    optClass: 'ui-table-editor-opt',
                    errorClass: 'ui-table-editor-error',
                    errorId: errorId
                }
            );
        }

        /**
         * 获取初始化后的控件
         *
         * @private
         */
        function getControlFromMap(controlMap, id) {
            for (var i = controlMap.length - 1; i >= 0; i--) {
                var control = controlMap[i];
                if (control.id === id) {
                    return control;
                }
            }
        };
        
        /**
         * 隐藏浮层
         *
         * @private
         */
        function hideLayer(argument) {
            (layer) && (layer.style.display = 'none');
        }

        /**
         * 现实浮层
         *
         * @private
         */
        function showLayer(argument) {
            (layer) && (layer.style.display = '');
        }

        /**
         * 显示错误信息
         *
         * @private
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
         * @private
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
         * @private
         * @return {Function} 
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

                currentTable.fire('saveedit', eventArgs);

                if (eventArgs.returnResult !== false) {
                    hideLayer();
                    currentState = 0;
                } else if (eventArgs.errorMsg) {
                    showErrorMsg(eventArgs.errorMsg);
                } 
            }
        }
        
        /**
         * 获取取消按钮的点击行为handler
         *
         * @private
         * @return {Function} 
         */
        function getCancelHandler() {
            return function () {
                stop();
            };
        }

        /**
         * 停止编辑功能
         *
         * @private
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
            currentTable.fire('canceledit', eventArgs);
        }

        /**
         * 启动编辑功能
         *
         * @private
         * @param {Object} table 表格控件实例
         * @param {Object} options 启动参数表
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
         * @public
         * @param {boolean} disabled 按钮的disabled状态
         */
        function setButtonDisabled( disabled ) {
            okButton.setDisabled( disabled );
            cancelButton.setDisabled( disabled );
        }

        /**
         * 设置当前编辑器的值
         *
         * @private
         * @param {string} value 值内容
         */
        function setValue(value) {
            inputCtrl.setValue(value);
        }

        /**
         * 获取当前编辑器所编辑的值
         *
         * @private
         * @return {Any} 
         */
        function getValue() { 
            return inputCtrl.getValue();
        }

        /**
         * 编辑按钮单击事件处理函数
         *
         * @param {object} element 事件元素
         * @param {object} e 事件元素
         *
         * @private
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
         * @param {number} index 行序号
         * @private
         */
        function startEdit(rowIndex, columnIndex, element) {
            if (this.editable) {
                var field = this.realFields[columnIndex];
                var eventArgs = {
                    rowIndex: rowIndex,
                    columnIndex: columnIndex,
                    field: field
                };
                this.fire('startedit',eventArgs);

                if (eventArgs.returnResult !== false) {
                    var data = this.datasource[rowIndex];
                    var content = field.editContent; 
                    var value = 'function' == typeof content
                                ? content.call(this, data, rowIndex, columnIndex)
                                : data[field.field];

                    start(
                        this,
                        {
                            field: field,
                            rowIndex: rowIndex,
                            columnIndex: columnIndex,
                            element: element,
                            field: field,
                            value: value
                        }
                    );
                }
            }
        }

        /**
         * 取消编辑
         * @public
         */
        function cancelEdit() {
            if (this == currentTable) {
                stop();
            }
        }

        var editentryTpl = '<div class="${className}" '
                         + 'data-row="${row}" data-col="${col}"></div>';
        /**
         * 生成每单元格内容
         * @private
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

        /**
         * 表格行内编辑扩展
         *
         * @constructor
         * @extends Extension
         */
        function TableEdit() {
            Extension.apply(this, arguments);
        }

        TableEdit.prototype.type = 'TableEdit';

        /**
         * 激活扩展
         *
         * @public
         */
        TableEdit.prototype.activate = function () {
            var target = this.target;
            // 只对`Table`控件生效
            if (!(target instanceof Table)) {
                return;
            }

            target.startEdit = startEdit;
            target.cancelEdit = cancelEdit;

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

            Extension.prototype.activate.apply(this, arguments);
        };

        /**
         * 取消扩展的激活状态
         *
         * @public
         */
        TableEdit.prototype.inactivate = function () {
            var target = this.target;
            // 只对`Table`控件生效
            if (!(target instanceof Table)) {
                return;
            }

            delete target.startEdit;
            delete target.cancelEdit;

            disposeEditorControl();

            Extension.prototype.inactivate.apply(this, arguments);
        };

        require('../lib').inherits(TableEdit, Extension);
        require('../main').registerExtension(TableEdit);
        
        return TableEdit;
    }
);