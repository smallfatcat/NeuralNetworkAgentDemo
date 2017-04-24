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
const B_SMART = 0;
const B_DUMB  = 1;

var frameTime = 0;

var numberActions = 6;
var numberActionsLabel = [ 'F', 'CW', 'CCW', 'L', 'R', 'E' ]

var tickCompleted = true;
var trainingRuns = 0;
var testdata = [];
var label = [];
var runs = 0;
var cycleTraining = false;
var autoTraining = false;
var slowDraw = false;
var lastError = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
label.push(6);
//var net = new convnetjs.Net();
var simRunning = false;

var rotLabels  = ['up','right','down','left'];
var turnLabels = ['cw', 'ccw'];
var mapLabels  = ['empty','wall','food','poison','water','vis'];

var worldMap = new World();
buildWorld();

// Create Agents
var agents = [];
agents.push(new Agent(150,250,B_SMART,0));
agents.push(new Agent(350,250,B_SMART,1));
//agents.push(new Agent(250,250,B_DUMB));

var routeTimer;

var loopTimer;

var visualFieldArray = visFieldGen();



$(document).ready( start );

function start() {
  buildActionButtons();
  drawAll();
  loopTimer = setInterval(checkSimRunning, 10);
  
}

function resetWorld()
{
  worldMap = new World();
  buildWorld();
  agents[0].x = 150;
  agents[0].y = 250;
  agents[1].x = 350;
  agents[1].y = 250;
}

function resetAgents(){
  var netData1 = JSON.stringify(agents[0].brain.value_net.toJSON());
  var netData2 = JSON.stringify(agents[1].brain.value_net.toJSON());
  var gen1 = agents[0].brainGen;
  var gen2 = agents[1].brainGen;
  agents = [];
  agents.push(new Agent(150,250,B_SMART,0));
  agents.push(new Agent(350,250,B_SMART,1));
  agents[0].brain.value_net.fromJSON(JSON.parse(netData1));
  agents[1].brain.value_net.fromJSON(JSON.parse(netData2));
  agents[0].brainGen = gen1;
  agents[1].brainGen = gen1;
  stoplearn(); // also stop learning
}

function autoTrain(){
  savenetLS();
  resetWorld();
  resetAgents();
  loadnetLS();
  startlearn();
  runs = 0;
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
  for (var i = 50; i < 451; i++){
    worldMap.map[250][i]  = 1;
  }

  
  // Create food block
  for(var i=0; i < 50; i++){
    var x = Math.floor(Math.random()*180)+ 60;
    var y = Math.floor(Math.random()*380)+ 60;
    for(var x2 = 0;x2<10;x2++){
      for(var y2 = 0;y2<10;y2++){
        if(worldMap.map[x+x2][y+y2] != 2 && worldMap.map[x+x2][y+y2] != 1){
          worldMap.map[x+x2][y+y2] = 2;
          worldMap.foodTotal++;
          worldMap.map[x+x2+200][y+y2] = 2;
          worldMap.foodTotal++;
        }
      }
    }
  }
  
  // Create poison block
  for(var i=0; i < 25; i++){
    var x = Math.floor(Math.random()*180)+ 60;
    var y = Math.floor(Math.random()*380)+ 60;
    for(var x2 = 0;x2<5;x2++){
      for(var y2 = 0;y2<5;y2++){
        if(worldMap.map[x+x2][y+y2] != 2 && worldMap.map[x+x2][y+y2] != 1){
          worldMap.map[x+x2][y+y2] = 8;
          worldMap.foodTotal++;
          worldMap.map[x+x2+200][y+y2] = 8;
          worldMap.foodTotal++;
        }
      }
    }
  }
  /*
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
  */
  /*
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
  */
  
}

function checkFood()
{
  var foodTotal = worldMap.foodTotal;
  if(foodTotal < 1000){
    // Create food block
    for(var i=0; i < 50; i++){
      var x = Math.floor(Math.random()*398)+ 51;
      var y = Math.floor(Math.random()*398)+ 51;
      for(var x2 = 0;x2<10;x2++){
        for(var y2 = 0;y2<10;y2++){
          if(worldMap.map[x+x2][y+y2] != 2 && worldMap.map[x+x2][y+y2] != 1){
            worldMap.map[x+x2][y+y2] = 2;
            worldMap.foodTotal++;
          }
        }
      }
    }
  }
}
  
function checkSimRunning()
{
  var startTime = Date.now();
  if(!tickCompleted){
    console.log('slowdown detected');
  }
  if(simRunning && tickCompleted){
    if(cycleTraining){
      if(runs%100 == 0){
        for(var agent of agents){
          if(MyAgent.brain.learning){
            agent.brain.learning = false;
          }
          else{
            agent.brain.learning = true;
          }
        }
      }
    }
    if(autoTraining){
      if(runs%31000 == 0 && runs != 0){
        autoTrain();
      }
    }
    tickCompleted = false;
    clockTick();
    tickCompleted = true;
  }
  if(!simRunning && tickCompleted){
    //MyAgent.sense();
    //MyAgent.calcReward();
  }
     
  // Draw Everything
  drawAll();
  
  frameTime = Date.now() - startTime;
  
}

function clockTick()
{
  runs++;
  checkFood();
  // Calculate sensor readings
  //MyAgent.sense();
  for(var agent of agents){
    // get inputs
    var brainInputs = [];
    if(agent.brainType == B_SMART){
      for(var pix of agent.sensors[0].outputs[0]){
        brainInputs.push(pix);
      }
      for(var pix of agent.sensors[0].outputs[1]){
        brainInputs.push(pix);
      }
      for(var pix of agent.sensors[0].outputs[2]){
        brainInputs.push(pix);
      }
      brainInputs.push(agent.rot === 0 ? 1:0);
      brainInputs.push(agent.rot === 1 ? 1:0);
      brainInputs.push(agent.rot === 2 ? 1:0);
      brainInputs.push(agent.rot === 3 ? 1:0);
      brainInputs.push(agent.tasteOutput);
      brainInputs.push(agent.tastePoison);
    }
    
    
    // Get action from brain
    var action = agent.brain.forward(brainInputs);
    
    // Do brain action
    agent.doAction(action);
    
    if(agent.brainType == B_SMART){
      // Calculate sensor readings
      agent.sense();
      // Calculate rewards
      agent.calcReward();
      
      // Train brain with reward
      agent.brain.backward(agent.reward);
    }
  }
  
}

// Adapted from deepqlearn demo by @karpathy from 
// http://cs.stanford.edu/people/karpathy/convnetjs/
function brainMaker(brainType, netType)
{
  var num_inputs = 39; // 3 eyes, each sees 11 pixels color (wall, food proximity), 4 rotation, 2 taste
  var num_actions = 6; // 3 possible actions agent can do
  var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment :)
  if(brainType == B_SMART){
    
    var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

    // the value function network computes a value of taking any of the possible actions
    // given an input state. Here we specify one explicitly the hard way
    // but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
    // to just insert simple relu hidden layers.
    var layer_defs = [];
    layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
    if(netType == 0){
      layer_defs.push({type:'fc', num_neurons: 100, activation:'relu'});
      layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
    }   
    if(netType == 1){
      layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
      layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
    }  
    layer_defs.push({type:'regression', num_neurons:num_actions});

    // options for the Temporal Difference learner that trains the above net
    // by backpropping the temporal difference learning rule.
    var tdtrainer_options = {learning_rate:0.001, momentum:0.0, batch_size:64, l2_decay:0.01};

    var opt = {};
    opt.temporal_window = temporal_window;
    opt.experience_size = 30000;
    opt.start_learn_threshold = 1000;
    opt.gamma = 0.7;
    opt.learning_steps_total = 30000;
    opt.learning_steps_burnin = 3000;
    opt.epsilon_min = 0.05;
    opt.epsilon_test_time = 0.05;
    opt.layer_defs = layer_defs;
    opt.tdtrainer_options = tdtrainer_options;
    var brain;
    return brain = new deepqlearn.Brain(num_inputs, num_actions, opt); // woohoo
  }
  if(brainType == B_DUMB){
    return brain = new DumbBrain(num_actions);
  }
}

function savenetLS() {
  var netData1 = JSON.stringify(agents[0].brain.value_net.toJSON());
  var netData2 = JSON.stringify(agents[1].brain.value_net.toJSON());
  var netData1History = JSON.stringify({size: netData1.length, generation: agents[0].brainGen});
  var netData2History = JSON.stringify({size: netData2.length, generation: agents[1].brainGen});
  console.log('Agent 1 saved to LS: '+netData1.length);
  console.log('Agent 2 saved to LS: '+netData2.length);
  localStorage.setItem('netData1',netData1);
  localStorage.setItem('netData1History',netData1History);
  localStorage.setItem('netData2History',netData2History);
  localStorage.setItem('netData2',netData2);
  $('#loadTxt').empty();
  $('#loadTxt').append('Current Net Saved To LS');
}

function loadnetLS() {
  var netData1 = localStorage.getItem('netData1');
  var netData2 = localStorage.getItem('netData2');
  var netData1History = JSON.parse(localStorage.getItem('netData1History'));
  var netData2History = JSON.parse(localStorage.getItem('netData2History'));
  console.log('Agent 1 loaded from LS: '+netData1.length);
  console.log('Agent 2 loaded from LS: '+netData2.length);
  agents[0].brain.value_net.fromJSON(JSON.parse(netData1));
  agents[1].brain.value_net.fromJSON(JSON.parse(netData2));
  agents[0].brainGen = netData1History.generation+1;
  agents[1].brainGen = netData2History.generation+1;
  stoplearn(); // also stop learning
  $('#loadTxt').empty();
  $('#loadTxt').append('Net Loaded From LS');
}

function savenet() {
  var j = agents[0].brain.value_net.toJSON();
  var t = JSON.stringify(j);
  document.getElementById('brainText').value = t;
  $('#loadTxt').empty();
  $('#loadTxt').append('Current Net Saved');
}

function loadnet() {
  var t = document.getElementById('brainText').value;
  var j = JSON.parse(t);
  agents[0].brain.value_net.fromJSON(j);
  stoplearn(); // also stop learning
  $('#loadTxt').empty();
  $('#loadTxt').append('Net Loaded');
}

function startlearn() {
  for(var agent of agents){
    agent.brain.learning = true;
    cycleTraining = false;
  }
  
}
function stoplearn() {
  for(var agent of agents){
    agent.brain.learning = false;
    cycleTraining = false;
  }
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

function autoButton(){
  if(autoTraining){
    autoTraining = false;
  }
  else{
    autoTraining = true;
  }
}

function slowButton(){
  if(slowDraw){
    slowDraw = false;
  }
  else{
    slowDraw = true;
  }
}

function butAction(action)
{
  if(!simRunning){
    // Do action
    agents[0].doAction(action);
    
    // Calculate sensor readings
    agents[0].sense();
    // Calculate rewards
    agents[0].calcReward();
  }
  console.log(action);
}


function buildActionButtons()
{
  var buttonTxt = '';
  for(var i =0;i<numberActions;i++){
    buttonTxt += '<button id="action'+i+'" class="ui-button ui-widget ui-corner-all my-button" onclick="butAction( '+i+' )">'+numberActionsLabel[i]+'</button>';
  }
  $('#controlButtons').empty();
  $('#controlButtons').append(buttonTxt);
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
  visFieldArray.push(buildVisField(11,100,R_UP).filter(isInRange));
  visFieldArray.push(buildVisField(11,100,R_RIGHT).filter(isInRange));
  visFieldArray.push(buildVisField(11,100,R_DOWN).filter(isInRange));
  visFieldArray.push(buildVisField(11,100,R_LEFT).filter(isInRange));
  return visFieldArray;
}

function isInRange(v)
{
  return v[4] <= 100; 
}


