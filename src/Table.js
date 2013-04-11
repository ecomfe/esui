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
            _followHeightArr    : [0, 0],
            _followWidthArr     : [] 
        };

        /**
         * 表格控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Table(options) {
            options.extensions = [ new dataCommand() ];
            Control.call( this, lib.extend( {} , DEFAULT_OPTION , options ) );
        }
        
        Table.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'Table',

            /**
             * 获取dom子部件的id
             * 
             * @protected
             * @return {string}
             */
            __getId: function(name){
                return helper.getId( this, name );
            },

            /**
             * 获取dom子部件的css class
             * 
             * @protected
             * @return {string}
             */
            __getClass: function ( name ) {
                return helper.getClasses( this, name ).join(' ');
            },

            /**
             * 初始化表格的字段
             * 
             * @private
             */
            _initFields: function () {
                if ( !this.fields ) {
                    return;
                }
                
                // 避免刷新时重新注入
                var fields  = this.fields,
                    _fields = fields.slice( 0 ),
                    len     = _fields.length;

                while ( len-- ) {
                    if ( !_fields[ len ] ) {
                        _fields.splice( len, 1 );
                    }
                }
                this._fields = _fields;
                if ( !this.select || this.disabled ) {
                    return;
                }
                switch ( this.select.toLowerCase() ) {
                    case 'multi':
                        _fields.unshift( this.FIELD_MULTI_SELECT );
                        break;
                    case 'single':
                        _fields.unshift( this.FIELD_SINGLE_SELECT );
                        break;
                }
            },

            /**
             * 获取列表体容器素
             * 
             * @public
             * @return {HTMLElement}
             */
            getBody: function () {
                return lib.g( this.__getId( 'body' ) );
            },
            
            /**
             * 获取列表头容器元素
             * 
             * @public
             * @return {HTMLElement}
             */
            getHead: function () {
                return lib.g( this.__getId( 'head' ) );
            },

            /**
             * 获取列表尾容器元素
             * 
             * @public
             * @return {HTMLElement}
             */
            getFoot: function () {
                return lib.g( this.__getId( 'foot' ) );
            },
            
            /**
             * 获取表格内容行的dom元素
             * 
             * @private
             * @param {number} index 行号
             * @return {HTMLElement}
             */
            _getRow: function ( index ) {
                return lib.g( this.__getId( 'row' ) + index );
            },
            
            /**
             * 获取checkbox选择列表格头部的checkbox表单
             * 
             * @private
             * @return {HTMLElement}
             */
            _getHeadCheckbox: function () {
                return lib.g( this.__getId( 'selectAll' ) );
            },
            
            /**
             * 获取表格所在区域宽度
             * 
             * @private
             * @return {number}
             */
            _getWidth: function () {  
                // 如果手工设置宽度，不动态计算
                if ( this.width ) {
                    return this.width;
                }  
                
                var me = this;
                var rulerDiv = document.createElement( 'div' );
                var parent = me.main.parentNode;
                
                parent.appendChild( rulerDiv );    
                var width = rulerDiv.offsetWidth;
                parent.removeChild( rulerDiv );
                
                return width;
            },

            /**
             * dom表格起始的html模板
             * 
             * @private
             */
            _tplTablePrefix: '<table cellpadding="0" cellspacing="0" width="${width}" controlTable="${controlTableId}">',
            /**
             * 缓存控件的核心数据
             *
             * @private
             */
            _caching: function () {
                if ( this.followHead ) {
                    this._cachingFollowHead();
                }
            },
            
            /**
             * 缓存表头跟随所用的数据
             *
             * @private
             */
            _cachingFollowHead: function () {
                var me = this;
                var followDoms = me._followDoms;

                if ( !followDoms ) {
                    followDoms = [];
                    me._followDoms = followDoms;

                    var walker = me.main.parentNode.firstChild;
                    var followWidths = me._followWidthArr;
                    var followHeights = me._followHeightArr;

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
                me._followTop = followOffest.top;
                me._followLeft = followOffest.left;
            },


            initCols : function() {
               this._initFields();
               this._initMinColsWidth();
               this._initColsWidth();
            },

            initStructure : function() {
                var me = this ;

                me._width = me._getWidth();
                me.main.style.width = me._width + 'px';   
                me._subrowIndex = null;

                me.initCols();
            },

            _dataCommandTransfer : function( args, e ){
                if( args.commandArgs && args.commandArgs.__esuiIsControlInner ){
                    this[ args.commandName ] && this[ args.commandName ].apply( this, arguments );
                }else{
                    this.oncommand.apply( this, arguments );
                }
            },

            _initEventHandler : function(){
                this.addDataCommand( this.main, 'click' , this._dataCommandTransfer );
                this.addDataCommand( this.main, 'mouseover' , this._dataCommandTransfer );
                this.addDataCommand( this.main, 'mouseout' , this._dataCommandTransfer );

                var head = this.getHead();
                this.addDataCommand( head, 'mousemove' , this._dataCommandTransfer );
                this.addDataCommand( head, 'mousedown' , this._dataCommandTransfer );
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
                            me._selectedIndex = [];
                        }
                    }
                }

                if ( !me._fields ) {
                    return;
                }

                me._renderHead();   // 绘制表格头
                me._renderBody();   // 绘制列表
                me._renderFoot();   // 绘制表格尾       

                // 如果未绘制过，初始化resize处理
                if ( !helper.isRendered(me) ) {
                    me._initEventHandler();
                    me._caching();
                    me._initResizeHandler();
                    me._initTopResetHandler();

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
                if ( me._width != me._getWidth() ) {
                    me._handleResize();
                }

            },

            onselectChange: new Function (),
            oncommand : new Function(),
            /**
             * 初始最小列宽
             *
             * @private
             */
            _initMinColsWidth: function() {
                var me      = this;
                var fields  = me._fields ;
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

                me._minColsWidth = result;
            },
            
            /**
             * 初始化列宽
             * 
             * @private
             */
            _initColsWidth: function () {
                var me          = this;
                var fields      = me._fields;
                var canExpand   = [];
                
                me._colsWidth = [];
                
                // 减去边框的宽度
                var leftWidth = me._width - 1;
                
                var maxCanExpandIdx = len;

                // 读取列宽并保存
                for ( var i = 0, len = fields.length ; i < len; i++ ) {
                    var field = fields[ i ];
                    var width = field.width;
                    
                    width = (width ? parseInt( width, 10 ) : 0);
                    me._colsWidth.push( width );
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
                    me._colsWidth[ index ] += offset;

                    //计算最小宽度
                    var minWidth = me._minColsWidth[ index ];
                    if ( minWidth > me._colsWidth[ index ] ) {
                        leftWidth += me._colsWidth[ index ] - minWidth;
                        me._colsWidth[ index ] = minWidth;
                    }
                }
                
                if ( leftWidth < 0 ) {// 如果空间不够分配，需要重新从富裕的列调配空间
                    var i = 0;
                    var len = fields.length;
                    while ( i < len && leftWidth != 0 ) {
                        var index    = canExpand[ i ];
                        minWidth = me._minColsWidth[ index ];

                        if ( minWidth < me._colsWidth[ index ] ) {
                            offset = me._colsWidth[ canExpand[ i ] ] - minWidth;
                            offset = offset > Math.abs( leftWidth ) ? leftWidth : -offset;
                            leftWidth += Math.abs( offset );
                            me._colsWidth[ index ] += offset;
                        }
                        i++;
                    }
                } else if ( leftWidth > 0 ) {// 如果空间富裕，则分配给第一个可调整的列
                    me._colsWidth[ canExpand[ 0 ] ] += leftWidth;
                }
                
            },
            
            /**
             * 绘制表格尾
             * 
             * @private
             */
            _renderFoot: function () {
                var me      = this;
                var type    = 'foot';
                var id      = me.__getId( type );
                var foot    = lib.g( id );

                if ( !( me.foot instanceof Array ) ) {
                    foot && (foot.style.display = 'none');
                } else {
                    if ( !foot ) {
                        foot = document.createElement( 'div' );
                        foot.id = id;
                        foot.className = me.__getClass( type );
                        foot.setAttribute( 'controlTable', me.id );
                        
                        me.main.appendChild( foot );
                    }    
                    
                    foot.style.display = '';
                    foot.style.width = me._width + 'px';
                    foot.innerHTML = me._getFootHtml();
                }
            },
            
            /**
             * 获取表格尾的html
             * 
             * @private
             * @return {string}
             */
            _getFootHtml: function () {
                var html        = [];
                var footArray   = this.foot;
                var fieldIndex  = 0;
                var colsWidth   = this._colsWidth;
                var thCellClass = this.__getClass( 'fcell' );
                var thTextClass = this.__getClass( 'fcell-text' );
                
                html.push( lib.format( this._tplTablePrefix, { width: '100%', controlTableId : this.id }) );

                for ( var i = 0 , len = footArray.length ; i < len; i++ ) {
                    var footInfo    = footArray[ i ];
                    var colWidth    = colsWidth[ fieldIndex ];
                    var colspan     = footInfo.colspan || 1;
                    var thClass     = [ thCellClass ];
                    var contentHtml = footInfo.content;

                    if ( 'function' == typeof contentHtml ) {
                        contentHtml = contentHtml.call( this );
                    }
                    contentHtml = contentHtml || '&nbsp;';

                    for ( var j = 1; j < colspan; j++ ) {
                        colWidth += colsWidth[ fieldIndex + j ];
                    }
                    
                    fieldIndex += colspan;
                    if ( footInfo.align ) {
                        thClass.push( this.__getClass( 'cell-align-' + footInfo.align ) );
                    }
                    
                    colWidth += this.rowWidthOffset; 
                    (colWidth < 0) && (colWidth = 0);
                    html.push('<th id="' + this._getFootCellId( i ) + '" class="' + thClass.join( ' ' ) + '"',
                                ' style="width:' + colWidth + 'px;',
                                (colWidth ? '' : 'display:none;') + '">',
                                '<div class="' + thTextClass + '">',
                                contentHtml,
                                '</div></th>');
                }

                html.push( '</tr></table>' );
                return html.join( '' );
            },

            /**
             * 绘制表格头
             * 
             * @private
             */
            _renderHead: function () {
                var me          = this;
                var type        = 'head';
                var id          = me.__getId( type );
                var head        = lib.g( id );
                var multiSelect = me.select && me.select.toLowerCase() == 'multi' ;

                if ( me.noHead ) {
                    return;
                }

                if ( !head ) {
                    head = document.createElement( 'div' );
                    head.id = id;
                    head.className = me.__getClass( type );
                    head.setAttribute( 'controlTable', me.id );

                    me.main.appendChild( head );
                }

                var commandAtrs = lib.getCommandAttr(
                    {   mousemove : me.columnResizable ? '_headMoveHandler' : '' ,
                        mousedown : me.columnResizable ? '_dragStartHandler' : '',
                        args :'__esuiIsControlInner:1'
                    },
                    head
                );

                
                head.style.width = me._width + 'px';
                head.innerHTML   = me._getHeadHtml();
            },
            
            /**
             * 获取表格头的html
             * 
             * @private
             * @return {string}
             */
            _getHeadHtml: function () {
                // TODO: 使用format性能很低的哈
                var me          = this;
                var fields      = this._fields;
                var thCellClass = me.__getClass( 'hcell' );
                var thTextClass = me.__getClass( 'hcell-text' );
                var breakClass  = me.__getClass( 'cell-break' );
                var sortClass   = me.__getClass( 'hsort' );
                var selClass    = me.__getClass( 'hcell-sel' );
                var tipClass    = me.__getClass( 'hhelp' );
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
                html.push( lib.format( me._tplTablePrefix, { width : '100%' , controlTableId : me.id} ) );//me._totalWidth - 2
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
                        tempThTextClass += ' ' + me.__getClass('hcell-text-first');
                    }else if( i == len - 1  ){
                        tempThTextClass += ' ' + me.__getClass('hcell-text-last');
                    }

                    // 计算排序图标样式
                    var sortIconHtml = '';
                    var orderClass   = '';
                    if ( sortable ) {
                        thClass.push( me.__getClass( 'hcell-sort' ) );
                        if ( currentSort ) {
                            thClass.push( me.__getClass( 'hcell-' + me.order ) );
                        }             
                        sortIconHtml = lib.format( me._tplSortIcon, { className : sortClass } );
                    }
                    
                    // 计算表格对齐样式
                    if ( field.align ) {
                        thClass.push( me.__getClass( 'cell-align-' + field.align ) );
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
                    
                                                
                    html.push('<th id="' + this._getTitleCellId( i ) + '" index="' + i + '"',
                                ' class="' + thClass.join( ' ' ) + '"',
                                sortable ? sortAction( field, i ) : '',
                                (i >= canDragBegin && i < canDragEnd ? ' dragright="1"' : ''),
                                (i <= canDragEnd && i > canDragBegin ? ' dragleft="1"' : ''),
                                ' style="width:' + (me._colsWidth[ i ] + me.rowWidthOffset) + 'px;',
                                (me._colsWidth[i] ? '' : 'display:none') + '">',
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
                                                mouseover : '_titleOverHandler' ,
                                                mouseout : '_titleOutHandler' ,
                                                click : '_titleClickHandler' ,
                                                args : '__esuiIsControlInner:1;index:' + index 
                                            }),
                                            index : index
                                        }
                    );
                }
            },
            
            _tplSortIcon: '<div class="${className}"></div>',

            // 提示模板，此处还未定实现方式
            _tplTipIcon: '<div class="${className}" {1}></div>', 
            
            /**
             * 获取表格头单元格的id
             * 
             * @private
             * @param {number} index 单元格的序号
             * @return {string}
             */
            _getTitleCellId: function ( index ) {
                return this.__getId( 'titleCell' ) + index;
            },

            /**
             * 获取表格尾单元格的id
             * 
             * @private
             * @param {number} index 单元格的序号
             * @return {string}
             */
            _getFootCellId: function ( index ) {
                return this.__getId( 'footCell' ) + index;
            },
            
            /**
             * 表格头单元格鼠标移入的事件handler
             * 
             * @private
             * @param {HTMLElement} cell 移出的单元格
             */
            _titleOverHandler: function ( args, e ) {
               this._titleOver( args.element );
            },

            _titleOver : function( element ){
                 if ( this._isDraging || this._dragReady ) {
                    return;
                }
                
                this._sortReady = 1;
                helper.addClass( this, element, 'hcell-hover' );
            },
            
            /**
             * 表格头单元格鼠标移出的事件handler
             * 
             * @private
             * @param {HTMLElement} cell 移出的单元格
             */
            _titleOutHandler: function ( args, e ) {
               this._titleOut( args.element );
            },

            _titleOut : function( element ){
                this._sortReady = 0;
                helper.removeClass( this, element, 'hcell-hover' );
            },
            
            onsort: new Function(),

            /**
             * 对行进行排序，不改变datasource，只通过appendChild改变展示的顺序
             */
            _sortRows : function( field, order ){
                var map  = [];
                for ( var i = 0 , l = this.datasource.length ; i < l; i++ ) {
                    map.push({
                        item : this.datasource[i],
                        index : i
                    });
                };

                map.sort( function ( a, b ) {
                    var compareResult = field.comparer( a.item, b.item );
                    return order == 'asc' ? compareResult : 0 - compareResult;
                });

                for ( var i = 0 , l = map.length ; i < l; i++ ) {
                    var index = map[i].index;
                    var row = this._getRow( index );
                    var parentNode = row.parentNode;
                    parentNode.appendChild( row );

                    if( this.subrow ){
                        var subrow = lib.g( this._getSubrowId( index ) );
                        if( subrow ){
                            parentNode.appendChild( subrow );
                        }
                    }
                };

                //由于sort前要renderHead,所以需要设置全选按钮是否选中
                if( this.select == 'multi'
                 && this._selectedIndex  
                 && this._selectedIndex.length == this.datasource.length ){
                    this._getHeadCheckbox().checked = true;
                }
            },

            /**
             * 表格头单元格点击的事件handler
             * 
             * @private
             * @param {HTMLElement} cell 点击的单元格
             */
            _titleClickHandler: function ( args, e ) {
                if ( this._sortReady ) { // 避免拖拽触发排序行为
                    var me      = this,
                        field   = me._fields[ args.commandArgs.index ],
                        orderBy = me.orderBy,
                        order   = me.order;
                    
                    if ( orderBy == field.field ) {
                        order = (!order || order == 'asc') ? 'desc' : 'asc';
                    } else {
                        order = 'desc';
                    }

                    me.order = order;
                    me.orderBy = field.field;

                    if( field.sortable && this.datasource ){
                        me._renderHead();

                        //如果有comparer，则进行dom排序
                        if( field.comparer ){
                            me._sortRows( field, order );
                        }

                        me.onsort( field , order );
                    }
                }
            },
            
            /**
             * 获取表格头鼠标移动的事件handler
             * 
             * @private
             * @return {Function}
             */
            _headMoveHandler: function ( args, e ) {
                var me          = this;
                var dragClass   = 'startdrag';
                var range       = 8; // 可拖拽的单元格边界范围
                    
                if ( me._isDraging ) {
                    return;
                }
            
                var tar     = e.srcElement || e.target ;
                // 寻找th节点。如果查找不到，退出
                tar = me._findDragCell( tar );
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
                    sortable && ( me._titleOut( tar ) ); // 清除可排序列的over样式
                    helper.addClass( me, el, dragClass );
                    me._dragPoint = 'left';
                    me._dragReady = 1;
                } else if (tar.getAttribute( 'dragright' ) 
                           && pos.left + tar.offsetWidth - pageX < range
                ) {
                    sortable && ( me._titleOut( tar ) ); // 清除可排序列的over样式
                    helper.addClass( me, el, dragClass );
                    me._dragPoint = 'right';
                    me._dragReady = 1;
                } else {
                    helper.removeClass( me, el, dragClass );
                    sortable && ( me._titleOver( tar ) ); // 附加可排序列的over样式
                    me._dragPoint = '';
                    me._dragReady = 0;
                }
            },
            
            /**
             * 查询拖拽相关的表格头单元格
             * 
             * @private
             * @param {HTMLElement} target 触发事件的元素
             * @return {HTMLTHElement}
             */
            _findDragCell: function ( target ) {    
                while ( target.nodeType == 1 ) {
                    if ( target.tagName == 'TH' ) {
                        return target;
                    }
                    target = target.parentNode;
                }
                
                return null;
            },
         
            /**
             * 获取表格头鼠标点击拖拽起始的事件handler
             * 
             * @private
             * @return {Function}
             */
            _dragStartHandler: function ( args, e ) {
                var me = this;
                var dragClass = me.__getClass( 'startdrag' );

                var tar = e.target || e.srcElement;
                
                // 寻找th节点，如果查找不到，退出
                tar = me._findDragCell( tar );
                if ( !tar ) {
                    return;
                }
                
                if ( lib.g( me.__getId( 'head' ) ).className.indexOf( dragClass ) < 0 ) {
                    return;
                }            
                            
                // 获取显示区域高度
                me._htmlHeight = document.documentElement.clientHeight;
                
                // 记忆起始拖拽的状态
                me._isDraging = true;
                me._dragIndex = tar.getAttribute( 'index' );
                me._dragStart = e.pageX || e.clientX + lib.page.getScrollLeft();
                
                // 绑定拖拽事件
                helper.addDOMEvent( me, document, 'mousemove' , me._getDragingHandler());
                helper.addDOMEvent( me, document, 'mouseup' , me._getDragEndHandler());
                
                // 显示拖拽基准线
                me._showDragMark( me._dragStart );
                
                // 阻止默认行为
                lib.event.preventDefault( e );
                return false;
            },

            /**
             * 获取拖拽中的事件handler
             * 
             * @private
             * @desc 移动拖拽基准线
             * @return {Function}
             */
            _getDragingHandler: function () {
                var me = this;
                return function ( e ) {
                    e = e || window.event;
                    me._showDragMark( e.pageX || e.clientX + lib.page.getScrollLeft() );
                    lib.event.preventDefault( e );
                    return false;
                };
            },
            
            /**
             * 显示基准线
             * 
             * @private
             */
            _showDragMark: function ( left ) {
                var me      = this;
                var mark    = me._getDragMark();
                
                if ( !me.top ) {
                    me.top = lib.getOffset( me.main ).top;
                }    
                
                if ( !mark ) {
                    mark = me._createDragMark();
                }
                
                mark.style.top = me.top + 'px';
                mark.style.left = left + 'px';
                mark.style.height = me._htmlHeight - me.top + lib.page.getScrollTop() + 'px';
            },
            
            /**
             * 隐藏基准线
             * 
             * @private
             */
            _hideDragMark: function () {
                var mark = this._getDragMark();
                mark.style.left = '-10000px';
                mark.style.top = '-10000px';
            },
            
            /**
             * 创建拖拽基准线
             * 
             * @private
             * @return {HTMLElement}
             */
            _createDragMark: function () {
                var mark        = document.createElement( 'div' );
                mark.id         = this.__getId( 'dragMark' );
                mark.className  = this.__getClass( 'mark ');
                mark.style.top  = '-10000px';
                mark.style.left = '-10000px';
                document.body.appendChild( mark );
                
                return mark;
            },
            
            /**
             * 获取基准线的dom元素
             * 
             * @private
             * @return {HTMLElement}
             */
            _getDragMark: function () {
                return lib.g( this.__getId( 'dragMark' ) );
            },
            
            /**
             * 获取拖拽结束的事件handler
             * 
             * @private
             * @return {Function}
             */
            _getDragEndHandler: function () {
                var me = this;
                return function (e) {
                    e = e || window.event;
                    var index = parseInt( me._dragIndex, 10 );
                    var pageX = e.pageX || e.clientX + lib.page.getScrollLeft();
                    var fields      = me._fields; 
                    var fieldLen    = fields.length;
                    var alterSum    = 0;
                    var colsWidth   = me._colsWidth;
                    var revise      = 0;

                    // 校正拖拽元素
                    // 如果是从左边缘拖动的话，拖拽元素应该上一列
                    if ( me._dragPoint == 'left' ) {
                        index--;
                    }
                    
                    // 校正拖拽列的宽度
                    // 不允许小于最小宽度
                    var minWidth        = me._minColsWidth[ index ];
                    var offsetX         = pageX - me._dragStart;
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
                        minWidth = me._minColsWidth[ alter ];
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
                    me._resetColumns();
                    
                    // 清除拖拽向全局绑定的事件
                    helper.removeDOMEvent( me, document, 'mousemove');
                    helper.removeDOMEvent( me, document, 'mouseup');

                    me._isDraging = false;
                    me._hideDragMark();
                    
                    lib.event.preventDefault( e );
                    return false;
                };
            },
            
            /**
             * 绘制表格主体
             * 
             * @private
             */
            _renderBody: function () {
                var me      = this;
                var type    = 'body';
                var id      = me.__getId( type );
                var tBody   = lib.g( id );

                if ( !tBody ) {
                    tBody = document.createElement( 'div' );
                    tBody.id = id;
                    tBody.className = me.__getClass( type );
                    
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

                tBody.style.width = me._width + 'px';
                tBody.innerHTML   = me._getBodyHtml();

            },
            
            /**
             * 获取表格主体的html
             * 
             * @private
             * @return {string}
             */
            _getBodyHtml: function () {
                var data    = this.datasource || [];
                var dataLen = data.length;
                var html    = [];
                
                if ( !dataLen ) {
                    return this.noDataHtml;
                }

                for ( var i = 0; i < dataLen; i++ ) {
                    var item = data[ i ];
                    html[ i ] = this._getRowHtml( item, i );
                }
                
                return html.join( '' );  
            },
            
            _tplRowPrefix: '<div id="${id}" class="${className}" ${dataCommand} >',
            /**
             * 获取表格体的单元格id
             * 
             * @private
             * @param {number} rowIndex 当前行序号
             * @param {number} fieldIndex 当前字段序号
             * @return {string}
             */
            _getBodyCellId: function ( rowIndex, fieldIndex ) {
                return this.__getId( 'cell' ) + rowIndex + "_" + fieldIndex;
            },
            
            /**
             * 获取表格行的html
             * 
             * @private
             * @param {Object} data 当前行的数据
             * @param {number} index 当前行的序号
             * @return {string}
             */
            _getRowHtml: function ( data, index ) {
                var me = this;
                var html = [];
                var tdCellClass     = me.__getClass( 'cell' );
                var tdBreakClass    = me.__getClass( 'cell-break' );
                var tdTextClass     = me.__getClass( 'cell-text' );
                var fields          = me._fields;
                var fieldLen        = fields.length;
                var subrow = me.subrow && me.subrow != 'false';
                    
                html.push(
                    lib.format( me._tplRowPrefix,
                                {
                                    id : me.__getId( 'row' ) + index,
                                    className : me.__getClass( 'row' ) + ' ' 
                                                + me.__getClass( 'row-' + ((index % 2) ? 'odd' : 'even') ),
                                    dataCommand : lib.getCommandStr( {
                                        mouseover : '_rowOverHandler' ,
                                        mouseout : '_rowOutHandler' ,
                                        click : '_rowClickHandler' ,
                                        args : '__esuiIsControlInner:1;index:' + index 
                                    })
                                }
                    ),
                    lib.format( me._tplTablePrefix, { width : '100%' , controlTableId : me.id } )
                );

                for ( i = 0; i < fieldLen; i++ ) {
                    var tdClass     = [ tdCellClass ];
                    var textClass   = [ tdTextClass ];
                    var field       = fields[ i ];
                    var content     = field.content;
                    var colWidth    = me._colsWidth[ i ];
                    var subentry    = subrow && field.subEntry;
                    var editable    = me.editable && field.editable && field.edittype;
                    

                    if( i == 0 ){
                        textClass.push(me.__getClass('cell-text-first'));
                    }else if( i == fieldLen - 1  ){
                        textClass.push( me.__getClass('cell-text-last'));
                    }

                    // 生成可换行列的样式
                    if ( me.breakLine 
                         || field.breakLine
                    ) {
                        tdClass.push( tdBreakClass );
                    }

                    // 生成选择列的样式
                    if ( field.select ) {
                        textClass.push( me.__getClass( 'cell-sel' ) );
                    }
                    
                    // 计算表格对齐样式
                    if ( field.align ) {
                        tdClass.push( me.__getClass( 'cell-align-' + field.align ) );
                    }
                    
                    // 计算表格排序样式
                    if ( field.field && field.field == me.orderBy ) {
                        tdClass.push( me.__getClass( 'cell-sorted' ) );
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
                            subentryHtml = me._getSubEntryHtml( index );
                        }
                        
                        tdClass.push( me.__getClass( 'subentryfield' ) );
                        contentHtml = '<table width="100%" collpadding="0" collspacing="0">'
                                        + '<tr><td width="' + me.subEntryWidth + '" align="right">' + subentryHtml
                                        + '</td><td>' + contentHtml + '</td></tr></table>';
                    }
                    html.push('<td id="' + me._getBodyCellId( index, i ) + '"',
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
                    html.push( me._getSubrowHtml( index ) );
                }
                
                return html.join( '' );
            },

            /**
             * 表格行鼠标移上的事件handler
             * 
             * @private
             * @param {number} index 表格行序号
             */
            _rowOverHandler: function ( args , el ) {
                if ( this._isDraging ) {
                    return;
                }
                helper.addClass( this, args.element, 'row-hover' );
            },
            
            /**
             * 表格行鼠标移出的事件handler
             * 
             * @private
             * @param {number} index 表格行序号
             */
            _rowOutHandler: function ( args , el ) {
                helper.removeClass( this, args.element, 'row-hover' );
            },
            
            /**
             * 阻止行选，用于点击在行的其他元素，不希望被行选时。
             * 
             * @public
             */
            preventLineSelect: function () {
                this._dontSelectLine = 1;
            },
            
            /**
             * 表格行鼠标点击的事件handler
             * 
             * @private
             * @param {number} index 表格行序号
             */
            _rowClickHandler: function ( args , e ) {

                if ( this.selectMode == 'line' && !this.disabled ) {
                    if ( this._dontSelectLine ) {
                        this._dontSelectLine = false;
                        return;
                    }
                    
                    var index = args.commandArgs.index;
                    var input;
                    
                    switch ( this.select ) {
                        case 'multi':
                            input = lib.g( this.__getId( 'multiSelect' ) + index );
                            // 如果点击的是checkbox，则不做checkbox反向处理
                            if ( !lib.hasValue( this._preSelectIndex ) ) {
                                input.checked = !input.checked;
                            }
                            this._selectMulti( index );
                            this._preSelectIndex = null;
                            break;

                        case 'single':
                            input = lib.g( this.__getId( 'singleSelect' ) + index );
                            input.checked = true;
                            this._selectSingle( index );
                            break;
                    }
                }
            },
            
            /**
             * subrow入口的html模板
             * 
             * @private
             */
            tplSubEntry: '<div class="${className}" id="${id}" title="${title}" ${dataCommand} ></div>',
            
            /**
             * 获取子内容区域入口的html
             *
             * @private
             * @return {string}
             */
            _getSubEntryHtml: function( index ) {
                var me = this;
                return lib.format(
                    me.tplSubEntry,
                    {
                        className : me.__getClass( 'subentry' ),
                        id :  me._getSubentryId( index ),
                        title :  me.subEntryOpenTip,
                        dataCommand : lib.getCommandStr( {
                            mouseover : '_entryOverHandler' ,
                            mouseout : '_entryOutHandler' ,
                            click : 'fireSubrow' ,
                            args : '__esuiIsControlInner:1;index:' + index 
                        })
                    }
                );
            },
            
            /**
             * 获取子内容区域的html
             *
             * @private
             * @return {string}
             */
            _getSubrowHtml: function ( index ) {
                return '<div id="' + this._getSubrowId( index )
                            + '" class="' + this.__getClass( 'subrow' ) + '"'
                            + ' style="display:none"></div>';
            },
            
            /**
             * 获取表格子行的元素
             *
             * @public
             * @param {number} index 行序号
             * @return {HTMLElement}
             */
            getSubrow: function ( index ) {
                return lib.g( this._getSubrowId( index ) );    
            },
            
            /**
             * 获取表格子行的元素id
             *
             * @private
             * @param {number} index 行序号
             * @return {string}
             */
            _getSubrowId: function ( index ) {
                return this.__getId( 'subrow' ) + index;
            },
            
            /**
             * 获取表格子行入口元素的id
             *
             * @private
             * @param {number} index 行序号
             * @return {string}
             */
            _getSubentryId: function ( index ) {
                return this.__getId( 'subentry' ) + index;
            },
            

            _entryOverHandler : function( args, e ){
                this._entryOver( args.element );
            },

            /**
             * 处理子行入口元素鼠标移入的行为
             *
             * @private
             * @param {number} index 入口元素的序号
             */
            _entryOver: function ( element ) {
                var el = element;
                var opened      = /subentry-opened/.test( el.className );
                var classBase   = 'subentry-hover';
                    
                if ( opened ) {
                    classBase = 'subentry-opened-hover';
                }    
                
                helper.addClass( this, el, classBase );
            },
            
            _entryOutHandler: function( args, e ){
                this._entryOut( args.element );
            },
            /**
             * 处理子行入口元素鼠标移出的行为
             *
             * @private
             * @param {number} index 入口元素的序号
             */
            _entryOut: function ( element ) {
                helper.removeClass( this, element, 'subentry-hover' );
                helper.removeClass( this, element, 'subentry-opened-hover' );
            },
            
            /**
             * 触发subrow的打开|关闭
             *
             * @public
             * @param {number} index 入口元素的序号
             */
            fireSubrow: function ( args, e ) {
                var me              = this;
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
                        me.openSubrow( index, el );
                    }
                } else {
                    me._closeSubrow( index, el );
                }
                
                me._entryOver( el );
            },
            
            /**
             * 关闭子行
             *
             * @private
             * @param {number} index 子行的序号
             */
            _closeSubrow: function ( index, element ) {
                var me          = this;  
                var entry       = element;
                
                if ( me.onsubrowclose( index, me.datasource[ index ] ) !== false ) {
                    me._entryOut( entry );
                    me._subrowIndex = null;
                    
                    helper.removeClass( me, entry, 'subentry-opened' );
                    helper.removeClass( me, me._getRow( index ), 'row-unfolded' );
                    
                    entry.setAttribute( 'title', me.subEntryOpenTip );
                    entry.setAttribute( 'data-subrowopened', '' );
                    
                    lib.g( me._getSubrowId( index ) ).style.display = 'none';
                    return true;
                }
                
                return false;
            },
            
            onsubrowopen: new Function(),
            onsubrowclose: new Function(),
            
            /**
             * 打开子行
             *
             * @private
             * @param {number} index 子行的序号
             */
            openSubrow: function ( index, element ) {
                var me           = this;
                var currentIndex = me._subrowIndex;
                var entry        = element;
                var closeSuccess = 1;
                
                if ( lib.hasValue( currentIndex ) ) {
                    closeSuccess = me._closeSubrow( currentIndex, lib.g( me._getSubentryId( currentIndex ) ) );
                }
                
                if ( !closeSuccess ) {
                    return;
                }

                helper.addClass( me, entry, 'subentry-opened' );
                helper.addClass( me, me._getRow( index ), 'row-unfolded' );

                entry.setAttribute( 'title', me.subEntryCloseTip );
                entry.setAttribute( 'data-subrowopened', '1' );
                
                lib.g(me._getSubrowId( index )).style.display = '';
                
                me.subrowMutex && ( me._subrowIndex = index );
            },
            
            /**
             * 初始化resize的event handler
             * 
             * @private
             */
            _initResizeHandler: function () {
                var me        = this;
                me.viewWidth  = lib.page.getViewWidth();
                me.viewHeight = lib.page.getViewHeight();
                
                me._resizeHandler = function () {
                    var viewWidth  = lib.page.getViewWidth(),
                        viewHeight = lib.page.getViewHeight();
                        
                    if ( viewWidth == me.viewWidth
                         && viewHeight == me.viewHeight
                    ) {
                        return;
                    }
                    
                    me.viewWidth = viewWidth;
                    me.viewHeight = viewHeight;

                    me._handleResize();
                    
                };

                // 在dispose的时候会释放的哈
                lib.on( window, 'resize', me._resizeHandler );
            },
            
            /**
             * 浏览器resize的处理
             *
             * @private
             */
            _handleResize: function () {
                var me      = this;
                var head    = me.getHead();
                var foot    = me.getFoot();
                me._width = me._getWidth();
                var widthStr = me._width + 'px';
                
                // 设置主区域宽度
                me.main.style.width = widthStr;
                me.getBody().style.width = widthStr;
                head && (head.style.width = widthStr);
                foot && (foot.style.width = widthStr);
                
                // 重新绘制每一列  
                me._initColsWidth();
                me._resetColumns();    
                if ( me.followHead ) {
                    var walker  = me.main.parentNode.firstChild;
                    var i       = 0;
                    while ( walker ) {
                        if ( walker.nodeType == 1
                             && walker.getAttribute( 'followThead' )
                        ) {
                            walker.style.width = me._width - me._followWidthArr[ i++ ] + 'px';
                        }

                        walker = walker.nextSibling;
                    }
                }    

                me._topReseter && me._topReseter();
            },
            
            /**
             * 纵向锁定初始化
             *
             * @private
             */
            _initTopResetHandler : function() {
                if ( !this.followHead ) {
                    return;
                }

                var me = this;
                var walker           = me.main.parentNode.firstChild;
                var domHead          = me.getHead();
                var followWidths     = me._followWidthArr;
                var placeHolderId    = me.__getId( 'TopPlaceholder' );
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
                for ( i = 0, len = me._followDoms.length; i < len; i++ ) {
                    me._followDoms[ i ].style.width = me._width - followWidths[ i ] + 'px';
                }
                domHead && ( domHead.style.width = me._width + 'px' );
                        
                me._topReseter = function () {
                    var scrollTop   = lib.page.getScrollTop();
                    var scrollLeft  = lib.page.getScrollLeft();
                    var fhArr       = me._followHeightArr;
                    var fhLen       = fhArr.length;
                    var posStyle    = '';
                    var followDoms  = me._followDoms;
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
                        if ( scrollTop > me._followTop && scrollTop - me._followTop < mainHeight ) {
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
                        if ( scrollTop > me._followTop && scrollTop - me._followTop < mainHeight ) {
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

                lib.on( window, 'scroll', me._topReseter );    
            },
            
            /**
             * 重新设置表格每个单元格的宽度
             * 
             * @private
             */
            _resetColumns: function () {
                var me          = this;
                var datasource  = me.datasource || [];
                var colsWidth   = me._colsWidth;
                var foot        = me.foot;
                var id          = me.id;
                var len         = foot instanceof Array && foot.length;
                var dLen        = datasource.length;
                var tds         = me.getBody().getElementsByTagName( 'td' );
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

                        var td = lib.g( me._getFootCellId( i ) );
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

                        var td = lib.g( me._getTitleCellId( i ) );
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
            },
            
            /**
             * 第一列的多选框
             * 
             * @private
             */
            FIELD_MULTI_SELECT: {
                width       : 36,
                stable      : true,
                select      : true,
                title       : function ( item, index ) {
                    return lib.format(  '<input type="checkbox" id="${id}" class="${className}" ${dataCommand} />',
                                        {
                                            id : this.__getId( 'selectAll' ),
                                            className : this.__getClass( 'selectAll' ),
                                            dataCommand : lib.getCommandStr( {
                                                click : '_toggleSelectAll',
                                                args : '__esuiIsControlInner:1'
                                            })
                                        }
                    );
                            
                },
                
                content: function ( item, index ) {
                    return lib.format('<input type="checkbox" id="${id}" class="${className}" ${dataCommand}/>',
                                        {
                                            id : this.__getId( 'multiSelect' ) + index,
                                            className : this.__getClass( 'multiSelect' ),
                                            dataCommand : lib.getCommandStr( {
                                                click : '_rowCheckboxClick' ,
                                                args : '__esuiIsControlInner:1;index:' + index
                                            })
                                        }
                    );
                }
            },
            
            /**
             * 第一列的单选框
             * 
             * @private
             */
            FIELD_SINGLE_SELECT: {
                width   : 30,
                stable  : true,
                title   : '&nbsp;',
                select  : true,
                content : function ( item, index ) {
                    var id = this.__getId( 'singleSelect' );

                    return lib.format('<input type="radio" id="${id}" name="${name}" class="${className}" ${dataCommand} />',
                                        {
                                            id : id + index,
                                            name : id ,
                                            className : this.__getClass( 'singleSelect' ),
                                            dataCommand : lib.getCommandStr( {
                                                click : '_selectSingleHandler' ,
                                                args : '__esuiIsControlInner:1;index:' + index
                                            }) 
                                        }
                    );
                }
            },
            
            /**
             * 行的checkbox点击处理函数
             * 
             * @private
             */
            _rowCheckboxClick: function ( args, e ) {
                var index = args.commandArgs.index;
                if ( this.selectMode != 'line' ) {
                    this._selectMulti( index );
                } else {
                    this._preSelectIndex = index;
                }
            },
            
            /**
             * 根据checkbox是否全部选中，更新头部以及body的checkbox状态
             * 
             * @private
             * @param {number} index 需要更新的body中checkbox行，不传则更新全部
             */
            _selectMulti: function ( index ) {
                var me = this;
                var selectAll       = me._getHeadCheckbox();
                var inputs          = me.getBody().getElementsByTagName( 'input' );
                var allChecked      = true;
                var len             = inputs.length;
                var selected        = [];
                var cbIdPrefix      = me.__getId( 'multiSelect' );
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


                me._selectedIndex = selected;

                this.onselectChange( selected );

                if ( !updateAll ) {
                    var row = me._getRow( index );
                    var input = lib.g( cbIdPrefix + index );
                    if ( input.checked ) {
                        helper.addClass( me, row, selectedClass );
                    } else {
                        helper.removeClass( me, row, selectedClass );
                    }
                }

                selectAll.checked = allChecked;
            },

            /**
             * 全选/不选 所有的checkbox表单
             * 
             * @private
             */
            _toggleSelectAll: function ( args, e ) {
                this._selectAll( this._getHeadCheckbox().checked );
            },
            
            /**
             * 更新所有checkbox的选择状态
             * 
             * @private
             * @param {boolean} checked 是否选中
             */
            _selectAll: function ( checked ) {
                var inputs          = this.getBody().getElementsByTagName( 'input' );
                var len             = inputs.length;
                var selected        = [];
                var selectedIndex   = [];
                var cbIdPrefix      = this.__getId( 'multiSelect' );
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
                            helper.addClass( this, this._getRow( index ), 'row-selected' );
                        } else {
                            helper.removeClass( this, this._getRow( index ), 'row-selected' );
                        }
                        
                        index ++;
                    }
                }

                this._selectedIndex = selected;
                this.onselectChange( selected );
            },
            

            _selectSingleHandler : function( args, e ){
                this._selectSingle( args.commandArgs.index );
            },

            /**
             * 单选选取
             * 
             * @private
             * @param {number} index 选取的序号
             */
            _selectSingle: function ( index ) {
                var selectedIndex = this._selectedIndex;

                this.onselectChange( index );

               if ( selectedIndex && selectedIndex.length ) {
                    helper.removeClass( this, this._getRow( selectedIndex[0] ), 'row-selected' );
                }

                this._selectedIndex = [ index ];

                helper.addClass( this, this._getRow( index ), 'row-selected' );
            },
            
            /**
             * 重置表头样式
             * 
             * @private
             */
            resetHeadStyle: function () {
                var ths = this.getHead().getElementsByTagName( 'th' );
                var len = ths.length;
                    
                while ( len-- ) {
                    var th = ths[ len ];
                    lib.removeClass( th.firstChild, this.__getClass( 'thcell_sort' ) );
                }    
            },
            
            /**
             * 更新视图
             *
             * @public
             */
            refreshView: function () {
                this._handleResize();
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
                    var head = lib.g( this.__getId('head') ),
                        mark = lib.g( this.__getId('dragMark') );

                    // 释放表头跟随的元素引用
                    this._followDoms = null;

                    // 移除拖拽基准线
                    if ( mark ) {
                        document.body.removeChild( mark );
                    }
                    
                    // remove resize事件listener
                    if ( this._resizeHandler ) {
                        lib.un( window, 'resize', this._resizeHandler );
                        this._resizeHandler = null;
                    }

                    // remove scroll事件listener
                    if ( this._topReseter ) {
                        lib.un( window, 'scroll', this._topReseter );
                        this._topReseter = null;
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
