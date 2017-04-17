function drawAll() {
  drawCanvas();
  drawWorld();
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
  // Draw DumbAgent2
  ctx.beginPath();
  ctx.fillStyle = 'rgb(64,255,64)';
  ctx.fillRect(DumbAgent2.x-5, DumbAgent2.y-5, 10, 10);
  
  var p = 10;
  var cx = DumbAgent2.x;
  var cy = DumbAgent2.y;
  ctx.beginPath();
  if(DumbAgent2.rot == 3){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx-p, cy);
  }
  if(DumbAgent2.rot == 1){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx+p, cy);
  }
  if(DumbAgent2.rot == 0){
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy-p);
  }
  if(DumbAgent2.rot == 2){
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