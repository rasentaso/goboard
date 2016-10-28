var _input_color = 'blank';
var _back;
var _board;
var _guide;
var _whiteFactory;
var _blackFactory;
var _whiteStack;
var _blackStack;
var _isDrag;
var _dtxt;
/*
_dtxt = new PIXI.Text('koko' + _input_color);
_dtxt.x = 100;
_dtxt.y = 300;
stage.addChild(_dtxt);
*/
var _debug = false;

window.onload = function() {

    var displayWidth  = innerWidth;
    var displayHeight = innerHeight;
	var renderer = PIXI.autoDetectRenderer(displayWidth,
                                           displayHeight,
                                           { antialias: true, backgroundColor: ColorCode('renderer') });
    document.body.appendChild(renderer.view);
    renderer.view.style.display = "block";
    renderer.view.style.width = displayWidth + 'px';
    renderer.view.style.marginTop = "0px";
    renderer.view.style.marginLeft = "auto";
    renderer.view.style.marginRight = "auto";
    renderer.view.style.paddingLeft = "0";
    renderer.view.style.paddingRight = "0";

    
    var stage = new PIXI.Container();

    
    _back = new Back(0,0,displayWidth,displayHeight,stage);
    var init = calcInitInfo(displayWidth,displayHeight);
    var tract = Number(document.getElementById('tract'));
    _board          = new Board(stage,init.boardXPos,init.boardYPos,init.boardLen,tract);
    _guide          = new Guide(stage);
    _blackFactory   = new StoneFactory(stage,init.blacksXPos,init.blacksYPos,init.radius,'black');
    _whiteFactory   = new StoneFactory(stage,init.whitesXPos,init.whitesYPos,init.radius,'white');
    _blackStack     = new StoneStack(stage,init.blacksStackXPos,init.blacksStackYPos,init.radius,'black');
    _whiteStack     = new StoneStack(stage,init.whitesStackXPos,init.whitesStackYPos,init.radius,'white');
    
	// run the render loop
	animate();
	function animate() {        
	    renderer.render(stage);
	    requestAnimationFrame( animate );
    }
    
};

function calcInitInfo(displayWidth,displayHeight){

    var init = {};
    var margin = 20;                
    if(displayWidth < displayHeight){
        //縦長
        init.boardLen   = adjustBoardSize(displayWidth,displayHeight); 
        init.boardXPos  = displayWidth  / 2 - init.boardLen / 2;
        init.boardYPos  = displayHeight / 2 - init.boardLen / 2;
        init.radius     = init.boardYPos / 3;
        init.blacksXPos = displayWidth - margin - init.radius;
        init.blacksYPos = init.boardYPos + init.boardLen + init.boardYPos / 2;
        init.blacksStackXPos = init.blacksXPos - margin - init.radius * 2;
        init.blacksStackYPos = init.boardYPos + init.boardLen + init.boardYPos / 2;        
        init.whitesXPos = margin + init.radius;
        init.whitesYPos = init.boardYPos / 2;      
        init.whitesStackXPos = init.whitesXPos + margin + init.radius * 2;
        init.whitesStackYPos = init.boardYPos / 2;      
        
    }else{
        //横長
        init.boardLen        = adjustBoardSize(displayHeight,displayWidth);    
        init.boardXPos       = displayWidth    / 2 - init.boardLen / 2;
        init.boardYPos       = displayHeight   / 2 - init.boardLen / 2;        
        init.radius          = init.boardXPos  / 3;
        init.blacksXPos      = init.boardXPos  + init.boardLen + init.boardXPos / 2;
        init.blacksYPos      = init.boardYPos  + margin + init.radius;
        init.blacksStackXPos = init.boardXPos  + init.boardLen + init.boardXPos / 2;
        init.blacksStackYPos = init.blacksYPos + margin + init.radius * 2;    
        init.whitesXPos      = init.boardXPos  / 2;
        init.whitesYPos      = init.boardYPos  + init.boardLen - margin - init.radius;        
        init.whitesStackXPos = init.boardXPos  / 2;
        init.whitesStackYPos = init.whitesYPos - margin - init.radius * 2;        
    }
    
    return init;
}

function adjustBoardSize(smaller,larger){
    expansion = smaller * 1.3;
    return expansion - larger < 0 ? smaller : (smaller - (expansion - larger));
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

    var cursorDown = function(event){
        _isDrag = true;            
    }
    
    var cursorUp = function(event){
        _board.diffX = 0;
        _board.diffY = 0;
        _isDrag = false;   
        _input_color = 'blank';    
        this.deleteMove();
        _guide.clear();
    }
    var cursorMove = function(event){
        var pos = event.data.getLocalPosition(this.parent);  
        if(this.containsPoint(pos)){  
            if(_isDrag){
                _guide.refresh(pos.x - _board.diffX, pos.y - _board.diffY);                                                           
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
Board.prototype.initialize = function(stage,xpos,ypos,length,tract) {

    PIXI.Graphics.call(this);
    stage.addChild(this);
    
    this.interactive = true;
    this.buttonMode  = true;
    this.diffX = 0;
    this.diffY = 0;

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
    
    var timer;
    var cursorDown = function(event){
        
        _isDrag = true;    
        var interval = 500;
        var pos = event.data.getLocalPosition(this.parent);        
        var cellId = this.Pos2CellId(pos);
        
        this.diffX = this.PosDiffCellPosX(pos);
        this.diffY = this.PosDiffCellPosY(pos);
        timer = setTimeout( function() {
            //長押し
            if(this.cells[cellId].stone !== 'blank'){
                //複数選択
                this.movingIds[0] = cellId;                
                this.checkSumi = [];  
                this.checkSumi[cellId] = true;
                this.getConnectedMoveIds(cellId);                
                this.refresh();
            } 
            _guide.refresh(pos.x - this.diffX, pos.y - this.diffY);                            
        }.bind(this), interval ) ;

        if(this.cells[cellId].stone !== 'blank'){
            //move start
            this.movingIds[0] = cellId;
            this.refresh();
        }
        _guide.refresh(pos.x - this.diffX, pos.y - this.diffY);                            
        
    }
    var cursorUp = function(event){
        clearTimeout(timer);        
        _isDrag = false;
        var pos = event.data.getLocalPosition(this.parent);                
        var cellId = this.Pos2CellId(pos);
        
        if(_input_color !== 'blank' && this.cells[cellId].stone === 'blank'){      
            this.cells[cellId].stone = _input_color;
        }
        _input_color = 'blank';
        
        if(this.movingIds.length > 0 && this.canMovePut(pos)){
            this.commitMove(pos);            
        }else{
            this.rollBackMove();
        }
        this.refresh();        
        _guide.clear();
        this.diffX = 0;
        this.diffY = 0;
        
    }  
    var cursorMove = function(event){        
        clearTimeout(timer);
        var pos = event.data.getLocalPosition(this.parent);        
        if(this.containsPoint(pos)){
            _guide.clear();    
            if(_isDrag){  
                _guide.refresh(pos.x - this.diffX, pos.y - this.diffY);                            
            }
        }        
    }
            
    this.on('mousedown',cursorDown);
    this.on('touchstart',cursorDown);
    this.on('mouseup',cursorUp);
    this.on('touchend',cursorUp);
    this.on('mousemove',cursorMove);
    this.on('touchmove',cursorMove);
    
    this.refresh();
    
};

Board.prototype.tractChange = function(tract){
    
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

Board.prototype.refresh = function(){

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
        if(this.movingIds.indexOf(destCellId) !== -1) continue ;    //移動先が移動中 OK 
        if(this.cells[destCellId].stone !== 'blank') return false;  //移動先が既存   NG
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

    var destinationIds = [];
    for(var i = 0; i < this.movingIds.length; ++i){
        
        var srcCellX   = this.CellId2CellX(this.movingIds[i]);
        var srcCellY   = this.CellId2CellY(this.movingIds[i]);
        srcCellX += amountCellX;
        srcCellY += amountCellY;
        var destCellId = this.CellXY2CellId(srcCellX,srcCellY);        
        this.cells[destCellId].stone = this.cells[this.movingIds[i]].stone;       
        destinationIds.push(destCellId);
    }
    for(var i = 0; i < this.movingIds.length; ++i){
        if(destinationIds.indexOf(this.movingIds[i]) === -1){
            this.cells[this.movingIds[i]].stone = 'blank';                    
        }
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
Board.prototype.PosDiffCellPosX = function(pos){
    var cellX = this.PosX2CellX(pos.x);
    return pos.x - (this.xpos + cellX * this.cell_length + this.cell_half_length);
}
Board.prototype.PosDiffCellPosY = function(pos){
    var cellY = this.PosY2CellY(pos.y);
    return pos.y - (this.ypos + cellY * this.cell_length + this.cell_half_length);
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

StoneFactory.prototype.initialize = function(stage,xpos,ypos,radius,color) {

    PIXI.Graphics.call(this);
    stage.addChild(this);
    this.interactive = true;
    this.buttonMode = true;
    this.xpos    = xpos;
    this.ypos    = ypos;
    this.radius  = radius;
    this.color   = color;

    var cursorDown = function(event){
        _isDrag = true;    
        _input_color = this.color;        
    }

    var cursorUp = function(event){
        _isDrag = false;
    }
    this.on('mousedown',cursorDown);
    this.on('touchstart',cursorDown);
    this.on('mouseup',cursorUp);    
    this.on('touchend',cursorUp);    
    
    this.refresh();
            
}

StoneFactory.prototype.refresh = function(){
    
    this.beginFill(ColorCode(this.color));
    this.drawCircle(this.xpos, this.ypos, this.radius);
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
StoneStack.prototype.initialize = function(stage,x,y,radius,color) {

    PIXI.Graphics.call(this);
    stage.addChild(this);

    this.label = new PIXI.Text();
    this.addChild(this.label);
    
    this.interactive = true;
    this.buttonMode = true;
    
    this.x       = x;
    this.y       = y;
    this.radius  = radius;
    this.color   = color;
    if(color === 'white')this.reverse_color = 'black';
    else if(color === 'black')this.reverse_color = 'white';

    this.label.style = {
        fontFamily : 'Arial',
        fontSize : radius + 'px',        
        fontStyle : 'normal',
        fontWeight : 'bold',
        fill : ColorCode(this.reverse_color),   
    };    

    this.count = 0;    
    var cursorDown = function(event){
        _isDrag = true;  
        if(this.count > 0 && _input_color === 'blank'){
            _input_color = this.reverse_color;        
            --this.count;
        }
        this.refresh();        
    }
    var cursorUp = function(event){
        _isDrag = false;        
        if(_input_color !== 'blank' && _input_color === this.reverse_color){      
            ++this.count;
            _input_color = 'blank';
        }
        if(_board.movingIds.length > 0 &&
           _board.cells[_board.movingIds[0]].stone === this.reverse_color){
            for(var i = 0; i < _board.movingIds.length; ++i){
                _board.cells[_board.movingIds[i]].stone = 'blank';        
            }            
            this.count += _board.movingIds.length;                        
        }
        _board.movingIds = [];
        _board.refresh();
        this.refresh();        
        _guide.clear();                     
    }
    this.on('mousedown',cursorDown);
    this.on('touchstart',cursorDown);
    this.on('mouseup',cursorUp);    
    this.on('touchend',cursorUp);    
    
    this.refresh();
            
}

StoneStack.prototype.refresh = function(){
    
    this.beginFill(ColorCode(this.color),0.0);
    this.lineStyle(10, ColorCode(this.color), 1);    
    this.drawCircle(0, 0, this.radius);    
    this.label.text = String(this.count);
    this.label.x = -(this.label.width  / 2);
    this.label.y = -(this.label.height / 2);
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

Guide.prototype.refresh = function(x,y){
    
    this.clear();   
    if(_input_color !== 'blank'){
        
        this.beginFill(ColorCode(_input_color),0.5);
        this.drawCircle(x,y,_board.cell_half_length);            
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
            this.drawCircle(x + sabunX * _board.cell_length,
                            y + sabunY * _board.cell_length,
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
