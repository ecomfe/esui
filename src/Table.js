/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 表格控件
 * @author wurongyao
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var main = require('./main')
        var dataCommand = require('./extension/DataCommand')

        /**
         * 表格控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Table(options) {
            /**
             * 默认Table选项配置
             * 
             * @const
             * @inner
             * @type {Object}
             */
            var DEFAULT_OPTION = {
                noDataHtml          : 'text',
                followHead          : false,
                sortable            : false,
                columnResizable     : false,
                rowWidthOffset      : -1,
                subrowMutex         : 1,
                subEntryOpenTip     : '点击展开',
                subEntryCloseTip    : '点击收起',
                subEntryWidth       : 18,
                breakLine           : false,
                followHeightArr    : [0, 0],
                followWidthArr     : [] 
            };

            options.extensions = [ new dataCommand() ];
            Control.call( this, lib.extend( {} , DEFAULT_OPTION , options ) );
        }

         /**
         * 获取dom子部件的id
         * 
         * @protected
         * @return {string}
         */
        function getId( table, name ){
            return helper.getId( table, name );
        }

        /**
         * 获取dom子部件的css class
         * 
         * @protected
         * @return {string}
         */
        function getClass( table, name ) {
            return helper.getClasses( table, name ).join(' ');
        }

         /**
         * 获取列表头容器元素
         * 
         * @public
         * @return {HTMLElement}
         */
        function getHead( table ) {
            return lib.g( getId( table, 'head' ) );
        }

        /**
         * 获取列表体容器素
         * 
         * @public
         * @return {HTMLElement}
         */
        function getBody( table ) {
            return lib.g( getId( table, 'body' ) );
        }


        /**
         * 获取列表尾容器元素
         * 
         * @public
         * @return {HTMLElement}
         */
        function getFoot( table ) {
            return lib.g( getId( table, 'foot' ) );
        }

        /**
         * 获取表格内容行的dom元素
         * 
         * @private
         * @param {number} index 行号
         * @return {HTMLElement}
         */
        function getRow ( table, index ) {
            return lib.g( getId( table, 'row' ) + index );
        }
            
        /**
         * 获取checkbox选择列表格头部的checkbox表单
         * 
         * @private
         * @return {HTMLElement}
         */
        function getHeadCheckbox ( table ) {
            return lib.g( getId( table, 'selectAll' ) );
        }
        
        /**
         * 获取表格所在区域宽度
         * 
         * @private
         * @return {number}
         */
        function getWidth( table ) {  
            // 如果手工设置宽度，不动态计算
            if ( table.width ) {
                return table.width;
            }  
            
            var me = table;
            var rulerDiv = document.createElement( 'div' );
            var parent = me.main.parentNode;
            
            parent.appendChild( rulerDiv );    
            var width = rulerDiv.offsetWidth;
            parent.removeChild( rulerDiv );
            
            return width;
        }
        /**
         * 初始化表格的字段
         * 
         * @private
         */
        function initFields( table ) {
            if ( !table.fields ) {
                return;
            }
            
            // 避免刷新时重新注入
            var fields  = table.fields;
            var realFields = fields.slice( 0 );
            var len     = realFields.length;

            while ( len-- ) {
                if ( !realFields[ len ] ) {
                    realFields.splice( len, 1 );
                }
            }
            table.realFields = realFields;
            if ( !table.select || table.disabled ) {
                return;
            }
            switch ( table.select.toLowerCase() ) {
                case 'multi':
                    realFields.unshift( getMultiSelectTpl( table ) );
                    break;
                case 'single':
                    realFields.unshift( getSingleSelectTpl( table ) );
                    break;
            }
        }

        /**
         * dom表格起始的html模板
         * 
         * @private
         */
        var tplTablePrefix = '<table cellpadding="0" cellspacing="0" width="${width}" controlTable="${controlTableId}">';
          
         /**
         * 缓存控件的核心数据
         *
         * @private
         */
        function caching( table ) {
            if ( table.followHead ) {
                cachingFollowHead( table );
            }
        }
        
        /**
         * 缓存表头跟随所用的数据
         *
         * @private
         */
        function cachingFollowHead( table ) {
            var me = table;
            var followDoms = me.followDoms;

            if ( !followDoms ) {
                followDoms = [];
                me.followDoms = followDoms;

                var walker = me.main.parentNode.firstChild;
                var followWidths = me.followWidthArr;
                var followHeights = me.followHeightArr;

                // 缓存表格跟随的dom元素
                while ( walker ) {
                    if ( walker.nodeType == 1 
                         && walker.getAttribute( 'followThead' )
                    ) {
                        followDoms.push( walker );
                    }
                    walker = walker.nextSibling;
                }

                function getStyleNum( dom, styleName ) {
                    var result = lib.getComputedStyle( dom, styleName );
                    return ( result == '' ? 0 : +( result.replace( 'px','' ) ) );
                }

                // 读取height和width的值缓存
                followHeights[ 0 ] = 0;
                for ( var i = 0, len = followDoms.length; i < len; i++ ) {
                    var dom = followDoms[ i ];
                    followWidths[ i ] = getStyleNum( dom, 'padding-left' ) 
                                      + getStyleNum( dom, 'padding-right' )  
                                      + getStyleNum( dom, 'border-left' ) 
                                      + getStyleNum( dom, 'border-right' ); 
                    followHeights[ i + 1 ] = followHeights[ i ] + dom.offsetHeight;
                }
                followHeights[ i + 1 ] = followHeights[ i ];
                followHeights.lenght = i + 2;
            }

            // 读取跟随的高度，缓存
            var followOffest = lib.getOffset( followDoms[ 0 ] || me.main );
            me.followTop = followOffest.top;
            me.followLeft = followOffest.left;
        }


        /**
         * 初始化列
         *
         * @private
         */
        function initCols( table ) {
           initFields( table );
           initMinColsWidth( table );
           initColsWidth( table );
        }


        var commandEventSet = { 
            titleOverHandler : titleOverHandler,
            titleOutHandler : titleOutHandler,
            titleClickHandler : titleClickHandler,
            rowOverHandler : rowOverHandler,
            rowOutHandler : rowOutHandler,
            rowClickHandler : rowClickHandler,
            entryOverHandler : entryOverHandler,
            entryOutHandler : entryOutHandler,
            fireSubrow : fireSubrow,
            toggleSelectAll : toggleSelectAll,
            rowCheckboxClick : rowCheckboxClick,
            selectSingleHandler : selectSingleHandler,
            headMoveHandler : headMoveHandler,
            dragStartHandler : dragStartHandler
        };
        /**
         * Command事件转换
         *
         * @private
         */
        function dataCommandTransfer( args, e ){
            var table = args.control;
            if( commandEventSet && args.commandArgs && args.commandArgs.__esuiIsControlInner ){
                commandEventSet[args.commandName] && commandEventSet[args.commandName]( args, e );
            }else{
                table.oncommand.apply( table, arguments );
            }
        }

        /**
         * 初始化事件
         *
         * @private
         */
        function initEventHandler( table ){

            table.addDataCommand( table.main, 'click' , dataCommandTransfer );
            table.addDataCommand( table.main, 'mouseover' , dataCommandTransfer );
            table.addDataCommand( table.main, 'mouseout' , dataCommandTransfer );

            if( !table.noHead ){
                var head = getHead( table );
                table.addDataCommand( head, 'mousemove' , dataCommandTransfer );
                table.addDataCommand( head, 'mousedown' , dataCommandTransfer );
            }
        }

        /**
         * 初始最小列宽
         *
         * @private
         */
        function initMinColsWidth( table ) {
            var me      = table;
            var fields  = me.realFields ;
            var result  = [];
            var field ;
            var width ;

            if ( !me.noHead ) {
                for ( var i = 0 , len = fields.length; i < len; i++ ) {
                    field = fields[ i ];
                    width = field.minWidth;
                    if ( !width && !field.breakLine ) {
                        // 30包括排序和外层padding
                        width = field.title.length * 13 + 30;
                    }

                    result[i] = width;
                }
            } else {
                for ( i = 0; i < len; i++ ) {
                    result[i] = 50;
                }
            }

            me.minColsWidth = result;
        }

        /**
         * 初始化列宽
         * 
         * @private
         */
        function initColsWidth( table ) {
            var me          = table;
            var fields      = me.realFields;
            var canExpand   = [];
            
            me.colsWidth = [];
            
            // 减去边框的宽度
            var leftWidth = me.realWidth - 1;
            
            var maxCanExpandIdx = len;

            // 读取列宽并保存
            for ( var i = 0, len = fields.length ; i < len; i++ ) {
                var field = fields[ i ];
                var width = field.width;
                
                width = (width ? parseInt( width, 10 ) : 0);
                me.colsWidth.push( width );
                leftWidth -= width;

                if ( !field.stable ) {
                    canExpand.push( i );
                }
            }
            
            // 根据当前容器的宽度，计算可拉伸的每列宽度
            var len = canExpand.length;                 
            var leaveAverage = Math.round( leftWidth / len );
            
            for ( var i = 0, len = fields.length ; i < len ;i++ ) {
                var index  = canExpand[ i ];
                var offset = Math.abs( leftWidth ) < Math.abs( leaveAverage ) ? leftWidth : leaveAverage; 
                leftWidth -= offset;
                me.colsWidth[ index ] += offset;

                //计算最小宽度
                var minWidth = me.minColsWidth[ index ];
                if ( minWidth > me.colsWidth[ index ] ) {
                    leftWidth += me.colsWidth[ index ] - minWidth;
                    me.colsWidth[ index ] = minWidth;
                }
            }
            
            if ( leftWidth < 0 ) {// 如果空间不够分配，需要重新从富裕的列调配空间
                var i = 0;
                var len = fields.length;
                while ( i < len && leftWidth != 0 ) {
                    var index    = canExpand[ i ];
                    minWidth = me.minColsWidth[ index ];

                    if ( minWidth < me.colsWidth[ index ] ) {
                        offset = me.colsWidth[ canExpand[ i ] ] - minWidth;
                        offset = offset > Math.abs( leftWidth ) ? leftWidth : -offset;
                        leftWidth += Math.abs( offset );
                        me.colsWidth[ index ] += offset;
                    }
                    i++;
                }
            } else if ( leftWidth > 0 ) {// 如果空间富裕，则分配给第一个可调整的列
                me.colsWidth[ canExpand[ 0 ] ] += leftWidth;
            }
            
        }
        
        /**
         * 绘制表格尾
         * 
         * @private
         */
        function renderFoot( table ) {
            var me      = table;
            var foot    = getFoot( table );

            if ( !( me.foot instanceof Array ) ) {
                foot && (foot.style.display = 'none');
            } else {
                if ( !foot ) {
                    var type    = 'foot';
                    var id      = getId( table, type );
                    foot = document.createElement( 'div' );
                    foot.id = id;
                    foot.className = getClass( me, type );
                    foot.setAttribute( 'controlTable', me.id );
                    
                    me.main.appendChild( foot );

                }    
                
                foot.style.display = '';
                foot.style.width = me.realWidth + 'px';
                foot.innerHTML = getFootHtml( me );
            }
        }
        
        /**
         * 获取表格尾的html
         * 
         * @private
         * @return {string}
         */
        function getFootHtml( table ) {
            var html        = [];
            var footArray   = table.foot;
            var fieldIndex  = 0;
            var colsWidth   = table.colsWidth;
            var thCellClass = getClass( table, 'fcell' );
            var thTextClass = getClass( table, 'fcell-text' );
            
            html.push( lib.format( tplTablePrefix, { width: '100%', controlTableId : table.id }) );

            for ( var i = 0 , len = footArray.length ; i < len; i++ ) {
                var footInfo    = footArray[ i ];
                var colWidth    = colsWidth[ fieldIndex ];
                var colspan     = footInfo.colspan || 1;
                var thClass     = [ thCellClass ];
                var contentHtml = footInfo.content;

                if ( 'function' == typeof contentHtml ) {
                    contentHtml = contentHtml.call( table );
                }
                contentHtml = contentHtml || '&nbsp;';

                for ( var j = 1; j < colspan; j++ ) {
                    colWidth += colsWidth[ fieldIndex + j ];
                }
                
                fieldIndex += colspan;
                if ( footInfo.align ) {
                    thClass.push( getClass( table, 'cell-align-' + footInfo.align ) );
                }
                
                colWidth += table.rowWidthOffset; 
                (colWidth < 0) && (colWidth = 0);
                html.push('<th id="' + getFootCellId( table, i ) + '" class="' + thClass.join( ' ' ) + '"',
                            ' style="width:' + colWidth + 'px;',
                            (colWidth ? '' : 'display:none;') + '">',
                            '<div class="' + thTextClass + '">',
                            contentHtml,
                            '</div></th>');
            }

            html.push( '</tr></table>' );
            return html.join( '' );
        }

        /**
         * 绘制表格头
         * 
         * @private
         */
        function renderHead( table ) {
            var me          = table;
            var type        = 'head';
            var id          = getId( table, type );
            var head        = getHead( me );
            var multiSelect = me.select && me.select.toLowerCase() == 'multi' ;

            if ( me.noHead ) {
                return;
            }

            if ( !head ) {
                head = document.createElement( 'div' );
                head.id = id;
                head.className = getClass( me, type );
                head.setAttribute( 'controlTable', me.id );

                me.main.appendChild( head );

            }

            var commandAtrs = lib.getCommandAttr(
                {   mousemove : me.columnResizable ? 'headMoveHandler' : '' ,
                    mousedown : me.columnResizable ? 'dragStartHandler' : '',
                    args :'__esuiIsControlInner:1'
                },
                head
            );

            
            head.style.width = me.realWidth + 'px';
            head.innerHTML   = getHeadHtml( me );
        }
        
        /**
         * 获取表格头的html
         * 
         * @private
         * @return {string}
         */
        function getHeadHtml( table ) {
            // TODO: 使用format性能很低的哈
            var me          = table;
            var fields      = me.realFields;
            var thCellClass = getClass( me, 'hcell' );
            var thTextClass = getClass( me, 'hcell-text' );
            var breakClass  = getClass( me, 'cell-break' );
            var sortClass   = getClass( me, 'hsort' );
            var selClass    = getClass( me, 'hcell-sel' );
            var tipClass    = getClass( me, 'hhelp' );
            var tipHtml;
            
            var len = fields.length;
            var canDragBegin = -1;
            var canDragEnd = -1;
            if( !me.disabled ){
                // 计算最开始可拖拽的单元格
                for ( var i = 0 ; i < len; i++ ) {
                    if ( !fields[i].stable ) {
                        canDragBegin = i;
                        break;
                    }
                }
                
                // 计算最后可拖拽的单元格
                for (var i = len - 1; i >= 0; i-- ) {
                    if ( !fields[ i ].stable ) {
                        canDragEnd = i;
                        break;
                    }
                }
            }

            var html = [];
            // 拼装html
            html.push( lib.format( tplTablePrefix, { width : '100%' , controlTableId : me.id} ) );//me._totalWidth - 2
            html.push( '<tr>' ); 
            for (var i = 0; i < len; i++ ) {
                var thClass     = [ thCellClass ];
                var field       = fields[ i ];
                var title       = field.title;
                var sortable    = ( !me.disabled && me.sortable && field.sortable);
                var currentSort = ( sortable 
                                 && field.field 
                                 && field.field == me.orderBy);
                var tempThTextClass = thTextClass;
                if( i == 0 ){
                    tempThTextClass += ' ' + getClass( me, 'hcell-text-first' );
                }else if( i == len - 1  ){
                    tempThTextClass += ' ' + getClass( me, 'hcell-text-last' );
                }

                // 计算排序图标样式
                var sortIconHtml = '';
                var orderClass   = '';
                if ( sortable ) {
                    thClass.push( getClass( me, 'hcell-sort' ) );
                    if ( currentSort ) {
                        thClass.push( getClass( me, 'hcell-' + me.order ) );
                    }             
                    sortIconHtml = lib.format( tplSortIcon, { className : sortClass } );
                }
                
                // 计算表格对齐样式
                if ( field.align ) {
                    thClass.push( getClass( me, 'cell-align-' + field.align ) );
                }

                // 判断是否breakline模式
                if ( me.breakLine
                    || field.breakLine
                ) {
                    thClass.push( breakClass );
                }

                var contentHtml;
                // 计算内容html
                if ( typeof title == 'function' ) {
                    contentHtml = title.call( me );
                } else {
                    contentHtml = title;
                }
                contentHtml = contentHtml || '&nbsp;';
                
                                            
                html.push('<th id="' + getTitleCellId( me, i ) + '" index="' + i + '"',
                            ' class="' + thClass.join( ' ' ) + '"',
                            sortable ? sortAction( field, i ) : '',
                            (i >= canDragBegin && i < canDragEnd ? ' dragright="1"' : ''),
                            (i <= canDragEnd && i > canDragBegin ? ' dragleft="1"' : ''),
                            ' style="width:' + (me.colsWidth[ i ] + me.rowWidthOffset) + 'px;',
                            (me.colsWidth[i] ? '' : 'display:none') + '">',
                            '<div class="' + tempThTextClass +
                            (field.select ? ' ' + selClass : '') + '">',
                            contentHtml,
                            sortIconHtml,
                            tipHtml,
                            '</div></th>');
            }
            html.push( '</tr></table>' );

            return html.join('');
            
            /**
             * 获取表格排序的单元格预定义属性html
             * 
             * @inner
             * @return {string}
             */
            function sortAction( field, index ) {
                return lib.format(  ' ${dataCommand} sortable="1" index="${index}" ',
                                    {
                                        dataCommand : lib.getCommandStr( {
                                            mouseover : 'titleOverHandler' ,
                                            mouseout : 'titleOutHandler' ,
                                            click : 'titleClickHandler' ,
                                            args : '__esuiIsControlInner:1;index:' + index 
                                        }),
                                        index : index
                                    }
                );
            }
        }
        
        var tplSortIcon =  '<div class="${className}"></div>';

        // 提示模板，此处还未定实现方式
        var tplTipIcon =  '<div class="${className}" {1}></div>';
        
        /**
         * 获取表格头单元格的id
         * 
         * @private
         * @param {number} index 单元格的序号
         * @return {string}
         */
        function getTitleCellId( table, index ) {
            return getId( table, 'titleCell' ) + index;
        }

        /**
         * 获取表格尾单元格的id
         * 
         * @private
         * @param {number} index 单元格的序号
         * @return {string}
         */
        function getFootCellId( table, index ) {
            return getId( table, 'footCell' ) + index;
        }
        
        /**
         * 表格头单元格鼠标移入的事件handler
         * 
         * @private
         * @param {HTMLElement} cell 移出的单元格
         */
        function titleOverHandler( args, e ) {
           titleOver( args.control, args.element );
        }

        function titleOver( table, element ){
             if ( table.isDraging || table.dragReady ) {
                return;
            }
            
            table.sortReady = 1;
            helper.addClass( table, element, 'hcell-hover' );
        }
        
        /**
         * 表格头单元格鼠标移出的事件handler
         * 
         * @private
         * @param {HTMLElement} cell 移出的单元格
         */
        function titleOutHandler( args, e ) {
           titleOut( args.control, args.element );
        }

        function titleOut( table, element ){
            table.sortReady = 0;
            helper.removeClass( table, element, 'hcell-hover' );
        }

        /**
         * 对行进行排序，不改变datasource，只改变展示的顺序
         */
        /* 
        function sortRows( table, field, order ){
            var map  = [];
            var html = [];
            for ( var i = 0 , l = table.datasource.length ; i < l; i++ ) {
                map.push({
                    item : table.datasource[i],
                    index : i
                });
            };

            map.sort( function ( a, b ) {
                var compareResult = field.comparer( a.item, b.item );
                return order == 'asc' ? compareResult : 0 - compareResult;
            });

            for ( var i = 0 , l = map.length ; i < l; i++ ) {
                var index = map[i].index;
                var row = getRow( table, index );

                html.push( row.outerHTML );
                if( table.subrow ){
                    var subrow = lib.g( getSubrowId( table, index ) );
                    if( subrow ){
                        html.push( subrow.outerHTML );
                    }
                }
            };

            if( html.length > 0 ){
                getBody( table ).innerHTML = html.join('');

                //由于sort前要renderHead,所以需要设置全选按钮是否选中
                if( table.select == 'multi'
                 && table.selectedIndex  
                 && table.selectedIndex.length == table.datasource.length ){
                    table.getHeadCheckbox().checked = true;
                }
            }
            
        }*/

        /**
         * 表格头单元格点击的事件handler
         * 
         * @private
         * @param {HTMLElement} cell 点击的单元格
         */
        function titleClickHandler( args, e ) {
            var me = args.control;
            if ( me.sortReady ) { // 避免拖拽触发排序行为
                var me      = args.control,
                    field   = me.realFields[ args.commandArgs.index ],
                    orderBy = me.orderBy,
                    order   = me.order;
                
                if ( orderBy == field.field ) {
                    order = (!order || order == 'asc') ? 'desc' : 'asc';
                } else {
                    order = 'desc';
                }

                me.order = order;
                me.orderBy = field.field;

                if( field.sortable && me.datasource ){
                    renderHead( me );

                    //如果有comparer，则进行dom排序
                    /*if( field.comparer ){
                        sortRows( me, field, order );
                    }*/

                    me.onsort( field , order );
                }
            }
        }
        
        /**
         * 获取表格头鼠标移动的事件handler
         * 
         * @private
         * @return {Function}
         */
        function headMoveHandler( args, e ) {
            var me          = args.control;
            var dragClass   = 'startdrag';
            var range       = 8; // 可拖拽的单元格边界范围
                
            if ( me.isDraging ) {
                return;
            }
        
            var tar     = e.srcElement || e.target ;
            // 寻找th节点。如果查找不到，退出
            tar = findDragCell( me, tar );
            if ( !tar ) {
                return;
            }
            
            var el      = args.element;
            var pageX   = e.pageX || e.clientX + lib.page.getScrollLeft();

            // 获取位置与序号
            var pos     = lib.getOffset( tar );
            var index   = tar.getAttribute('index');
            var sortable = tar.getAttribute('sortable');
            
            // 如果允许拖拽，设置鼠标手型样式与当前拖拽点
            if ( tar.getAttribute( 'dragleft' ) 
                 && pageX - pos.left < range
            ) {
                sortable && ( titleOut( me, tar ) ); // 清除可排序列的over样式
                helper.addClass( me, el, dragClass );
                me.dragPoint = 'left';
                me.dragReady = 1;
            } else if (tar.getAttribute( 'dragright' ) 
                       && pos.left + tar.offsetWidth - pageX < range
            ) {
                sortable && ( titleOut( me, tar ) ); // 清除可排序列的over样式
                helper.addClass( me, el, dragClass );
                me.dragPoint = 'right';
                me.dragReady = 1;
            } else {
                helper.removeClass( me, el, dragClass );
                sortable && ( titleOver( me, tar ) ); // 附加可排序列的over样式
                me.dragPoint = '';
                me.dragReady = 0;
            }
        }
        
        /**
         * 查询拖拽相关的表格头单元格
         * 
         * @private
         * @param {HTMLElement} target 触发事件的元素
         * @return {HTMLTHElement}
         */
        function findDragCell( taable, target ) {    
            while ( target.nodeType == 1 ) {
                if ( target.tagName == 'TH' ) {
                    return target;
                }
                target = target.parentNode;
            }
            
            return null;
        }
     
        /**
         * 获取表格头鼠标点击拖拽起始的事件handler
         * 
         * @private
         * @return {Function}
         */
        function dragStartHandler( args, e ) {
            var me = args.control;
            var dragClass = getClass( me, 'startdrag' );

            var tar = e.target || e.srcElement;
            
            // 寻找th节点，如果查找不到，退出
            tar = findDragCell( me, tar );
            if ( !tar ) {
                return;
            }
            
            if ( lib.g( getId( me, 'head' ) ).className.indexOf( dragClass ) < 0 ) {
                return;
            }            
                        
            // 获取显示区域高度
            me.htmlHeight = document.documentElement.clientHeight;
            
            // 记忆起始拖拽的状态
            me.isDraging = true;
            me.dragIndex = tar.getAttribute( 'index' );
            me.dragStart = e.pageX || e.clientX + lib.page.getScrollLeft();
            
            // 绑定拖拽事件
            helper.addDOMEvent( me, document, 'mousemove' , getDragingHandler( me ));
            helper.addDOMEvent( me, document, 'mouseup' , getDragEndHandler( me ));
            
            // 显示拖拽基准线
            showDragMark( me, me.dragStart );
            
            // 阻止默认行为
            lib.event.preventDefault( e );
            return false;
        }

        /**
         * 获取拖拽中的事件handler
         * 
         * @private
         * @desc 移动拖拽基准线
         * @return {Function}
         */
        function getDragingHandler( table ) {
            return function ( e ) {
                e = e || window.event;
                showDragMark( table, e.pageX || e.clientX + lib.page.getScrollLeft() );
                lib.event.preventDefault( e );
                return false;
            };
        }
        
        /**
         * 显示基准线
         * 
         * @private
         */
        function showDragMark( table, left ) {
            var me      = table;
            var mark    = getDragMark( table );
            
            if ( !me.top ) {
                me.top = lib.getOffset( me.main ).top;
            }    
            
            if ( !mark ) {
                mark = createDragMark( me );
            }
            
            mark.style.top = me.top + 'px';
            mark.style.left = left + 'px';
            mark.style.height = me.htmlHeight - me.top + lib.page.getScrollTop() + 'px';
        }
        
        /**
         * 隐藏基准线
         * 
         * @private
         */
        function hideDragMark( table ) {
            var mark = getDragMark( table );
            mark.style.left = '-10000px';
            mark.style.top = '-10000px';
        }
        
        /**
         * 创建拖拽基准线
         * 
         * @private
         * @return {HTMLElement}
         */
        function createDragMark( table ) {
            var mark        = document.createElement( 'div' );
            mark.id         = getId( table, 'dragMark' );
            mark.className  = getClass( table, 'mark ');
            mark.style.top  = '-10000px';
            mark.style.left = '-10000px';
            document.body.appendChild( mark );
            
            return mark;
        }
        
        /**
         * 获取基准线的dom元素
         * 
         * @private
         * @return {HTMLElement}
         */
        function getDragMark( table ) {
            return lib.g( getId( table, 'dragMark' ) );
        }
        
        /**
         * 获取拖拽结束的事件handler
         * 
         * @private
         * @return {Function}
         */
        function getDragEndHandler( table ) {
            var me = table;
            return function (e) {
                e = e || window.event;
                var index = parseInt( me.dragIndex, 10 );
                var pageX = e.pageX || e.clientX + lib.page.getScrollLeft();
                var fields      = me.realFields; 
                var fieldLen    = fields.length;
                var alterSum    = 0;
                var colsWidth   = me.colsWidth;
                var revise      = 0;

                // 校正拖拽元素
                // 如果是从左边缘拖动的话，拖拽元素应该上一列
                if ( me.dragPoint == 'left' ) {
                    index--;
                }
                
                // 校正拖拽列的宽度
                // 不允许小于最小宽度
                var minWidth        = me.minColsWidth[ index ];
                var offsetX         = pageX - me.dragStart;
                var currentWidth    = colsWidth[ index ] + offsetX;
                if ( currentWidth < minWidth ) {
                    offsetX += (minWidth - currentWidth);
                    currentWidth = minWidth;
                }
                
                var alters = [];
                var alterWidths = [];
                //查找宽度允许改变的列
                for ( i = index + 1; i < fieldLen; i++ ) {
                    if ( !fields[ i ].stable && colsWidth[i] > 0 ) {
                        alters.push( i );
                        alterWidth = colsWidth[ i ];
                        alterWidths.push( alterWidth );
                        alterSum += alterWidth;
                    }
                }

                // 计算允许改变的列每列的宽度
                var leave = offsetX;
                var alterLen = alters.length;
                for ( i = 0; i < alterLen; i++ ) {
                    var alter       = alters[ i ];
                    var alterWidth  = alterWidths[ i ];    //当前列宽
                    var roughWidth  = offsetX * alterWidth / alterSum; // 变更的列宽
                    
                    // 校正变更的列宽
                    // roughWidth可能存在小数点
                    if ( leave > 0 ) {
                        offsetWidth = Math.ceil( roughWidth );
                    } else {
                        offsetWidth = Math.floor( roughWidth );
                    }
                    offsetWidth = (Math.abs( offsetWidth ) < Math.abs( leave ) ? offsetWidth : leave);

                    // 校正变更后的列宽
                    // 不允许小于最小宽度
                    alterWidth -= offsetWidth;
                    leave -= offsetWidth;
                    minWidth = me.minColsWidth[ alter ];
                    if ( alterWidth < minWidth ) {
                        revise += minWidth - alterWidth;
                        alterWidth = minWidth;
                    }
                    
                    colsWidth[ alter ] = alterWidth;
                }

                // 校正拖拽列的宽度
                // 当影响的列如果宽度小于最小宽度，会自动设置成最小宽度
                // 相应地，拖拽列的宽度也会相应减小
                currentWidth -= revise;

                colsWidth[ index ] = currentWidth;

                // 重新绘制每一列
                resetColumns( me );
                
                // 清除拖拽向全局绑定的事件
                helper.removeDOMEvent( me, document, 'mousemove');
                helper.removeDOMEvent( me, document, 'mouseup');

                me.isDraging = false;
                hideDragMark( me );
                
                lib.event.preventDefault( e );
                return false;
            };
        }
        
        /**
         * 绘制表格主体
         * 
         * @private
         */
        function renderBody( table ) {
            var me      = table;
            var tBody   = getBody( me );

            if ( !tBody ) {
                var type    = 'body';
                var id      = getId( me, type );
                tBody = document.createElement( 'div' );
                tBody.id = id;
                tBody.className = getClass( me, type );
                
                // 如果设置了表格体高度
                // 表格需要出现横向滚动条
                if ( me.bodyHeight ) {
                    var style = tBody.style;
                    style.height = me.bodyHeight + 'px';
                    style.overflowX = 'hidden';
                    style.overflowY = 'auto';
                }
                me.main.appendChild( tBody );
            }

            tBody.style.width = me.realWidth + 'px';
            tBody.innerHTML   = getBodyHtml( me );

        }
        
        /**
         * 获取表格主体的html
         * 
         * @private
         * @return {string}
         */
        function getBodyHtml( table ) {
            var data    = table.datasource || [];
            var dataLen = data.length;
            var html    = [];
            
            if ( !dataLen ) {
                return table.noDataHtml;
            }

            for ( var i = 0; i < dataLen; i++ ) {
                var item = data[ i ];
                html[ i ] = getRowHtml( table, item, i );
            }
            
            return html.join( '' );  
        }
        
        var tplRowPrefix = '<div id="${id}" class="${className}" ${dataCommand} >';
        /**
         * 获取表格体的单元格id
         * 
         * @private
         * @param {number} rowIndex 当前行序号
         * @param {number} fieldIndex 当前字段序号
         * @return {string}
         */
        function getBodyCellId( table, rowIndex, fieldIndex ) {
            return getId( table, 'cell' ) + rowIndex + "_" + fieldIndex;
        }
        
        /**
         * 获取表格行的html
         * 
         * @private
         * @param {Object} data 当前行的数据
         * @param {number} index 当前行的序号
         * @return {string}
         */
        function getRowHtml( table, data, index ) {
            var me = table;
            var html = [];
            var tdCellClass     = getClass( me, 'cell' );
            var tdBreakClass    = getClass( me, 'cell-break' );
            var tdTextClass     = getClass( me, 'cell-text' );
            var fields          = me.realFields;
            var fieldLen        = fields.length;
            var subrow = me.subrow && me.subrow != 'false';
                
            html.push(
                lib.format( tplRowPrefix,
                            {
                                id : getId( me, 'row' ) + index,
                                className : getClass( me, 'row' ) + ' ' 
                                          + getClass( me, 'row-' + ((index % 2) ? 'odd' : 'even') ),
                                dataCommand : lib.getCommandStr( {
                                    mouseover : 'rowOverHandler' ,
                                    mouseout : 'rowOutHandler' ,
                                    click : 'rowClickHandler' ,
                                    args : '__esuiIsControlInner:1;index:' + index 
                                })
                            }
                ),
                lib.format( tplTablePrefix, { width : '100%' , controlTableId : me.id } )
            );

            for ( i = 0; i < fieldLen; i++ ) {
                var tdClass     = [ tdCellClass ];
                var textClass   = [ tdTextClass ];
                var field       = fields[ i ];
                var content     = field.content;
                var colWidth    = me.colsWidth[ i ];
                var subentry    = subrow && field.subEntry;
                var editable    = me.editable && field.editable && field.edittype;
                

                if( i == 0 ){
                    textClass.push(getClass( me, 'cell-text-first' ));
                }else if( i == fieldLen - 1  ){
                    textClass.push( getClass( me, 'cell-text-last' ));
                }

                // 生成可换行列的样式
                if ( me.breakLine 
                     || field.breakLine
                ) {
                    tdClass.push( tdBreakClass );
                }

                // 生成选择列的样式
                if ( field.select ) {
                    textClass.push( getClass( me, 'cell-sel' ) );
                }
                
                // 计算表格对齐样式
                if ( field.align ) {
                    tdClass.push( getClass( me, 'cell-align-' + field.align ) );
                }
                
                // 计算表格排序样式
                if ( field.field && field.field == me.orderBy ) {
                    tdClass.push( getClass( me, 'cell-sorted' ) );
                }
                // 构造内容html
                contentHtml = '<div class="' + textClass.join( ' ' ) + '">'
                                + ('function' == typeof content 
                                    ? content.call( me, data, index, i ) 
                                    : data[ content ])
                                + '</div>';

                subentryHtml = '&nbsp;';
                if ( subentry ) {
                    if ( typeof field.isSubEntryShow != 'function'
                         || field.isSubEntryShow.call( me, data, index, i ) !== false
                    ) {
                        subentryHtml = getSubEntryHtml( me, index );
                    }
                    
                    tdClass.push( getClass( me, 'subentryfield' ) );
                    contentHtml = '<table width="100%" collpadding="0" collspacing="0">'
                                    + '<tr><td width="' + me.subEntryWidth + '" align="right">' + subentryHtml
                                    + '</td><td>' + contentHtml + '</td></tr></table>';
                }
                html.push('<td id="' + getBodyCellId( me, index, i ) + '"',
                        'class="' + tdClass.join( ' ' )  + '"',
                        ' style="width:' + ( colWidth + me.rowWidthOffset ) + 'px;',
                        ( colWidth ? '' : 'display:none' ),
                        '" controlTable="' + me.id,
                        '" row="' + index + '" col="' + i + '">',
                        contentHtml,
                        '</td>');
            }

            html.push( '</tr></table></div>' );
            
            // 子行html
            if ( subrow ) {
                html.push( getSubrowHtml( me, index ) );
            }
            
            return html.join( '' );
        }

        /**
         * 表格行鼠标移上的事件handler
         * 
         * @private
         * @param {number} index 表格行序号
         */
        function rowOverHandler( args , el ) {
            if ( args.control.isDraging ) {
                return;
            }
            helper.addClass( args.control, args.element, 'row-hover' );
        }
        
        /**
         * 表格行鼠标移出的事件handler
         * 
         * @private
         * @param {number} index 表格行序号
         */
        function rowOutHandler( args , el ) {
            helper.removeClass( args.control, args.element, 'row-hover' );
        }
        
        /**
         * 表格行鼠标点击的事件handler
         * 
         * @private
         * @param {number} index 表格行序号
         */
        function rowClickHandler( args , e ) {
            var me = args.control;
            if ( me.selectMode == 'line' && !me.disabled ) {
                if ( me.dontSelectLine ) {
                    me.dontSelectLine = false;
                    return;
                }
                
                var index = args.commandArgs.index;
                var input;
                
                switch ( me.select ) {
                    case 'multi':
                        input = lib.g( getId( me, 'multiSelect' ) + index );
                        // 如果点击的是checkbox，则不做checkbox反向处理
                        if ( !lib.hasValue( me.preSelectIndex ) ) {
                            input.checked = !input.checked;
                        }
                        selectMulti( me, index );
                        me.preSelectIndex = null;
                        break;

                    case 'single':
                        input = lib.g( getId( me, 'singleSelect' ) + index );
                        input.checked = true;
                        selectSingle( me, index );
                        break;
                }
            }
        }
        
        /**
         * subrow入口的html模板
         * 
         * @private
         */
        var tplSubEntry =  '<div class="${className}" id="${id}" title="${title}" ${dataCommand} ></div>';
        
        /**
         * 获取子内容区域入口的html
         *
         * @private
         * @return {string}
         */
        function getSubEntryHtml( table, index ) {
            var me = table;
            return lib.format(
                tplSubEntry,
                {
                    className : getClass( me, 'subentry' ),
                    id :  getSubentryId( me, index ),
                    title :  me.subEntryOpenTip,
                    dataCommand : lib.getCommandStr( {
                        mouseover : 'entryOverHandler' ,
                        mouseout : 'entryOutHandler' ,
                        click : 'fireSubrow' ,
                        args : '__esuiIsControlInner:1;index:' + index 
                    })
                }
            );
        }
        
        /**
         * 获取子内容区域的html
         *
         * @private
         * @return {string}
         */
        function getSubrowHtml( table, index ) {
            return '<div id="' + getSubrowId( table, index )
                        + '" class="' + getClass( table, 'subrow' ) + '"'
                        + ' style="display:none"></div>';
        }
        
        /**
         * 获取表格子行的元素id
         *
         * @private
         * @param {number} index 行序号
         * @return {string}
         */
        function getSubrowId( table, index ) {
            return getId( table, 'subrow' ) + index;
        }
        
        /**
         * 获取表格子行入口元素的id
         *
         * @private
         * @param {number} index 行序号
         * @return {string}
         */
        function getSubentryId( table, index ) {
            return getId( table, 'subentry' ) + index;
        }
        

        function entryOverHandler( args, e ){
            entryOver( args.control, args.element );
        }

        /**
         * 处理子行入口元素鼠标移入的行为
         *
         * @private
         * @param {number} index 入口元素的序号
         */
        function entryOver( table, element ) {
            var opened      = /subentry-opened/.test( element.className );
            var classBase   = 'subentry-hover';
                
            if ( opened ) {
                classBase = 'subentry-opened-hover';
            }    
            
            helper.addClass( table, element, classBase );
        }
        
        function entryOutHandler( args, e ){
            entryOut( args.control, args.element );
        }
        /**
         * 处理子行入口元素鼠标移出的行为
         *
         * @private
         * @param {number} index 入口元素的序号
         */
        function entryOut( table, element ) {
            helper.removeClass( table, element, 'subentry-hover' );
            helper.removeClass( table, element, 'subentry-opened-hover' );
        }
        
        /**
         * 触发subrow的打开|关闭
         *
         * @public
         * @param {number} index 入口元素的序号
         */
        function fireSubrow( args, e ) {
            var me              = args.control;
            var el              = args.element;
            var index           = args.commandArgs.index;
            var datasource      = me.datasource;
            var dataLen         = (datasource instanceof Array && datasource.length);
            var dataItem;
            
            if ( !dataLen || index >= dataLen ) {
                return;
            }
            
            if ( !el.getAttribute( 'data-subrowopened' ) ) {
                dataItem = datasource[ index ];
                if ( me.onsubrowopen( index, dataItem ) !== false ) {
                    openSubrow( me, index, el );
                }
            } else {
                closeSubrow( me, index, el );
            }
            
            entryOver( me, el );
        }
        
        /**
         * 关闭子行
         *
         * @private
         * @param {number} index 子行的序号
         */
        function closeSubrow( table, index, element ) {
            var me          = table;  
            var entry       = element;
            
            if ( me.onsubrowclose( index, me.datasource[ index ] ) !== false ) {
                entryOut( me, entry );
                me.subrowIndex = null;
                
                helper.removeClass( me, entry, 'subentry-opened' );
                helper.removeClass( me, getRow( me, index ), 'row-unfolded' );
                
                entry.setAttribute( 'title', me.subEntryOpenTip );
                entry.setAttribute( 'data-subrowopened', '' );
                
                lib.g( getSubrowId( me, index ) ).style.display = 'none';
                return true;
            }
            
            return false;
        }
        
        
        
        /**
         * 打开子行
         *
         * @private
         * @param {number} index 子行的序号
         */
        function openSubrow( table, index, element ) {
            var me           = table;
            var currentIndex = me.subrowIndex;
            var entry        = element;
            var closeSuccess = 1;
            
            if ( lib.hasValue( currentIndex ) ) {
                closeSuccess = closeSubrow( me, currentIndex, lib.g( getSubentryId( me, currentIndex ) ) );
            }
            
            if ( !closeSuccess ) {
                return;
            }

            helper.addClass( me, entry, 'subentry-opened' );
            helper.addClass( me, getRow( me, index ), 'row-unfolded' );

            entry.setAttribute( 'title', me.subEntryCloseTip );
            entry.setAttribute( 'data-subrowopened', '1' );
            
            lib.g(getSubrowId( me, index )).style.display = '';
            
            me.subrowMutex && ( me.subrowIndex = index );
        }
        
        /**
         * 初始化resize的event handler
         * 
         * @private
         */
        function initResizeHandler( table ) {
            var me        = table;
            me.viewWidth  = lib.page.getViewWidth();
            me.viewHeight = lib.page.getViewHeight();
            
            me.resizeHandler = function () {
                var viewWidth  = lib.page.getViewWidth(),
                    viewHeight = lib.page.getViewHeight();
                    
                if ( viewWidth == me.viewWidth
                     && viewHeight == me.viewHeight
                ) {
                    return;
                }
                
                me.viewWidth = viewWidth;
                me.viewHeight = viewHeight;

                handleResize( me );
            };

            // 在dispose的时候会释放的哈
            lib.on( window, 'resize', me.resizeHandler );
        }
        
        /**
         * 浏览器resize的处理
         *
         * @private
         */
        function handleResize( table ) {
            var me      = table;
            var head    = getHead( me );
            var foot    = getFoot( me );
            me.realWidth = getWidth( me );
            var widthStr = me.realWidth + 'px';
            
            // 设置主区域宽度
            me.main.style.width = widthStr;
            getBody( me ).style.width = widthStr;
            head && (head.style.width = widthStr);
            foot && (foot.style.width = widthStr);
            
            // 重新绘制每一列  
            initColsWidth( me );
            resetColumns( me );    
            if ( me.followHead ) {
                var walker  = me.main.parentNode.firstChild;
                var i       = 0;
                while ( walker ) {
                    if ( walker.nodeType == 1
                         && walker.getAttribute( 'followThead' )
                    ) {
                        walker.style.width = me.realWidth - me.followWidthArr[ i++ ] + 'px';
                    }

                    walker = walker.nextSibling;
                }
            }    

            me.topReseter && me.topReseter();
        }
        
        /**
         * 纵向锁定初始化
         *
         * @private
         */
         function initTopResetHandler( table ) {
            if ( !table.followHead ) {
                return;
            }

            var me = table;
            var walker           = me.main.parentNode.firstChild;
            var domHead          = getHead( me );
            var followWidths     = me.followWidthArr;
            var placeHolderId    = getId( me, 'TopPlaceholder' );
            var domPlaceholder   = document.createElement( 'div' );
            var mainOffestLeft   = lib.getOffset( me.main ).left ;
            // 占位元素
            // 否则元素浮动后原位置空了将导致页面高度减少，影响滚动条  
            domPlaceholder.id = placeHolderId;
            domPlaceholder.style.width = '100%';
            domPlaceholder.style.display = 'none';

            lib.insertBefore( domPlaceholder, me.main );
            domPlaceholder = null;
            
            // 写入表头跟随元素的宽度样式
            for ( i = 0, len = me.followDoms.length; i < len; i++ ) {
                me.followDoms[ i ].style.width = me.realWidth - followWidths[ i ] + 'px';
            }
            domHead && ( domHead.style.width = me.realWidth + 'px' );
                    
            me.topReseter = function () {
                var scrollTop   = lib.page.getScrollTop();
                var scrollLeft  = lib.page.getScrollLeft();
                var fhArr       = me.followHeightArr;
                var fhLen       = fhArr.length;
                var posStyle    = '';
                var followDoms  = me.followDoms;
                var len         = followDoms.length;
                var placeHolder = lib.g( placeHolderId );
                var mainHeight       = parseInt( lib.getComputedStyle( me.main , 'height' ) );
                
                function setPos( dom, pos, top , left ) {
                    if ( dom ) {
                        dom.style.top = top + 'px';
                        dom.style.left = left + 'px'; 
                        dom.style.position = pos;
                    }
                }

                // 2x2的判断，真恶心
                if ( lib.ie && lib.ie < 7 ) {
                    if ( scrollTop > me.followTop && scrollTop - me.followTop < mainHeight ) {
                        posStyle = 'absolute';
                        placeHolder.style.height = fhArr[ fhLen - 1 ] + domHead.offsetHeight + 'px';
                        placeHolder.style.display = '';
                        var curLeft = mainOffestLeft - scrollLeft ;
                        for ( var i = 0 ; i < len; i++ ) {
                            setPos( followDoms[ i ], posStyle, fhArr[ i ] + scrollTop, curLeft );
                        }

                        setPos( domHead, posStyle, fhArr[ fhLen - 1 ] + scrollTop, curLeft );
                    } else {
                        placeHolder.style.height  = 0;
                        placeHolder.style.display = 'none';
                        posStyle = '';
                        
                        for ( var i = 0 ; i < len; i++ ) {
                            setPos( followDoms[i], posStyle, 0 , 0 );
                        }

                        setPos( domHead, posStyle, 0 , 0 );
                    }
                } else {
                    if ( scrollTop > me.followTop && scrollTop - me.followTop < mainHeight ) {
                        placeHolder.style.height = fhArr[ fhLen - 1 ] + domHead.offsetHeight + 'px';
                        placeHolder.style.display = '';
                        posStyle = 'fixed';
                        var curLeft = mainOffestLeft - scrollLeft ;
                        for ( var i = 0; i < len; i++ ) {
                            setPos( followDoms[ i ], posStyle, fhArr[ i ] ,curLeft  );
                        }

                        setPos( domHead, posStyle, fhArr[ fhLen - 1 ] , curLeft );
                    } else {
                        placeHolder.style.height  = 0;
                        placeHolder.style.display = 'none';
                        posStyle = '';
                        
                        for ( var i = 0; i < len; i++) {
                            setPos( followDoms[i], posStyle, 0, 0 );
                        }

                        setPos( domHead, posStyle, 0, 0 );
                    }
                }
                
            };

            lib.on( window, 'scroll', me.topReseter );    
        }
        
        /**
         * 重新设置表格每个单元格的宽度
         * 
         * @private
         */
        function resetColumns( table ) {
            var me          = table;
            var datasource  = me.datasource || [];
            var colsWidth   = me.colsWidth;
            var foot        = me.foot;
            var id          = me.id;
            var len         = foot instanceof Array && foot.length;
            var dLen        = datasource.length;
            var tds         = getBody( me ).getElementsByTagName( 'td' );
            var tables      = me.main.getElementsByTagName( 'table' );
            var tdsLen      = tds.length;
            var index       = 0;
            
            // 重新设置表格尾的每列宽度
            if ( len ) {
                var colIndex = 0;
                for ( i = 0; i < len; i++ ) {
                    var item    = foot[ i ];
                    var width   = colsWidth[ colIndex ];
                    var colspan = item.colspan || 1;

                    for ( j = 1; j < colspan; j++ ) {
                        width += colsWidth[ colIndex + j ];
                    }
                    colIndex += colspan;

                    var td = lib.g( getFootCellId( me, i ) );
                    width = Math.max( width + me.rowWidthOffset, 0 );
                    
                    td.style.width      = width + 'px';
                    td.style.display    = width ? '' : 'none';
                }
            }

            // 重新设置表格头的每列宽度
            len = colsWidth.length;
            if ( !me.noHead ) {
                for ( i = 0; i < len; i++ ) {
                    var width = Math.max( colsWidth[ i ] + me.rowWidthOffset, 0 );

                    var td = lib.g( getTitleCellId( me, i ) );
                    td.style.width      = width + 'px';
                    td.style.display    = width ? '' : 'none';
                }
            }

            // 重新设置表格体的每列宽度
            var j = 0;
            for ( var i = 0; i < tdsLen; i++ ) {
                var td = tds[ i ];
                if ( td.getAttribute( 'controlTable' ) == id ) {
                    var width = Math.max( colsWidth[ j % len ] + me.rowWidthOffset, 0 );
                    td.style.width = width + 'px';
                    td.style.display = width ? '' : 'none';
                    j++;
                }
            }
        }
        
        /**
         * 获取第一列的多选框
         * 
         * @private
         */
        function getMultiSelectTpl( table ){
            return{
                width       : 36,
                stable      : true,
                select      : true,
                title       : function ( item, index ) {
                    return lib.format(  '<input type="checkbox" id="${id}" class="${className}" ${dataCommand} />',
                                        {
                                            id : getId( table, 'selectAll' ),
                                            className : getClass( table, 'selectAll' ),
                                            dataCommand : lib.getCommandStr( {
                                                click : 'toggleSelectAll',
                                                args : '__esuiIsControlInner:1'
                                            })
                                        }
                    );
                            
                },
                
                content: function ( item, index ) {
                    return lib.format('<input type="checkbox" id="${id}" class="${className}" ${dataCommand}/>',
                                        {
                                            id : getId( table, 'multiSelect' ) + index,
                                            className : getClass( table, 'multiSelect' ),
                                            dataCommand : lib.getCommandStr( {
                                                click : 'rowCheckboxClick' ,
                                                args : '__esuiIsControlInner:1;index:' + index
                                            })
                                        }
                    );
                }
            }
        }
        
        /**
         * 第一列的单选框
         * 
         * @private
         */
         function getSingleSelectTpl( table ){
            return {
                width   : 30,
                stable  : true,
                title   : '&nbsp;',
                select  : true,
                content : function ( item, index ) {
                    var id = getId( table, 'singleSelect' );
                    return lib.format('<input type="radio" id="${id}" name="${name}" class="${className}" ${dataCommand} />',
                                        {
                                            id : id + index,
                                            name : id ,
                                            className : getClass( table, 'singleSelect' ),
                                            dataCommand : lib.getCommandStr( {
                                                click : 'selectSingleHandler' ,
                                                args : '__esuiIsControlInner:1;index:' + index
                                            }) 
                                        }
                    );
                }
            }
        }
        
        /**
         * 行的checkbox点击处理函数
         * 
         * @private
         */
        function rowCheckboxClick( args, e ) {
            var index = args.commandArgs.index;
            var table = args.control;
            if ( table.selectMode != 'line' ) {
                selectMulti( table, index );
            } else {
                table.preSelectIndex = index;
            }
        }
        
        /**
         * 根据checkbox是否全部选中，更新头部以及body的checkbox状态
         * 
         * @private
         * @param {number} index 需要更新的body中checkbox行，不传则更新全部
         */
        function selectMulti( table, index ) {
            var me = table;
            var selectAll       = getHeadCheckbox( me );
            var inputs          = getBody( me ).getElementsByTagName( 'input' );
            var allChecked      = true;
            var len             = inputs.length;
            var selected        = [];
            var cbIdPrefix      = getId( me, 'multiSelect' );
            var updateAll       = !lib.hasValue( index );
            var selectedClass   = 'row-selected';
            var currentIndex    = 0;

            for ( var i = 0; i < len; i++ ) {
                var input   = inputs[ i ];
                var inputId = input.id;

                if ( input.getAttribute( 'type' ) == 'checkbox' 
                     && inputId 
                     && inputId.indexOf( cbIdPrefix ) >= 0
                ) {
                    // row = me.getRow(currentIndex); // faster
                    if ( updateAll ) {
                        var row = input.parentNode;
                        while ( 1 ) {
                            if ( row.tagName == 'DIV' // faster
                                 && /^ui-table-row/.test( row.className )
                            ) {
                                break;
                            }
                            row = row.parentNode;
                        }
                    }

                    if ( !input.checked ) {
                        allChecked = false;
                        // faster
                        updateAll && helper.removeClass( me, row, selectedClass ); 
                    } else {
                        selected.push( currentIndex );
                        // faster
                        updateAll && helper.addClass( me, row, selectedClass );
                    }
                    currentIndex++;
                }
            }


            me.selectedIndex = selected;

            me.onselectChange( selected );

            if ( !updateAll ) {
                var row = getRow( me, index );
                var input = lib.g( cbIdPrefix + index );
                if ( input.checked ) {
                    helper.addClass( me, row, selectedClass );
                } else {
                    helper.removeClass( me, row, selectedClass );
                }
            }

            selectAll.checked = allChecked;
        }

        /**
         * 全选/不选 所有的checkbox表单
         * 
         * @private
         */
        function toggleSelectAll( args, e ) {
            selectAll( args.control, getHeadCheckbox( args.control ).checked );
        }
        
        /**
         * 更新所有checkbox的选择状态
         * 
         * @private
         * @param {boolean} checked 是否选中
         */
        function selectAll( table, checked ) {
            var me              = table;
            var inputs          = getBody( me ).getElementsByTagName( 'input' );
            var len             = inputs.length;
            var selected        = [];
            var selectedIndex   = [];
            var cbIdPrefix      = getId( me, 'multiSelect' );
            var index           = 0;

            for ( var i = 0 ; i < len; i++ ) {
                var input = inputs[ i ];
                var inputId = input.id;

                if ( input.getAttribute( 'type' ) == 'checkbox' 
                     && inputId 
                     && inputId.indexOf( cbIdPrefix ) >= 0
                ) {
                    inputs[ i ].checked = checked;
                    
                    if ( checked ) {
                        selected.push( index );
                        helper.addClass( me, getRow( me, index ), 'row-selected' );
                    } else {
                        helper.removeClass( me, getRow( me, index ), 'row-selected' );
                    }
                    
                    index ++;
                }
            }

            me.selectedIndex = selected;
            me.onselectChange( selected );
        }
        

        function selectSingleHandler( args, e ){
            selectSingle( args.control, args.commandArgs.index );
        }

        /**
         * 单选选取
         * 
         * @private
         * @param {number} index 选取的序号
         */
        function selectSingle( table, index ) {
            var selectedIndex = table.selectedIndex;

            table.onselectChange( index );

           if ( selectedIndex && selectedIndex.length ) {
                helper.removeClass( table, getRow( table, selectedIndex[0] ), 'row-selected' );
            }

            table.selectedIndex = [ index ];

            helper.addClass( table, getRow( table, index ), 'row-selected' );
        }
        
        /**
         * 重置表头样式
         * 
         * @private
         */
        function resetHeadStyle( table ) {
            var ths = getHead( table ).getElementsByTagName( 'th' );
            var len = ths.length;
                
            while ( len-- ) {
                var th = ths[ len ];
                lib.removeClass( th.firstChild, getClass( table, 'thcell_sort' ) );
            }    
        }

        
        Table.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'Table',

            initStructure : function() {
                var me = this;
                me.realWidth = getWidth( me );
                me.main.style.width = me.realWidth + 'px';   
                me.subrowIndex = null;

                initCols( me );
            },

            /**
             * 渲染控件
             * 
             * @override
             */
            repaint: function (changes) {
                 // 初始化控件主元素上的行为
                var me   = this;
                var main = me.main;
                
                if( changes && changes.length ){
                    for ( var i = 0; i < changes.length; i++ ) {
                        var record = changes[i];
                        var recordName = record.name;
                        if( recordName == 'fields' 
                         || recordName == 'columnResizable'
                            ){
                            me.initCols();
                        }
                        if( recordName == 'datasource' ){
                            me.selectedIndex = [];
                        }
                    }
                }

                if ( !me.realFields ) {
                    return;
                }

                renderHead( me );   // 绘制表格头
                renderBody( me );   // 绘制列表
                renderFoot( me );   // 绘制表格尾       

                // 如果未绘制过，初始化resize处理
                if ( !helper.isRendered(me) ) {
                    initEventHandler( me );
                    caching( me );
                    initResizeHandler( me );
                    initTopResetHandler( me );

                } else {
                    // 重绘时触发onselectChange事件
                    switch ( me.select ) {
                    case 'multi':
                        me.onselectChange( [] );
                        break;
                    }
                }
                
                // 如果表格的绘制导致浏览器出现纵向滚动条
                // 需要重新计算各列宽度
                // 妈的，又多一次reflow
                if ( me.realWidth != getWidth( me ) ) {
                    handleResize( me );
                }

            },


            onselectChange: new Function (),
            oncommand : new Function(),
            onsort: new Function(),
            onsubrowopen: new Function(),
            onsubrowclose: new Function(),
            /**
             * 更新视图
             *
             * @public
             */
            refreshView: function () {
                handleResize( this );
            },

             /**
             * 获取表格子行的元素
             *
             * @public
             * @param {number} index 行序号
             * @return {HTMLElement}
             */
            getSubrow : function( index ) {
                return lib.g( getSubrowId( this, index ) );    
            },

            /**
             * 销毁释放控件
             * 
             * @override
             */
            dispose: function () {
                helper.beforeDispose(this);

                var main = this.main;
                if (main) {
                    var head = lib.g( getId( this, 'head') ),
                        mark = lib.g( getId( this, 'dragMark') );

                    // 释放表头跟随的元素引用
                    this.followDoms = null;

                    // 移除拖拽基准线
                    if ( mark ) {
                        document.body.removeChild( mark );
                    }
                    
                    // remove resize事件listener
                    if ( this.resizeHandler ) {
                        lib.un( window, 'resize', this.resizeHandler );
                        this.resizeHandler = null;
                    }

                    // remove scroll事件listener
                    if ( this.topReseter ) {
                        lib.un( window, 'scroll', this.topReseter );
                        this.topReseter = null;
                    }
                }

                helper.dispose(this);
                helper.afterDispose(this);
            }
        };

        require('./lib').inherits(Table, Control);
        require('./main').register(Table);

        return Table;
    }
);
