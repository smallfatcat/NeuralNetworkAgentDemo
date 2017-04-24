var World = function()
{
  this.width = 500;
  this.height = 500;
  this.map = [];
  this.foodTotal = 0;
  this.poison = 0;
  
  for (var h = 0; h < this.height ; h++){
    var y_row = [];
    for (var w = 0; w < this.width ; w++){
      y_row.push(0);
    }
    this.map.push(y_row);
  }
}

var DumbBrain = function(num_actions)
{
  this.num_actions = num_actions;
  this.learning = false;
}

DumbBrain.prototype = {
  forward: function(inputs){
    // Do DumbAgent action
    var action = Math.floor( Math.random()*this.num_actions);
    return action;
  },
  backward: function(reward)
  {
    // Do nothing
  }
}

var SensorEye = function(x,y,rot,range, sensitivities)
{
  this.x_offset = x;
  this.y_offset = y;
  this.rot = rot;
  this.range = range;
  this.outputs = [];
  this.sensitivities = sensitivities;
  this.width = 5;
  for(var s of sensitivities){
    var out = [];
    for(var m=0;m<(this.width*2)+1;m++){
      out.push(0);
    }
    this.outputs.push(out);
  }
}
SensorEye.prototype = {
  setOutput: function(x,y)
  {
    // set outputs to zero
    
    for(var sensitivityoutputs of this.outputs){
      // Set outputs to zero
      for(var n = 0; n < sensitivityoutputs.length ;n++){
        sensitivityoutputs[n] = 0;
      }
    }
    // Get visfield for this rotation
    var visField = visualFieldArray[this.rot];
    for(var vis of visField){
      // vis is [x,y,depth,pixel,distance]
      var xi = vis[0] + x;
      var yi = vis[1] + y;
      if( yi > -1 && yi < 500 && xi > -1 && xi < 500) {
        //if(worldMap.map[xi][yi] == 0){worldMap.map[xi][yi] = 6};
        for(var index = 0; index < this.sensitivities.length;index++){
          if(worldMap.map[xi][yi] == this.sensitivities[index]){
            this.outputs[index][vis[3]] = Math.max(this.outputs[index][vis[3]], (this.range - vis[4]) / this.range );
          }
        }
      }
    }
    // Square the outputs
    for(var sensitivityoutputs of this.outputs){
      for(var n = 0; n < sensitivityoutputs.length ;n++){
        sensitivityoutputs[n] = sensitivityoutputs[n] * sensitivityoutputs[n];
      }
    }
    
    
    
   
  },
  
  getScreenX: function(x,y,wx,wy,rot)
  {
      var newx = 0;
      var relx = wx - x;
      var rely = wy - y;
      if(rot == R_UP){
        newx = ((relx * this.width)/(rely - this.width)) + this.width;
      }
      if(rot == R_DOWN){
        newx = ((relx * this.width)/(this.width + rely)*-1) + this.width;
      }
      if(rot == R_RIGHT){
        newx = ((rely * this.width)/(this.width + relx)) + this.width;
      }
      if(rot == R_LEFT){
        newx = ((rely * this.width)/(relx - this.width)) + this.width;
      }
      //console.log(Math.floor(newx));
      return Math.round(newx);
  }
}
var Mouth = function(x,y)
{
  this.x_offset = x;
  this.y_offset = y;
  this.output = 0;
}

// Agent class
var Agent = function(x,y,brainType)
{
  // Init properties
  this.x = x;
  this.y = y;
  this.rot = R_UP;
  this.lastAction = 0;
  this.reward = 0;
  this.food = 0;
  this.poison = 0;
  this.justEaten = 0;
  this.travelled = 0;
  this.moveCost =0.005;
  this.turnCost =0.0005;
  this.tasteOutput = 0;
  this.tastePoison = 0;
  
  this.collided = false;
    
  this.sensors = [];
  this.mouths = [];
  this.rewardArray = [];
  this.brainType = brainType;
  this.brainGen = 0;
  this.brain = brainMaker(brainType);
  
  // Add sensors
  var sensitivities = [2,1,8];
  this.sensors.push(new SensorEye(0,-5,R_UP,100,sensitivities));
    
  // Add mouths
  var mouthOffset = getLineCoords(-5,-6,5,-6);
  for(var m of mouthOffset){
    this.mouths.push(new Mouth(m[0], m[1]));
  }
}

// Agent methods
Agent.prototype = {
  doAction: function(action)
  {
    this.lastAction = action;
    if(action==0){
      this.advance(1);
      this.food -= this.moveCost;
    }
    if(action==1){
      this.turn(T_CW);
      this.food -= this.turnCost;
    }
    if(action==2){
      this.turn(T_CCW);
      this.food -= this.turnCost;
    }
    if(action==3){
      this.turn(T_CCW);
      this.advance(1);
      this.turn(T_CW);
      this.food -= this.moveCost;
    }
    if(action==4){
      this.turn(T_CW);
      this.advance(1);
      this.turn(T_CCW);
      this.food -= this.moveCost;
    }
    if(action==5){
      this.eat();
    }
    
  },
  
  // Action - Turn
  turn: function(direction)
  {
    if(direction == T_CW){
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
    // Move eyes to facing direction
    
    for(var i=0;i< this.sensors.length;i++){
      this.sensors[i].rot = this.rot;
      if(this.rot == R_UP){
        this.sensors[i].x_offset = 0;
        this.sensors[i].y_offset = -5;
      }
      if(this.rot == R_DOWN){
        this.sensors[i].x_offset = 0;
        this.sensors[i].y_offset = 5;
      }
      if(this.rot == R_LEFT){
        this.sensors[i].x_offset = -5;
        this.sensors[i].y_offset = 0;
      }
      if(this.rot == R_RIGHT){
        this.sensors[i].x_offset = 5;
        this.sensors[i].y_offset = 0;
      }
    }
    
    // Move Mouths to front of agent
    var mouthOffset = [];
    if(this.rot == R_UP){
      mouthOffset = getLineCoords(-5,-6,5,-6);
    }
    if(this.rot == R_DOWN){
      mouthOffset = getLineCoords(-5,6,5,6);
    }
    if(this.rot == R_LEFT){
      mouthOffset = getLineCoords(-6,-5,-6,5);
    }
    if(this.rot == R_RIGHT){
      mouthOffset = getLineCoords(6,-5,6,5);
    }
    for(var m=0; m < this.mouths.length;m++){
      this.mouths[m].x_offset = mouthOffset[m][0];
      this.mouths[m].y_offset = mouthOffset[m][1];
    }
    
    
    
  },
  
  // Action - Advance
  advance: function(speed)
  {
    this.collided = false;
    if(this.rot==R_UP){
      var coll = false;
      for(var u = -5; u < 6; u++ ){
        if(worldMap.map[this.x+u][this.y - 6] == 1){
          coll = true;
        }
      }
      if(!coll){
        this.y -= speed;
      }
      else{
        this.collided = true;
      }
    }
    if(this.rot==R_DOWN){
      var coll = false;
      for(var u = -5; u < 6; u++ ){
        if(worldMap.map[this.x+u][this.y + 6] == 1){
          coll = true;
        }
      }
      if(!coll){
        this.y += speed;
      }
      else{
        this.collided = true;
      }
    }
    if(this.rot==R_LEFT){
      var coll = false;
      for(var u = -5; u < 6; u++ ){
        if(worldMap.map[this.x-6][this.y + u] == 1){
          coll = true;
        }
      }
      if(!coll){
        this.x -= speed;
      }
      else{
        this.collided = true;
      }
    }
    if(this.rot==R_RIGHT){
      var coll = false;
      for(var u = -5; u < 6; u++ ){
        if(worldMap.map[this.x+6][this.y + u] == 1){
          coll = true;
        }
      }
      if(!coll){
        this.x += speed;
      }
      else{
        this.collided = true;
      }
    }
    
    this.travelled++;        
    if(this.x<50)   this.x = 50;
    if(this.x>450) this.x = 450;
    if(this.y<50)   this.y = 50;
    if(this.y>450) this.y = 450;
  },
  
  // Action - Eat
  eat: function()
  {
    var poisoned = false;
    var foodEaten = 0;
    for(var m of this.mouths){
      if(worldMap.map[this.x+m.x_offset][this.y+m.y_offset] == 2){
        worldMap.map[this.x+m.x_offset][this.y+m.y_offset] = 0;
        foodEaten += 1;
        this.justEaten += 1;
        worldMap.foodTotal--;
      }
      // poison
      if(worldMap.map[this.x+m.x_offset][this.y+m.y_offset] == 8){
        poisoned = true;
        this.poison += 1;
      }
    }
    if(poisoned){
      this.food -= 2;
      this.justEaten = 0;
    }
    else{
      this.food += foodEaten;
    }
  },
  
   sense: function()
  {
    for(var s of this.sensors){
      s.setOutput(this.x+s.x_offset, this.y+s.y_offset);
    }
    
    for(var j =0;j<this.sensors[0].outputs[0].length; j++){
      // walls hide food
      if(this.sensors[0].outputs[1][j] > this.sensors[0].outputs[0][j]){
        this.sensors[0].outputs[0][j] = 0;
      }
    }
    for(var j =0;j<this.sensors[0].outputs[2].length; j++){
      // walls hide poison
      if(this.sensors[0].outputs[1][j] > this.sensors[0].outputs[2][j]){
        this.sensors[0].outputs[2][j] = 0;
      }
    }
    
    this.tasteOutput = 0;
    this.tastePoison = 0;
    for(var m of this.mouths){
      if(worldMap.map[this.x+m.x_offset][this.y+m.y_offset] == 2){
        m.output += 1;
        this.tasteOutput +=1;
      }
      if(worldMap.map[this.x+m.x_offset][this.y+m.y_offset] == 8){
        m.output += 1;
        this.tastePoison +=1;
      }
    }
    this.tasteOutput = this.tasteOutput / this.mouths.length;
    this.tastePoison = this.tastePoison / this.mouths.length;
  },
  
  calcReward: function()
  {
    // multiply each pixel output by a factor to prefer centre vision
    var peripheralMultiplier = [0.1,0.2,0.4,0.6,0.8,1,0.8,0.6,0.4,0.2,0.1];
    var foodProximityReward = 0;
    var pixIdx = 0;
    for(var s of this.sensors[0].outputs[0]){
      if(this.sensors[0].sensitivities[0] == 2){
        foodProximityReward = Math.max(s*peripheralMultiplier[pixIdx], foodProximityReward);
      }
      pixIdx++;
    }
    
    var wallProximityReward = 0;
    pixIdx = 0;
    for(var s of this.sensors[0].outputs[1]){
      if(this.sensors[0].sensitivities[1] == 1){
        wallProximityReward = Math.max(s*peripheralMultiplier[pixIdx], wallProximityReward) ;
      }
      pixIdx++;
    }
    //wallProximityReward = wallProximityReward / this.sensors[0].outputs[1].length
        
    var foodReward = Math.max(this.food/20,0);
    var eatenReward = this.justEaten;
    this.justEaten = 0;
    
    var movementReward = 0;
    if(this.lastAction == 0){
      if(this.collided){
        movementReward =  0; 
      }
      else{
        movementReward =  1; 
      }
    }
    var eatAttemptReward = 0;
    if(this.lastAction == 7 ){
      eatAttemptReward = 1;
    }
    
    // Tweak rewards
    foodProximityReward = foodProximityReward/4;
    wallProximityReward = wallProximityReward/5;
    foodReward = foodReward/100;
    eatenReward = eatenReward/2;
    movementReward = movementReward/4;
    eatAttemptReward = eatAttemptReward/2;
    
    // Store reward contributors
    this.rewardArray = [];
    this.rewardArray.push(['foodProximityReward',foodProximityReward]);
    this.rewardArray.push(['wallProximityReward',wallProximityReward]);
    this.rewardArray.push(['foodReward',foodReward]);
    this.rewardArray.push(['eatenReward',eatenReward]);
    this.rewardArray.push(['movementReward',movementReward]);
    this.rewardArray.push(['eatAttemptReward',eatAttemptReward]);
    
    this.reward = foodProximityReward + foodReward + eatenReward + movementReward - wallProximityReward - eatAttemptReward;
    this.reward = Math.max(this.reward,0);
  }
}