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

$(document).ready( start );

//var net; // declared outside -> global variable in window scope
//var MyAgent.brain;
var loopTimer;

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
  //MyAgent.brain = brainMaker();
  drawAll();
  loopTimer = setInterval(checkSimRunning, 10);
  //setInterval(checkFood,10000);
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
  drawWorld();
}

function checkSimRunning()
{
  if(!tickCompleted){
    console.log('slowdown detected');
  }
  if(simRunning && tickCompleted){
    tickCompleted = false;
    clockTick();
    tickCompleted = true;
  }
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
  
  // Get action from brain
  var action = MyAgent.brain.forward(brainInputs);
  
  // Do brain action
  MyAgent.doAction(action);
  
  // Train brain with reward
  MyAgent.brain.backward(MyAgent.reward);
  
  for(var dAgent of DumbAgents){
    // Do DumbAgent action
    var actionDumb = Math.floor( Math.random()*7);
    dAgent.doAction(actionDumb);
  }
  
  // Update Agent readout
  $('#agentDiv').empty();
   
  var data = [];
  for(var rc of MyAgent.rewardArray){
    data.push([ rc[0], rc[1].toFixed(3) ]);
  }
  data.push([ 'Reward',               MyAgent.reward.toFixed(3)     ]);
  data.push([ '', 'AI Agent', 'DumbAgent1', 'DumbAgent2']);
  data.push([ 'Food',              MyAgent.food.toFixed(3) , DumbAgents[0].food.toFixed(3), DumbAgents[1].food.toFixed(3) ]);
  //data.push([ 'Food DumbAgent1',      DumbAgents[0].food.toFixed(3) ]);
  //data.push([ 'Food DumbAgent2',      DumbAgents[1].food.toFixed(3) ]);
  data.push([ 'Travelled',         MyAgent.travelled, DumbAgents[0].travelled, DumbAgents[1].travelled ]);
  //data.push([ 'Travelled DumbAgent',  DumbAgents[0].travelled       ]);
  //data.push([ 'Travelled DumbAgent2', DumbAgents[1].travelled       ]);
  data.push([ 'Runs',                 runs ]);
  data.push([ 'Food',                 worldMap.foodTotal ]);
  data.push([ 'Sim running',          simRunning ]);
  data.push([ 'Learning',             MyAgent.brain.learning ]);
  data.push([ 'experience replay size', MyAgent.brain.experience.length ]);
  data.push([ 'exploration epsilon',    MyAgent.brain.epsilon.toFixed(3) ]);
  data.push([ 'age',                     MyAgent.brain.age ]);
  data.push([ 'average Q-learning loss', MyAgent.brain.average_loss_window.get_average().toFixed(3) ]);
  data.push([ 'smooth-ish reward',       MyAgent.brain.average_reward_window.get_average().toFixed(3) ]);
  var agentTxt = simpleTable(data);
  $('#agentDiv').append(agentTxt);
  
  drawAll();
  
  //var eltvar = document.getElementById("eltDiv");
  //MyAgent.brain.visSelf(eltvar);
}

function brainMaker()
{
var num_inputs = 26; // 2 eyes, each sees 11 pixels color (wall, food proximity), 4 rotation
var num_actions = 7; // 3 possible actions agent can do
var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment :)
var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

// the value function network computes a value of taking any of the possible actions
// given an input state. Here we specify one explicitly the hard way
// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
// to just insert simple relu hidden layers.
var layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
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
}

function loadnet() {
  var t = document.getElementById('brainText').value;
  var j = JSON.parse(t);
  MyAgent.brain.value_net.fromJSON(j);
  stoplearn(); // also stop learning
}

function startlearn() {
  $('#statusTxt').empty();
  $('#statusTxt').append("Training Active");
  MyAgent.brain.learning = true;
}
function stoplearn() {
  $('#statusTxt').empty();
  $('#statusTxt').append("Training Disabled");
  MyAgent.brain.learning = false;
}
function runsim() {
  simRunning = true;
}
function pausesim() {
  simRunning = false;
}

