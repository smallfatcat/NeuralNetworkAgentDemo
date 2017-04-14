var timer1value = 0;
var neurons = [];
var layers = [];
var links = [];
var testData = [];
var currentError = [0,0];
var testNumber = 0;
var testCounter = 0;
var timer1;

$(document).ready( on_page_ready );


function on_page_ready( )
{
  var dt = new Date();
  var UTCtime = dt.toLocaleString();
  
  $( '#mainDiv' ).append( ': loaded at '+UTCtime);
  console.log('loaded');
  
  timer1 = setInterval(timeElapsed, 10);
  
  createlayers();
  createNeurons();
  createTestData();
  createlinks();
  randomize();
  calcOutput();
  drawAll();

}

function onClickStep(){
  timeElapsed();
}

function onClickRand(){
  randomize();
}

function onClickPause(){
  clearInterval(timer1);
}

function onClickPlay(){
  timer1 = setInterval(timeElapsed, 10);
}

function timeElapsed()
{
  timer1value++;
  $( '#elapsedDiv' ).empty( );
  $( '#elapsedDiv' ).append( timer1value + ' runs');
  backPropogate();
  runTest();
  drawAll();
}

function createlayers()
{
  var layer = new Object();
  layer.id = 0;
  layer.nCount = 4;
  layer.label = 'input';
  layers.push(layer);
  var layer = new Object();
  layer.nCount = 2;
  layer.id = 1;
  layer.label = 'output';
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
      n.y = 50+(i*50+(layer.id*50));
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
    link.to = 4;
    link.weight = 1;
    links.push(link);
    var link = new Object();
    link.from = i;
    link.to = 5;
    link.weight = 1;
    links.push(link);
  }
}

function randomize()
{
  /*
  for(let n of neurons){
    if(n.layer == 0){
      n.value = (Math.random()*2)-1;
    }
  }
  */
  for(let l of links){
    l.weight = ( parseInt(Math.random()*400)/200)-1;
  }
}

function runTest()
{
  testCounter++;
  if(testCounter>300){
    testCounter = 0;
    testNumber++;
    if(testNumber > 5){testNumber = 0;}
  }
  for(let i=0;i<4;i++){
    neurons[i].value = testData[testNumber][i];
  }
  calcOutput();
  currentError[0] = testData[testNumber][4]-neurons[4].value;
  currentError[1] = testData[testNumber][5]-neurons[5].value;
}

function getError()
{
  var error = [0,0];
  error[0] = testData[testNumber][4]-neurons[4].value;
  error[1] = testData[testNumber][5]-neurons[5].value;
  return error;
}

function backPropogate()
{
  for(let link of links){
    if(true){
      var baseError = getError();
      var baseWeight = link.weight;
      link.weight = baseWeight - 0.005;
      calcOutput();
      var reducedError = getError();
      link.weight = baseWeight + 0.005;
      calcOutput();
      var increasedError = getError();
      if(absError(reducedError)<absError(increasedError)){
        link.weight = baseWeight - 0.005;
      }
      else if(absError(increasedError)< absError(baseError))
      {
        link.weight = baseWeight + 0.005;
      }
      else{
        link.weight = baseWeight;
      }
      if(link.weight < -1){link.weight = -1};
      if(link.weight > 1){link.weight = 1};
    }
  }
}

function absError(error)
{
  //return Math.abs(error[0])+Math.abs(error[1]);
  return max(Math.abs(error[0]),Math.abs(error[1]));
}

function max(a,b)
{
  if (a > b){
    return a;
  }
  else{
    return b;
  }
}

function calcOutput()
{
  for(let n of neurons){
    if(n.layer == 1){
      n.value = 0;
    }
  }
  for(let link of links){
    let value = neurons[link.from].value;
    let weight = link.weight;
    let output = weight*value;
    neurons[link.to].value += output;
  }
  for(let n of neurons){
    if(n.layer==1){
      if(n.value>1){n.value = 1;}
      if(n.value<-1){n.value = -1;}
      //n.value = n.value/4;
    }
  }
}

function drawAll()
{
  drawCanvas();
  drawTable();
}

function drawCanvas()
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

function drawTable()
{
  $( '#dataTable' ).empty( );
  // Neuron table
  var table = '';
  table += '<table><tr><th>Neuron</th><th>Value</th></tr>';
  for(let n of neurons){
    table += '<tr><td>'+n.id+'</td><td>'+n.value+'</td></tr>';
  }
  table += '</table>';
  // Link table
  table += '<table><tr><th>From</th><th>To</th><th>Weight</th></tr>';
  for(let l of links){
    table += '<tr><td>'+l.from+'</td><td>'+l.to+'</td><td>'+l.weight+'</td></tr>';
  }
  table += '</table>';
  // Error table
  table += '<table><tr><th>Neuron</th><th>Output</th><th>Expected</th><th>Error</th></tr>';
  table += '<tr><td>'+4+'</td><td>'+neurons[4].value+'</td><td>'+testData[testNumber][4]+'</td><td>'+currentError[0]+'</td></tr>';
  table += '<tr><td>'+5+'</td><td>'+neurons[5].value+'</td><td>'+testData[testNumber][5]+'</td><td>'+currentError[1]+'</td></tr>';
  table += '</table>';
  // data table
  table += '<table><tr><td>Absolute Error</td><td>'+absError(currentError)+'</td></tr></table>';
  $( '#dataTable' ).append( table);
  
}

function createTestData()
{
  testData.push([-1,-1,-1,1,-1,1]);
  testData.push([-1,-1,1,1,1,-1]);
  testData.push([-1,1,1,1,1,1]);
  testData.push([1,-1,-1,-1,-1,1]);
  testData.push([1,1,-1,-1,1,-1]);
  testData.push([1,1,1,-1,1,1]);
}