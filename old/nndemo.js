// Neural net demo code
//
// from http://karpathy.github.io/neuralnets/

var data = []; var labels = [];
data.push([1.0, -1.0]); labels.push(1);
data.push([-1, 1.0]); labels.push(1);
data.push([-1, -1]); labels.push(-1);
data.push([1.0, 1.0]); labels.push(1);
data.push([-1, -1]); labels.push(-1);



// random initial parameters
var a1 = Math.random() - 0.5; // a random number between -0.5 and 0.5
var a2 = Math.random() - 0.5;
var a3 = Math.random() - 0.5;
var a4 = Math.random() - 0.5;
var b1 = Math.random() - 0.5;
var b2 = Math.random() - 0.5;
var b3 = Math.random() - 0.5;
var b4 = Math.random() - 0.5;
var c1 = Math.random() - 0.5;
var c2 = Math.random() - 0.5;
var c3 = Math.random() - 0.5;
var c4 = Math.random() - 0.5;
var d4 = Math.random() - 0.5;

var neurons = [];
var layers = [];
var links = [];
var timer1;

createlayers();
createNeurons();
createlinks();

$(document).ready( on_page_ready );


function on_page_ready( )
{
  timer1 = setInterval(runSimulation, 1000);

}

function runSimulation( )
{
  for(var iter = 0;iter < 100;iter++){
    // pick a random data point
    var i = Math.floor(Math.random() * data.length);
    var x = data[i][0];
    var y = data[i][1];
    var label = labels[i];

    // compute forward pass
    var n1 = Math.max(0, a1*x + b1*y + c1); // activation of 1st hidden neuron
    var n2 = Math.max(0, a2*x + b2*y + c2); // 2nd neuron
    var n3 = Math.max(0, a3*x + b3*y + c3); // 3rd neuron
    var score = a4*n1 + b4*n2 + c4*n3 + d4; // the score
    //console.log(' score: '+score + ' label: ' + label);
    
    neurons[0].value = x;
    neurons[1].value = y;
    neurons[2].value = n1;
    neurons[3].value = n2;
    neurons[4].value = n3;
    neurons[5].value = score;
    
    links[0].weight = a1;
    links[1].weight = a2;
    links[2].weight = a3;
    links[3].weight = b1;
    links[4].weight = b2;
    links[5].weight = b3;
    links[6].weight = a4;
    links[7].weight = b4;
    links[8].weight = c4;
    

    // compute the pull on top
    var pull = 0.0;
    if(label === 1 && score < 1) pull = 1; // we want higher output! Pull up.
    if(label === -1 && score > -1) pull = -1; // we want lower output! Pull down.

    // now compute backward pass to all parameters of the model

    // backprop through the last "score" neuron
    var dscore = pull;
    var da4 = n1 * dscore;
    var dn1 = a4 * dscore;
    var db4 = n2 * dscore;
    var dn2 = b4 * dscore;
    var dc4 = n3 * dscore;
    var dn3 = c4 * dscore;
    var dd4 = 1.0 * dscore; // phew

    // backprop the ReLU non-linearities, in place
    // i.e. just set gradients to zero if the neurons did not "fire"
    var dn3 = n3 === 0 ? 0 : dn3;
    var dn2 = n2 === 0 ? 0 : dn2;
    var dn1 = n1 === 0 ? 0 : dn1;

    // backprop to parameters of neuron 1
    var da1 = x * dn1;
    var db1 = y * dn1;
    var dc1 = 1.0 * dn1;
    
    // backprop to parameters of neuron 2
    var da2 = x * dn2;
    var db2 = y * dn2;
    var dc2 = 1.0 * dn2;

    // backprop to parameters of neuron 3
    var da3 = x * dn3;
    var db3 = y * dn3;
    var dc3 = 1.0 * dn3;

    // phew! End of backprop!
    // note we could have also backpropped into x,y
    // but we do not need these gradients. We only use the gradients
    // on our parameters in the parameter update, and we discard x,y

    // add the pulls from the regularization, tugging all multiplicative
    // parameters (i.e. not the biases) downward, proportional to their value
    da1 += -a1; da2 += -a2; da3 += -a3;
    db1 += -b1; db2 += -b2; db3 += -b3;
    da4 += -a4; db4 += -b4; dc4 += -c4;

    // finally, do the parameter update
    var step_size = 0.01;
    a1 += step_size * da1; 
    b1 += step_size * db1; 
    c1 += step_size * dc1;
    a2 += step_size * da2; 
    b2 += step_size * db2;
    c2 += step_size * dc2;
    a3 += step_size * da3; 
    b3 += step_size * db3; 
    c3 += step_size * dc3;
    a4 += step_size * da4; 
    b4 += step_size * db4; 
    c4 += step_size * dc4; 
    d4 += step_size * dd4;
    // wow this is tedious, please use for loops in prod.
    // we're done!
  }
  drawGraph();
  
}

function drawGraph()
{
  var canvas = document.getElementById("mainCanvas");
  var ctx = canvas.getContext("2d");
  
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  for(let n of neurons){
    ctx.beginPath();
    ctx.arc(n.x,n.y,10,0,2*Math.PI);
    var c = parseInt((n.value+1)/2*255);
    ctx.fillStyle='rgb('+c+','+c+','+c+')';
    ctx.fill();
  }
  for(let link of links){
    ctx.beginPath();
    ctx.moveTo(neurons[link.from].x+10, neurons[link.from].y);
    ctx.lineTo(neurons[link.to].x-10,   neurons[link.to].y);
    var c = parseInt((link.weight+1)/2*255);
    ctx.strokeStyle='rgb('+c+','+c+','+c+')';
    ctx.lineWidth=2;
    ctx.stroke();
  }
}

function createlayers()
{
  var layer = new Object();
  layer.id = 0;
  layer.nCount = 2;
  layer.label = 'input';
  layer.offset = 25;
  layers.push(layer);
  var layer = new Object();
  layer.nCount = 3;
  layer.id = 1;
  layer.label = 'hidden';
  layer.offset = 0;
  layers.push(layer);
  var layer = new Object();
  layer.nCount = 1;
  layer.id = 2;
  layer.label = 'output';
  layer.offset = 50;
  layers.push(layer);
}

function createNeurons(){
  let neuronID = 0;
  for(let layer of layers){
    for(let i=0;i<layer.nCount;i++){
      var n = new Object();
      n.id = neuronID;
      neuronID++;
      n.layer = layer.id;
      n.x = 50+(layer.id*50);
      n.y = 50+(i*50+(layer.offset));
      n.value = 1;
      neurons.push(n);
    }
  }
}

function createlinks()
{
  for(let i=0;i<layers[0].nCount;i++){
    var link = new Object();
    link.from = i;
    link.to = 2;
    link.weight = 1;
    links.push(link);
    var link = new Object();
    link.from = i;
    link.to = 3;
    link.weight = 1;
    links.push(link);
    var link = new Object();
    link.from = i;
    link.to = 4;
    link.weight = 1;
    links.push(link);
  }
  for(let i=0;i<layers[1].nCount;i++){
    var link = new Object();
    link.from = i+2;
    link.to = 5;
    link.weight = 1;
    links.push(link);
  }
}