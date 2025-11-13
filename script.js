// URL del modelo de Teachable Machine POSE
const URL = "https://teachablemachine.withgoogle.com/models/2XWH1Ltbj/";

let model, webcam, ctx, maxPredictions;
const leftArm = document.getElementById('leftArm');
const rightArm = document.getElementById('rightArm');
const gestureText = document.getElementById('gestureText');
const statusText = document.getElementById('status');

// Inicializar
async function init() {
    try {
        statusText.textContent = 'Cargando modelo de pose...';
        
        // Cargar el modelo de POSE
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        statusText.textContent = 'Iniciando cámara...';

        // Configurar webcam para pose
        const size = 400;
        const flip = true;
        webcam = new tmPose.Webcam(size, size, flip);
        
        await webcam.setup();
        await webcam.play();
        
        // Agregar el canvas de la webcam al contenedor
        const webcamContainer = document.getElementById('webcam-container');
        webcamContainer.appendChild(webcam.canvas);
        
        statusText.textContent = '✓ Sistema activo - Detectando poses';
        
        // Iniciar predicción
        window.requestAnimationFrame(loop);
    } catch (error) {
        console.error('Error al inicializar:', error);
        statusText.textContent = '❌ Error: ' + error.message;
        gestureText.textContent = 'Error al cargar';
        
        if (error.name === 'NotAllowedError') {
            statusText.textContent = '❌ Permiso de cámara denegado';
        } else if (error.name === 'NotFoundError') {
            statusText.textContent = '❌ No se encontró cámara';
        }
    }
}

// Loop de predicción
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// Realizar predicción
async function predict() {
    try {
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        const prediction = await model.predict(posenetOutput);
        
        if (prediction && prediction.length > 0) {
            // Encontrar la clase con mayor probabilidad
            let maxProb = 0;
            let detectedClass = '';
            
            for (let i = 0; i < maxPredictions; i++) {
                if (prediction[i].probability > maxProb) {
                    maxProb = prediction[i].probability;
                    detectedClass = prediction[i].className;
                }
            }
            
            // Solo actuar si la confianza es mayor al 50%
            if (maxProb > 0.5) {
                updateRobot(detectedClass);
            }
        }
    } catch (error) {
        console.error('Error en predicción:', error);
    }
}

// Actualizar el robot según el gesto detectado
function updateRobot(gesture) {
    const gestureLower = gesture.toLowerCase();
    
    // Resetear brazos
    leftArm.classList.remove('raised');
    rightArm.classList.remove('raised');

    if (gestureLower.includes('derecha') || gestureLower.includes('right')) {
        rightArm.classList.add('raised');
        gestureText.textContent = '👉 Derecha';
        gestureText.style.color = '#f59e0b';
    } 
    else if (gestureLower.includes('izquierda') || gestureLower.includes('left')) {
        leftArm.classList.add('raised');
        gestureText.textContent = '👈 Izquierda';
        gestureText.style.color = '#3b82f6';
    } 
    else if (gestureLower.includes('ambos') || gestureLower.includes('both') || gestureLower.includes('dos')) {
        // LEVANTAR ambos brazos
        leftArm.classList.add('raised');
        rightArm.classList.add('raised');
        gestureText.textContent = '🙌 Ambos Brazos';
        gestureText.style.color = '#10b981';
    } 
    else {
        // Indeterminado o clase por defecto - brazos abajo
        gestureText.textContent = '❓ ' + gesture;
        gestureText.style.color = '#6b7280';
    }
}

// Iniciar cuando cargue la página
window.addEventListener('load', init);
