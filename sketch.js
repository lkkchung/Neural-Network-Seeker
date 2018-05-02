let head;
let light;
let margin = 50;
let angleBrain;
let positionBrain;
let area = 20;
let dbM = true;
let trainMode = true;
let mouseControl = false;
let backProp = false;

function setup() {
  createCanvas(700, 540);
  angleBrain = new NeuralNetwork(3, 6, 1);
  positionBrain = new NeuralNetwork(3, 6, 1);

  head = new sensorPoints();
  light = new sourcePoint();

}

function draw() {
  background(0);
  stroke(255);
  noFill();
  strokeWeight(0.5);
  rect(margin, margin, width - margin - margin, height - margin - margin);

  head.move();
  head.render();
  head.readings();
  if (trainMode == true) {
    head.training();
  }

  light.render();


  if (dbM == true) {
    head.debugMode();
  }

  let dMag = (mouseX - light.pos.x) * (mouseX - light.pos.x) +
    (mouseY - light.pos.y) * (mouseY - light.pos.y);

  let intensity = 1 / dMag;
  noStroke();
  fill(255);
  text("TRAINING MODE:", 20, 20);
  text("BACK PROPAGATION:", 20, 40);
  if (trainMode == false) {
    fill(100);
  } 
  text("ON", 180, 20);

  fill(255);

  if (backProp == false) {
    fill(100);
  } 
  text("ON", 180, 40);
}

function mousePressed() {
  mouseControl = !mouseControl;
}

function keyPressed() {
  if (keyCode === 32) {
    trainMode = !trainMode;;
  } else if (keyCode === CONTROL) {
    backProp = !backProp;
  } 
}

class sensorPoints {
  constructor() {
    this.pos = createVector(width / 2, height / 2);

    this.pointA = -20;
    this.pointC = 20;

    this.angle = PI / 2;
    this.sensorAngleA = PI / 4;
    this.sensorAngleC = -PI / 4;
    this.counter = 0;

    this.prediction = 0;
  }

  updateDirections() {
    if (trainMode == true) {
      this.angle += 0.01;
    } else {
      let newDir = angleBrain.predict([this.lookingA, this.lookingB, this.lookingC]) - 0.5;
      console.log(newDir);
      this.angle += newDir;
      // this.training();
    }

    //establishing vector angles
    this.vectA = p5.Vector.fromAngle(this.angle + this.sensorAngleA);
    this.vectB = p5.Vector.fromAngle(this.angle);
    this.vectC = p5.Vector.fromAngle(this.angle + this.sensorAngleC);

    this.offsetA = createVector(this.pos.x + (this.pointA * cos(this.angle - PI / 2)),
      this.pos.y + (this.pointA * sin(this.angle - PI / 2)));
    this.offsetC = createVector(this.pos.x + (this.pointC * cos(this.angle - PI / 2)),
      this.pos.y + (this.pointC * sin(this.angle - PI / 2)));
  }

  readings() {
    this.lightDirectionA = createVector(this.offsetA.x - light.pos.x, this.offsetA.y - light.pos.y);
    this.lightDirectionB = createVector(this.pos.x - light.pos.x, this.pos.y - light.pos.y);
    this.lightDirectionC = createVector(this.offsetC.x - light.pos.x, this.offsetC.y - light.pos.y);

    let angleA = this.vectA.angleBetween(this.lightDirectionA);
    let angleB = this.vectB.angleBetween(this.lightDirectionB);
    let angleC = this.vectC.angleBetween(this.lightDirectionC);

    let sensorMax = 1024;

    this.lookingA = angleA / PI;
    this.lookingB = angleB / PI;
    this.lookingC = angleC / PI;

  }

  move() {
    this.counter += 0.01;

    this.updateDirections();

    if (trainMode == true) {
      this.pos.x += noise(this.counter);
      this.pos.y += noise(this.counter-2000);
    } else {
 
      let accel = angleBrain.predict([this.lookingA, this.lookingB, this.lookingC]);
      console.log(accel);
      accel = map(accel, 0, 1, -2, 8);

      if(backProp==true){
        this.training();
      }
      

      this.pos.add(p5.Vector.mult(this.vectB, accel));
    }


    if (this.pos.x > width - margin) {
      this.pos.x = margin;
    }
    if (this.pos.x < margin) {
      this.pos.x = width - margin;
    }
    if (this.pos.y > height - margin) {
      this.pos.y = margin;
    }
    if (this.pos.y < margin) {
      this.pos.y = height - margin;
    }

  }

  debugMode() {
    let dirA = p5.Vector.mult(this.vectA, 50);
    let dirB = p5.Vector.mult(this.vectB, 80);
    let dirC = p5.Vector.mult(this.vectC, 50);

    strokeWeight(1);
    stroke(255, 0, 0);
    strokeWeight(this.lookingA * 20);
    line(this.offsetA.x, this.offsetA.y, this.offsetA.x + dirA.x, this.offsetA.y + dirA.y);
    stroke(0, 255, 0);
    strokeWeight(this.lookingB * 20);
    line(this.pos.x, this.pos.y, this.pos.x + dirB.x, this.pos.y + dirB.y);
    stroke(0, 0, 255);
    strokeWeight(this.lookingC * 20);
    line(this.offsetC.x, this.offsetC.y, this.offsetC.x + dirC.x, this.offsetC.y + dirC.y);

  }

  render() {

    strokeWeight(1);
    noFill();
    stroke('#FFFFFF');

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle - PI / 2);

    //pointA
    if (dbM == true) {
      stroke('#FF0000');
    }
    ellipse(this.pointA, 0, 8, 8);

    //pointB
    if (dbM == true) {
      stroke('#00FF00');
    }
    ellipse(0, 0, 12, 12);

    //pointC
    if (dbM == true) {
      stroke('#0000FF');
    }
    ellipse(this.pointC, 0, 8, 8);
    pop();
  }

  training() {
    let inputs = [this.lookingA, this.lookingB, this.lookingC];
    let targets = [];

    if (this.lookingB > this.lookingA && this.lookingB > this.lookingC) {
      targets = [0.5];
    } else if (this.lookingB < this.lookingA) {
      targets = [1];
    } else if (this.lookingB < this.lookingC) {
      targets = [0];
    }

    console.log(targets);

    angleBrain.train(inputs, targets);


    if (this.lookingB > this.lookingA && this.lookingB > this.lookingC) {
      targets = [1];
    } else if (this.lookingB < this.lookingA) {
      targets = [0];
    } else if (this.lookingB < this.lookingC) {
      targets = [0];
    }

    positionBrain.train(inputs, targets);
  }
}

class sourcePoint {
  constructor() {
    this.pos = createVector(random(margin, width - margin * 1.5), random(margin, height - margin * 1.5));
  }

  render() {
    if (mouseControl == true) {
      this.pos.x = mouseX;
      this.pos.y = mouseY;
    } else {
      if (dist(this.pos.x, this.pos.y, head.pos.x, head.pos.y) < 25) {
        this.pos.x = random(margin, width - margin * 1.5);
        this.pos.y = random(margin, height - margin * 1.5);
      }

    }

    noStroke();
    fill(255);
    ellipse(this.pos.x, this.pos.y, 30, 30);
  }
}