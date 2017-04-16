var trainingRuns = 0;
var testdata = [];
var label = [];
var lastError = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
testdata.push(new convnetjs.Vol([0,0,0,0]));
label.push(0);
testdata.push(new convnetjs.Vol([0,0,0,1]));
label.push(1);
testdata.push(new convnetjs.Vol([0,0,1,0]));
label.push(2);
testdata.push(new convnetjs.Vol([0,0,1,1]));
label.push(3);
testdata.push(new convnetjs.Vol([0,1,0,0]));
label.push(1);
testdata.push(new convnetjs.Vol([0,1,0,1]));
label.push(2);
testdata.push(new convnetjs.Vol([0,1,1,0]));
label.push(3);
testdata.push(new convnetjs.Vol([0,1,1,1]));
label.push(4);
testdata.push(new convnetjs.Vol([1,0,0,0]));
label.push(2);
testdata.push(new convnetjs.Vol([1,0,0,1]));
label.push(3);
testdata.push(new convnetjs.Vol([1,0,1,0]));
label.push(4);
testdata.push(new convnetjs.Vol([1,0,1,1]));
label.push(5);
testdata.push(new convnetjs.Vol([1,1,0,0]));
label.push(3);
testdata.push(new convnetjs.Vol([1,1,0,1]));
label.push(4);
testdata.push(new convnetjs.Vol([1,1,1,0]));
label.push(5);
testdata.push(new convnetjs.Vol([1,1,1,1]));
label.push(6);
var net = new convnetjs.Net();

var rotLabels  = ['up','right','down','left'];
var turnLabels = ['cw', 'ccw'];
var mapLabels  = ['wall','food','poison','water'];

var World = function()
{
  var this.width = 500;
  var this.height = 500;
  var this.map = [];
  var y_row = [];
  for (var h = 0; h < this.height ; h++){
    for (var w = 0; w < this.width ; w++){
      y_row.push(0);
    }
    this.map.push(y_row);
  }
}

var worldMap = new World();

var Sensor = function(x,y,rot,range)
{
  var this.x_offset = x;
  var this.y_offset = y;
  var this.rot = rot;
  var this.range = range;
  var this.output = 0;
}
Sensor.prototype = {
  setOutput: function(x,y)
  {
    if(this.rot == 0){
      for(var i = range; i > 0 ; i-- ){
        if(y+this.y_offset-i > -1){
          if(worldMap[x+this.x_offset][y+this.y_offset-i] > 0){
            this.output = ( (this.range-i) + 1 ) / range;
          }
        }
      }
    }
    if(this.rot == 2){
      for(var i = range; i > 0 ; i-- ){
        if(y+this.y_offset+i <= worldMap.height){
          if(worldMap[x+this.x_offset][y+this.y_offset+i] > 0){
            this.output = ( (this.range-i) + 1 ) / range;
          }
        }
      }
    }
    if(this.rot == 3){
      for(var i = range; i > 0 ; i-- ){
        if(x+this.x_offset-i > -1){
          if(worldMap[x+this.x_offset-i][y+this.y_offset] > 0){
            this.output = ( (this.range-i) + 1 ) / range;
          }
        }
      }
    }
    if(this.rot == 1){
      for(var i = range; i > 0 ; i-- ){
        if(x+this.x_offset+i <= worldMap.width){
          if(worldMap[x+this.x_offset+i][y+this.y_offset] > 0){
            this.output = ( (this.range-i) + 1 ) / range;
          }
        }
      }
    }
  }
}

var Agent = function()
{
  var this.x = 0;
  var this.y = 0;
  var this.rot = 0;
  var this.sensors = [];
  this.sensors.push(new Sensor( 0, -5, 0, 10));
  this.sensors.push(new Sensor( 5,  0, 1, 10));
  this.sensors.push(new Sensor( 0,  5, 2, 10));
  this.sensors.push(new Sensor(-5,  0, 3, 10));
}
Agent.prototype = {
  turn: function(direction)
  {
    if(direction == 0){
      this.rot++;
      if(this.rot>3){
        this.rot=0;
      }
    }
    else{
      this.rot--;
      if(this.rot<0){
        this.rot=3;
      }
    }
  }
  advance: function(speed)
  {
    if(this.rot==0){
      this.y -= speed;
    }
    if(this.rot==2){
      this.y += speed;
    }
    if(this.rot==3){
      this.x -= speed;
    }
    if(this.rot==1){
      this.x += speed;
    }
  }
}

$(document).ready( start );

function periodic() {
  trainingRuns ++;
  
  var trainer = new convnetjs.Trainer(net, {learning_rate:0.01, l2_decay:0.001});
  var i = Math.floor(Math.random() * testdata.length);
  var stats = trainer.train(testdata[i], label[i]);
   
  var probability_volume2 = net.forward(testdata[i]);
  //console.log('probability that x is class 0: ' + probability_volume2.w[0]);
  var d = document.getElementById('egdiv');
  d.innerHTML = 'probability that '+ i +' is class '+label[i]+': ' + probability_volume2.w[label[i]]+' runs: ' + trainingRuns;
  
  lastError[i] =  1-probability_volume2.w[label[i]];
  var d = document.getElementById('errordiv');
  var errortxt = '';
  var j = 0;
  for(e in lastError){
    errortxt += j + ' : ' + lastError[j] + '<br>';
    j++;
  }
  d.innerHTML = errortxt;
  // prints 0.50374
  drawCanvas();
}
 
var net; // declared outside -> global variable in window scope
function start() {
  var layer_defs = [];
  // input layer of size 1x1x2 (all volumes are 3D)
  layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:4});
  layer_defs.push({type:'fc', num_neurons:50, activation:'relu'});
  layer_defs.push({type:'fc', num_neurons:50, activation:'relu'});
  layer_defs.push({type:'fc', num_neurons:3, activation:'relu'});
  layer_defs.push({type:'softmax', num_classes:7});
   
  // create a net out of it
  
  net.makeLayers(layer_defs);
   
  // the network always works on Vol() elements. These are essentially
  // simple wrappers around lists, but also contain gradients and dimensions
  // line below will create a 1x1x2 volume and fill it with 0.5 and -1.3
  
   
  var probability_volume = net.forward(testdata[0]);
  // console.log('probability that x is class 0: ' + probability_volume.w[0]);
  // prints 0.50101
 
  // example of running something every 1 second
  setInterval(periodic, 10);
}

function drawCanvas()
{
  var canvas = document.getElementById("mainCanvas");
  var ctx = canvas.getContext("2d");
  
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  //net.layers[1].out_act.w[0]
  var x = 20;
  var y = 20;
  for(let l of net.layers){
    x =  20;
    y += 15;
    for(let w of l.out_act.w){
      //console.log(w);
      x += 15;
      ctx.beginPath();
      ctx.arc(x,y,5,0,2*Math.PI);
      var c = parseInt((w+1)/2*255);
      ctx.fillStyle='rgb('+c+','+c+','+c+')';
      ctx.fill();
    }
  }
  /*
  for(let link of links){
    ctx.beginPath();
    ctx.moveTo(neurons[link.from].x+10, neurons[link.from].y);
    ctx.lineTo(neurons[link.to].x-10,   neurons[link.to].y);
    var c = parseInt((link.weight+1)/2*255);
    ctx.strokeStyle='rgb('+c+','+c+','+c+')';
    ctx.lineWidth=2;
    ctx.stroke();
  }
  */
}