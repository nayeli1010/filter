//nombre de la imagen
let sample = "1"
let serialvalidation

let serial = "1234"
let ubicacion
let statusf = 0
let statusp = 0
let statusfinal
let resulstatus
let pass1
let fail1
let coord1 = []
let coord2 = []
let coord3 = []
let coord4 = []
let boxpoint = []
let pn='LFTM113558-54-A' //'LFTM113558-16-B'
const input = document.getElementById('serial')
let serialInput 
let serialCorto

let elemento = document.getElementById("pn")
elemento.textContent="PN INGRESADO: "+pn

//**************************DECLARACION DE MODELOS
let model = new cvstfjs.ObjectDetectionModel()
let model2 = new cvstfjs.ClassificationModel()
console.log(model)
console.log(model2)

//*****Modelos de segmentacion ******/ 
let modelp1 = new cvstfjs.ObjectDetectionModel()
let modelp2 = new cvstfjs.ObjectDetectionModel()
let modelp3 = new cvstfjs.ObjectDetectionModel()
let modelp4 = new cvstfjs.ObjectDetectionModel()

//*****Modelos de clasificacion ******/ 
let modelClasP1 = new cvstfjs.ClassificationModel()
let modelClasP2 = new cvstfjs.ClassificationModel()
let modelClasP3 = new cvstfjs.ClassificationModel()
let modelClasP3Nuevo = new cvstfjs.ClassificationModel()


//*************************CARGAR MODELOS */
//Cargar modelo al iniciar la pagina 
async function loadmodel() {
    //****Cargar modelos de segmentacion */
    await modelp1.loadModelAsync('./modelmcla/segmentacion-old/P1/model.json')
    await modelp2.loadModelAsync('./modelmcla/segmentacion-old/P2/model.json')
    await modelp3.loadModelAsync('./modelmcla/segmentacion-old/P3/model.json')
    await modelp4.loadModelAsync('./modelmcla/segmentacion-old/P4/model.json')

    //Modelos DEMO
    await model.loadModelAsync('./modelmcla/segmentacion-old/model.json')
    await model2.loadModelAsync('./modelmcla/clasificacion/model.json');

    //Modelos Clasificacion
    await modelClasP1.loadModelAsync('./modelmcla/clasificacion/P1/modelnuevo/model.json');
    await modelClasP2.loadModelAsync('./modelmcla/clasificacion/P2/modelnuevo/model.json');
    await modelClasP3.loadModelAsync('./modelmcla/clasificacion/P3/model.json');
    await modelClasP3Nuevo.loadModelAsync('./modelmcla/clasificacion/P4/model.json');

}


loadmodel()
//Variable camid para las camaras
let camid
var contenido

/************************************************ canva de la imagen a guardar */
let fullimage = document.getElementById('CanvasFHD')
let fullimagectx = fullimage.getContext('2d')
let tarjeta2 = document.getElementsByClassName('tarjeta2') //canvas donde se pondra la imagen original
let tarjeta = document.getElementsByClassName('tarjeta') //canvas donde se pondra la imagen original 
let contenedor = document.getElementsByClassName('contenedor') //canvas donde se pondra la imagen original 
let recortito = document.getElementById('Canvascut') //Canvas para el recorte de P1 
let recortitoctx = recortito.getContext('2d')
let recortito1 = document.getElementById('Canvascut1') //Canvas para el recorte de P1 
let recortito1ctx = recortito1.getContext('2d')
let recortito2 = document.getElementById('Canvascut2') //Canvas para el recorte de P1 
let recortito2ctx = recortito2.getContext('2d')
let recortito3 = document.getElementById('Canvascut3') //Canvas para el recorte de P1 
let recortito3ctx = recortito3.getContext('2d')
let recortito4 = document.getElementById('Canvascut4') //Canvas para el recorte de P1 
let recortito4ctx = recortito4.getContext('2d')

/************************************************ canva de la imagen colocada*/
let Captura = document.getElementById('Captura')
let Capturactx = Captura.getContext('2d')

// images = []
// images.push(new Image())
// images.push(new Image())
// images.push(new Image())

// images.forEach((element ,index)=> {
//     element.src = "pruebas/"+(index+1)+".jpeg"
// });

//*************************Socket block */
const socket = io();

socket.on('Sequence_start', function (infoplc) {//pg migrated

    if (infoplc != 0) {
        cadenadedatos = infoplc.toString()

        Sequence()//Activa bandera para continuar

        console.log("Start test sequence");
        // console.log(typeof(data))
        //console.log(infoplc)
        //console.log(pn)
    }
    else {
        console.log("Algo salio mal en el backend");
    }
});

/************************************************ llamada de las funciones de forma asincrona */
async function Sequence() {
    //const selectedOption = document.getElementById("lang").value;
    //P1545622-01-C:REV02:SANN23360000508
    boxpoint = []
    decision = []
    ancho=[1176,1536,1222]
    alto=[415,929,799]
    x=[670,228,14]
    y=[36,55,254]
    console.log("serialInput: "+serialInput)
    console.log("serial corto: ",serialCorto)
    for (point = 1; point < 4; point++) {
        await open_cam(point)
        console.log("estoy en la camara.. " + point)
        await captureimage()
        //await snapshot(point,serialCorto)
        await predict1(point)
        await analisis(point)
        
        await snapshotRecorte(point,ancho[point-1],alto[point-1],x[point-1],y[point-1])

        //await predict1(point)
       //  await analisis(point)
        // input.disabled = false
    }
    passalert()
    // setTimeout(function fire() { location.reload() }, 2000);// temporizador para limpiar pantalla

    // input.disabled = false
    // input.focus()
   
    // evaluaArray()
    // await plc_response(boxpoint)

}



input.addEventListener('keypress', function(event){

    // P1545622-01-C:REV02:SANN24313000E76
    if(event.keyCode === 13){
        serialInput = input.value
        input.disabled = true
        // serialCorto = serialInput.split(":")[2]
        serialCorto = serialInput.slice(20,36)
        console.log("serialInput: "+serialInput)
        console.log("serial corto: ",serialCorto)
        input.value  = ''
        Sequence()
        
        // document.getElementById('serial').reset
    }

})

//*************************FUNCIONES ANALISIS
async function analisis(p,step) {
    return new Promise(async resolve => { // inicio de promesa --

        switch (p) {
            case 1://coordenadas P1
                console.log("entre a analisis case " + p)
                recortito1ctx.drawImage(fullimage, coord1[0], coord1[1], coord1[2], coord1[3], 0, 0, recortito1ctx.canvas.width, recortito1ctx.canvas.height) // coordenada y tamaño de recorte en el canvas
                await mlinspector(recortito1, coord1[0], 1)
                allpoints(1, statusf)
                await snapshot(1)
                console.log("serialInput: "+serialInput)
                console.log("serial corto: ",serialCorto)
                /*var dataURI = recortito1.toDataURL('image/jpeg')
                savepic2(dataURI,step,serial)
                console.log("entre a savepic2")*/
              
                coord1 = []
                break
            case 2://P2
                recortito2ctx.drawImage(fullimage, coord1[0], coord1[1], coord1[2], coord1[3], 0, 0, recortito2ctx.canvas.width, recortito2ctx.canvas.height) // coordenada y tamaño de recorte en el canvas
                await mlinspector(recortito2, coord1[0], 2)
                allpoints(2, statusf)
                await snapshot(2)
                coord1 = []
                break
            case 3:
                recortito3ctx.drawImage(fullimage, coord1[0], coord1[1], coord1[2], coord1[3], 0, 0, recortito3ctx.canvas.width, recortito3ctx.canvas.height) // coordenada y tamaño de recorte en el canvas
                await mlinspector(recortito3, coord1[0], 3)
                allpoints(3, statusf)
                await snapshot(3)

                coord1 = []
                break
            default:

        }
        resolve('resolved')
    })

}
function allpoints(pot, statusf) {
    console.log('el valor final es ', statusf, 'en el punto ', pot)
    boxpoint.push(statusf)// Array guarda el valor de cada punto analizado 
    console.log(boxpoint)
}

async function evaluaArray() {
    return new Promise(async resolve => {
        console.log("evaluarray: boxpoint = ", boxpoint)
        let resultadofinal = boxpoint.some((e) => e == "0")
        if (resultadofinal == false) {
            console.log(resultadofinal)
            pass()
            pass1 = 1
            await plc_response(pass1)
            //console.log("soy plc_response de pass :" + plc_response)

        } else {
            fail()
            fail0 = 0
            await plc_response(fail0)
            //console.log("soy plc_response de fail :" + plc_response)

        }
        resultado = resultadofinal
        console.log("Resultado final ---> " + boxpoint)
        console.log("Resultado final " + resultadofinal)
        resolve('resolved')
    })
}
//****************************************** Backend call functions

async function plcelevado() {
    // const socket = io();
    socket.emit('plc_response', resulstatus);
}
function resultado() {
    return new Promise(async resolve => {
        if (statusfinal == 1) { await pass() }
        else {
            await fail()
        }
        resolve('resolved')
    })

}
function open_cam(point) {
    return new Promise(async resolve => {
        if (point == 1) { camid = "0d4ef669c86943cf67333c67e090812f1261ef5f2ba5d0470516193d0c66b1a5" }
        if (point == 2) { camid = "b3cc0e2eaafdd99e26e48ebd07fbd6d9bfa524e087a03179f346abcb403278b5" }
        if (point == 3) { camid = "b3cc0e2eaafdd99e26e48ebd07fbd6d9bfa524e087a03179f346abcb403278b5" }
        // if (point == 4) { camid = "b3cc0e2eaafdd99e26e48ebd07fbd6d9bfa524e087a03179f346abcb403278b5" }
        const video = document.querySelector('video')
        const vgaConstraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                "frameRate": 30,
                "resizeMode": "crop-and-scale",
                deviceId: camid
            }//llave video
        }

        await navigator.mediaDevices.getUserMedia(vgaConstraints).then((stream) => { video.srcObject = stream }).catch(function (err) { console.log(err.name) })

        setTimeout(function fire() { resolve('resolved') }, 2000)
    })
}
/************************************************ Tomar la foto */
async function captureimage() {
    return new Promise(async resolve => {

        const video = document.getElementById("video")

        fullimagectx.drawImage(video, 0, 0, fullimage.width, fullimage.height) // Dibuja en el fullimage la captura de la imagen 1
        Capturactx.drawImage(fullimage, 0, 0, Captura.width, Captura.height)
        setTimeout(function fire() { resolve('resolved'); }, 500) //tiempo para el opencam
        resolve('resolved')
    })
}

function mapcams() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const filtered = devices.filter(device => device.kind === 'videoinput');
            console.log('Cameras found', filtered);

            filtered.forEach(camera => {
                console.log('Camera ID:', camera.deviceId);
                localStorage.setItem("ids", camera.deviceId)

            });
        });
}
/************************************************ Guardado de imagen */

async function snapshot(step) {
    
    console.log('guardar la imagen en su carpeta.')
    return new Promise(async resolve => {
        var dataURI = fullimage.toDataURL('image/jpeg')
        savepic(dataURI, step) //savepic(dataURI,point);
        resolve('resolved')
    })
}
async function snapshotRecorte(point,ancho,alto,x,y){
    return new Promise(async(resolve) => {
        console.log("estoy en snapshorrecorte")
           let tempCanvas = document.createElement('canvas');
            
            let tempCtx = tempCanvas.getContext('2d');

            tempCanvas.width = ancho;
            tempCanvas.height = alto;

            tempCtx.drawImage(fullimage,x,y,ancho,alto,0,0,ancho,alto);
            const dataURI = tempCanvas.toDataURL('image/jpg');
            tempCanvas.remove();
            
           
               await savingpicpruebas(dataURI,point,serialCorto)
            
        resolve("resolved")
   });
}
 async function savingpicpruebas(uri,point,sn){
    const socket = io();
    socket.emit('picsavingpruebas',uri,point,sn)
 }

function stopcam() {
    return new Promise(async resolve => {
        const video = document.querySelector('video');
        // A video's MediaStream object is available through its srcObject attribute
        const mediaStream = video.srcObject;
        // Through the MediaStream, you can get the MediaStreamTracks with getTracks():
        const tracks = mediaStream.getTracks();
        tracks.forEach(track => { track.stop() })//;console.log(track);
        setTimeout(function fire() { resolve('resolved'); }, 1000);
    });//Cierra Promise principal
}

//analiza la imagen full 
async function predict1(point, canvas) {
    return new Promise(async resolve => {
        fullimage = document.getElementById('CanvasFHD')
        console.log("estoy en predict1")

        switch (point) {
            case 1:
                input_size = modelp1.input_size
                image = tf.browser.fromPixels(fullimage, 3)
                image = tf.image.resizeBilinear(image.expandDims(), [input_size, input_size])
                let predictP1 = await modelp1.executeAsync(image)
                await highlightResults(predictP1, point, criterio)
                break
            case 2: //Entrenamiento independiente 
                input_size = modelp2.input_size
                image = tf.browser.fromPixels(fullimage, 3)
                image = tf.image.resizeBilinear(image.expandDims(), [input_size, input_size])
                let predictP2 = await modelp2.executeAsync(image)
                await highlightResults(predictP2, point, criterio)
                break
            case 3:
                input_size = modelp3.input_size
                image = tf.browser.fromPixels(fullimage, 3)
                image = tf.image.resizeBilinear(image.expandDims(), [input_size, input_size])
                let predictP3 = await modelp3.executeAsync(image)
                await highlightResults(predictP3, point, criterio)
                break
            case 4:
                input_size = modelp4.input_size
                image = tf.browser.fromPixels(fullimage, 3)
                image = tf.image.resizeBilinear(image.expandDims(), [input_size, input_size])
                let predictP4 = await modelp4.executeAsync(image)
                await highlightResults(predictP4, point, criterio)
                break
            default:
        }
        resolve('resolved')
    });
}

//************************************************************************************** Funciones de recuadros ubica */
var children = []
let criterio = 0.0003
console.log("criterio 1: " + criterio)
//esta funcion es para verificar el corto de l primer punto
async function highlightResults(predictions, point, criterio) {

    //statusf=1
    for (let n = 0; n < predictions[0].length; n++) {

        // Check scores
        if (predictions[1][n] > criterio) {
            console.log("predictios " + predictions[1][n])
            console.log("criterio " + criterio)
            bboxLeft = (predictions[0][n][0] * fullimagectx.canvas.width)
            bboxTop = (predictions[0][n][1] * fullimagectx.canvas.height)
            bboxWidth = (predictions[0][n][2] * fullimagectx.canvas.width) - bboxLeft
            bboxHeight = (predictions[0][n][3] * fullimagectx.canvas.height) - bboxTop
            coord1.push(bboxLeft)
            coord1.push(bboxTop)
            coord1.push(bboxWidth)
            coord1.push(bboxHeight)

            console.log("Coordenadas en highlightResults:", coord1);

            bboxLeft1 = (predictions[0][n][0] * Capturactx.canvas.width)
            bboxTop1 = (predictions[0][n][1] * Capturactx.canvas.height)
            bboxWidth1 = (predictions[0][n][2] * Capturactx.canvas.width) - bboxLeft1
            bboxHeight1 = (predictions[0][n][3] * Capturactx.canvas.height) - bboxTop1

            Capturactx.strokeStyle = 'blue';
            Capturactx.lineWidth = 4;
            Capturactx.strokeRect(bboxLeft1, bboxTop1, bboxWidth1, bboxHeight1);

        }

    }

}
//*************Clasificacion
async function mlinspector(cut, array, pot) {
    return new Promise(async resolve => { // inicio de promesa 
        //console.log('array', array)
        await call(cut, array, pot)
        //console.log(cut,array,pot)
        resolve('resolved')
    })
}
async function call(cut, array, pot) {
    switch (pot) {
        case 1:
            result = await modelClasP1.executeAsync(cut)
            break
        case 2:
            result = await modelClasP2.executeAsync(cut)
            break
        case 3:
            if(pn == 'LFTM113558-54-A' ){
                console.log("estoy en el nuevo modelo")
                result = await modelClasP3Nuevo.executeAsync(cut)
            }
            console.log("estoy en el numero de parte normal")
            result = await modelClasP3.executeAsync(cut)
            break
        case 4:
            result = await modelClasP4.executeAsync(cut)
            break
        default:
    }
    falla = result[0][1]
    console.log('Valor de falla clasificacion', falla)
    pasa = result[0][0]
    console.log('Valor de pasa clasificacion', pasa)
    if (pasa >= falla && array != null) { //Evalua el valor en la posicion 0 que da la redneuronal
        statusf = 1
        console.log("pass -> " + "Punto: " + pot, statusf)
    } else {
        statusf = 0
        console.log("fail -> " + "Punto: " + pot, statusf)
    }

}
async function pass() {
    document.getElementById('tarjeta2').style.background = '#00ff40'
    failalert()
    resulstatus = "Pass"
}
async function fail() {
    document.getElementById('tarjeta2').style.background = '#cf010b'
    failalert()
    resulstatus = "Fail"
}

async function removeHighlights() {
    for (let i = 0; i < children.length; i++) {
        imageOverlay.removeChild(children[i])
    }
    children = []
}

/************************************************ Conexion socket */

function savepic(uri, point) {
    console.log("serialInput: "+serialInput)
                console.log("serial corto: ",serialCorto)
    // const socket = io();
    socket.emit('picsaving', uri, point,serialCorto);

}

function savepic2(uri, point, snr) {
    var random = Math.floor(Math.random()*1000)
    socket.emit('picsaving2', uri, random,point);
}
async function renombra(serial) {
    return new Promise(async resolve => {
        socket.emit('renombrasnr', serial);
        resolve('resolved')
    });
}
async function logsaving(logarray, serial, logsave) {
    return new Promise(async resolve => {
        console.log('estoy en logsaving ')
        socket.emit('logsaving', logarray, serial, logsave);
        resolve('resolved')
    });
}
async function plc_response(boxpoint) { //El Array boxpoint guarda la equivalencia del punto, cuando vale pass o cuando vale fail
    return new Promise(async resolve => {
        console.log("plc_response: sn = ", serial)
        logarray =
            "\n" + "serial: " + serial + "\n" +
            "Point 1 Conector J4 " + " = " + boxpoint[0] + " --> " + `${boxpoint[0] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            "Point 2 Conector J2 " + " = " + boxpoint[1] + " --> " + `${boxpoint[1] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            "Point 3 Conector J8" + " = " + boxpoint[2] + " --> " + `${boxpoint[2] == 0 ? 'Fail' : 'Pass'}` + "\n" + "\n" + ""

        boxpoint =
            "&Point1" + "," + boxpoint[0] +
            "&Point2" + "," + boxpoint[1] +
            "&Point3" + "," + boxpoint[2] +
            "#"


        console.log("soy boxpoint: " + boxpoint)
        await logsaving(logarray, serial,)
        console.log("estoy en logsaving")

        if (resultado) {
            await renombra(serial)
        }

        console.log("soy logarray: " + logarray)
        resolve('resolved')
    })
}

