export function initOneko() {
  if (document.getElementById('oneko')) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const neko = document.createElement("div");
  neko.id = "oneko";
  neko.style.width = "32px";
  neko.style.height = "32px";
  neko.style.position = "fixed";
  neko.style.pointerEvents = "none";
  neko.style.backgroundImage = "url('https://raw.githubusercontent.com/adryd325/oneko.js/main/oneko.gif')";
  neko.style.imageRendering = "pixelated";
  neko.style.left = "32px";
  neko.style.top = "32px";
  neko.style.zIndex = "999999";
  
  if (document.body) document.body.appendChild(neko);
  else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(neko));

  let nekoPosX = 32, nekoPosY = 32;
  let mousePosX = 0, mousePosY = 0;
  let frame = 0;
  let idleTime = 0;
  let state = "idle";
  
  const spriteSets: any = {
    idle: [[-32, 0], [-64, 0]],
    alert: [[-96, 0]],
    scratchSelf: [[-128, 0], [-160, 0]],
    scratchWallN: [[0, -32], [0, -64]],
    scratchWallS: [[-32, -32], [-32, -64]],
    scratchWallE: [[-64, -32], [-64, -64]],
    scratchWallW: [[-96, -32], [-96, -64]],
    tired: [[-128, -32], [-128, -64]],
    sleeping: [[-160, -32], [-160, -64]],
    N: [[-32, -192], [-64, -192]],
    NE: [[-96, -192], [-128, -192]],
    E: [[-160, -192], [-192, -192]],
    SE: [[-224, -192], [-256, -192]],
    S: [[-288, -192], [-320, -192]],
    SW: [[-352, -192], [-384, -192]],
    W: [[-416, -192], [-448, -192]],
    NW: [[-480, -192], [-512, -192]],
  };

  document.addEventListener('mousemove', (event) => {
    mousePosX = event.clientX;
    mousePosY = event.clientY;
  });

  function getDirection(angle: number) {
    const degree = (angle * 180) / Math.PI;
    if (degree > -22.5 && degree <= 22.5) return "E";
    if (degree > 22.5 && degree <= 67.5) return "SE";
    if (degree > 67.5 && degree <= 112.5) return "S";
    if (degree > 112.5 && degree <= 157.5) return "SW";
    if (degree > 157.5 || degree <= -157.5) return "W";
    if (degree > -157.5 && degree <= -112.5) return "NW";
    if (degree > -112.5 && degree <= -67.5) return "N";
    return "NE";
  }

  function frameProcess() {
    const diffX = mousePosX - nekoPosX;
    const diffY = mousePosY - nekoPosY;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    
    if (distance < 5) {
      state = "idle";
      idleTime += 1;
      frame = (frame + 1) % spriteSets.idle.length;
      const sprite = spriteSets.idle[frame];
      neko.style.backgroundPosition = `${sprite[0]}px ${sprite[1]}px`;
    } else {
      state = "moving";
      idleTime = 0;
      const angle = Math.atan2(diffY, diffX);
      const direction = getDirection(angle);
      
      const speed = Math.min(distance, 10);
      nekoPosX += Math.cos(angle) * speed;
      nekoPosY += Math.sin(angle) * speed;
      
      neko.style.left = `${nekoPosX - 16}px`;
      neko.style.top = `${nekoPosY - 16}px`;
      
      const sprites = spriteSets[direction];
      frame = (frame + 1) % sprites.length;
      const sprite = sprites[frame];
      neko.style.backgroundPosition = `${sprite[0]}px ${sprite[1]}px`;
    }
  }
  
  setInterval(frameProcess, 100);
}
