function drawAll() {
  drawNeurons();
  drawWorld();
  // Update Agent readout
  updateStatus();
  updateAgentReadout(); 
}

function updateStatus(){
  var statusTxt = '';
  if(simRunning){
    statusTxt += 'Sim Running - ';
  }
  else{
    statusTxt += 'Sim Paused - ';
  }
  if(agents[0].brain.learning){
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
  
  //$('#statusTxt').empty();
  //$('#statusTxt').append(statusTxt);
  
  document.getElementById('statusTxt').innerHTML  = statusTxt;
}

function updateAgentReadout()
{
  //$('#agentDiv').empty();
   
  var data = [];
  data.push([ 'Frame Time',               frameTime     ]);
  data.push([ 'FPS',               (1000/frameTime).toFixed(1)     ]);
  for(var rc of agents[0].rewardArray){
    data.push([ rc[0], rc[1].toFixed(3) ]);
  }
  data.push([ 'Reward',               agents[0].reward.toFixed(3)     ]);
  data.push([ '', 'AI Agent', 'DumbAgent1', 'DumbAgent2']);
  data.push([ 'Food',              agents[0].food.toFixed(3) , agents[1].food.toFixed(3), agents[2].food.toFixed(3) ]);
  data.push([ 'Poison',              agents[0].poison.toFixed(3) , agents[1].poison.toFixed(3), agents[2].poison.toFixed(3) ]);
  data.push([ 'Travelled',         agents[0].travelled, agents[1].travelled, agents[2].travelled ]);
  data.push([ 'Runs',                 runs ]);
  data.push([ 'Food',                 worldMap.foodTotal ]);
  data.push([ 'Sim running',          simRunning ]);
  data.push([ 'Learning',             agents[0].brain.learning ]);
  data.push([ 'experience replay size', agents[0].brain.experience.length ]);
  data.push([ 'exploration epsilon',    agents[0].brain.epsilon.toFixed(3) ]);
  data.push([ 'age',                     agents[0].brain.age ]);
  data.push([ 'average Q-learning loss', agents[0].brain.average_loss_window.get_average().toFixed(3) ]);
  data.push([ 'smooth-ish reward',       agents[0].brain.average_reward_window.get_average().toFixed(3) ]);
  var agentTxt = simpleTable(data);
  //$('#agentDiv').append(agentTxt);
  document.getElementById('agentDiv').innerHTML  = agentTxt;
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

function drawNeurons()
{
  var canvas = document.getElementById("mainCanvas");
  var ctx = canvas.getContext("2d");
  
  // Clear
  ctx.fillStyle='rgb(64,64,255)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  //net.layers[1].out_act.w[0]
  var x = 70;
  var y = 20;
  for(let l of agents[0].brain.value_net.layers){
    x =  70;
    y += 10;
    ctx.font = "8px Arial";
    ctx.fillStyle='rgb(255,255,255)';
    ctx.fillText(l.layer_type.toUpperCase() + ' ('+l.out_depth+ ')',10,y+3);
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
  var px = 70;
  var py = 400;
  ctx.fillStyle='rgb(255,255,255)';
  ctx.fillText('VISUAL FIELD',10,py-20);
  var sensIdx = 0;
  var sType = ['FOOD','WALL','POISON'];
  for(var outputs of agents[0].sensors[0].outputs){
    ctx.fillStyle='rgb(255,255,255)';
    ctx.fillText(sType[sensIdx],10,py+9);
    outputArray.push(outputs);
    var i=0;
    for(var p of outputs){
      var c = parseInt(p*255);
      var sensitivity = agents[0].sensors[0].sensitivities[sensIdx];
      if(sensitivity == 2){
        ctx.fillStyle = 'rgb(0,'+c+',0)';
      }
      if(sensitivity == 1){
        ctx.fillStyle='rgb('+c+',0,0)';
      }
      if(sensitivity == 8){
        ctx.fillStyle='rgb('+c+','+c+',0)';
      }
      ctx.fillRect(px, py, 10, 10);
      px += 10;
      i++;
    }
    py += 10;
    px = 70;
    sensIdx ++;
  }
  // Composite Cortex
  py += 10;
  ctx.fillStyle='rgb(255,255,255)';
  ctx.fillText('COMPOSITE',10,py+9);
  for(var p=0;p<outputArray[0].length;p++){
    var food   = outputArray[0][p];
    var wall   = outputArray[1][p];
    var poison = outputArray[2][p];
    var colorWall = 'rgb('+c+',0,0)';
    var colorFood = 'rgb(0,'+c+',0)';
    var colorPoison = 'rgb('+c+','+c+',0)';
    
    if( food > wall || poison > wall ){
      if(poison > food){
        var c = parseInt(outputArray[1][p]*255);
        ctx.fillStyle = colorPoison;
      }
      else{
        var c = parseInt(outputArray[0][p]*255);
        ctx.fillStyle = colorFood;
      }
    }
    else {
      var c = parseInt(outputArray[1][p]*255);
      ctx.fillStyle = colorWall;
    }
    ctx.fillRect(px, py, 10, 10);
    px += 10;
  }
  
  // Draw taste outputs
  var tx = 50;
  var ty = 300;
  var length = agents[0].tasteOutput*100;
  ctx.fillStyle='rgb(0,255,0)';
  ctx.fillRect(tx, ty, length, 10);
  ty += 10;
  var length = agents[0].tastePoison*100;
  ctx.fillStyle='rgb(255,255,0)';
  ctx.fillRect(tx, ty, length, 10);
  
  // Draw reward
  ty += 20;
  var length = agents[0].reward*100;
  ctx.fillStyle='rgb(0,0,0)';
  ctx.fillRect(tx, ty, length, 10);
  
  
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
      // store contents for reuse in if statements, not doing so causes chrome to deoptimize this loop
      var contents = worldMap.map[wx][wy];
      // Draw Walls
      if(contents == 1){
        ctx.fillStyle = 'rgb(255,64,64)';
        ctx.fillRect(wx, wy, 1, 1);
      }
      // Draw food
      if(contents == 2){
        ctx.fillStyle = 'rgb(0,128,0)';
        ctx.fillRect(wx, wy, 1, 1);
      }
      
      // Draw poison
      if(contents == 8){
        ctx.fillStyle = 'rgb(200,200,0)';
        ctx.fillRect(wx, wy, 1, 1);
      }
      
      /*
      // Draw visual field
      if(contents == 6){
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
  
    
  for(var i=1;i<3;i++){
    var dAgent = agents[i];
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
  ctx.fillRect(agents[0].x-5.5, agents[0].y-5.5, 11, 11);
  
  var p = 10;
  var cx = agents[0].x;
  var cy = agents[0].y;
  ctx.beginPath();
  var rot = agents[0].rot;
  if(rot == 3){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx-p, cy);
  }
  if(rot == 1){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx+p, cy);
  }
  if(rot == 0){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy-p);
  }
  if(rot == 2){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy+p);
  }
  ctx.strokeStyle='rgb(0,0,0)';
  ctx.lineWidth=2;
  ctx.stroke();

}