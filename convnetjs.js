var trainingRuns = 0;
var testdata = [];
var label = [];
var runs = 0;
var lastError = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
label.push(6);
var net = new convnetjs.Net();

var rotLabels  = ['up','right','down','left'];
var turnLabels = ['cw', 'ccw'];
var mapLabels  = ['empty','wall','food','poison','water'];

var World = function()
{
  this.width = 500;
  this.height = 500;
  this.map = [];
  
  for (var h = 0; h < this.height ; h++){
    var y_row = [];
    for (var w = 0; w < this.width ; w++){
      y_row.push(0);
    }
    this.map.push(y_row);
  }
}

var worldMap = new World();
buildWorld();

function buildWorld()
{
  // Create outer walls
  for (var x = 50; x < 451; x++){
    worldMap.map[x][50]  = 1;
    worldMap.map[x][450] = 1;
  }
  for (var y = 50; y < 451; y++){
    worldMap.map[50][y]  = 1;
    worldMap.map[450][y] = 1;
  }
  // Create food
  for (var i=0; i < 500; i++){
    var x = Math.floor(Math.random()*398)+ 51;
    var y = Math.floor(Math.random()*398)+ 51;
    worldMap.map[x][y] = 2;
    worldMap.map[x+1][y] = 2;
    worldMap.map[x][y+1] = 2;
    worldMap.map[x+1][y+1] = 2;
  }
}

var Mouth = function(x,y)
{
  this.x_offset = x;
  this.y_offset = y;
}

var Sensor = function(x,y,rot,range, sensitivity)
{
  this.x_offset = x;
  this.y_offset = y;
  this.rot = rot;
  this.range = range;
  this.output = 0;
  this.sensitivity = sensitivity;
}
Sensor.prototype = {
  setOutput: function(x,y)
  {
    this.output = 0;
    for(var i = this.range; i > 0 ; i-- ){
      if(this.rot == 0){
          if(y+this.y_offset-i > -1){
            if(worldMap.map[x+this.x_offset][y+this.y_offset-i] == this.sensitivity){
              this.output = ( (this.range-i) + 1 ) / this.range;
            }
          }
      }
      if(this.rot == 2){
          if(y+this.y_offset+i < worldMap.height){
            if(worldMap.map[x+this.x_offset][y+this.y_offset+i] == this.sensitivity){
              this.output = ( (this.range-i) + 1 ) / this.range;
            }
          }
      }
      if(this.rot == 3){
          if(x+this.x_offset-i > -1){
            if(worldMap.map[x+this.x_offset-i][y+this.y_offset] == this.sensitivity){
              this.output = ( (this.range-i) + 1 ) / this.range;
            }
          }
      }
      if(this.rot == 1){
          if(x+this.x_offset+i < worldMap.width){
            if(worldMap.map[x+this.x_offset+i][y+this.y_offset] == this.sensitivity){
              this.output = ( (this.range-i) + 1 ) / this.range;
            }
          }
      }
    }
  }
}

var Agent = function()
{
  this.x = 0;
  this.y = 0;
  this.rot = 0;
  this.lastAction = 0;
  this.reward = 0;
  this.food = 0;
  this.justEaten = 0;
  this.travelled = 0;
  this.moveCost =0.005;
  this.turnCost =0.0;
  this.sensors = [];
  this.mouths = [];
  // Add sensors 
  for(var j = 2; j<3; j++){
    for(var sx = -5; sx< 6; sx++){
      this.sensors.push(new Sensor( sx, -5, 0, 150, j));
      this.sensors.push(new Sensor( sx,  5, 2, 150, j));
    }
    for(var sy = -5; sy< 6; sy++){
      this.sensors.push(new Sensor( -5, sy, 4, 150, j));
      this.sensors.push(new Sensor(  5, sy, 1, 150, j));
    }
  }
  // Add mouths
  for(var sx = -5; sx< 6; sx++){
    this.mouths.push(new Mouth(sx, -5));
    this.mouths.push(new Mouth(sx,  5));
  }
  for(var sy = -5; sy< 6; sy++){
    this.mouths.push(new Mouth(  5, sy));
    this.mouths.push(new Mouth( -5, sy));
  }
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
    this.food -= this.turnCost;
    this.lastAction = 1;
  },
  
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
    this.food -= this.moveCost;
    this.travelled++;
    this.lastAction = 0;
    
    if(this.x<50)   this.x = 50;
    if(this.x>450) this.x = 450;
    if(this.y<50)   this.y = 50;
    if(this.y>450) this.y = 450;
  },
  
  sense: function()
  {
    for(var s of this.sensors){
      s.setOutput(this.x, this.y);
    }
  },
  
  eat: function()
  {
    for(var m of this.mouths){
      if(worldMap.map[this.x+m.x_offset][this.y+m.y_offset] == 2){
        worldMap.map[this.x+m.x_offset][this.y+m.y_offset] = 0;
        this.food += 1;
        this.justEaten += 1;
      }
    }
  },
  
  calcReward: function()
  {
    var foodProximityReward = 0;
    for(var s of this.sensors){
      if(s.sensitivity == 2 && s.rot == this.rot){
        foodProximityReward = Math.max(s.output, foodProximityReward);
      }
    }
    
    var foodReward = Math.max(this.food/20,0);
    var eatenReward = this.justEaten * 5;
    this.justEaten = 0;
    
    var movementReward = this.lastAction === 0 ? 1: 0; 
    
    this.reward = foodProximityReward/2 + foodReward/10 + eatenReward + movementReward/10;
  }
}

var MyAgent = new Agent();
MyAgent.x = 250;
MyAgent.y = 250;

var DumbAgent = new Agent();
DumbAgent.x = 250;
DumbAgent.y = 250;

var routeTimer;

function followRoute(routeList){
  var r = routeList.pop();
  followWP(r);
  if(routeList.length > 0){
    routeTimer = setTimeout(followRoute, 1000, routeList);
  }
}

function followWP(r){
  if(r==0){
    MyAgent.advance(10);
  }
  if(r==1){
    MyAgent.turn(0);
  }
  if(r==2){
    MyAgent.turn(1);
  }
  MyAgent.sense();
  console.log('0:'+MyAgent.sensors[0].output);
  console.log('1:'+MyAgent.sensors[1].output);
  console.log('2:'+MyAgent.sensors[2].output);
  console.log('3:'+MyAgent.sensors[3].output);
  console.log('4:'+MyAgent.sensors[4].output);
  console.log('5:'+MyAgent.sensors[5].output);
  console.log('6:'+MyAgent.sensors[6].output);
  console.log('7:'+MyAgent.sensors[7].output);
  drawWorld();
}

function randomAction()
{
  runs++;
  // Calculate sensor readings
  MyAgent.sense();
  // Calculate rewards
  MyAgent.calcReward();
  // get inputs
  var brainInputs = [];
  for(var s of MyAgent.sensors){
    if(s.rot == MyAgent.rot){
      brainInputs.push(s.output);
    }
    else{
      brainInputs.push(s.output/4);
    }
  }
  brainInputs.push(MyAgent.rot === 0 ? 1:0);
  brainInputs.push(MyAgent.rot === 1 ? 1:0);
  brainInputs.push(MyAgent.rot === 2 ? 1:0);
  brainInputs.push(MyAgent.rot === 3 ? 1:0);
  
  // Get action from brain
  var action = agentbrain.forward(brainInputs);
  
  // Train brain with reward
  agentbrain.backward(MyAgent.reward);
  
  // Do DumbAgent action
  var actionDumb = Math.floor( Math.random()*5);
  if(actionDumb==0){
    DumbAgent.advance(1);
    DumbAgent.eat();
  }
  if(actionDumb==1){
    DumbAgent.turn(0);
  }
  if(actionDumb==2){
    DumbAgent.turn(1);
  }
  if(actionDumb==3){
    DumbAgent.advance(1);
    DumbAgent.eat();
    DumbAgent.turn(0);
  }
  if(actionDumb==4){
    DumbAgent.advance(1);
    DumbAgent.eat();
    DumbAgent.turn(1);
  }
  
  // Do brain action
  //var action = Math.floor( Math.random()*3);
  if(action==0){
    MyAgent.advance(1);
    MyAgent.eat();
  }
  if(action==1){
    MyAgent.turn(0);
  }
  if(action==2){
    MyAgent.turn(1);
  }
  if(action==3){
        MyAgent.advance(1);
    MyAgent.eat();
    MyAgent.turn(0);
  }
  if(action==4){
    MyAgent.advance(1);
    MyAgent.eat();
    MyAgent.turn(1);
  }
  // Update Agent readout
  $('#agentDiv').empty();
  var agentTxt = '';
  /*
  var i = 0;
  for(var s of MyAgent.sensors){
    agentTxt += 'Sensor'+i+':' + s.output + ' : ';
    i++;
  }
  */
  agentTxt += 'Reward:' + MyAgent.reward + '<br>';
  agentTxt += 'Food AI:' + MyAgent.food + '<br>';
  agentTxt += 'Food DumbAgent:' + DumbAgent.food + '<br>';
  agentTxt += 'Travelled AI:' + MyAgent.travelled + '<br>';
  agentTxt += 'Travelled DumbAgent:' + DumbAgent.travelled + '<br>';
  agentTxt += 'Runs:' + runs + '<br>';
  $('#agentDiv').append(agentTxt);
  
  drawWorld();
}

$(document).ready( start );

function drawAll() {
  drawCanvas();
  drawWorld();
}
 
var net; // declared outside -> global variable in window scope
var agentbrain;
function start() {
  /*
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
  */
 
  // example of running something every 1 second
  agentbrain = brainMaker();
  setInterval(drawAll, 100);
  setInterval(randomAction, 10);
}

function brainMaker()
{
var num_inputs = 48; // 11 eyes, each sees 1 number (wall, green proximity), 4 rotation
var num_actions = 5; // 3 possible actions agent can do
var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment :)
var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

// the value function network computes a value of taking any of the possible actions
// given an input state. Here we specify one explicitly the hard way
// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
// to just insert simple relu hidden layers.
var layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
layer_defs.push({type:'fc', num_neurons: 48, activation:'sigmoid'});
layer_defs.push({type:'fc', num_neurons: 48, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 48, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 24, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 12, activation:'relu'});
layer_defs.push({type:'regression', num_neurons:num_actions});

// options for the Temporal Difference learner that trains the above net
// by backpropping the temporal difference learning rule.
var tdtrainer_options = {learning_rate:0.001, momentum:0.0, batch_size:64, l2_decay:0.01};

var opt = {};
opt.temporal_window = temporal_window;
opt.experience_size = 30000;
opt.start_learn_threshold = 1000;
opt.gamma = 0.7;
opt.learning_steps_total = 200000;
opt.learning_steps_burnin = 3000;
opt.epsilon_min = 0.05;
opt.epsilon_test_time = 0.05;
opt.layer_defs = layer_defs;
opt.tdtrainer_options = tdtrainer_options;

return brain = new deepqlearn.Brain(num_inputs, num_actions, opt); // woohoo
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
  for(let l of agentbrain.value_net.layers){
    x =  20;
    y += 15;
    if(l.out_act !=undefined){
      for(let w of l.out_act.w){
        //console.log(w);
        x += 15;
        if (x>600){x = 35;y+=15;};
        ctx.beginPath();
        ctx.arc(x,y,5,0,2*Math.PI);
        var c = parseInt((w+1)/2*255);
        ctx.fillStyle='rgb('+c+','+c+','+c+')';
        ctx.fill();
      }
    }
  }
}

function drawWorld()
{
  var canvas = document.getElementById("worldCanvas");
  var ctx = canvas.getContext("2d");
  // Clear
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw MyAgent
  ctx.beginPath();
  ctx.fillStyle = 'rgb(255,64,64)';
  ctx.fillRect(MyAgent.x-5, MyAgent.y-5, 10, 10);
  
  var p = 10;
  var cx = MyAgent.x;
  var cy = MyAgent.y;
  ctx.beginPath();
  if(MyAgent.rot == 3){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx-p, cy);
  }
  if(MyAgent.rot == 1){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx+p, cy);
  }
  if(MyAgent.rot == 0){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy-p);
  }
  if(MyAgent.rot == 2){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy+p);
  }
  ctx.strokeStyle='rgb(0,0,0)';
  ctx.lineWidth=2;
  ctx.stroke();
    
  // Draw DumbAgent
  ctx.beginPath();
  ctx.fillStyle = 'rgb(64,255,64)';
  ctx.fillRect(DumbAgent.x-5, DumbAgent.y-5, 10, 10);
  
  var p = 10;
  var cx = DumbAgent.x;
  var cy = DumbAgent.y;
  ctx.beginPath();
  if(DumbAgent.rot == 3){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx-p, cy);
  }
  if(DumbAgent.rot == 1){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx+p, cy);
  }
  if(DumbAgent.rot == 0){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy-p);
  }
  if(DumbAgent.rot == 2){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy+p);
  }
  ctx.strokeStyle='rgb(0,0,0)';
  ctx.lineWidth=2;
  ctx.stroke();
  
  // Draw Environment
  for(var wx=0; wx <500; wx++){
    for(var wy=0; wy <500; wy++){
      // Draw Walls
      if(worldMap.map[wx][wy] == 1){
        ctx.fillStyle = 'rgb(255,64,64)';
        ctx.fillRect(wx, wy, 1, 1);
      }
      // Draw food
      if(worldMap.map[wx][wy] == 2){
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillRect(wx, wy, 1, 1);
      }
    }
  }

}