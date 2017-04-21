function drawAll() {
  drawCanvas();
  drawWorld();
  // Update Agent readout
  updateStatus();
  updateAgentReadout(); 
}

function updateStatus(){
  var statusTxt = ''
  if(simRunning){
    statusTxt += 'Sim Running - ';
  }
  else{
    statusTxt += 'Sim Paused - ';
  }
  if(MyAgent.brain.learning){
    statusTxt += 'Training Active - ';
  }
  else{
    statusTxt += 'Training Disabled - ';
  }
  if(cycleTraining){
    statusTxt += 'Cycle Training On';
  }
  else{
    statusTxt += 'Cycle Training Off';
  }
  
  $('#statusTxt').empty();
  $('#statusTxt').append(statusTxt);
}

function updateAgentReadout()
{
  $('#agentDiv').empty();
   
  var data = [];
  for(var rc of MyAgent.rewardArray){
    data.push([ rc[0], rc[1].toFixed(3) ]);
  }
  data.push([ 'Reward',               MyAgent.reward.toFixed(3)     ]);
  data.push([ '', 'AI Agent', 'DumbAgent1', 'DumbAgent2']);
  data.push([ 'Food',              MyAgent.food.toFixed(3) , DumbAgents[0].food.toFixed(3), DumbAgents[1].food.toFixed(3) ]);
  data.push([ 'Poison',              MyAgent.poison.toFixed(3) , DumbAgents[0].poison.toFixed(3), DumbAgents[1].poison.toFixed(3) ]);
  data.push([ 'Travelled',         MyAgent.travelled, DumbAgents[0].travelled, DumbAgents[1].travelled ]);
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
}

function simpleTable(data)
{
  var outTxt = '';
  outTxt += '<table class="my-table">';
  for(var row of data){
    outTxt += '<tr>';
    for(var item of row){
      outTxt += '<td>' + item + '</td>';
    }
     outTxt += '</tr>';
  }
  outTxt += '</table>';
  return outTxt;
}

function drawCanvas()
{
  var canvas = document.getElementById("mainCanvas");
  var ctx = canvas.getContext("2d");
  
  // Clear
  ctx.fillStyle='rgb(64,64,255)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  //net.layers[1].out_act.w[0]
  var x = 70;
  var y = 20;
  for(let l of MyAgent.brain.value_net.layers){
    x =  70;
    y += 10;
    ctx.font = "8px Arial";
    ctx.fillStyle='rgb(255,255,255)';
    ctx.fillText(l.layer_type.toUpperCase(),10,y+3);
    // draw each neuron
    if(l.out_act !=undefined){
      
      var k = 0;
      for(let w of l.out_act.w){
        //console.log(w);
        k++;
        x += 10;
        if (k>50){x = 80;y+=10; k = 1};
        ctx.beginPath();
        ctx.arc(x,y,5,0,2*Math.PI);
        var c = parseInt((w+1)/2*255);
        ctx.fillStyle='rgb('+c+','+c+','+c+')';
        ctx.fill();
      }
    }
    // draw each neuron if the net is not yet complete
    else{
      var k = 0;
      for(var w =0;w<l.out_depth;w++){
        //console.log(w);
        k++;
        x += 10;
        if (k>50){x = 80;y+=10; k = 1};
        ctx.beginPath();
        ctx.arc(x,y,5,0,2*Math.PI);
        //var c = parseInt((w+1)/2*255);
        ctx.fillStyle='rgb(128,128,128)';
        ctx.fill();
      }
    }
  }
  
  // Draw Visual Cortex
  var outputArray = [];
  var px = 50;
  var py = 400;
  for(var eye of MyAgent.sensors){
    outputArray.push(eye.outputs);
    var i=0;
    for(var p of eye.outputs){
      var c = parseInt(p*255);
      if(eye.sensitivity == 2){
        ctx.fillStyle = 'rgb(0,'+c+',0)';
      }
      if(eye.sensitivity == 1){
        ctx.fillStyle='rgb('+c+',0,0)';
      }
      if(eye.sensitivity == 8){
        ctx.fillStyle='rgb('+c+','+c+',0)';
      }
      ctx.fillRect(px, py, 10, 10);
      px += 10;
      i++;
    }
    py += 10;
    px = 50;
  }
  // Composite Cortex
  py += 10;
  for(var p=0;p<outputArray[0].length;p++){
    if(outputArray[0][p]>outputArray[1][p]){
      var c = parseInt(outputArray[0][p]*255);
      ctx.fillStyle = 'rgb(0,'+c+',0)';
    }
    else{
      var c = parseInt(outputArray[1][p]*255);
      ctx.fillStyle='rgb('+c+',0,0)';
    }
    ctx.fillRect(px, py, 10, 10);
    px += 10;
  }
  
  
}

function drawWorld()
{
  var canvas = document.getElementById("worldCanvas");
  var ctx = canvas.getContext("2d");
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw Environment
  for(var wx=0; wx <500; wx++){
    for(var wy=0; wy <500; wy++){
      // Draw Walls
      var contents = worldMap.map[wx][wy];
      if(contents == 1){
        ctx.fillStyle = 'rgb(255,64,64)';
        ctx.fillRect(wx, wy, 1, 1);
      }
      // Draw food
      if(contents == 2){
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillRect(wx, wy, 1, 1);
      }
      
      // Draw poison
      if(contents == 8){
        ctx.fillStyle = 'rgb(128,128,0)';
        ctx.fillRect(wx, wy, 1, 1);
      }
      
      /*
      // Draw visual field
      if(worldMap.map[wx][wy] == 6){
        ctx.fillStyle = 'rgb(230,230,255)';
        ctx.fillRect(wx, wy, 1, 1);
        worldMap.map[wx][wy] = 0;
      }
      /*
      // Draw visual field
      if(worldMap.map[wx][wy] == 7){
        ctx.fillStyle = 'rgb(0,0,255)';
        ctx.fillRect(wx, wy, 1, 1);
        worldMap.map[wx][wy] = 0;
      }
      */
    }
  }
  
    
  for(var dAgent of DumbAgents){
    // Draw DumbAgent
    ctx.beginPath();
    ctx.fillStyle = 'rgb(64,255,64)';
    ctx.fillRect(dAgent.x-5.5, dAgent.y-5.5, 11, 11);
    
    var p = 10;
    var cx = dAgent.x;
    var cy = dAgent.y;
    ctx.beginPath();
    if(dAgent.rot == 3){
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx-p, cy);
    }
    if(dAgent.rot == 1){
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx+p, cy);
    }
    if(dAgent.rot == 0){
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy-p);
    }
    if(dAgent.rot == 2){
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy+p);
    }
    ctx.strokeStyle='rgb(0,0,0)';
    ctx.lineWidth=2;
    ctx.stroke();
  }  
    
  // Draw MyAgent
  ctx.beginPath();
  ctx.fillStyle = 'rgb(255,64,64)';
  ctx.fillRect(MyAgent.x-5.5, MyAgent.y-5.5, 11, 11);
  
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

}