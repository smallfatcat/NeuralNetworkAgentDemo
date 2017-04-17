const R_UP    = 0;
const R_RIGHT = 1;
const R_DOWN  = 2;
const R_LEFT  = 3;
const T_CW    = 0;
const T_CCW   = 1;

var trainingRuns = 0;
var testdata = [];
var label = [];
var runs = 0;
var lastError = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
label.push(6);
var net = new convnetjs.Net();
var simRunning = false;

var rotLabels  = ['up','right','down','left'];
var turnLabels = ['cw', 'ccw'];
var mapLabels  = ['empty','wall','food','poison','water'];

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
  drawAll();
  setInterval(checkSimRunning, 10);
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
  // Create food
  for (var i=0; i < 500; i++){
    var x = Math.floor(Math.random()*398)+ 51;
    var y = Math.floor(Math.random()*398)+ 51;
    if(worldMap.map[x][y] != 2){
      worldMap.map[x][y] = 2;
      worldMap.foodTotal++;
    }
    if(worldMap.map[x+1][y]  != 2){
      worldMap.map[x+1][y]  = 2;
      worldMap.foodTotal++;
    }
    if(worldMap.map[x][y+1] != 2){
      worldMap.map[x][y+1] = 2;
      worldMap.foodTotal++;
    }
    if(worldMap.map[x+1][y+1] != 2){
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
      if(worldMap.map[x][y] != 2){
        worldMap.map[x][y] = 2;
        worldMap.foodTotal++;
      }
      if(worldMap.map[x+1][y]  != 2){
        worldMap.map[x+1][y]  = 2;
        worldMap.foodTotal++;
      }
      if(worldMap.map[x][y+1] != 2){
        worldMap.map[x][y+1] = 2;
        worldMap.foodTotal++;
      }
      if(worldMap.map[x+1][y+1] != 2){
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

function checkSimRunning()
{
  if(simRunning){
    clockTick();
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
  
  // Do brain action
  MyAgent.doAction(action);
  
  // Train brain with reward
  agentbrain.backward(MyAgent.reward);
  
  for(var dAgent of DumbAgents){
    // Do DumbAgent action
    var actionDumb = Math.floor( Math.random()*7);
    dAgent.doAction(actionDumb);
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
  for(var rc of MyAgent.rewardArray){
    agentTxt += rc[0]+':' + rc[1].toFixed(3) + '<br>';
  }
  agentTxt += 'Reward:' + MyAgent.reward.toFixed(3) + '<br>';
  agentTxt += 'Food AI:' + MyAgent.food.toFixed(3) + '<br>';
  agentTxt += 'Food DumbAgent1:' + DumbAgents[0].food.toFixed(3) + '<br>';
  agentTxt += 'Food DumbAgent2:' + DumbAgents[1].food.toFixed(3) + '<br>';
  agentTxt += 'Travelled AI:' + MyAgent.travelled + '<br>';
  agentTxt += 'Travelled DumbAgent:' + DumbAgents[0].travelled + '<br>';
  agentTxt += 'Travelled DumbAgent2:' + DumbAgents[1].travelled + '<br>';
  agentTxt += 'Runs:' + runs + '<br>';
  agentTxt += 'Food:' + worldMap.foodTotal + '<br>';
  agentTxt += 'Sim running:' + simRunning + '<br>'
  agentTxt += 'Learning:' + agentbrain.learning + '<br>';
  $('#agentDiv').append(agentTxt);
  
  drawAll();
  
  var eltvar = document.getElementById("eltDiv");
  agentbrain.visSelf(eltvar);
}

function brainMaker()
{
var num_inputs = 26; // 22 eyes, each sees 1 color (wall, food proximity), 4 rotation
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

return brain = new deepqlearn.Brain(num_inputs, num_actions, opt); // woohoo
}

function savenet() {
  var j = agentbrain.value_net.toJSON();
  var t = JSON.stringify(j);
  document.getElementById('brainText').value = t;
}

function loadnet() {
  var t = document.getElementById('brainText').value;
  var j = JSON.parse(t);
  agentbrain.value_net.fromJSON(j);
  stoplearn(); // also stop learning
}

function startlearn() {
  agentbrain.learning = true;
}
function stoplearn() {
  agentbrain.learning = false;
}
function runsim() {
  simRunning = true;
}
function pausesim() {
  simRunning = false;
}

