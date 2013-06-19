/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 表格自动排序扩展
 * @author otakustay
 */

define(
    function (require) {
        var Extension = require('../Extension');
        var lib = require('../lib');
        var helper = require('../controlHelper');
        var Table = require('../Table');

        /**
         * 隐藏编辑区域
         * @private 
         */
        function hideEditField(table, index) {
            helper.removePartClasses(
                table, 'cell-editing', table.getRow(index)
            );
            table.tableEditStatus.lastIndex = index;
        }

        /**
         * 隐藏编辑区域
         * @param {number} index 行序号
         * @private
         */
        function showEditField(table, index) {
            var editedIndex = table.tableEditStatus.editedIndex;
            if (table.edit !== 'mutil' && editedIndex >= 0)  {
                hideEditField(table, editedIndex);
            }
            helper.addPartClasses(
                table, 'cell-editing', table.getRow(index)
            );
        }

        /**
         * 隐藏编辑区域
         * @param {number} index 行序号
         * @public
         */
        function startEdit(index) {
            var table = this;
            var datasource = table.datasource;
            var fields = table.realFields;
            var data = datasource[index];
            var tableEditStatus = table.tableEditStatus;
            var isMutil = table.edit == 'mutil';

            if (!tableEditStatus.initedControls['row' + index]) {
                table.initBodyChildren(table.getRow(index));
                tableEditStatus.initedControls['row' + index] = true;
            }

            var lastIndex = tableEditStatus.lastIndex;
            if (lastIndex >=0){
                var viewContext = table.viewContext;
                for (var i = fields.length - 1; i >= 0; i--) {
                    var field = fields[i];
                    if (field.editable) {
                        var inputId = table.getId('edit-input-' + index + '-'+ i);
                        var input = viewContext.get(inputId);
                        if (input) {
                            input.setValue(data[field.field].toString());
                        }
                    }
                }
            }

            if (!isMutil 
                && tableEditStatus.editedIndex >= 0) {
                table.fire(
                    'canceledit', 
                    {index: tableEditStatus.editedIndex}
                );
            }

            showEditField(table, index);

            tableEditStatus.editedIndex = index;

            table.fire('startedit', {index: index, data: data});
        }

        /**
         * 开始编辑
         * @param {number} index 行序号
         * @public
         */
        function saveEdit(index) {
            var table = this;
            var tableEditStatus = table.tableEditStatus;
            var data = table.datasource[index];
            var newData = {};
            var fields = table.realFields;
            var viewContext = table.viewContext;

            for (var i = fields.length - 1; i >= 0; i--) {
                var field = fields[i];
                if (field.editable) {
                    var inputId = table.getId('edit-input-' + index + '-'+ i);
                    var input = viewContext.get(inputId);
                    if (input) {
                        newData[field.field] = input.getValue();
                    }
                }
            }
            var eventArgs = { 
                index: index, 
                data: lib.extend({}, data, newData) 
            };
            table.fire('saveedit', eventArgs);

            if (eventArgs.returnResult !== false) {
                tableEditStatus.editedIndex = -1;
                hideEditField(table, index);
            }
        }

        /**
         * 取消编辑
         * @param {number} index 行序号
         * @public
         */
        function cancelEdit(index) {
            var table = this;
            hideEditField(table, index);
            table.fire('cancelEdit', {index: index});
        }

        /**
         * 初始化编辑状态
         * @private
         */
        function iniEditOptions(table) {
            this.tableEditStatus = {
                initedControls: {},
                editedIndex: -1,
                lastIndex: -1
            };
        }

        /**
         * 生成每单元格内容
         * @private
         */
        function getColHtml(table, data, field, rowIndex, fieldIndex, extraArgs) {
            if (!field.editable || table.edit == 'dialog') {
                return;
            }

            var editOptions = field.editOptions;
            var isSelect = editOptions 
                        && editOptions.type == 'select'
                        && editOptions.datasource;
            var format = lib.format;
            var contentTpl = '<input data-ui="type:TextBox;id:${id};value:${value};"/>';
            var inputId = table.getId('edit-input-' + rowIndex + '-'+ fieldIndex);
            var inputValue = table.datasource[rowIndex][field.field];

            if (isSelect) {
                var selectTpl = '<select data-ui="type:Select;id:${id};value:${value};">';
                if (!editOptions.datasourceText) {
                    var datasource = editOptions.datasource;
                    var textTpl = '<option value="${value}">${text}</option>';
                    var dataText = [];
                    for (var i = 0, l = datasource.length; i < l; i++) {
                        var data = datasource[i];
                        dataText.push(format(textTpl, data));
                    }
                    editOptions.datasourceText = dataText.join('\n');
                }

                contentTpl = selectTpl
                            + editOptions.datasourceText
                            + '</select>';                
            }
                 
            return {
                textClass: table.getClass('cell-editable'),
                html: format(
                    '<div class="${className}">${content}</div>',
                    { className: table.getClass('cell-editfield'), 
                      content: format(
                        contentTpl,
                        {   
                            id: inputId, 
                            value: inputValue
                        }
                      )
                    }
                )
            };
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
            // 只对`Table`控件生效
            target.on('bodyChange', iniEditOptions);

            target.startEdit = startEdit;
            target.saveEdit = saveEdit;
            target.cancelEdit = cancelEdit;

            target.addPlugins([
                {
                    getColHtml: getColHtml
                }
            ]);

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
            delete target.saveEdit;
            delete target.cancelEdit;

            target.un('bodyChange', iniEditOptions);

            Extension.prototype.inactivate.apply(this, arguments);
        };

        require('../lib').inherits(TableEdit, Extension);
        require('../main').registerExtension(TableEdit);
        
        return TableEdit;
    }
);