var World = function()
{
  this.width = 500;
  this.height = 500;
  this.map = [];
  this.foodTotal = 0;
  
  for (var h = 0; h < this.height ; h++){
    var y_row = [];
    for (var w = 0; w < this.width ; w++){
      y_row.push(0);
    }
    this.map.push(y_row);
  }
}

var Sensor = function(x,y,rot,range, sensitivity)
{
  this.x_offset = x;
  this.y_offset = y;
  this.rot = rot;
  this.range = range;
  this.output = 0;
  this.sensitivity = sensitivity;
}
Sensor.prototype = {
  setOutput: function(x,y)
  {
    this.output = 0;
    for(var i = this.range; i > 0 ; i-- ){
      if(this.rot == R_UP){
          if(y+this.y_offset-i > -1){
            if(worldMap.map[x+this.x_offset][y+this.y_offset-i] == this.sensitivity){
              this.output = ( (this.range-i) + 1 ) / this.range;
            }
          }
      }
      if(this.rot == R_DOWN){
          if(y+this.y_offset+i < worldMap.height){
            if(worldMap.map[x+this.x_offset][y+this.y_offset+i] == this.sensitivity){
              this.output = ( (this.range-i) + 1 ) / this.range;
            }
          }
      }
      if(this.rot == R_LEFT){
          if(x+this.x_offset-i > -1){
            if(worldMap.map[x+this.x_offset-i][y+this.y_offset] == this.sensitivity){
              this.output = ( (this.range-i) + 1 ) / this.range;
            }
          }
      }
      if(this.rot == R_RIGHT){
          if(x+this.x_offset+i < worldMap.width){
            if(worldMap.map[x+this.x_offset+i][y+this.y_offset] == this.sensitivity){
              this.output = ( (this.range-i) + 1 ) / this.range;
            }
          }
      }
    }
    this.output *= this.output; // Square the output
  }
}

var Mouth = function(x,y)
{
  this.x_offset = x;
  this.y_offset = y;
}

var Agent = function()
{
  this.x = 0;
  this.y = 0;
  this.rot = R_UP;
  this.lastAction = 0;
  this.reward = 0;
  this.food = 0;
  this.justEaten = 0;
  this.travelled = 0;
  this.moveCost =0.005;
  this.turnCost =0.0005;
  this.sensors = [];
  this.mouths = [];
  this.rewardArray = [];
  this.brain = brainMaker();
  // Add sensors 
  for(var j = 2; j<3; j++){
    for(var sx = -5; sx< 6; sx++){
      // top
      this.sensors.push(new Sensor( sx, 0, R_UP, 300, 2)); // Food
      this.sensors.push(new Sensor( sx, 0, R_UP, 300, 1)); // Wall
      // bottom
      //this.sensors.push(new Sensor( sx,  5, R_DOWN, 300, j));
    }
    for(var sy = -5; sy< 6; sy++){
      // left
      //this.sensors.push(new Sensor( -5, sy, R_LEFT, 300, j));
      // right
      //this.sensors.push(new Sensor(  5, sy, R_RIGHT, 300, j));
    }
  }
  // Add mouths
  for(var sx = -5; sx< 6; sx++){
    this.mouths.push(new Mouth(sx, -5));
    this.mouths.push(new Mouth(sx,  5));
  }
  for(var sy = -5; sy< 6; sy++){
    this.mouths.push(new Mouth(  5, sy));
    this.mouths.push(new Mouth( -5, sy));
  }
}
Agent.prototype = {
  doAction: function(action)
  {
      if(action==0){
      this.advance(1);
      this.eat();
    }
    if(action==1){
      this.turn(T_CW);
    }
    if(action==2){
      this.turn(T_CCW);
    }
    if(action==3){
      this.advance(1);
      this.eat();
      this.turn(T_CW);
    }
    if(action==4){
      this.advance(1);
      this.eat();
      this.turn(T_CCW);
    }
    if(action==5){
      this.advance(1);
      this.eat();
      this.advance(1);
      this.eat();
    }
    if(action==6){
      this.advance(1);
      this.eat();
      this.advance(1);
      this.eat();
      this.advance(1);
      this.eat();
    }
  },
  
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
      //console.log(runs);
      var tmpx = 0;
      var tmpy = 0;
      tmpx = this.sensors[i].x_offset;
      tmpy = this.sensors[i].y_offset;
      if((direction == T_CW && this.sensors[i].rot == R_UP) || (direction == T_CW && this.sensors[i].rot == R_DOWN) || (direction == T_CCW && this.sensors[i].rot == R_LEFT) || (direction == T_CCW && this.sensors[i].rot == R_RIGHT)){
        // Swap offsets for rotation
        this.sensors[i].x_offset = tmpy;
        this.sensors[i].y_offset = tmpx;
      }
      else{
        // Swap offsets for rotation and invert
        this.sensors[i].x_offset = tmpy * -1;
        this.sensors[i].y_offset = tmpx * -1;
      }
      this.sensors[i].rot = this.rot;
    }
    
    this.food -= this.turnCost;
    this.lastAction = 1;
  },
  
  advance: function(speed)
  {
    if(this.rot==R_UP){
      if(worldMap.map[this.x][this.y - speed] != 1){
        this.y -= speed;
      }
    }
    if(this.rot==R_DOWN){
      if(worldMap.map[this.x][this.y + speed] != 1){
        this.y += speed;
      }
    }
    if(this.rot==R_LEFT){
      if(worldMap.map[this.x - speed][this.y] != 1){
        this.x -= speed;
      }
    }
    if(this.rot==R_RIGHT){
      if(worldMap.map[this.x + speed][this.y] != 1){
        this.x += speed;
      }
    }
    this.food -= this.moveCost;
    this.travelled++;
    this.lastAction = 0;
    
    if(this.x<50)   this.x = 50;
    if(this.x>450) this.x = 450;
    if(this.y<50)   this.y = 50;
    if(this.y>450) this.y = 450;
  },
  
  sense: function()
  {
    for(var s of this.sensors){
      s.setOutput(this.x, this.y);
    }
    
    for(var i =0;i<this.sensors.length-1; i+=2){
      if(this.sensors[i].output>this.sensors[i+1].output){
        this.sensors[i+1].output = 0;
      }
      if(this.sensors[i].output<this.sensors[i+1].output){
        this.sensors[i].output = 0;
      }
    }
    
  },
  
  eat: function()
  {
    for(var m of this.mouths){
      if(worldMap.map[this.x+m.x_offset][this.y+m.y_offset] == 2){
        worldMap.map[this.x+m.x_offset][this.y+m.y_offset] = 0;
        this.food += 1;
        this.justEaten += 1;
        worldMap.foodTotal--;
      }
    }
  },
  
  calcReward: function()
  {
    var foodProximityReward = 0;
    for(var s of this.sensors){
      if(s.sensitivity == 2){
        foodProximityReward += s.output;
      }
    }
    var wallProximityReward = 0;
    for(var s of this.sensors){
      if(s.sensitivity == 1){
        wallProximityReward += s.output;
      }
    }
    
    var foodReward = Math.max(this.food/20,0);
    var eatenReward = this.justEaten;
    this.justEaten = 0;
    
    var movementReward = this.lastAction === 0 ? 1: 0; 
    
    // Tweak rewards
    foodProximityReward = foodProximityReward/10;
    wallProximityReward = wallProximityReward/10;
    foodReward = Math.min(foodReward/100,0);
    eatenReward = eatenReward;
    movementReward = movementReward/10;
    
    // Store reward contributors
    this.rewardArray = [];
    this.rewardArray.push(['foodProximityReward',foodProximityReward]);
    this.rewardArray.push(['wallProximityReward',wallProximityReward]);
    this.rewardArray.push(['foodReward',foodReward]);
    this.rewardArray.push(['eatenReward',eatenReward]);
    this.rewardArray.push(['movementReward',movementReward]);
    
    this.reward = foodProximityReward + foodReward + eatenReward + movementReward - wallProximityReward;
  }
}