var _displayWidth;
var _displayHeight;
var _init_boardLen;
var _init_boardXPos;
var _init_boardYPos;
var _init_stonesLen;
var _init_whitesXPos;
var _init_whitesYPos;
var _init_blacksXPos;
var _init_blacksYPos;

var _input_color = 'blank';
var _back;
var _board;
var _guide;
var _whites;
var _blacks;
var _whiteStack;
var _blackStack;
var _isDrag;
var _debug = false;
window.onload = function() {

    _displayWidth  = innerWidth;
    _displayHeight = innerHeight;
	var renderer = PIXI.autoDetectRenderer(_displayWidth,_displayHeight, { antialias: true, backgroundColor: ColorCode('renderer') });

    document.body.appendChild(renderer.view);
    renderer.view.style.display = "block";
    renderer.view.style.width = _displayWidth + 'px';
    renderer.view.style.marginTop = "0px";
    renderer.view.style.marginLeft = "auto";
    renderer.view.style.marginRight = "auto";
    renderer.view.style.paddingLeft = "0";
    renderer.view.style.paddingRight = "0";

	var stage = new PIXI.Container();
    _back = new Back(0,0,_displayWidth,_displayHeight,stage);
    
    initPostion();
    
    _board = new Board(stage);
    _board.setUp(_init_boardXPos,_init_boardYPos,_init_boardLen,9);
    _board.refreshBoard();

    _guide = new Guide(stage);

    _blacks = new StoneFactory(stage);
    _blacks.setUp(_init_blacksXPos,_init_blacksYPos,_init_stonesLen,_init_stonesLen,'black');
    _blacks.refreshStoneFactory();
   
    _whites = new StoneFactory(stage);
    _whites.setUp(_init_whitesXPos,_init_whitesYPos,_init_stonesLen,_init_stonesLen,'white');
    _whites.refreshStoneFactory();    

    _whiteStack = new StoneStack(stage);
    _whiteStack.setUp(_init_whitesXPos + 200,_init_whitesYPos,_init_stonesLen,_init_stonesLen,'white');
    _whiteStack.refreshStoneStack();

    _blackStack = new StoneStack(stage);
    _blackStack.setUp(_init_blacksXPos + 200,_init_blacksYPos,_init_stonesLen,_init_stonesLen,'black');
    _blackStack.refreshStoneStack();
    
    
	// run the render loop
	animate();
	function animate() {        
	    renderer.render(stage);
	    requestAnimationFrame( animate );
    }
    
};

function initPostion(){

    if(_displayWidth < _displayHeight){
        //縦長
        _init_boardLen   = adjustBoardSize(_displayWidth,_displayHeight); 
        _init_boardXPos  = _displayWidth  / 2 - _init_boardLen / 2;
        _init_boardYPos  = _displayHeight / 2 - _init_boardLen / 2;
        _init_stonesLen  = _init_boardYPos / 2;
        _init_blacksXPos = _displayWidth / 2 - _init_stonesLen / 2;
        _init_blacksYPos = _init_boardYPos / 2 - _init_stonesLen / 2;        
        _init_whitesXPos = _displayWidth / 2 - _init_stonesLen / 2;
        _init_whitesYPos = _init_boardYPos + _init_boardLen + _init_boardYPos / 2 - _init_stonesLen / 2;
    }else{
        //横長
        _init_boardLen   = adjustBoardSize(_displayHeight,_displayWidth);    
        _init_boardXPos  = _displayWidth / 2 - _init_boardLen / 2;
        _init_boardYPos  = _displayHeight / 2 - _init_boardLen / 2;;        
        _init_stonesLen  = _init_boardXPos / 2;
        _init_whitesXPos = _init_boardXPos / 2 - _init_stonesLen / 2;      ;
        _init_whitesYPos = _displayHeight / 2 - _init_stonesLen / 2;        
        _init_blacksXPos  = _init_boardXPos + _init_boardLen + _init_boardXPos / 2 - _init_stonesLen / 2;;
        _init_blacksYPos  = _displayHeight / 2 - _init_stonesLen / 2;;
    }

}

function adjustBoardSize(smaller,larger){
    expansion = smaller * 1.3;
    return expansion - larger < 0 ? smaller : smaller - (expansion - larger);
}

//
// Back
//
function Back() {
    this.initialize.apply(this, arguments);
}
Back.prototype = Object.create(PIXI.Graphics.prototype);
Back.prototype.constructor = Back;
Back.prototype.initialize = function(xpos,ypos,width,height,stage) {

    PIXI.Graphics.call(this);
    stage.addChild(this);

    this.interactive = true;
    this.beginFill(ColorCode('back',0,0));
    this.drawRect(xpos,ypos,width,height);
    this.endFill();  
    
    var cursorUp = function(event){
        _isDrag = false;   
        _input_color = 'blank';    
        this.deleteMove();
        _guide.clear();
    }
    var cursorMove = function(event){
        var pos = event.data.getLocalPosition(this.parent);  
        if(this.containsPoint(pos)){  
            if(_isDrag){  
                _guide.refreshGuide(pos);                            
            }
        }
    }
    this.on('mouseup',cursorUp);
    this.on('touchend',cursorUp);
    this.on('mousemove',cursorMove);
    this.on('touchmove',cursorMove);
    
};

Back.prototype.deleteMove = function(){

    for(var i = 0; i < _board.movingIds.length; ++i){
        _board.cells[_board.movingIds[i]].stone = 'blank';                
    }
    _board.movingIds = [];
}

//
// Board
//
function Board() {
    this.initialize.apply(this, arguments);
}
Board.prototype = Object.create(PIXI.Graphics.prototype);
Board.prototype.constructor = Board;
Board.prototype.initialize = function(stage) {

    PIXI.Graphics.call(this);
    stage.addChild(this);
    
    this.interactive = true;
    this.buttonMode  = true;
    
    var didFirstClick = false;
    
    var cursorDown = function(event){
        _isDrag = true;
        var pos = event.data.getLocalPosition(this.parent);        
        var cellId = this.Pos2CellId(pos);
        if(!didFirstClick){    
            didFirstClick = true;
            setTimeout( function() {
                didFirstClick = false ;
            }, 350 ) ;

            if(this.cells[cellId].stone !== 'blank'){
                //move start
                this.movingIds[0] = cellId;
                this.refreshBoard();
            }

        }else{
            //double click
            didFirstClick = false ;
            if(this.cells[cellId].stone !== 'blank'){

                //複数選択
                this.movingIds[0] = cellId;                
                this.checkSumi = [];  
                this.checkSumi[cellId] = true;
                this.getConnectedMoveIds(cellId);                
                this.refreshBoard();

            }            
        }
        _guide.refreshGuide(pos);       
    }
    var cursorUp = function(event){
        _isDrag = false;
        var pos = event.data.getLocalPosition(this.parent);                
        var cellId = this.Pos2CellId(pos);
        
        if(_input_color !== 'blank' && this.cells[cellId].stone === 'blank'){      
            this.cells[cellId].stone = _input_color;
            _input_color = 'blank';
        }
        if(this.movingIds.length > 0 && this.canMovePut(pos)){
            this.commitMove(pos);            
        }else{
            this.rollBackMove();
        }
        this.refreshBoard();        
        _guide.clear();                     
    }  
    var cursorMove = function(event){
        var pos = event.data.getLocalPosition(this.parent);        
        if(this.containsPoint(pos)){
            _guide.clear();    
            if(_isDrag){  
                _guide.refreshGuide(pos);                            
            }
        }        
    }
            
    this.on('mousedown',cursorDown);
    this.on('touchstart',cursorDown);
    this.on('mouseup',cursorUp);
    this.on('touchend',cursorUp);
    this.on('mousemove',cursorMove);
    this.on('touchmove',cursorMove);
    
};



Board.prototype.setUp = function(xpos,ypos,length,tract){
    
    this.xpos   = xpos; 
    this.ypos   = ypos;
    this.length = length;
    this.tract  = tract;
    this.cell_length      = this.length  / this.tract ;
    this.cell_half_length = this.cell_length / 2;
    this.movingIds = [];
    this.cells = [];
    for(var i = 0; i < this.tract * this.tract; ++i){
        var cell = {stone : 'blank'};                
        this.cells[i] = cell;
    }
    
}
Board.prototype.refreshBoard = function(){

    this.clear();
	this.beginFill(ColorCode('board'));
	this.lineStyle(2, ColorCode('line'), 1);

    this.drawRect(this.xpos,this.ypos,this.length,this.length);
    for(var i = 0; i < this.tract; ++i){
        this.moveTo(this.xpos +  this.cell_half_length + (i * this.cell_length),
                        this.ypos +  this.cell_half_length);
        this.lineTo(this.xpos +  this.cell_half_length + (i * this.cell_length),
                        this.ypos + this.length -  this.cell_half_length);
        this.moveTo(this.xpos +  this.cell_half_length,
                        this.ypos +  this.cell_half_length + (i * this.cell_length));
        this.lineTo(this.xpos + this.length -  this.cell_half_length,
                        this.ypos +  this.cell_half_length + (i * this.cell_length));        
    }    
    this.endFill();
	this.lineStyle(0);
    
    for(var i = 0; i < this.cells.length; ++i){
        
        if(this.cells[i].stone !== 'blank' && this.movingIds.indexOf(i) === -1){
            this.beginFill(ColorCode(this.cells[i].stone));
            var cellX = this.CellId2CellX(i);
            var cellY = this.CellId2CellY(i);                    
            this.drawCircle(this.xpos + cellX * this.cell_length + this.cell_half_length,
                            this.ypos + cellY * this.cell_length + this.cell_half_length,
                            this.cell_half_length);
        	this.endFill();
        }
    }
    
 
}
Board.prototype.canMovePut = function(pos){
    
    var srcRootCellX   = this.CellId2CellX(_board.movingIds[0]);
    var srcRootCellY   = this.CellId2CellY(_board.movingIds[0]);        
    var destRootCellX  = this.PosX2CellX(pos.x);
    var destRootCellY  = this.PosY2CellY(pos.y);
    var amountCellX    = destRootCellX - srcRootCellX;     //移動量
    var amountCellY    = destRootCellY - srcRootCellY;     //移動量

    for(var i = 0; i < this.movingIds.length; ++i){

        var srcCellX   = this.CellId2CellX(this.movingIds[i]);
        var srcCellY   = this.CellId2CellY(this.movingIds[i]);
        srcCellX += amountCellX;
        srcCellY += amountCellY;
        if(srcCellX < 0 || srcCellX >= this.tract) return false;    //範囲外
        if(srcCellY < 0 || srcCellY >= this.tract) return false;    //範囲外
        
        var destCellId = this.CellXY2CellId(srcCellX,srcCellY);
        if(this.cells[destCellId].stone !== 'blank') return false;
    }
    return true;
}

Board.prototype.rollBackMove = function(){

    this.movingIds = [];
    
}
Board.prototype.commitMove = function(pos){
    
    var srcRootCellX   = this.CellId2CellX(_board.movingIds[0]);
    var srcRootCellY   = this.CellId2CellY(_board.movingIds[0]);        
    var destRootCellX  = this.PosX2CellX(pos.x);
    var destRootCellY  = this.PosY2CellY(pos.y);
    var amountCellX    = destRootCellX - srcRootCellX;     //移動量
    var amountCellY    = destRootCellY - srcRootCellY;     //移動量

    for(var i = 0; i < this.movingIds.length; ++i){
        
        var srcCellX   = this.CellId2CellX(this.movingIds[i]);
        var srcCellY   = this.CellId2CellY(this.movingIds[i]);
        srcCellX += amountCellX;
        srcCellY += amountCellY;
        var destCellId = this.CellXY2CellId(srcCellX,srcCellY);
        
        this.cells[destCellId].stone = this.cells[this.movingIds[i]].stone;        
        this.cells[this.movingIds[i]].stone = 'blank';        
        
    }
    
    this.movingIds = [];

}

Board.prototype.PosX2CellX = function(x){
    return Math.floor((x - this.xpos) / this.cell_length);
}

Board.prototype.PosY2CellY = function(y){
    return Math.floor((y - this.ypos) / this.cell_length);
}
Board.prototype.CellXY2CellId = function(cellX,cellY){
    
    return cellX + cellY * this.tract;
}
Board.prototype.CellId2CellX = function(cellId){
    return Math.floor(cellId % this.tract);
}
Board.prototype.CellId2CellY = function(cellId){
    
    return Math.floor(cellId / this.tract);        
}
Board.prototype.Pos2CellId = function(pos){
    return this.CellXY2CellId(this.PosX2CellX(pos.x),this.PosY2CellY(pos.y));
}
Board.prototype.getConnectedMoveIds = function(orgId){
    
    var cellX = this.CellId2CellX(orgId);
    var cellY = this.CellId2CellY(orgId);
    
    //left
    var nextId = this.CellXY2CellId(cellX - 1,cellY);
    if( cellX - 1 >= 0 && this.checkSumi[nextId] === undefined &&
        this.cells[nextId].stone === this.cells[orgId].stone){
        this.movingIds.push(nextId);
        this.checkSumi[nextId] = true;
        this.getConnectedMoveIds(nextId);
    }
    
    //right
    nextId = this.CellXY2CellId(cellX + 1,cellY);
    if( cellX + 1 < this.tract && this.checkSumi[nextId] === undefined &&
        this.cells[nextId].stone === this.cells[orgId].stone){
        this.movingIds.push(nextId);
        this.checkSumi[nextId] = true;
        this.getConnectedMoveIds(nextId);
    }

    //top
    nextId = this.CellXY2CellId(cellX,cellY - 1);
    if( cellY - 1 >= 0 && this.checkSumi[nextId] === undefined &&
        this.cells[nextId].stone === this.cells[orgId].stone){
        this.movingIds.push(nextId);
        this.checkSumi[nextId] = true;
        this.getConnectedMoveIds(nextId);
    }

    //Bottom
    nextId = this.CellXY2CellId(cellX,cellY + 1);
    if( cellY + 1 < this.tract && this.checkSumi[nextId] === undefined &&
        this.cells[nextId].stone === this.cells[orgId].stone){
        this.movingIds.push(nextId);
        this.checkSumi[nextId] = true;
        this.getConnectedMoveIds(nextId);
    }
    
    return;
    
}

//
// StoneFactory
//
function StoneFactory() {
    this.initialize.apply(this, arguments);
}
StoneFactory.prototype = Object.create(PIXI.Graphics.prototype);
StoneFactory.prototype.constructor = StoneFactory;

StoneFactory.prototype.initialize = function(stage) {

    PIXI.Graphics.call(this);
    stage.addChild(this);
    this.interactive = true;
    this.buttonMode = true;

    var cursorDown = function(event){
        _isDrag = true;    
        _input_color = this.color;        
    }

    var cursorUp = function(event){
        _isDrag = false;
        _input_color = 'blank';        
    }
    this.on('mousedown',cursorDown);
    this.on('touchstart',cursorDown);
    this.on('mouseup',cursorUp);    
    this.on('touchend',cursorUp);    
            
}

StoneFactory.prototype.setUp = function(xpos,ypos,xlength,ylength,color){

    this.xpos    = xpos;
    this.ypos    = ypos;
    this.xlength = xlength;
    this.ylength = ylength;
    this.color   = color;
    
}

StoneFactory.prototype.refreshStoneFactory = function(){
    
    this.beginFill(ColorCode(this.color));
    this.drawRoundedRect(this.xpos,this.ypos,this.xlength,this.ylength);
    this.endFill();
     
}

//
// StoneStack
//
function StoneStack() {
    this.initialize.apply(this, arguments);
}
StoneStack.prototype = Object.create(PIXI.Graphics.prototype);
StoneStack.prototype.constructor = StoneStack;
StoneStack.prototype.initialize = function(stage) {

    PIXI.Graphics.call(this);
    stage.addChild(this);
    
    this.interactive = true;
    this.buttonMode = true;
    this.count = 0;
    this.label = new PIXI.Text('test');
    this.label.x =0;
    this.label.y =0;
    stage.addChild(this.label);
    
    var cursorDown = function(event){
        _isDrag = true;  
        if(this.count > 0){
            _input_color = this.color;        
            --this.count;
        }
        this.refreshStoneStack();        
    }
    var cursorUp = function(event){
        _isDrag = false;        
        if(_input_color !== 'blank' && _input_color === this.color){      
            ++this.count;
            _input_color = 'blank';
        }
        if(_board.movingIds.length > 0 &&
           _board.cells[_board.movingIds[0]].stone === this.color){
            this.count += _board.movingIds.length;            
        }
        
        _board.movingIds = [];        
        this.refreshStoneStack();        
        _guide.clear();                     
    }
    this.on('mousedown',cursorDown);
    this.on('touchstart',cursorDown);
    this.on('mouseup',cursorUp);    
    this.on('touchend',cursorUp);    
            
}

StoneStack.prototype.setUp = function(xpos,ypos,xlength,ylength,color){

    this.xpos    = xpos;
    this.ypos    = ypos;
    this.label.x = xpos;
    this.label.y = ypos;
    this.xlength = xlength;
    this.ylength = ylength;
    this.color   = color;
    
}

StoneStack.prototype.refreshStoneStack = function(){
    
    this.beginFill(ColorCode(this.color));
    this.drawRoundedRect(this.xpos,this.ypos,this.xlength,this.ylength);
    this.label.text = this.count;
    this.endFill();
     
}


//
// Guide
//
function Guide() {
    this.initialize.apply(this, arguments);
}
Guide.prototype = Object.create(PIXI.Graphics.prototype);
Guide.prototype.constructor = Guide;

Guide.prototype.initialize = function(stage) {

    PIXI.Graphics.call(this);
    stage.addChild(this);
    
}

Guide.prototype.refreshGuide = function(pos){
    
    this.clear();   
    if(_input_color !== 'blank'){
        this.beginFill(ColorCode(_input_color),0.5);
        this.drawCircle(pos.x,pos.y,_board.cell_half_length);            
        this.endFill();        
    }else if(_board.movingIds.length > 0){       
        var rootCellX  = _board.CellId2CellX(_board.movingIds[0]);
        var rootCellY  = _board.CellId2CellY(_board.movingIds[0]);
        for(var i = 0; i < _board.movingIds.length; ++i){
            var moveCellX  = _board.CellId2CellX(_board.movingIds[i]);
            var moveCellY  = _board.CellId2CellY(_board.movingIds[i]);
            var sabunX = moveCellX - rootCellX;
            var sabunY = moveCellY - rootCellY;
            this.beginFill(ColorCode(_board.cells[_board.movingIds[i]].stone),0.5);
            this.drawCircle(pos.x + sabunX * _board.cell_length,
                            pos.y + sabunY * _board.cell_length,
                            _board.cell_half_length);    
            this.endFill();  
        } 
    }
    
}

function ColorCode(name){
    
if(_debug){
    return 0xFFFFFF;
}
    if(name === 'white'){
        return 0xFFFFFF;
    }else if(name === 'black'){
        return 0x000000;        
    }else if(name === 'renderer'){
        return 0xE4CEC0;
    }else if(name === 'back'){
        return 0xE4CEC0;
    }else if(name === 'board'){
        return 0xCED091;
    }else if(name === 'line'){
        return 0x000000;
    }
    
    return undefined;
}

