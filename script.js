// Runner Game - script.js
// Dependência: three.js (inserido via CDN no index.html)

let scene, camera, renderer;
let player, ground;
let obstacles = [];
let clock = new THREE.Clock();
let spawnTimer = 0;
let spawnInterval = 1.2; // segundos
let speed = 8; // velocidade do mundo
let score = 0;
let running = false;
let canJump = true;
let lane = 0; // -1 esquerda, 0 centro, 1 direita

const lanesX = [-3, 0, 3];

function init() {
  const container = document.getElementById('game-container');
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1220, 10, 80);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
  camera.position.set(0,5,12);
  camera.lookAt(0,1,0);

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  container.appendChild(renderer.domElement);

  // luz
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(5,10,7);
  scene.add(dir);

  // jogador
  const pgeo = new THREE.BoxGeometry(1,2,1);
  const pmaterial = new THREE.MeshStandardMaterial({color:0x22c1c3});
  player = new THREE.Mesh(pgeo, pmaterial);
  player.position.set(0,1,0);
  scene.add(player);

  // chão
  const ggeo = new THREE.BoxGeometry(20,1,200);
  const gmat = new THREE.MeshStandardMaterial({color:0x20252b});
  ground = new THREE.Mesh(ggeo,gmat);
  ground.position.set(0,-0.5,-90);
  scene.add(ground);

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
}

function spawnObstacle() {
  const size = Math.random()*1.2 + 0.6;
  const z = camera.position.z - 120;
  const laneIndex = Math.floor(Math.random()*3);
  const x = lanesX[laneIndex];
  const geo = new THREE.BoxGeometry(size, size, size);
  const mat = new THREE.MeshStandardMaterial({color:0xff6b6b});
  const obs = new THREE.Mesh(geo,mat);
  obs.position.set(x, size/2, z);
  obs.userData = {speedOffset: Math.random()*1.2 + 0.2};
  scene.add(obs);
  obstacles.push(obs);
}

function resetGame(){
  obstacles.forEach(o=> scene.remove(o));
  obstacles = [];
  score = 0;
  speed = 8;
  spawnInterval = 1.2;
  spawnTimer = 0;
  lane = 0;
  player.position.set(0,1,0);
  camera.position.set(0,5,12);
  running = false;
  document.getElementById('scoreValue').innerText = '0';
  document.getElementById('restartBtn').style.display = 'none';
}

function gameOver(){
  running = false;
  document.getElementById('restartBtn').style.display = 'inline-block';
}

function onKeyDown(e){
  if(!running) return;
  if(e.code === 'ArrowLeft') moveLeft();
  if(e.code === 'ArrowRight') moveRight();
  if(e.code === 'Space') jump();
}

function moveLeft(){
  if(lane > -1) lane -= 1;
  player.position.x = lanesX[lane+1] ?? lanesX[0];
}

function moveRight(){
  if(lane < 1) lane += 1;
  player.position.x = lanesX[lane+1] ?? lanesX[2];
}

function jump(){
  if(!canJump) return;
  canJump = false;
  const startY = player.position.y;
  const peak = startY + 4;
  const upDuration = 0.28;
  const downDuration = 0.32;
  const upStart = performance.now();

  function upFrame() {
    const t = (performance.now() - upStart)/1000;
    if(t < upDuration){
      player.position.y = startY + (peak - startY)*(t/upDuration);
      requestAnimationFrame(upFrame);
    } else {
      const downStart = performance.now();
      function downFrame(){
        const td = (performance.now() - downStart)/1000;
        if(td < downDuration){
          player.position.y = peak - (peak-startY)*(td/downDuration);
          requestAnimationFrame(downFrame);
        } else {
          player.position.y = startY;
          canJump = true;
        }
      }
      requestAnimationFrame(downFrame);
    }
  }
  requestAnimationFrame(upFrame);
}

function update(dt){
  if(!running) return;

  spawnTimer += dt;
  if(spawnTimer > spawnInterval){
    spawnTimer = 0;
    spawnObstacle();
    spawnInterval = Math.max(0.5, spawnInterval - 0.01);
    speed += 0.05;
  }

  for(let i = obstacles.length-1; i >= 0; i--){
    const o = obstacles[i];
    o.position.z += (speed*o.userData.speedOffset) * dt;

    if(o.position.z > camera.position.z + 10){
      scene.remove(o);
      obstacles.splice(i,1);
      score += 10;
      document.getElementById('scoreValue').innerText = Math.floor(score);
    }

    const dx = Math.abs(o.position.x - player.position.x);
    const dz = Math.abs(o.position.z - player.position.z);
    const overlapX = dx < (o.geometry.parameters.width/2 + 0.5);
    const overlapZ = dz < (o.geometry.parameters.depth/2 + 0.8);
    const overlapY = player.position.y < (o.geometry.parameters.height + 1);

    if(overlapX && overlapZ && overlapY){
      gameOver();
    }
  }

  camera.position.z -= speed * dt * 0.3;
}

function animate(){
  const dt = clock.getDelta();
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onWindowResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// UI
window.addEventListener('load', ()=>{
  init();
  animate();
  document.getElementById('startBtn').addEventListener('click', ()=>{
    if(!running){
      running = true;
      document.getElementById('startBtn').style.display = 'none';
    }
  });
  document.getElementById('restartBtn').addEventListener('click', ()=>{
    resetGame();
    document.getElementById('startBtn').style.display = 'inline-block';
  });
});
