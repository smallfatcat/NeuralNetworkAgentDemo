// Title   : Simple AI Agent Demo - using neural nets
// Author  : David Imrie
// Date    : April 2017
// Contact : @smallfatcat
// Repo    : https://github.com/smallfatcat/nettestv1
// version : Alpha 0.1

//
// Neural Nets Powered by : http://cs.stanford.edu/people/karpathy/convnetjs/
//                        : https://github.com/karpathy/convnetjs
//                        : LICENSE - MIT (see LICENSE file)
//

'use strict';
const R_UP    = 0;
const R_RIGHT = 1;
const R_DOWN  = 2;
const R_LEFT  = 3;
const T_CW    = 0;
const T_CCW   = 1;

var tickCompleted = true;
var trainingRuns = 0;
var testdata = [];
var label = [];
var runs = 0;
var cycleTraining = true;
var lastError = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
label.push(6);
//var net = new convnetjs.Net();
var simRunning = false;

var rotLabels  = ['up','right','down','left'];
var turnLabels = ['cw', 'ccw'];
var mapLabels  = ['empty','wall','food','poison','water','vis'];

var worldMap = new World();
buildWorld();

var MyAgent = new Agent();
MyAgent.x = 250;
MyAgent.y = 250;

var DumbAgents = [];
var DumbAgent = new Agent();
DumbAgent.x = 250;
DumbAgent.y = 250;
DumbAgents.push(DumbAgent);

var DumbAgent2 = new Agent();
DumbAgent2.x = 250;
DumbAgent2.y = 250;
DumbAgents.push(DumbAgent2);

var routeTimer;

var loopTimer;

var visualFieldArray = visFieldGen();

$(document).ready( start );

function start() {
  //MyAgent.brain.learning = false;
  //clockTick();
  //MyAgent.brain.learning = true;
  drawAll();
  loopTimer = setInterval(checkSimRunning, 10);
  
}

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
  // Inside walls
  for (var i = 150; i < 351; i++){
    worldMap.map[150][i]  = 1;
    worldMap.map[i][150]  = 1;
    worldMap.map[i][350]  = 1;
  }
  for(var i = 350; i < 450; i++){
    worldMap.map[250][i]  = 1;
  }
  
  
  // Create food
  for (var i=0; i < 500; i++){
    var x = Math.floor(Math.random()*398)+ 51;
    var y = Math.floor(Math.random()*398)+ 51;
    if(worldMap.map[x][y] != 2 && worldMap.map[x][y] != 1){
      worldMap.map[x][y] = 2;
      worldMap.foodTotal++;
    }
    if(worldMap.map[x+1][y]  != 2 && worldMap.map[x+1][y] != 1){
      worldMap.map[x+1][y]  = 2;
      worldMap.foodTotal++;
    }
    if(worldMap.map[x][y+1] != 2 && worldMap.map[x][y+1] != 1){
      worldMap.map[x][y+1] = 2;
      worldMap.foodTotal++;
    }
    if(worldMap.map[x+1][y+1] != 2 && worldMap.map[x+1][y+1] != 1){
      worldMap.map[x+1][y+1] = 2;
      worldMap.foodTotal++;
    }
  }
  
  // Create poison
  for (var i=0; i < 100; i++){
    var x = Math.floor(Math.random()*398)+ 51;
    var y = Math.floor(Math.random()*398)+ 51;
    if(worldMap.map[x][y] != 2 && worldMap.map[x][y] != 1){
      worldMap.map[x][y] = 8;
      worldMap.poison++;
    }
    if(worldMap.map[x+1][y]  != 2 && worldMap.map[x+1][y] != 1){
      worldMap.map[x+1][y]  = 8;
      worldMap.poison++;
    }
    if(worldMap.map[x][y+1] != 2 && worldMap.map[x][y+1] != 1){
      worldMap.map[x][y+1] = 8;
      worldMap.poison++;
    }
    if(worldMap.map[x+1][y+1] != 2 && worldMap.map[x+1][y+1] != 1){
      worldMap.map[x+1][y+1] = 8;
      worldMap.poison++;
    }
  }
  
}

function checkFood()
{
  var foodTotal = worldMap.foodTotal;
  if(foodTotal < 1000){
    // Create food
    for (var i=0; i < 500; i++){
      var x = Math.floor(Math.random()*398)+ 51;
      var y = Math.floor(Math.random()*398)+ 51;
      if(worldMap.map[x][y] != 2 && worldMap.map[x][y] != 1){
        worldMap.map[x][y] = 2;
        worldMap.foodTotal++;
      }
      if(worldMap.map[x+1][y]  != 2 && worldMap.map[x+1][y] != 1){
        worldMap.map[x+1][y]  = 2;
        worldMap.foodTotal++;
      }
      if(worldMap.map[x][y+1] != 2 && worldMap.map[x][y+1] != 1){
        worldMap.map[x][y+1] = 2;
        worldMap.foodTotal++;
      }
      if(worldMap.map[x+1][y+1] != 2 && worldMap.map[x+1][y+1] != 1){
        worldMap.map[x+1][y+1] = 2;
        worldMap.foodTotal++;
      }
    }
  }
}
  
function checkSimRunning()
{
  if(!tickCompleted){
    console.log('slowdown detected');
  }
  if(simRunning && tickCompleted){
    if(cycleTraining){
      if(runs%100 == 0){
        if(MyAgent.brain.learning){
          MyAgent.brain.learning = false;
        }
        else{
          MyAgent.brain.learning = true;
        }
      }
    }
    tickCompleted = false;
    clockTick();
    tickCompleted = true;
  }
  if(!simRunning && tickCompleted){
    MyAgent.sense();
    MyAgent.calcReward();
  }
     
  // Draw Everything
  drawAll();
  
}

function clockTick()
{
  runs++;
  checkFood();
  // Calculate sensor readings
  MyAgent.sense();
  // Calculate rewards
  MyAgent.calcReward();
  // get inputs
  var brainInputs = [];
  for(var pix of MyAgent.sensors[0].outputs){
    brainInputs.push(pix);
  }
  for(var pix of MyAgent.sensors[1].outputs){
    brainInputs.push(pix);
  }
  for(var pix of MyAgent.sensors[2].outputs){
    brainInputs.push(pix);
  }
  /*OLD EYES
  for(var s of MyAgent.sensors){
    if(s.rot == MyAgent.rot){
      brainInputs.push(s.output);
    }
    else{
      brainInputs.push(s.output/4);
    }
  }
  */
  brainInputs.push(MyAgent.rot === 0 ? 1:0);
  brainInputs.push(MyAgent.rot === 1 ? 1:0);
  brainInputs.push(MyAgent.rot === 2 ? 1:0);
  brainInputs.push(MyAgent.rot === 3 ? 1:0);
  brainInputs.push(MyAgent.tasteOutput);
  brainInputs.push(MyAgent.tastePoison);
  
  
  // Get action from brain
  var action = MyAgent.brain.forward(brainInputs);
  
  // Do brain action
  MyAgent.doAction(action);
  
  // Train brain with reward
  MyAgent.brain.backward(MyAgent.reward);
  
  for(var dAgent of DumbAgents){
    // Do DumbAgent action
    var actionDumb = Math.floor( Math.random()*8);
    dAgent.doAction(actionDumb);
  }
}

// Adapted from deepqlearn demo by @karpathy from 
// http://cs.stanford.edu/people/karpathy/convnetjs/
function brainMaker()
{
  var num_inputs = 39; // 3 eyes, each sees 11 pixels color (wall, food proximity), 4 rotation, 2 taste
  var num_actions = 8; // 3 possible actions agent can do
  var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment :)
  var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

  // the value function network computes a value of taking any of the possible actions
  // given an input state. Here we specify one explicitly the hard way
  // but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
  // to just insert simple relu hidden layers.
  var layer_defs = [];
  layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
  layer_defs.push({type:'fc', num_neurons: 100, activation:'relu'});
  layer_defs.push({type:'fc', num_neurons: 20, activation:'relu'});
  layer_defs.push({type:'fc', num_neurons: 20, activation:'relu'});
    
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
  var brain;
  return brain = new deepqlearn.Brain(num_inputs, num_actions, opt); // woohoo
}

function savenet() {
  var j = MyAgent.brain.value_net.toJSON();
  var t = JSON.stringify(j);
  document.getElementById('brainText').value = t;
  $('#loadTxt').empty();
  $('#loadTxt').append('Current Net Saved');
}

function loadnet() {
  var t = document.getElementById('brainText').value;
  var j = JSON.parse(t);
  MyAgent.brain.value_net.fromJSON(j);
  stoplearn(); // also stop learning
  $('#loadTxt').empty();
  $('#loadTxt').append('Net Loaded');
}

function startlearn() {
  MyAgent.brain.learning = true;
  cycleTraining = false;
}
function stoplearn() {
  MyAgent.brain.learning = false;
  cycleTraining = false;
}
function runsim() {
  simRunning = true;
}
function pausesim() {
  simRunning = false;
}
function cycletrain() {
  if(cycleTraining){
    cycleTraining = false;
  }
  else{
    cycleTraining = true;
  }
}

function getLineCoords(x1,y1,x2,y2)
{
  var lineCoords = [];
  if(x1==x2){
    if(y1<y2){
      for(var i = y1; i <= y2; i++){
        lineCoords.push([x1,i]);
      }
    }
    else{
      for(var i = y1; i >= y2; i--){
        lineCoords.push([x1,i]);
      }
    }
  }
  if(y1==y2){
    if(x1<x2){
      for(var i = x1; i <= x2; i++){
        lineCoords.push([i,y1]);
      }
    }
    else{
      for(var i = x1; i >= x2; i--){
        lineCoords.push([i,y1]);
      }
    }
  }
  return lineCoords;
}

function buildVisField(width,range,rot)
{
  var visField = [];
  var dist = 0;
  var currentWidth = width;
  var startx = (width-1)/2;
  var pixelc = [];
  for(var depth=0;depth<=range;depth++){
    var line = [];
    if(rot == R_UP){
      line = getLineCoords(-startx, (depth*-1)-1, startx, (depth*-1)-1);
    }
    if(rot == R_DOWN){
      line = getLineCoords(startx, depth+1, -startx, depth+1);
    }
    if(rot == R_RIGHT){
      line = getLineCoords(depth+1, -startx, depth+1, startx);
    }
    if(rot == R_LEFT){
      line = getLineCoords((depth*-1)-1, startx, (depth*-1)-1, -startx);
    }
    if(depth ==0){
        pixelc = line;
    }
    for(var m = 0; m < line.length; m++){
      line[m].push(depth);
      // Check this works later
      var pixel = Math.round(m/(line.length-1)*(width-1));
      line[m].push(pixel);
      //calc distance
      var distance = Math.sqrt(Math.pow( ( line[m][0] - pixelc[pixel][0] ), 2) + Math.pow(line[m][1] - pixelc[pixel][1], 2));
      line[m].push(distance);
    }
    startx++;
    visField = visField.concat(line);
  }
  return visField;
}

function visFieldGen()
{
  var visFieldArray = [];
  visFieldArray.push(buildVisField(11,100,R_UP));
  visFieldArray.push(buildVisField(11,100,R_RIGHT));
  visFieldArray.push(buildVisField(11,100,R_DOWN));
  visFieldArray.push(buildVisField(11,100,R_LEFT));
  return visFieldArray;
}


