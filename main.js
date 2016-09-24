var _input_color = 'blank';
var _back;
var _board;
var _guide;
var _whites;
var _blacks;
var _isDrag;
var _debug = false;
var _debugtext;
window.onload = function() {
    
    var displayWidth = window.parent.screen.availWidth;
    var displayHeight = window.parent.screen.availHeight;
	var renderer = PIXI.autoDetectRenderer(displayWidth,displayHeight, { antialias: true, backgroundColor: ColorCode('renderer') });
    document.body.appendChild(renderer.view);
    renderer.view.style.display = "block";
//  renderer.view.style.width = "1900px";
    renderer.view.style.width = displayWidth + 'px';
    renderer.view.style.marginTop = "40px";
    renderer.view.style.marginLeft = "auto";
    renderer.view.style.marginRight = "auto";
    renderer.view.style.paddingLeft = "0";
    renderer.view.style.paddingRight = "0";
    
	var stage = new PIXI.Container();
    
    
    _back = new Back(0,0,displayWidth,displayHeight,stage);

    
    _board = new Board(stage);
    _board.setUp(40,20,585,9);
    _board.refreshBoard();

        _debugtext = new PIXI.Text('');
    _debugtext.x = 100;
    _debugtext.y = 100;
    _debugtext.text = displayWidth + '-' + displayHeight + '-' + window.devicePixelRatio;
    stage.addChild(_debugtext);
    _guide = new Guide(stage);

    _whites = new Stones(stage);
    _whites.setUp(680,50,100,100,'white');
    _whites.refreshStones();
    
    _blacks = new Stones(stage);
    _blacks.setUp(680,170,100,100,'black');
    _blacks.refreshStones();

	// run the render loop
	animate();
	function animate() {        
	    renderer.render(stage);
	    requestAnimationFrame( animate );
    }
    
};

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
	this.lineStyle(1, ColorCode('line'), 1);

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
// Stones
//
function Stones() {
    this.initialize.apply(this, arguments);
}
Stones.prototype = Object.create(PIXI.Graphics.prototype);
Stones.prototype.constructor = Stones;

Stones.prototype.initialize = function(stage) {

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

Stones.prototype.setUp = function(xpos,ypos,xlength,ylength,color){

    this.xpos    = xpos;
    this.ypos    = ypos;
    this.xlength = xlength;
    this.ylength = ylength;
    this.color   = color;
    
}

Stones.prototype.refreshStones = function(){
    
    this.beginFill(ColorCode(this.color));
    this.drawRoundedRect(this.xpos,this.ypos,this.xlength,this.ylength);
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

