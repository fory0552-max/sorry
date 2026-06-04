// --- 1. PHASE 1: FOGGY MIRROR WIPE ---
const canvas = document.getElementById('fog-canvas');
const ctx = canvas.getContext('2d');
const wipeInstruction = document.getElementById('wipe-instruction');
const mainContent = document.getElementById('main');
const bgMusic = document.getElementById('bg-music');
let fogCleared = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFog();
}
window.addEventListener('resize', resizeCanvas);

function drawFog() {
    if(fogCleared) return;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(230, 235, 240, 0.95)');
    gradient.addColorStop(1, 'rgba(180, 190, 200, 0.98)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
}
resizeCanvas();

let isDrawing = false;
let clearedPixels = 0;

function wipe(e) {
    if(fogCleared) return;
    isDrawing = true;
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        e.preventDefault(); 
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    ctx.beginPath();
    const gradient = ctx.createRadialGradient(clientX, clientY, 10, clientX, clientY, 60);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.arc(clientX, clientY, 60, 0, Math.PI * 2);
    ctx.fill();
    
    clearedPixels++;
    
    if (clearedPixels > 60) {
        revealCinematicSequence();
    }
}

canvas.addEventListener('mousedown', wipe);
canvas.addEventListener('mousemove', (e) => { if (isDrawing) wipe(e); });
canvas.addEventListener('mouseup', () => isDrawing = false);

canvas.addEventListener('touchstart', wipe, {passive: false});
canvas.addEventListener('touchmove', (e) => { if (isDrawing) wipe(e); }, {passive: false});
canvas.addEventListener('touchend', () => isDrawing = false);

// --- 2. CINEMATIC SEQUENCES (Letterbox & Credits) ---
function revealCinematicSequence() {
    if(fogCleared) return;
    fogCleared = true;
    
    // Play music smoothly
    bgMusic.volume = 0;
    bgMusic.play().catch(e => console.log(e));
    gsap.to(bgMusic, { volume: 0.6, duration: 4 });

    const tl = gsap.timeline();

    // 1. Fade out Fog
    tl.to(canvas, { opacity: 0, duration: 2, ease: "power2.inOut" });
    tl.to(wipeInstruction, { opacity: 0, duration: 1 }, "<"); 
    setTimeout(() => { canvas.style.display = 'none'; }, 2000);

    // 2. Slide in Cinematic Black Bars (Letterbox)
    tl.to('#bar-top', { y: 0, duration: 2, ease: "power3.inOut" }, "-=1");
    tl.to('#bar-bottom', { y: 0, duration: 2, ease: "power3.inOut" }, "<");

    // 3. Movie Credits Sequence (Sentence by Sentence)
    const creditLines = document.querySelectorAll('.credit-line');
    
    creditLines.forEach((line, index) => {
        // Fade in from blur
        tl.fromTo(line, 
            { opacity: 0, scale: 0.95, filter: 'blur(10px)' }, 
            { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 3, ease: 'power2.out' }
        );
        // Pause briefly, then fade out to blur
        tl.to(line, 
            { opacity: 0, scale: 1.05, filter: 'blur(5px)', duration: 2, ease: 'power2.in' }, 
            "+=1.5" // 1.5 second pause between reading
        );
    });

    // 4. Reveal Main Content (Photo and Interactive Box)
    tl.call(() => { mainContent.classList.remove('hidden'); });

    // Photo slides up and slowly zooms in (Ken Burns effect)
    tl.fromTo('.photo-frame',
        { y: 50, opacity: 0, scale: 1 }, 
        { y: 0, opacity: 1, scale: 1.05, duration: 2.5, ease: "power3.out" }
    );
    
    // Animate Cinematic Light Leak across the photo
    tl.to('.light-leak', {
        x: '200%', y: '200%', 
        duration: 3, 
        ease: "power1.inOut",
        repeat: -1, 
        repeatDelay: 5 // Light leak happens every 5 seconds
    }, "<");

    tl.to('#apology-box', {
        opacity: 1, y: 0, duration: 1.5, ease: "power2.out"
    }, "-=1");
    
    tl.call(initRipples);
}

// --- 3. LIQUID WATER RIPPLE EFFECT ---
function initRipples() {
    try {
        $('#ripple-photo').ripples({
            resolution: 256,
            dropRadius: 20, 
            perturbance: 0.04, 
            interactive: true
        });
        
        setInterval(function() {
            var $el = $('#ripple-photo');
            var x = Math.random() * $el.outerWidth();
            var y = Math.random() * $el.outerHeight();
            $el.ripples('drop', x, y, 20, 0.04 + Math.random() * 0.04);
        }, 3000);
        
    } catch (e) {
        console.log("Ripples WebGL not supported.", e);
    }
}

// --- 4. THREE.JS OPTIMIZED STARFIELD & HYPERSPACE ---
const webglContainer = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.0025);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true }); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
webglContainer.appendChild(renderer.domElement);

const starCount = 1500; 
const starPos = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for(let i=0; i<starCount; i++) {
    const r = 40 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 300;
    
    starPos[i*3] = r * Math.cos(theta);
    starPos[i*3+1] = y;
    starPos[i*3+2] = r * Math.sin(theta);

    const colorType = Math.random();
    if(colorType > 0.9) {
        starColors[i*3] = 1.0; starColors[i*3+1] = 0.9; starColors[i*3+2] = 0.7;
    } else {
        starColors[i*3] = 1.0; starColors[i*3+1] = 1.0; starColors[i*3+2] = 1.0;
    }
}

const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMat = new THREE.PointsMaterial({
    size: window.innerWidth < 768 ? 1.2 : 0.9, 
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
});

const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// Physics configuration for Hyperspace
const config = {
    rotationSpeed: 0.0005,
    hyperspaceSpeed: 0
};

let mouseX = 0;
let mouseY = 0;
if(window.innerWidth > 768) {
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) - 0.5;
        mouseY = (event.clientY / window.innerHeight) - 0.5;
    });
}

function animateThree() {
    requestAnimationFrame(animateThree);
    
    // Normal slow rotation
    stars.rotation.y += config.rotationSpeed; 
    
    // Hyperspace forward movement
    if (config.hyperspaceSpeed > 0) {
        camera.position.z -= config.hyperspaceSpeed;
        stars.rotation.y += config.hyperspaceSpeed * 0.01;
    }
    
    if(window.innerWidth > 768) {
        camera.position.x += (mouseX * 15 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 15 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);
    }
    
    renderer.render(scene, camera);
}
animateThree();

// --- 5. RUNAWAY BUTTON LOGIC ---
const btnNo = document.getElementById('btn-no');
const btnYes = document.getElementById('btn-yes');
const boxText = document.getElementById('box-text');

function moveNoButton(e) {
    if(e) e.preventDefault(); 
    
    if (btnNo.style.position !== 'fixed') {
        btnNo.style.position = 'fixed';
    }
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const btnWidth = btnNo.offsetWidth;
    const btnHeight = btnNo.offsetHeight;
    
    // Constrain random jump to stay clearly within the visible screen
    const randomX = Math.max(20, Math.random() * (viewportWidth - btnWidth - 40));
    const randomY = Math.max(20, Math.random() * (viewportHeight - btnHeight - 40));
    
    btnNo.style.left = `${randomX}px`;
    btnNo.style.top = `${randomY}px`;
}

btnNo.addEventListener('mouseenter', moveNoButton);
btnNo.addEventListener('touchstart', moveNoButton, {passive: false});

btnYes.addEventListener('click', () => {
    boxText.innerHTML = "thnx GF jaise friend ❤️";
    btnYes.style.display = 'none';
    btnNo.style.display = 'none';
    
    // HYPERSPACE JUMP!
    // Instantly accelerate the camera forward through the stars
    gsap.to(config, { hyperspaceSpeed: 1.5, duration: 3, ease: "power4.in" });
    
    // And fade out the letterbox for a dramatic full-screen finish
    gsap.to('.cinematic-bar', { height: 0, duration: 3, ease: "power2.inOut" });
});
